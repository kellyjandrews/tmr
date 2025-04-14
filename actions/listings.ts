// app/actions/listings.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import type { Listing, ListingImage, ListingShipping, ListingPrice, ListingCategory, ListingTag } from '@/types/listings'

/**
 * Get a listing by ID
 */
export async function getListingById(id: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('listings')
        .select(`
      *,
      store:stores(id, name, slug),
      images:listing_images(*),
      currentPrice:listing_prices(price)
    `)
        .eq('id', id)
        .eq('listing_prices.is_current', true)
        .eq('status', 'published')
        .is('deleted_at', null)
        .single()

    if (error || !data) return null

    return data as Listing & {
        store: { id: string; name: string; slug: string },
        images: ListingImage[],
        currentPrice: { price: number }[]
    }
}

/**
 * Get a listing with all details by ID
 */
export async function getListingWithDetails(id: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('listings')
        .select(`
      *,
      store:stores(id, name, slug, logo_url),
      images:listing_images(*),
      currentPrice:listing_prices(price, created_at),
      shipping:listing_shipping(*),
      brand:brands(id, name, slug),
      categories:listing_categories(
        id, category_id, is_primary,
        category:categories(id, name, slug)
      ),
      tags:listing_tags(
        id, tag_id,
        tag:tags(id, name, slug)
      ),
      inventory:inventory(
        id, quantity_available, quantity_reserved, restock_threshold,
        last_restock_date, next_restock_date
      )
    `)
        .eq('id', id)
        .eq('listing_prices.is_current', true)
        .single()

    if (error || !data) return null

    return data
}

/**
 * Search listings
 */
export async function searchListings(params: {
    query?: string,
    categoryId?: string,
    brandId?: string,
    minPrice?: number,
    maxPrice?: number,
    condition?: string[],
    page?: number,
    perPage?: number,
    sortBy?: string,
    sortDirection?: 'asc' | 'desc'
}) {
    const {
        query,
        categoryId,
        brandId,
        minPrice,
        maxPrice,
        condition,
        page = 1,
        perPage = 20,
        sortBy = 'created_at',
        sortDirection = 'desc'
    } = params

    const supabase = createClient()

    let queryBuilder = supabase
        .from('listings')
        .select(`
      *,
      store:stores(id, name, slug),
      images:listing_images(image_url, is_primary),
      currentPrice:listing_prices(price)
    `, { count: 'exact' })
        .eq('status', 'published')
        .is('deleted_at', null)
        .eq('listing_prices.is_current', true)

    // Apply search query if provided
    if (query && query.trim() !== '') {
        queryBuilder = queryBuilder.textSearch('search_vector', query)
    }

    // Apply filters if provided
    if (categoryId) {
        queryBuilder = queryBuilder.eq('listing_categories.category_id', categoryId)
    }

    if (brandId) {
        queryBuilder = queryBuilder.eq('brand_id', brandId)
    }

    if (minPrice !== undefined) {
        queryBuilder = queryBuilder.gte('listing_prices.price', minPrice)
    }

    if (maxPrice !== undefined) {
        queryBuilder = queryBuilder.lte('listing_prices.price', maxPrice)
    }

    if (condition && condition.length > 0) {
        queryBuilder = queryBuilder.in('condition', condition)
    }

    // Apply sorting
    if (sortBy === 'price') {
        queryBuilder = queryBuilder.order('listing_prices.price', { ascending: sortDirection === 'asc' })
    } else {
        queryBuilder = queryBuilder.order(sortBy, { ascending: sortDirection === 'asc' })
    }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    queryBuilder = queryBuilder.range(from, to)

    const { data, error, count } = await queryBuilder

    if (error) return { listings: [], count: 0 }

    return {
        listings: data.map(listing => ({
            ...listing,
            price: listing.currentPrice?.[0]?.price || 0,
            primaryImage: listing.images?.find(img => img.is_primary)?.image_url || listing.images?.[0]?.image_url
        })),
        count: count || 0
    }
}

/**
 * Create a new listing
 */
