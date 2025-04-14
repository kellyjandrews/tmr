// app/actions/orders.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Order, OrderItem, OrderShipment, OrderEvent, OrderNote } from '@/types/orders'
import { getActiveCart } from './carts'

/**
 * Get order by ID
 */
export async function getOrderById(id: string) {
    const supabase = createClient()

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
      )
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
