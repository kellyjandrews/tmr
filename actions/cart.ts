// app/actions/carts.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import type { CartItem } from '@/types/carts'
import { generateId } from '@/lib/utils'

/**
 * Get the current user's active cart
 */
export async function getActiveCart() {
    const supabase = await createSession()


    // Try to get user
    const { data: { user } } = await supabase.auth.getUser()

    // Get device ID from cookie for guest carts
    const cookieStore = cookies()
    const deviceId = cookieStore.get('deviceId')?.value || generateId()

    // Set device ID cookie if it doesn't exist
    if (!cookieStore.has('deviceId')) {
        cookieStore.set('deviceId', deviceId, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        })
    }

    // Query parameters
    const queryParams: any = {
        status: 'active',
        deleted_at: null
    }

    // If logged in, get user cart, otherwise get guest cart by device ID
    if (user) {
        queryParams.account_id = user.id
    } else {
        queryParams.account_id = null
        queryParams.device_id = deviceId
    }

    // Get cart
    const { data: cart, error } = await supabase
        .from('carts')
        .select(`
      *,
      items:cart_items(
        *,
        listing:listings(
          id,
          title,
          slug,
          images:listing_images(image_url, is_primary)
        )
      ),
      coupons:cart_coupons(*),
      shipping_options:cart_shipping_options(*)
    `)
        .match(queryParams)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error || !cart) {
        // Create a new cart if none exists
        return await createCart(user?.id, deviceId)
    }

    // Transform the data for easier use in the UI
    const transformedCart = {
        ...cart,
        items: cart.items.map((item: any) => ({
            ...item,
            listing: {
                ...item.listing,
                image_url: item.listing.images?.find((img: any) => img.is_primary)?.image_url ||
                    item.listing.images?.[0]?.image_url
            }
        }))
    }

    return transformedCart
}

/**
 * Create a new cart
 */