export async function createListing(formData: FormData) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // First, verify the user has a store
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!store) throw new Error('You must create a store before creating listings')

    const schema = z.object({
        title: z.string().min(5).max(200),
        description: z.string().max(5000).optional(),
        brand_id: z.string().uuid().optional(),
        year: z.number().min(1900).max(new Date().getFullYear()).optional(),
        condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional(),
        model: z.string().max(200).optional(),
        as_is: z.boolean().optional(),
        is_digital: z.boolean().optional(),
        price: z.number().min(0),
        category_ids: z.array(z.string().uuid()).min(1),
        primary_category_id: z.string().uuid(),
        tag_ids: z.array(z.string().uuid()).optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        title: formData.get('title'),
        description: formData.get('description') || undefined,
        brand_id: formData.get('brand_id') || undefined,
        year: formData.get('year') ? parseInt(formData.get('year') as string) : undefined,
        condition: formData.get('condition') || undefined,
        model: formData.get('model') || undefined,
        as_is: formData.get('as_is') === 'true',
        is_digital: formData.get('is_digital') === 'true',
        price: parseFloat(formData.get('price') as string),
        category_ids: JSON.parse(formData.get('category_ids') as string),
        primary_category_id: formData.get('primary_category_id') as string,
        tag_ids: formData.get('tag_ids') ? JSON.parse(formData.get('tag_ids') as string) : undefined,
    })

    // Start a transaction
    const result = await supabase.rpc('create_listing_transaction', {
        p_store_id: store.id,
        p_title: parsed.title,
        p_description: parsed.description,
        p_brand_id: parsed.brand_id,
        p_year: parsed.year,
        p_condition: parsed.condition,
        p_model: parsed.model,
        p_as_is: parsed.as_is || false,
        p_is_digital: parsed.is_digital || false,
        p_status: 'draft',
        p_price: parsed.price,
        p_category_ids: parsed.category_ids,
        p_primary_category_id: parsed.primary_category_id,
        p_tag_ids: parsed.tag_ids || []
    })

    if (result.error) throw new Error(`Failed to create listing: ${result.error.message}`)

    const newListingId = result.data

    revalidatePath('/dashboard/listings')
    return { success: true, listingId: newListingId }
}

/**
 * Update a listing
 */
