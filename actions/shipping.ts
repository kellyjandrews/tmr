// app/actions/shipping.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * Get shipping rates for a cart
 */
export async function getShippingRates(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const schema = z.object({
        cart_id: z.string().uuid(),
        destination_address_id: z.string().uuid(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        cart_id: formData.get('cart_id'),
        destination_address_id: formData.get('destination_address_id'),
    })

    // Get cart with items
    const { data: cart, error: cartError } = await supabase
        .from('carts')
        .select(`
      id, store_id:items(store_id:listings(store_id)),
      items:cart_items(
        quantity,
        listing:listings(
          id, store_id, is_digital,
          shipping:listing_shipping(
            shipping_type, weight, dimensions, carrier
          )
        )
      )
    `)
        .eq('id', parsed.cart_id)
        .eq('account_id', user.id)
        .single()

    if (cartError || !cart) throw new Error('Cart not found')

    // Extract store ID from items (assuming all items from same store for now)
    const storeId = cart.items[0]?.listing?.store_id
    if (!storeId) throw new Error('No items in cart or invalid items')

    // Get store shipping policy
    const { data: storePolicy, error: policyError } = await supabase
        .from('store_shipping_policy')
        .select('*')
        .eq('store_id', storeId)
        .single()

    // Get source address (store address)
    const { data: sourceAddress, error: sourceError } = await supabase
        .from('store_address')
        .select('*')
        .eq('store_id', storeId)
        .eq('address_type', 'shipping')
        .eq('is_default', true)
        .single()

    if (sourceError || !sourceAddress) throw new Error('Store shipping address not found')

    // Get destination address
    const { data: destinationAddress, error: destError } = await supabase
        .from('account_addresses')
        .select('*')
        .eq('id', parsed.destination_address_id)
        .eq('account_id', user.id)
        .single()

    if (destError || !destinationAddress) throw new Error('Destination address not found')

    // Check if there are any digital-only items
    const digitalOnly = cart.items.every(item => item.listing.is_digital)
    if (digitalOnly) {
        // For digital items, create a free shipping option
        const { error: optionError } = await supabase
            .from('cart_shipping_options')
            .insert({
                cart_id: parsed.cart_id,
                shipping_method: 'digital',
                carrier: 'N/A',
                estimated_cost: 0,
                estimated_delivery_min: 0,
                estimated_delivery_max: 0,
                is_selected: true,
                tracking_available: false,
                insurance_available: false,
            })

        if (optionError) throw new Error(`Failed to add digital shipping option: ${optionError.message}`)

        return { success: true, rates: [{ id: 'digital', carrier: 'N/A', method: 'Digital Download', amount: 0 }] }
    }

    // Calculate total weight and dimensions for physical items
    let totalWeight = 0
    const items = cart.items.filter(item => !item.listing.is_digital).map(item => {
        const weight = item.listing.shipping?.weight || 1 // Default to 1 if not specified
        totalWeight += weight * item.quantity

        return {
            weight: weight * item.quantity,
            quantity: item.quantity,
            dimensions: item.listing.shipping?.dimensions || { length: 10, width: 10, height: 2, unit: 'in' }
        }
    })

    // Check shipping rate cache first
    const { data: cachedRates } = await supabase
        .from('shipping_rate_cache')
        .select('*')
        .eq('origin_postal_code', sourceAddress.postal_code)
        .eq('destination_postal_code', destinationAddress.postal_code)
        .eq('weight', totalWeight)
        .gt('expires_at', new Date().toISOString())
        .order('rate_amount', { ascending: true })

    if (cachedRates && cachedRates.length > 0) {
        // Use cached rates
        const shippingOptions = cachedRates.map(rate => ({
            cart_id: parsed.cart_id,
            shipping_method: rate.service_level,
            carrier: rate.carrier,
            estimated_cost: rate.rate_amount,
            estimated_delivery_min: rate.transit_days_min,
            estimated_delivery_max: rate.transit_days_max,
            is_selected: false,
            tracking_available: true,
            insurance_available: false,
        }))

        // Save shipping options to cart
        await supabase
            .from('cart_shipping_options')
            .delete()
            .eq('cart_id', parsed.cart_id)

        await supabase
            .from('cart_shipping_options')
            .insert(shippingOptions)

        return {
            success: true,
            rates: cachedRates.map(rate => ({
                id: rate.id,
                carrier: rate.carrier,
                method: rate.service_level,
                amount: rate.rate_amount,
                min_days: rate.transit_days_min,
                max_days: rate.transit_days_max
            }))
        }
    }

    // If no cached rates, call Shippo API via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('get-shipping-rates', {
        body: {
            origin: {
                name: sourceAddress.full_name,
                street1: sourceAddress.street_address,
                street2: sourceAddress.street_address_2,
                city: sourceAddress.city,
                state: sourceAddress.state_province,
                zip: sourceAddress.postal_code,
                country: sourceAddress.country,
                is_residential: !sourceAddress.is_commercial
            },
            destination: {
                name: destinationAddress.full_name,
                street1: destinationAddress.street_address,
                street2: destinationAddress.street_address_2,
                city: destinationAddress.city,
                state: destinationAddress.state_province,
                zip: destinationAddress.postal_code,
                country: destinationAddress.country,
                is_residential: !destinationAddress.is_commercial
            },
            parcels: items,
            extra: {
                is_return: false,
                signature_confirmation: storePolicy?.shipping_carriers?.signature_required || false
            }
        }
    })

    if (error) throw new Error(`Failed to get shipping rates: ${error.message}`)

    // Save rates to cache
    const rateInserts = data.rates.map(rate => ({
        origin_postal_code: sourceAddress.postal_code,
        destination_postal_code: destinationAddress.postal_code,
        weight: totalWeight,
        dimensions: items[0].dimensions, // Simplified for now
        carrier: rate.provider,
        service_level: rate.service_name,
        rate_amount: rate.amount,
        currency: 'USD',
        transit_days_min: rate.days || 3,
        transit_days_max: rate.days ? rate.days + 2 : 5,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }))

    await supabase
        .from('shipping_rate_cache')
        .insert(rateInserts)

    // Save shipping options to cart
    const shippingOptions = data.rates.map(rate => ({
        cart_id: parsed.cart_id,
        shipping_method: rate.service_name === 'Priority' ? 'expedited' :
            rate.service_name === 'Express' ? 'express' : 'standard',
        carrier: rate.provider,
        estimated_cost: rate.amount,
        estimated_delivery_min: rate.days || 3,
        estimated_delivery_max: rate.days ? rate.days + 2 : 5,
        is_selected: false,
        tracking_available: true,
        insurance_available: Boolean(storePolicy?.insurance_options?.available)
    }))

    await supabase
        .from('cart_shipping_options')
        .delete()
        .eq('cart_id', parsed.cart_id)

    await supabase
        .from('cart_shipping_options')
        .insert(shippingOptions)

    return {
        success: true,
        rates: data.rates.map(rate => ({
            id: rate.rate_id,
            carrier: rate.provider,
            method: rate.service_name,
            amount: rate.amount,
            min_days: rate.days || 3,
            max_days: rate.days ? rate.days + 2 : 5
        }))
    }
}