async function createCart(accountId?: string, deviceId?: string) {
    const supabase = await createSession()


    const { data: cart, error } = await supabase
        .from('carts')
        .insert({
            account_id: accountId || null,
            device_id: !accountId ? deviceId : null,
            status: 'active',
            subtotal: 0,
            total_discounts: 0,
            total_shipping: 0,
            total_tax: 0,
            total_price: 0,
            currency: 'USD',
            expires_at: accountId ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create cart: ${error.message}`)
    }

    return {
        ...cart,
        items: [],
        coupons: [],
        shipping_options: []
    }
}

/**
 * Add an item to cart
 */
export async function addToCart(formData: FormData) {
    const supabase = await createSession()


    const cart = await getActiveCart()
    if (!cart) throw new Error('Failed to get or create cart')

    const schema = z.object({
        listing_id: z.string().uuid(),
        quantity: z.number().int().min(1),
        selected_options: z.record(z.string(), z.any()).optional(),
        custom_instructions: z.string().max(1000).optional(),
        is_gift: z.boolean().optional(),
        gift_message: z.string().max(500).optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        listing_id: formData.get('listing_id'),
        quantity: Number.parseInt(formData.get('quantity') as string || '1'),
        selected_options: formData.has('selected_options')
            ? JSON.parse(formData.get('selected_options') as string)
            : undefined,
        custom_instructions: formData.get('custom_instructions') || undefined,
        is_gift: formData.get('is_gift') === 'true',
        gift_message: formData.get('gift_message') || undefined,
    })

    // Get listing details
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, currentPrice:listing_prices(price, id)')
        .eq('id', parsed.listing_id)
        .eq('status', 'published')
        .eq('listing_prices.is_current', true)
        .is('deleted_at', null)
        .single()

    if (listingError || !listing) throw new Error('Listing not found or unavailable')

    const priceSnapshot = listing.currentPrice[0]?.price

    // Check inventory
    const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('quantity_available, quantity_reserved')
        .eq('listing_id', parsed.listing_id)
        .single()

    if (!inventoryError && inventory) {
        const availableQuantity = inventory.quantity_available - inventory.quantity_reserved
        if (availableQuantity < parsed.quantity) {
            throw new Error(`Sorry, only ${availableQuantity} item(s) available`)
        }
    }

    // Check if item already exists in cart
    const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('cart_id', cart.id)
        .eq('listing_id', parsed.listing_id)
        .eq('selected_options', parsed.selected_options || null)
        .single()

    if (existingItem) {
        // Update existing item quantity
        const { error } = await supabase
            .from('cart_items')
            .update({
                quantity: existingItem.quantity + parsed.quantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id)

        if (error) throw new Error(`Failed to update cart item: ${error.message}`)
    } else {
        // Add new item
        const { error } = await supabase
            .from('cart_items')
            .insert({
                cart_id: cart.id,
                listing_id: parsed.listing_id,
                price_snapshot: priceSnapshot,
                quantity: parsed.quantity,
                selected_options: parsed.selected_options || null,
                custom_instructions: parsed.custom_instructions || null,
                item_subtotal: priceSnapshot * parsed.quantity,
                is_gift: parsed.is_gift || false,
                gift_message: parsed.gift_message || null
            })

        if (error) throw new Error(`Failed to add item to cart: ${error.message}`)
    }

    // Reserve inventory
    if (inventory) {
        await supabase
            .from('inventory_transactions')
            .insert({
                inventory_id: inventory.id,
                quantity_change: -parsed.quantity, // Negative to reserve
                transaction_type: 'reservation',
                cart_id: cart.id
            })
    }

    // Log cart event
    await supabase
        .from('cart_events')
        .insert({
            cart_id: cart.id,
            account_id: cart.account_id,
            event_type: existingItem ? 'update_quantity' : 'add_item',
            data: {
                listing_id: parsed.listing_id,
                quantity: parsed.quantity,
                selected_options: parsed.selected_options
            },
            ip_address: formData.get('ip_address') || null
        })

    revalidatePath('/cart')
    return { success: true }
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(formData: FormData) {
    const supabase = await createSession()


    const cart = await getActiveCart()
    if (!cart) throw new Error('Cart not found')

    const schema = z.object({
        item_id: z.string().uuid(),
        quantity: z.number().int().min(0)
    })

    // Parse and validate form data
    const parsed = schema.parse({
        item_id: formData.get('item_id'),
        quantity: Number.parseInt(formData.get('quantity') as string)
    })

    // Get current item details
    const { data: item, error: itemError } = await supabase
        .from('cart_items')
        .select('id, quantity, listing_id')
        .eq('id', parsed.item_id)
        .eq('cart_id', cart.id)
        .single()

    if (itemError || !item) throw new Error('Cart item not found')

    // If quantity is 0, remove item
    if (parsed.quantity === 0) {
        return removeCartItem(formData)
    }

    // Check inventory
    const { data: inventory } = await supabase
        .from('inventory')
        .select('id, quantity_available, quantity_reserved')
        .eq('listing_id', item.listing_id)
        .single()

    if (inventory) {
        const currentReservation = item.quantity
        const availableQuantity = inventory.quantity_available - inventory.quantity_reserved + currentReservation

        if (availableQuantity < parsed.quantity) {
            throw new Error(`Sorry, only ${availableQuantity} item(s) available`)
        }

        // Update inventory reservation
        const quantityDiff = parsed.quantity - currentReservation

        if (quantityDiff !== 0) {
            await supabase
                .from('inventory_transactions')
                .insert({
                    inventory_id: inventory.id,
                    quantity_change: -quantityDiff, // Negative to reserve, positive to release
                    transaction_type: 'reservation',
                    cart_id: cart.id
                })
        }
    }

    // Update item quantity
    const { error } = await supabase
        .from('cart_items')
        .update({
            quantity: parsed.quantity,
            updated_at: new Date().toISOString()
        })
        .eq('id', parsed.item_id)

    if (error) throw new Error(`Failed to update quantity: ${error.message}`)

    // Log cart event
    await supabase
        .from('cart_events')
        .insert({
            cart_id: cart.id,
            account_id: cart.account_id,
            event_type: 'update_quantity',
            data: {
                item_id: parsed.item_id,
                old_quantity: item.quantity,
                new_quantity: parsed.quantity
            }
        })

    revalidatePath('/cart')
    return { success: true }
}

/**
 * Remove item from cart
 */
export async function removeCartItem(formData: FormData) {
    const supabase = await createSession()


    const cart = await getActiveCart()
    if (!cart) throw new Error('Cart not found')

    const itemId = formData.get('item_id') as string

    // Get item details before removal
    const { data: item, error: itemError } = await supabase
        .from('cart_items')
        .select('id, quantity, listing_id')
        .eq('id', itemId)
        .eq('cart_id', cart.id)
        .single()

    if (itemError || !item) throw new Error('Cart item not found')

    // Remove item
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)

    if (error) throw new Error(`Failed to remove item: ${error.message}`)

    // Release inventory reservation
    const { data: inventory } = await supabase
        .from('inventory')
        .select('id')
        .eq('listing_id', item.listing_id)
        .single()

    if (inventory) {
        await supabase
            .from('inventory_transactions')
            .insert({
                inventory_id: inventory.id,
                quantity_change: item.quantity, // Positive to release reservation
                transaction_type: 'reservation',
                cart_id: cart.id
            })
    }

    // Log cart event
    await supabase
        .from('cart_events')
        .insert({
            cart_id: cart.id,
            account_id: cart.account_id,
            event_type: 'remove_item',
            data: {
                listing_id: item.listing_id,
                quantity: item.quantity
            }
        })

    revalidatePath('/cart')
    return { success: true }
}

/**
 * Apply coupon to cart
 */
export async function applyCoupon(formData: FormData) {
    const supabase = await createSession()


    const cart = await getActiveCart()
    if (!cart) throw new Error('Cart not found')

    const couponCode = (formData.get('coupon_code') as string).trim().toUpperCase()

    // Get coupon details
    const { data: coupon, error: couponError } = await supabase
        .from('store_coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .lt('start_date', new Date().toISOString())
        .gt('expiration_date', new Date().toISOString())
        .single()

    if (couponError || !coupon) throw new Error('Invalid or expired coupon code')

    // Check if coupon is already applied
    const { data: existingCoupon } = await supabase
        .from('cart_coupons')
        .select('id')
        .eq('cart_id', cart.id)
        .eq('coupon_id', coupon.id)
        .single()

    if (existingCoupon) throw new Error('This coupon is already applied to your cart')

    // Check if coupon is valid for this cart
    // 1. Minimum purchase requirement
    if (coupon.minimum_purchase && cart.subtotal < coupon.minimum_purchase) {
        throw new Error(`This coupon requires a minimum purchase of $${coupon.minimum_purchase}`)
    }

    // 2. Check max uses per user
    if (coupon.max_uses_per_user && cart.account_id) {
        const { count, error: countError } = await supabase
            .from('cart_coupons')
            .select('id', { count: 'exact' })
            .eq('coupon_id', coupon.id)
            .eq('cart_id', cart.id)

        if (!countError && count && count >= coupon.max_uses_per_user) {
            throw new Error(`You've reached the maximum number of uses for this coupon`)
        }
    }

    // Calculate applied discount
    let appliedDiscount = 0
    let affectedItems: string[] = []

    // For now, apply discount to all items
    // More complex logic would go here for targeted coupons

    if (coupon.discount_type === 'percentage') {
        appliedDiscount = cart.subtotal * (coupon.discount_value / 100)
    } else if (coupon.discount_type === 'fixed_amount') {
        appliedDiscount = Math.min(coupon.discount_value, cart.subtotal)
    } else if (coupon.discount_type === 'free_shipping') {
        appliedDiscount = cart.total_shipping
    }

    // Get item IDs for affected items
    cart.items.forEach((item: CartItem) => {
        affectedItems.push(item.id)
    })

    // Apply coupon
    const { error } = await supabase
        .from('cart_coupons')
        .insert({
            cart_id: cart.id,
            coupon_id: coupon.id,
            coupon_code: couponCode,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            applied_discount: appliedDiscount,
            affects_items: affectedItems,
            applies_to_shipping: coupon.discount_type === 'free_shipping',
            is_active: true,
            application_order: 0 // For multiple coupon stacking order
        })

    if (error) throw new Error(`Failed to apply coupon: ${error.message}`)

    // Increment coupon usage count
    await supabase
        .from('store_coupons')
        .update({ usage_count: coupon.usage_count + 1 })
        .eq('id', coupon.id)

    // Log cart event
    await supabase
        .from('cart_events')
        .insert({
            cart_id: cart.id,
            account_id: cart.account_id,
            event_type: 'apply_coupon',
            data: {
                coupon_code: couponCode,
                applied_discount: appliedDiscount
            }
        })

    revalidatePath('/cart')
    return { success: true }
}

