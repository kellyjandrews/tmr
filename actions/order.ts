// actions/order.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getActiveCart } from './cart'

/**
 * Get order by ID
 */
export async function getOrderById(id: string) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Check if the user has access to this order (as buyer or seller)
    const { data: order, error } = await supabase
        .from('orders')
        .select(`
      *,
      store:stores(id, name, slug, owner_id),
      items:order_items(
        *,
        listing:listings(id, title, slug, images:listing_images(image_url, is_primary))
      ),
      shipments:order_shipments(*),
      payment_transactions(*),
      notes:order_notes(*)
    `)
        .eq('id', id)
        .or(`account_id.eq.${user.id},stores.owner_id.eq.${user.id}`)
        .single()

    if (error || !order) return null

    // Transform the data for easier use in the UI
    return {
        ...order,
        items: order.items.map((item: any) => ({
            ...item,
            listing: {
                ...item.listing,
                image_url: item.listing?.images?.find((img: any) => img.is_primary)?.image_url ||
                    item.listing?.images?.[0]?.image_url
            }
        }))
    }
}

/**
 * Get orders for the current user
 */
export async function getUserOrders(page: number = 1, perPage: number = 10) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { orders: [], count: 0 }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await supabase
        .from('orders')
        .select(`
      id,
      order_number,
      status,
      payment_status,
      total_price,
      currency,
      created_at,
      store:stores(id, name, slug)
    `, { count: 'exact' })
        .eq('account_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) return { orders: [], count: 0 }

    return {
        orders: data,
        count: count || 0
    }
}

/**
 * Get store orders for a seller
 */
export async function getStoreOrders(page: number = 1, perPage: number = 20, status?: string) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { orders: [], count: 0 }

    // Get user's store
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!store) return { orders: [], count: 0 }

    let queryBuilder = supabase
        .from('orders')
        .select(`
      id,
      order_number,
      status,
      payment_status,
      fulfillment_status,
      total_price,
      currency,
      created_at,
      customer_email,
      account:accounts(id, username, email)
    `, { count: 'exact' })
        .eq('store_id', store.id)
        .order('created_at', { ascending: false })

    // Filter by status if provided
    if (status) {
        queryBuilder = queryBuilder.eq('status', status)
    }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await queryBuilder.range(from, to)

    if (error) return { orders: [], count: 0 }

    return {
        orders: data,
        count: count || 0
    }
}

/**
 * Create an order from the current cart
 */
export async function createOrderFromCart() {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to create an order')

    // Get active cart with items
    const cart = await getActiveCart()
    if (!cart || cart.items.length === 0) throw new Error('Your cart is empty')

    // Check if all required information is present
    if (!cart.shipping_address_id) throw new Error('Shipping address is required')
    if (!cart.billing_address_id) throw new Error('Billing address is required')
    if (!cart.selected_payment_id) throw new Error('Payment method is required')

    // Get shipping option
    const shippingOption = cart.shipping_options.find(option => option.is_selected)
    if (!shippingOption) throw new Error('Shipping method is required')

    // Ensure all items are from the same store (for now, marketplace with multiple stores would need changes)
    const storeId = cart.items[0].listing.store_id
    if (cart.items.some(item => item.listing.store_id !== storeId)) {
        throw new Error('All items must be from the same store for now')
    }

    // Start a transaction
    const { data: order, error } = await supabase.rpc('create_order_from_cart', {
        p_cart_id: cart.id,
        p_account_id: user.id,
        p_store_id: storeId,
        p_shipping_address_id: cart.shipping_address_id,
        p_billing_address_id: cart.billing_address_id,
        p_payment_method_id: cart.selected_payment_id,
        p_shipping_method: shippingOption.shipping_method,
        p_customer_email: user.email
    })

    if (error) throw new Error(`Failed to create order: ${error.message}`)

    // Mark cart as completed
    await supabase
        .from('carts')
        .update({ status: 'completed' })
        .eq('id', cart.id)

    // Add order creation event
    await supabase
        .from('order_events')
        .insert({
            order_id: order.id,
            account_id: user.id,
            event_type: 'create',
            data: { cart_id: cart.id }
        })

    revalidatePath('/orders')
    return { success: true, orderId: order.id }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify the user has permission (as seller or admin)
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('store_id, status, stores!inner(owner_id)')
        .eq('id', orderId)
        .eq('stores.owner_id', user.id)
        .single()

    if (orderError || !order) throw new Error('Order not found or you do not have permission')

    // Validate the status transition
    const schema = z.enum([
        'pending', 'processing', 'shipped', 'delivered',
        'cancelled', 'refunded', 'partially_refunded', 'on_hold'
    ])

    try {
        schema.parse(status)
    } catch (error) {
        throw new Error('Invalid order status')
    }

    // Update order status
    const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)

    if (error) throw new Error(`Failed to update order status: ${error.message}`)

    // Log status change event
    await supabase
        .from('order_events')
        .insert({
            order_id: orderId,
            account_id: user.id,
            event_type: 'status_change',
            data: {
                old_status: order.status,
                new_status: status
            }
        })

    revalidatePath(`/orders/${orderId}`)
    revalidatePath('/dashboard/orders')
    return { success: true }
}