/**
 * Create shipping label for order
 */
export async function createShippingLabel(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const schema = z.object({
        order_id: z.string().uuid(),
        shipment_id: z.string().uuid(),
        carrier: z.string(),
        service_level: z.string(),
        insurance_amount: z.number().min(0).optional(),
        is_return_label: z.boolean().optional(),
        signature_required: z.boolean().optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        order_id: formData.get('order_id'),
        shipment_id: formData.get('shipment_id'),
        carrier: formData.get('carrier'),
        service_level: formData.get('service_level'),
        insurance_amount: formData.has('insurance_amount')
            ? parseFloat(formData.get('insurance_amount') as string)
            : undefined,
        is_return_label: formData.get('is_return_label') === 'true',
        signature_required: formData.get('signature_required') === 'true',
    })

    // Verify permissions (check if user is the store owner)
    const { data: orderCheck, error: orderError } = await supabase
        .from('orders')
        .select(`
      id, account_id, store_id,
      shipping_address:account_addresses!shipping_address_id(*),
      stores!inner(
        owner_id,
        addresses:store_address(*)
      )
    `)
        .eq('id', parsed.order_id)
        .eq('stores.owner_id', user.id)
        .single()

    if (orderError || !orderCheck) {
        throw new Error('Order not found or you do not have permission')
    }

    // Verify shipment
    const { data: shipment, error: shipmentError } = await supabase
        .from('order_shipments')
        .select(`
      id, weight, dimensions,
      items:shipment_items(
        order_item_id,
        order_items:order_items(
          listing_id,
          quantity
        )
      )
    `)
        .eq('id', parsed.shipment_id)
        .eq('order_id', parsed.order_id)
        .single()

    if (shipmentError || !shipment) {
        throw new Error('Shipment not found')
    }

    // Get origin address (store address)
    const storeAddress = orderCheck.stores.addresses.find(addr =>
        addr.address_type === 'shipping' && addr.is_default
    )

    if (!storeAddress) throw new Error('Store shipping address not found')

    // Prepare from and to addresses
    const fromAddress = {
        name: storeAddress.full_name,
        company: orderCheck.stores.name,
        street1: storeAddress.street_address,
        street2: storeAddress.street_address_2,
        city: storeAddress.city,
        state: storeAddress.state_province,
        zip: storeAddress.postal_code,
        country: storeAddress.country,
        phone: storeAddress.phone,
        email: null,
        is_residential: !storeAddress.is_commercial
    }

    const toAddress = {
        name: orderCheck.shipping_address.full_name,
        company: orderCheck.shipping_address.organization_name,
        street1: orderCheck.shipping_address.street_address,
        street2: orderCheck.shipping_address.street_address_2,
        city: orderCheck.shipping_address.city,
        state: orderCheck.shipping_address.state_province,
        zip: orderCheck.shipping_address.postal_code,
        country: orderCheck.shipping_address.country,
        phone: orderCheck.shipping_address.phone,
        email: null,
        is_residential: !orderCheck.shipping_address.is_commercial
    }

    // Prepare parcel info
    const parcel = {
        length: shipment.dimensions?.length || 12,
        width: shipment.dimensions?.width || 12,
        height: shipment.dimensions?.height || 4,
        distance_unit: shipment.dimensions?.unit || 'in',
        weight: shipment.weight || 1,
        weight_unit: 'lb',
        signature_confirmation: parsed.signature_required
    }

    // Call Shippo API via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-shipping-label', {
        body: {
            carrier: parsed.carrier,
            service_level: parsed.service_level,
            from_address: parsed.is_return_label ? toAddress : fromAddress,
            to_address: parsed.is_return_label ? fromAddress : toAddress,
            parcel,
            insurance_amount: parsed.insurance_amount,
            is_return: parsed.is_return_label
        }
    })

    if (error) throw new Error(`Failed to create shipping label: ${error.message}`)

    // Save shipping label to database
    const { error: labelError } = await supabase
        .from('shipping_labels')
        .insert({
            order_id: parsed.order_id,
            shipment_id: parsed.shipment_id,
            shippo_transaction_id: data.transaction_id,
            carrier: parsed.carrier,
            service_level: parsed.service_level,
            label_url: data.label_url,
            tracking_number: data.tracking_number,
            tracking_url_provider: data.tracking_url,
            status: 'created',
            rate_amount: data.rate_amount,
            insurance_amount: parsed.insurance_amount,
            is_return_label: parsed.is_return_label,
            from_address: fromAddress,
            to_address: toAddress,
            parcel
        })

    if (labelError) throw new Error(`Failed to save label: ${labelError.message}`)

    // Update shipment with tracking information
    await supabase
        .from('order_shipments')
        .update({
            carrier: parsed.carrier,
            tracking_number: data.tracking_number,
            tracking_url: data.tracking_url,
            status: 'in_transit',
            updated_at: new Date().toISOString()
        })
        .eq('id', parsed.shipment_id)

    // Update order status if needed
    await supabase
        .from('orders')
        .update({
            status: 'shipped',
            tracking_number: data.tracking_number,
            updated_at: new Date().toISOString()
        })
        .eq('id', parsed.order_id)
        .eq('status', 'processing')

    // Log event
    await supabase
        .from('order_events')
        .insert({
            order_id: parsed.order_id,
            account_id: user.id,
            event_type: 'shipment_created',
            data: {
                shipment_id: parsed.shipment_id,
                carrier: parsed.carrier,
                tracking_number: data.tracking_number,
                label_url: data.label_url
            }
        })

    revalidatePath(`/orders/${parsed.order_id}`)
    revalidatePath('/dashboard/orders')

    return {
        success: true,
        trackingNumber: data.tracking_number,
        labelUrl: data.label_url
    }
}

