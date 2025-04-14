// app/actions/inventory.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Inventory, InventoryTransaction } from '@/types/inventory'

/**
 * Get inventory for a listing
 */
export async function getInventoryForListing(listingId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('listing_id', listingId)
        .single()

    if (error || !data) return null

    return data as Inventory
}

/**
 * Get inventory with status for a listing
 */
export async function getInventoryWithStatus(listingId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('listing_id', listingId)
        .single()

    if (error || !data) return null

    const availableToPurchase = data.quantity_available - data.quantity_reserved
    let status = 'in_stock'
    let daysUntilRestock = null

    if (availableToPurchase <= 0) {
        status = 'out_of_stock'
    } else if (data.restock_threshold && availableToPurchase <= data.restock_threshold) {
        status = 'low_stock'
    }

    if (data.next_restock_date) {
        const nextRestock = new Date(data.next_restock_date)
        const today = new Date()
        const diffTime = nextRestock.getTime() - today.getTime()
        daysUntilRestock = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    }

    return {
        ...data,
        status,
        days_until_restock: daysUntilRestock,
        available_to_purchase: availableToPurchase
    }
}

/**
 * Create or update inventory for a listing
 */
export async function updateInventory(formData: FormData) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const listingId = formData.get('listing_id') as string

    // Verify the user owns this listing
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('store_id, stores!inner(owner_id)')
        .eq('id', listingId)
        .eq('stores.owner_id', user.id)
        .single()

    if (listingError || !listing) throw new Error('Listing not found or you do not have permission to manage its inventory')

    const schema = z.object({
        sku: z.string().optional(),
        quantity_available: z.number().int().min(0),
        restock_threshold: z.number().int().min(0).optional(),
        warehouse_location: z.string().max(100).optional(),
        next_restock_date: z.string().datetime().optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        sku: formData.get('sku') || undefined,
        quantity_available: parseInt(formData.get('quantity_available') as string),
        restock_threshold: formData.has('restock_threshold')
            ? parseInt(formData.get('restock_threshold') as string)
            : undefined,
        warehouse_location: formData.get('warehouse_location') || undefined,
        next_restock_date: formData.get('next_restock_date') || undefined,
    })

    // Check if inventory record exists
    const { data: existingInventory } = await supabase
        .from('inventory')
        .select('id, quantity_available')
        .eq('listing_id', listingId)
        .single()

    let newTransaction = null

    if (existingInventory) {
        // Calculate change in quantity
        const quantityChange = parsed.quantity_available - existingInventory.quantity_available

        // Update existing inventory
        const { error } = await supabase
            .from('inventory')
            .update({
                ...parsed,
                last_restock_date: quantityChange > 0 ? new Date().toISOString() : undefined,
            })
            .eq('id', existingInventory.id)

        if (error) throw new Error(`Failed to update inventory: ${error.message}`)

        // Log transaction if quantity changed
        if (quantityChange !== 0) {
            newTransaction = {
                inventory_id: existingInventory.id,
                quantity_change: quantityChange,
                transaction_type: quantityChange > 0 ? 'restock' : 'adjustment',
                notes: formData.get('notes') || 'Manual inventory update',
                created_by: user.id,
            }
        }
    } else {
        // Create new inventory record
        const { data: newInventory, error } = await supabase
            .from('inventory')
            .insert({
                ...parsed,
                listing_id: listingId,
                quantity_reserved: 0,
                last_restock_date: parsed.quantity_available > 0 ? new Date().toISOString() : undefined,
            })
            .select()
            .single()

        if (error) throw new Error(`Failed to create inventory: ${error.message}`)

        // Log initial stock transaction
        if (parsed.quantity_available > 0) {
            newTransaction = {
                inventory_id: newInventory.id,
                quantity_change: parsed.quantity_available,
                transaction_type: 'restock',
                notes: 'Initial inventory setup',
                created_by: user.id,
            }
        }
    }

    // Create transaction record if needed
    if (newTransaction) {
        await supabase
            .from('inventory_transactions')
            .insert(newTransaction)
    }

    revalidatePath(`/dashboard/listings/${listingId}`)
    return { success: true }
}

/**
 * Get inventory transaction history
 */
export async function getInventoryTransactions(inventoryId: string, limit: number = 20) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Verify the user has permission to view this inventory
    const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('listing_id, listings!inner(store_id, stores!inner(owner_id))')
        .eq('id', inventoryId)
        .eq('listings.stores.owner_id', user.id)
        .single()

    if (inventoryError || !inventory) return []

    const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
      *,
      created_by_user:accounts(username)
    `)
        .eq('inventory_id', inventoryId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) return []

    return data.map(transaction => ({
        ...transaction,
        created_by_username: transaction.created_by_user?.username,
        timestamp: transaction.created_at,
    }))
}

/**
 * Add inventory transaction
 */
export async function addInventoryTransaction(formData: FormData) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const inventoryId = formData.get('inventory_id') as string

    // Verify the user has permission to modify this inventory
    const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('id, listing_id, listings!inner(store_id, stores!inner(owner_id))')
        .eq('id', inventoryId)
        .eq('listings.stores.owner_id', user.id)
        .single()

    if (inventoryError || !inventory) throw new Error('Inventory not found or you do not have permission to manage it')

    const schema = z.object({
        quantity_change: z.number().int().nonzero(),
        transaction_type: z.enum(['restock', 'adjustment', 'return']),
        notes: z.string().max(500).optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        quantity_change: parseInt(formData.get('quantity_change') as string),
        transaction_type: formData.get('transaction_type'),
        notes: formData.get('notes') || undefined,
    })

    // Create transaction record
    const { error: transactionError } = await supabase
        .from('inventory_transactions')
        .insert({
            inventory_id: inventoryId,
            quantity_change: parsed.quantity_change,
            transaction_type: parsed.transaction_type,
            notes: parsed.notes,
            created_by: user.id,
        })

    if (transactionError) throw new Error(`Failed to record transaction: ${transactionError.message}`)

    // Update the inventory quantity based on the transaction
    // (Note: This would normally be handled by a database trigger)
    await supabase
        .from('inventory')
        .update({
            quantity_available: supabase.rpc('get_new_inventory_quantity', {
                p_inventory_id: inventoryId,
                p_quantity_change: parsed.quantity_change
            }),
            last_restock_date: parsed.transaction_type === 'restock' ? new Date().toISOString() : undefined
        })
        .eq('id', inventoryId)

    revalidatePath(`/dashboard/listings/${inventory.listing_id}`)
    return { success: true }
}

/**
 * Get low stock inventory for a store
 */
export async function getLowStockInventory(page: number = 1, perPage: number = 20) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { inventory: [], count: 0 }

    // Get user's store
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!store) return { inventory: [], count: 0 }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await supabase
        .from('inventory')
        .select(`
      *,
      listing:listings(id, title, slug)
    `, { count: 'exact' })
        .eq('listings.store_id', store.id)
        .lt('quantity_available', supabase.raw('COALESCE(restock_threshold, 5)'))
        .range(from, to)

    if (error) return { inventory: [], count: 0 }

    return {
        inventory: data.map(item => ({
            ...item,
            available_to_purchase: item.quantity_available - item.quantity_reserved,
            status: item.quantity_available <= 0 ? 'out_of_stock' : 'low_stock'
        })),
        count: count || 0
    }
}