/**
 * Remove coupon from cart
 */
export async function removeCoupon(formData: FormData) {
    const supabase = await createSession()


    const cart = await getActiveCart()
    if (!cart) throw new Error('Cart not found')

    const couponId = formData.get('coupon_id') as string

    // Remove coupon
    const { error } = await supabase
        .from('cart_coupons')
        .delete()
        .eq('id', couponId)
        .eq('cart_id', cart.id)

    if (error) throw new Error(`Failed to remove coupon: ${error.message}`)

    // Log cart event
    await supabase
        .from('cart_events')
        .insert({
            cart_id: cart.id,
            account_id: cart.account_id,
            event_type: 'remove_coupon',
            data: { coupon_id: couponId }
        })

    revalidatePath('/cart')
    return { success: true }
}

/**
 * Update shipping details
 */
export async function updateShippingDetails(formData: FormData) {
    const supabase = await createSession()


    const cart = await getActiveCart()
    if (!cart) throw new Error('Cart not found')

    const schema = z.object({
        shipping_address_id: z.string().uuid().optional(),
        billing_address_id: z.string().uuid().optional(),
        selected_shipping_option_id: z.string().uuid().optional(),
        notes: z.string().max(1000).optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        shipping_address_id: formData.get('shipping_address_id') || undefined,
        billing_address_id: formData.get('billing_address_id') || undefined,
        selected_shipping_option_id: formData.get('selected_shipping_option_id') || undefined,
        notes: formData.get('notes') || undefined,
    })

    // Update cart
    const updates: any = {}

    if (parsed.shipping_address_id) updates.shipping_address_id = parsed.shipping_address_id
    if (parsed.billing_address_id) updates.billing_address_id = parsed.billing_address_id
    if (parsed.notes) updates.notes = parsed.notes

    if (Object.keys(updates).length > 0) {
        const { error } = await supabase
            .from('carts')
            .update(updates)
            .eq('id', cart.id)

        if (error) throw new Error(`Failed to update shipping details: ${error.message}`)
    }

    // Update selected shipping option
    if (parsed.selected_shipping_option_id) {
        // First, unselect any currently selected options
        await supabase
            .from('cart_shipping_options')
            .update({ is_selected: false })
            .eq('cart_id', cart.id)

        // Then select the chosen option
        const { error } = await supabase
            .from('cart_shipping_options')
            .update({ is_selected: true })
            .eq('id', parsed.selected_shipping_option_id)
            .eq('cart_id', cart.id)

        if (error) throw new Error(`Failed to update shipping option: ${error.message}`)
    }

    revalidatePath('/cart/checkout')
    return { success: true }
}