/**
 * Verify shipment delivery
 */
export async function verifyDelivery(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const schema = z.object({
        order_id: z.string().uuid(),
        shipment_id: z.string().uuid(),
        delivery_date: z.string().datetime().optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        order_id: formData.get('order_id'),
        shipment_id: formData.get('shipment_id'),
        delivery_date: formData.get('delivery_date') || new Date().toISOString(),
    })

    // Verify permissions (check if user is the store owner or the buyer)
    const { data: orderCheck, error: orderError } = await supabase
        .from('orders')
        .select(`
      id, account_id, store_id, stores!inner(owner_id)
    `)
        .eq('id', parsed.order_id)
        .or(`account_id.eq.${user.id},stores.owner_id.eq.${user.id}`)
        .single()

    if (orderError || !orderCheck) {
        throw new Error('Order not found or you do not have permission')
    }

    // Update shipment
    const { error: shipmentError } = await supabase
        .from('order_shipments')
        .update({
            status: 'delivered',
            actual_delivery_date: parsed.delivery_date,
            updated_at: new Date().toISOString()
        })
        .eq('id', parsed.shipment_id)
        .eq('order_id', parsed.order_id)

    if (shipmentError) throw new Error('Failed to update shipment status')

    // Check if all shipments are delivered
    const { data: allShipments } = await supabase
        .from('order_shipments')
        .select('status')
        .eq('order_id', parsed.order_id)

    const allDelivered = allShipments?.every(s => s.status === 'delivered')

    // Update order status if all shipments delivered
    if (allDelivered) {
        await supabase
            .from('orders')
            .update({
                status: 'delivered',
                updated_at: new Date().toISOString()
            })
            .eq('id', parsed.order_id)
    }

    // Log delivery event
    await supabase
        .from('order_events')
        .insert({
            order_id: parsed.order_id,
            account_id: user.id,
            event_type: 'delivery_confirmed',
            data: {
                shipment_id: parsed.shipment_id,
                delivery_date: parsed.delivery_date
            }
        })

    revalidatePath(`/orders/${parsed.order_id}`)
    if (orderCheck.stores[0].owner_id === user.id) {
        revalidatePath('/dashboard/orders')
    }

    return { success: true }
}