/**
 * Add order note
 */
export async function addOrderNote(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const orderId = formData.get('order_id') as string
    const content = formData.get('content') as string
    const noteType = formData.get('note_type') as 'internal' | 'customer' | 'system'
    const isCustomerVisible = formData.get('is_customer_visible') === 'true'

    // Validate input
    if (!content || content.trim().length === 0) {
        throw new Error('Note content is required')
    }

    // Verify permission to add note to this order
    let permissionQuery = supabase
        .from('orders')
        .select('id')

    if (noteType === 'customer') {
        // Customer notes can be added by the buyer or seller
        permissionQuery = permissionQuery.or(
            `account_id.eq.${user.id},stores.owner_id.eq.${user.id}`
        )
    } else {
        // Internal notes can only be added by the seller
        permissionQuery = permissionQuery
            .eq('id', orderId)
            .eq('stores.owner_id', user.id)
    }

    const { data: orderCheck, error: permissionError } = await permissionQuery.single()

    if (permissionError || !orderCheck) {
        throw new Error('Order not found or you do not have permission')
    }

    // Add the note
    const { error } = await supabase
        .from('order_notes')
        .insert({
            order_id: orderId,
            account_id: user.id,
            note_type: noteType,
            content,
            is_customer_visible: isCustomerVisible
        })

    if (error) throw new Error(`Failed to add note: ${error.message}`)

    revalidatePath(`/orders/${orderId}`)
    return { success: true }
}

/**
 * Add shipment to order
 */