/**
 * Save item for later
 */
export async function saveForLater(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to save items')

    const listingId = formData.get('listing_id') as string
    const itemId = formData.get('item_id') as string // Optional, if saving from cart

    // Get listing details
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, currentPrice:listing_prices(price)')
        .eq('id', listingId)
        .eq('listing_prices.is_current', true)
        .eq('status', 'published')
        .is('deleted_at', null)
        .single()

    if (listingError || !listing) throw new Error('Listing not found or unavailable')

    // Check if item already saved
    const { data: existingSave } = await supabase
        .from('saved_cart_items')
        .select('id')
        .eq('account_id', user.id)
        .eq('listing_id', listingId)
        .single()

    if (existingSave) throw new Error('This item is already in your saved items')

    let selectedOptions = null
    let quantity = 1

    // If saving from cart, get item details
    if (itemId) {
        const { data: cartItem } = await supabase
            .from('cart_items')
            .select('selected_options, quantity')
            .eq('id', itemId)
            .single()

        if (cartItem) {
            selectedOptions = cartItem.selected_options
            quantity = cartItem.quantity
        }
    }

    // Check inventory status
    const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity_available, quantity_reserved')
        .eq('listing_id', listingId)
        .single()

    const isInStock = !inventory || (inventory.quantity_available - inventory.quantity_reserved) > 0

    // Save item
    const { error } = await supabase
        .from('saved_cart_items')
        .insert({
            account_id: user.id,
            listing_id: listingId,
            selected_options: selectedOptions,
            quantity: quantity,
            price_at_save: listing.currentPrice[0]?.price,
            is_in_stock: isInStock,
            collection_name: formData.get('collection_name') as string || 'Saved Items',
            notes: formData.get('notes') as string || null,
            notify_on_price_drop: formData.get('notify_on_price_drop') === 'true',
            notify_on_back_in_stock: formData.get('notify_on_back_in_stock') === 'true' && !isInStock,
        })

    if (error) throw new Error(`Failed to save item: ${error.message}`)

    // If saving from cart, optionally remove the item
    if (itemId && formData.get('remove_from_cart') === 'true') {
        await removeCartItem(formData)
    }

    revalidatePath('/saved-items')
    if (itemId) revalidatePath('/cart')

    return { success: true }
}