export async function updateListing(id: string, formData: FormData) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify the user owns this listing
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('store_id, stores!inner(owner_id)')
        .eq('id', id)
        .eq('stores.owner_id', user.id)
        .single()

    if (listingError || !listing) throw new Error('Listing not found or you do not have permission to edit it')

    const schema = z.object({
        title: z.string().min(5).max(200).optional(),
        description: z.string().max(5000).optional().nullable(),
        brand_id: z.string().uuid().optional().nullable(),
        year: z.number().min(1900).max(new Date().getFullYear()).optional().nullable(),
        condition: z.enum(['new', 'like_new', 'good', 'fair', 'poor']).optional().nullable(),
        model: z.string().max(200).optional().nullable(),
        as_is: z.boolean().optional(),
        is_digital: z.boolean().optional(),
        status: z.enum(['draft', 'published', 'sold', 'archived']).optional(),
        price: z.number().min(0).optional(),
    })

    // Parse and validate form data
    const updateData: Record<string, any> = {}

    if (formData.has('title')) updateData.title = formData.get('title')
    if (formData.has('description')) updateData.description = formData.get('description')
    if (formData.has('brand_id')) updateData.brand_id = formData.get('brand_id') || null
    if (formData.has('year')) updateData.year = formData.get('year') ? parseInt(formData.get('year') as string) : null
    if (formData.has('condition')) updateData.condition = formData.get('condition') || null
    if (formData.has('model')) updateData.model = formData.get('model') || null
    if (formData.has('as_is')) updateData.as_is = formData.get('as_is') === 'true'
    if (formData.has('is_digital')) updateData.is_digital = formData.get('is_digital') === 'true'
    if (formData.has('status')) updateData.status = formData.get('status')

    const parsed = schema.parse(updateData)

    // Start a transaction
    const { error } = await supabase
        .from('listings')
        .update(parsed)
        .eq('id', id)

    if (error) throw new Error(`Failed to update listing: ${error.message}`)

    // Update price if provided
    if (formData.has('price')) {
        const price = parseFloat(formData.get('price') as string)

        // Get current price
        const { data: currentPrice } = await supabase
            .from('listing_prices')
            .select('id, price')
            .eq('listing_id', id)
            .eq('is_current', true)
            .single()

        // Only update if price has changed
        if (!currentPrice || currentPrice.price !== price) {
            // Mark old price as not current
            if (currentPrice) {
                await supabase
                    .from('listing_prices')
                    .update({ is_current: false })
                    .eq('id', currentPrice.id)
            }

            // Create new price record
            await supabase
                .from('listing_prices')
                .insert({
                    listing_id: id,
                    price,
                    previous_price_id: currentPrice?.id,
                    is_current: true
                })

            // Log price change event
            await supabase
                .from('listing_events')
                .insert({
                    listing_id: id,
                    user_id: user.id,
                    event_type: 'price_change',
                    data: {
                        old_price: currentPrice?.price,
                        new_price: price
                    }
                })
        }
    }

    // Update categories if provided
    if (formData.has('category_ids') && formData.has('primary_category_id')) {
        const categoryIds = JSON.parse(formData.get('category_ids') as string)
        const primaryCategoryId = formData.get('primary_category_id') as string

        // Delete existing categories
        await supabase
            .from('listing_categories')
            .delete()
            .eq('listing_id', id)

        // Add new categories
        const categoryInserts = categoryIds.map((categoryId: string) => ({
            listing_id: id,
            category_id: categoryId,
            is_primary: categoryId === primaryCategoryId
        }))

        await supabase
            .from('listing_categories')
            .insert(categoryInserts)
    }

    // Update tags if provided
    if (formData.has('tag_ids')) {
        const tagIds = JSON.parse(formData.get('tag_ids') as string)

        // Delete existing tags
        await supabase
            .from('listing_tags')
            .delete()
            .eq('listing_id', id)

        // Add new tags
        if (tagIds && tagIds.length > 0) {
            const tagInserts = tagIds.map((tagId: string) => ({
                listing_id: id,
                tag_id: tagId
            }))

            await supabase
                .from('listing_tags')
                .insert(tagInserts)
        }
    }

    revalidatePath(`/listings/${id}`)
    revalidatePath('/dashboard/listings')
    return { success: true }
}

/**
 * Add images to a listing
 */
export async function addListingImages(id: string, imageUrls: string[], primaryIndex: number = 0) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify the user owns this listing
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('store_id, stores!inner(owner_id)')
        .eq('id', id)
        .eq('stores.owner_id', user.id)
        .single()

    if (listingError || !listing) throw new Error('Listing not found or you do not have permission to edit it')

    // Get current max display order
    const { data: currentImages } = await supabase
        .from('listing_images')
        .select('display_order')
        .eq('listing_id', id)
        .order('display_order', { ascending: false })
        .limit(1)

    const startOrder = currentImages && currentImages.length > 0
        ? currentImages[0].display_order + 1
        : 0

    // Prepare image inserts
    const imageInserts = imageUrls.map((url, index) => ({
        listing_id: id,
        image_url: url,
        display_order: startOrder + index,
        is_primary: index === primaryIndex
    }))

    // If setting a new primary image, unset any existing primary
    if (imageInserts.some(img => img.is_primary)) {
        await supabase
            .from('listing_images')
            .update({ is_primary: false })
            .eq('listing_id', id)
    }

    // Insert new images
    const { error } = await supabase
        .from('listing_images')
        .insert(imageInserts)

    if (error) throw new Error(`Failed to add images: ${error.message}`)

    revalidatePath(`/listings/${id}`)
    revalidatePath('/dashboard/listings')
    return { success: true }
}

/**
 * Delete a listing
 */