export async function addOrderShipment(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const orderId = formData.get('order_id') as string

    // Verify the user has permission (as seller)
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('store_id, stores!inner(owner_id)')
        .eq('id', orderId)
        .eq('stores.owner_id', user.id)
        .single()

    if (orderError || !order) throw new Error('Order not found or you do not have permission')

    const schema = z.object({
        carrier: z.string().min(1).max(100),
        tracking_number: z.string().min(1).max(100),
        tracking_url: z.string().url().optional(),
        shipment_method: z.enum([
            'standard', 'expedited', 'express',
            'overnight', 'international', 'pickup'
        ]),
        weight: z.number().min(0).optional(),
        estimated_delivery_min: z.string().datetime().optional(),
        estimated_delivery_max: z.string().datetime().optional(),
        notes: z.string().max(1000).optional(),
        signature_required: z.boolean().optional(),
    })

    // Parse and validate shipment data
    const parsed = schema.parse({
        carrier: formData.get('carrier'),
        tracking_number: formData.get('tracking_number'),
        tracking_url: formData.get('tracking_url') || undefined,
        shipment_method: formData.get('shipment_method'),
        weight: formData.has('weight') ? parseFloat(formData.get('weight') as string) : undefined,
        estimated_delivery_min: formData.get('estimated_delivery_min') || undefined,
        estimated_delivery_max: formData.get('estimated_delivery_max') || undefined,
        notes: formData.get('notes') || undefined,
        signature_required: formData.get('signature_required') === 'true',
    })

    // Dimensions if provided
    let dimensions = undefined
    if (
        formData.has('length') &&
        formData.has('width') &&
        formData.has('height')
    ) {
        dimensions = {
            length: parseFloat(formData.get('length') as string),
            width: parseFloat(formData.get('width') as string),
            height: parseFloat(formData.get('height') as string),
            unit: formData.get('dimension_unit') || 'in'
        }
    }

    // Create shipment
    const { data: shipment, error } = await supabase
        .from('order_shipments')
        .insert({
            ...parsed,
            order_id: orderId,
            dimensions,
            status: 'processing'
        })
        .select()
        .single()

    if (error) throw new Error(`Failed to create shipment: ${error.message}`)

    // Associate shipped items with the shipment
    const itemIds = formData.get('item_ids') ? JSON.parse(formData.get('item_ids') as string) : []
    if (itemIds && itemIds.length > 0) {
        const shipmentItems = itemIds.map((itemId: string) => ({
            shipment_id: shipment.id,
            order_item_id: itemId,
            quantity: parseInt(formData.get(`quantity_${itemId}`) as string || '1')
        }))

        await supabase
            .from('shipment_items')
            .insert(shipmentItems)

        // Update order fulfillment status
        await updateOrderFulfillmentStatus(orderId)
    }

    // Update order status if currently pending
    const { data: orderStatus } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single()

    if (orderStatus && orderStatus.status === 'pending') {
        await supabase
            .from('orders')
            .update({
                status: 'shipped',
                fulfillment_status: 'partially_fulfilled',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
    }

    // Log shipment creation event
    await supabase
        .from('order_events')
        .insert({
            order_id: orderId,
            account_id: user.id,
            event_type: 'shipment_created',
            data: {
                shipment_id: shipment.id,
                carrier: parsed.carrier,
                tracking_number: parsed.tracking_number
            }
        })

    revalidatePath(`/orders/${orderId}`)
    return { success: true, shipmentId: shipment.id }
}

/**
 * Update order fulfillment status based on shipped items
 */
async function updateOrderFulfillmentStatus(orderId: string) {
    const supabase = createSession()

    // Get total order items and shipped items count
    const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id, quantity')
        .eq('order_id', orderId)

    if (itemsError || !orderItems) return

    const { data: shippedItems, error: shippedError } = await supabase
        .from('shipment_items')
        .select('order_item_id, quantity, shipment_id')
        .in('order_item_id', orderItems.map(item => item.id))

    if (shippedError) return

    // Calculate fulfillment status
    let totalItems = 0
    let shippedQuantity = 0

    orderItems.forEach(item => {
        totalItems += item.quantity
    })

    if (shippedItems) {
        const shippedQuantityByItem: Record<string, number> = {}

        shippedItems.forEach(shipped => {
            const itemId = shipped.order_item_id
            if (!shippedQuantityByItem[itemId]) {
                shippedQuantityByItem[itemId] = 0
            }
            shippedQuantityByItem[itemId] += shipped.quantity
        })

        orderItems.forEach(item => {
            const shipped = shippedQuantityByItem[item.id] || 0
            shippedQuantity += Math.min(shipped, item.quantity)
        })
    }

    // Determine status
    let fulfillmentStatus = 'unfulfilled'

    if (shippedQuantity > 0) {
        fulfillmentStatus = shippedQuantity >= totalItems
            ? 'fulfilled'
            : 'partially_fulfilled'
    }

    // Update order
    await supabase
        .from('orders')
        .update({
            fulfillment_status: fulfillmentStatus,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
}