/**
 * Get user's saved items
 */
export async function getSavedItems(collectionName?: string) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
        .from('saved_cart_items')
        .select(`
      *,
      listing:listings(
        id,
        title,
        slug,
        currentPrice:listing_prices(price),
        images:listing_images(image_url, is_primary)
      )
    `)
        .eq('account_id', user.id)
        .eq('listing_prices.is_current', true)
        .order('created_at', { ascending: false })

    // Filter by collection if provided
    if (collectionName) {
        query = query.eq('collection_name', collectionName)
    }

    const { data, error } = await query

    if (error) return []

    // Transform the data for easier use in the UI
    return data.map(item => ({
        ...item,
        price: item.listing?.currentPrice[0]?.price,
        image_url: item.listing?.images?.find((img: any) => img.is_primary)?.image_url ||
            item.listing?.images?.[0]?.image_url
    }))
}

/**
 * Move saved item to cart
 */
export async function moveToCart(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to access saved items')

    const savedItemId = formData.get('saved_item_id') as string

    // Get saved item details
    const { data: savedItem, error: itemError } = await supabase
        .from('saved_cart_items')
        .select('listing_id, selected_options, quantity')
        .eq('id', savedItemId)
        .eq('account_id', user.id)
        .single()

    if (itemError || !savedItem) throw new Error('Saved item not found')

    // Create form data for addToCart
    const cartFormData = new FormData()
    cartFormData.append('listing_id', savedItem.listing_id)
    cartFormData.append('quantity', savedItem.quantity.toString())

    if (savedItem.selected_options) {
        cartFormData.append('selected_options', JSON.stringify(savedItem.selected_options))
    }

    // Add to cart
    await addToCart(cartFormData)

    // Mark as moved to cart
    await supabase
        .from('saved_cart_items')
        .update({
            moved_to_cart_at: new Date().toISOString()
        })
        .eq('id', savedItemId)

    // Optionally delete saved item
    if (formData.get('remove_after_move') === 'true') {
        await supabase
            .from('saved_cart_items')
            .delete()
            .eq('id', savedItemId)
    }

    revalidatePath('/saved-items')
    revalidatePath('/cart')

    return { success: true }
}

/**
 * Remove saved item
 */
export async function removeSavedItem(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to access saved items')

    const savedItemId = formData.get('saved_item_id') as string

    // Remove saved item
    const { error } = await supabase
        .from('saved_cart_items')
        .delete()
        .eq('id', savedItemId)
        .eq('account_id', user.id)

    if (error) throw new Error(`Failed to remove saved item: ${error.message}`)

    revalidatePath('/saved-items')
    return { success: true }
}