export async function deleteListing(id: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify the user owns this listing
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('store_id, stores!inner(owner_id)')
        .eq('id', id)
        .eq('stores.owner_id', user.id)
        .single()

    if (listingError || !listing) throw new Error('Listing not found or you do not have permission to delete it')

    // Soft delete (mark as deleted)
    const { error } = await supabase
        .from('listings')
        .update({
            deleted_at: new Date().toISOString(),
            status: 'archived'
        })
        .eq('id', id)

    if (error) throw new Error(`Failed to delete listing: ${error.message}`)

    revalidatePath('/dashboard/listings')
    return { success: true }
}

/**
 * Update listing shipping information
 */
export async function updateListingShipping(id: string, formData: FormData) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify the user owns this listing
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('store_id, stores!inner(owner_id)')
        .eq('id', id)
        .eq('stores.owner_id', user.id)
        .single()

    if (listingError || !listing) throw new Error('Listing not found or you do not have permission to edit it')

    const schema = z.object({
        shipping_type: z.enum(['flat', 'free', 'calculated', 'pickup']),
        flat_rate: z.number().min(0).optional(),
        weight: z.number().min(0).optional(),
        carrier: z.string().max(100).optional(),
        international_shipping: z.boolean().optional(),
        dimensions: z.object({
            length: z.number().min(0),
            width: z.number().min(0),
            height: z.number().min(0),
            unit: z.enum(['in', 'cm'])
        }).optional()
    })

    // Parse dimensions if provided
    let dimensions = undefined
    if (
        formData.has('length') &&
        formData.has('width') &&
        formData.has('height') &&
        formData.has('dimension_unit')
    ) {
        dimensions = {
            length: parseFloat(formData.get('length') as string),
            width: parseFloat(formData.get('width') as string),
            height: parseFloat(formData.get('height') as string),
            unit: formData.get('dimension_unit') as 'in' | 'cm'
        }
    }

    // Parse and validate form data
    const parsed = schema.parse({
        shipping_type: formData.get('shipping_type'),
        flat_rate: formData.has('flat_rate') ? parseFloat(formData.get('flat_rate') as string) : undefined,
        weight: formData.has('weight') ? parseFloat(formData.get('weight') as string) : undefined,
        carrier: formData.get('carrier') || undefined,
        international_shipping: formData.get('international_shipping') === 'true',
        dimensions
    })

    // Check if shipping record exists
    const { data: existingShipping } = await supabase
        .from('listing_shipping')
        .select('id')
        .eq('listing_id', id)
        .single()

    if (existingShipping) {
        // Update existing shipping
        const { error } = await supabase
            .from('listing_shipping')
            .update(parsed)
            .eq('id', existingShipping.id)

        if (error) throw new Error(`Failed to update shipping: ${error.message}`)
    } else {
        // Create new shipping record
        const { error } = await supabase
            .from('listing_shipping')
            .insert({
                ...parsed,
                listing_id: id
            })

        if (error) throw new Error(`Failed to create shipping: ${error.message}`)
    }

    revalidatePath(`/listings/${id}`)
    revalidatePath('/dashboard/listings')
    return { success: true }
}

/**
 * Get listings for the current user's store
 */
export async function getStoreListings(page: number = 1, perPage: number = 20, status?: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { listings: [], count: 0 }

    // Get user's store
    const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!store) return { listings: [], count: 0 }

    let queryBuilder = supabase
        .from('listings')
        .select(`
      *,
      images:listing_images(image_url, is_primary),
      currentPrice:listing_prices(price)
    `, { count: 'exact' })
        .eq('store_id', store.id)
        .is('deleted_at', null)
        .eq('listing_prices.is_current', true)

    // Filter by status if provided
    if (status) {
        queryBuilder = queryBuilder.eq('status', status)
    }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await queryBuilder
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) return { listings: [], count: 0 }

    return {
        listings: data.map(listing => ({
            ...listing,
            price: listing.currentPrice?.[0]?.price || 0,
            primaryImage: listing.images?.find(img => img.is_primary)?.image_url || listing.images?.[0]?.image_url
        })),
        count: count || 0
    }
}