/**
 * Get shipping label by ID
 */
export async function getShippingLabel(labelId: string) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data, error } = await supabase
        .from('shipping_labels')
        .select(`
      *,
      shipment:order_shipments(*),
      order:orders(*)
    `)
        .eq('id', labelId)
        .single()

    if (error) throw new Error('Shipping label not found')

    // Verify permissions
    const { data: isAuthorized, error: authError } = await supabase
        .from('orders')
        .select('id')
        .eq('id', data.order_id)
        .or(`account_id.eq.${user.id},stores.owner_id.eq.${user.id}`)
        .maybeSingle()

    if (authError || !isAuthorized) {
        throw new Error('You do not have permission to view this label')
    }

    return data
}

/**
 * Track shipment
 */
export async function getShipmentTracking(trackingNumber: string, carrier: string) {
    const supabase = await createSession()


    // Call Shippo API via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('track-shipment', {
        body: {
            tracking_number: trackingNumber,
            carrier: carrier
        }
    })

    if (error) throw new Error(`Failed to get tracking: ${error.message}`)

    return {
        success: true,
        tracking: data
    }
}

/**
 * Cancel shipping label
 */
export async function cancelShippingLabel(labelId: string) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get label details
    const { data: label, error: labelError } = await supabase
        .from('shipping_labels')
        .select('id, order_id, shippo_transaction_id, status')
        .eq('id', labelId)
        .single()

    if (labelError || !label) throw new Error('Shipping label not found')

    // Verify permissions
    const { data: isAuthorized, error: authError } = await supabase
        .from('orders')
        .select('id')
        .eq('id', label.order_id)
        .eq('stores.owner_id', user.id)
        .maybeSingle()

    if (authError || !isAuthorized) {
        throw new Error('You do not have permission to cancel this label')
    }

    // Can only cancel if status is created
    if (label.status !== 'created') {
        throw new Error('Cannot cancel label that has already been used')
    }

    // Call Shippo API via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('cancel-shipping-label', {
        body: {
            transaction_id: label.shippo_transaction_id
        }
    })

    if (error) throw new Error(`Failed to cancel label: ${error.message}`)

    // Update label status
    await supabase
        .from('shipping_labels')
        .update({
            status: 'refunded',
            updated_at: new Date().toISOString()
        })
        .eq('id', labelId)

    revalidatePath(`/orders/${label.order_id}`)

    return { success: true }
}