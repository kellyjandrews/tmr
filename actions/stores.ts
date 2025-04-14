// app/actions/stores.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Store } from '@/types/stores'

/**
 * Get store by ID
 */
export async function getStoreById(id: string) {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .is('deleted_at', null)
        .single()

    if (error || !data) return null

    return data as Store
}

/**
 * Get store by slug
 */
export async function getStoreBySlug(slug: string) {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('stores')
        .select(`
      *,
      addresses:store_address(*),
      images:store_images(*),
      categories:store_categories(
        id, category_id, is_primary,
        category:categories(id, name, slug)
      )
    `)
        .eq('slug', slug)
        .eq('status', 'active')
        .is('deleted_at', null)
        .single()

    if (error || !data) return null

    return data
}

/**
 * Get current user's store
 */
export async function getCurrentUserStore() {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('stores')
        .select(`
      *,
      addresses:store_address(*),
      images:store_images(*),
      categories:store_categories(
        id, category_id, is_primary,
        category:categories(id, name, slug)
      ),
      shipping_policy:store_shipping_policy(*),
      return_policy:store_return_policy(*)
    `)
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .single()

    if (error || !data) return null

    return data
}

/**
 * Create a new store
 */
export async function createStore(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Check if user already has a store
    const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .single()

    if (existingStore) throw new Error('You already have a store')

    const schema = z.object({
        name: z.string().min(2).max(200),
        description: z.string().min(10).max(5000),
        email: z.string().email(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
        website: z.string().url().optional(),
        logo_url: z.string().url().optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        name: formData.get('name'),
        description: formData.get('description'),
        email: formData.get('email'),
        phone: formData.get('phone') || undefined,
        website: formData.get('website') || undefined,
        logo_url: formData.get('logo_url') || undefined,
    })

    // Generate slug from name
    const slug = parsed.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    // Create store
    const { data: store, error } = await supabase
        .from('stores')
        .insert({
            ...parsed,
            slug,
            owner_id: user.id,
            status: 'pending', // New stores start in pending status
            verification_status: 'unverified',
        })
        .select()
        .single()

    if (error) throw new Error(`Failed to create store: ${error.message}`)

    // Update user role to seller
    await supabase
        .from('accounts')
        .update({ role: 'seller' })
        .eq('id', user.id)

    revalidatePath('/dashboard')
    return { success: true, storeId: store.id }
}

/**
 * Update store details
 */
export async function updateStore(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current user's store
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .single()

    if (storeError || !store) throw new Error('Store not found')

    const schema = z.object({
        name: z.string().min(2).max(200).optional(),
        description: z.string().min(10).max(5000).optional(),
        email: z.string().email().optional(),
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
        website: z.string().url().optional().nullable(),
        logo_url: z.string().url().optional().nullable(),
    })

    // Parse and validate form data
    const updateData: Record<string, any> = {}

    if (formData.has('name')) updateData.name = formData.get('name')
    if (formData.has('description')) updateData.description = formData.get('description')
    if (formData.has('email')) updateData.email = formData.get('email')
    if (formData.has('phone')) updateData.phone = formData.get('phone') || null
    if (formData.has('website')) updateData.website = formData.get('website') || null
    if (formData.has('logo_url')) updateData.logo_url = formData.get('logo_url') || null

    const parsed = schema.parse(updateData)

    // If name is updated, regenerate slug
    if (parsed.name) {
        parsed.slug = parsed.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    // Update store
    const { error } = await supabase
        .from('stores')
        .update(parsed)
        .eq('id', store.id)

    if (error) throw new Error(`Failed to update store: ${error.message}`)

    revalidatePath('/dashboard/store')
    return { success: true }
}

/**
 * Add store address
 */
export async function addStoreAddress(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current user's store
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .single()

    if (storeError || !store) throw new Error('Store not found')

    const schema = z.object({
        // Continuing app/actions/stores.ts

        address_type: z.enum(['primary', 'billing', 'shipping', 'warehouse', 'legal']),
        street_address: z.string().min(5).max(500),
        address_line_2: z.string().max(500).optional(),
        city: z.string().min(2).max(100),
        state_province: z.string().max(100).optional(),
        postal_code: z.string().min(3).max(20),
        country: z.string().length(2),
        is_default: z.boolean().optional(),
        is_commercial: z.boolean().optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        address_type: formData.get('address_type'),
        street_address: formData.get('street_address'),
        address_line_2: formData.get('address_line_2') || undefined,
        city: formData.get('city'),
        state_province: formData.get('state_province') || undefined,
        postal_code: formData.get('postal_code'),
        country: formData.get('country'),
        is_default: formData.get('is_default') === 'true',
        is_commercial: formData.get('is_commercial') === 'true',
    })

    // If this is set as default, update all others to not be default
    if (parsed.is_default) {
        await supabase
            .from('store_address')
            .update({ is_default: false })
            .eq('store_id', store.id)
            .eq('address_type', parsed.address_type)
    }

    // Add address
    const { error } = await supabase
        .from('store_address')
        .insert({
            ...parsed,
            store_id: store.id,
        })

    if (error) throw new Error(`Failed to add address: ${error.message}`)

    revalidatePath('/dashboard/store/addresses')
    return { success: true }
}

/**
* Update store shipping policy
*/
export async function updateShippingPolicy(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current user's store
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .single()

    if (storeError || !store) throw new Error('Store not found')

    const schema = z.object({
        shipping_type: z.enum(['free', 'flat', 'calculated', 'custom', 'mixed']),
        domestic_processing_time: z.number().min(0).max(30).optional(),
        international_processing_time: z.number().min(0).max(45).optional(),
        free_shipping_threshold: z.number().min(0).optional(),
        handling_fee: z.number().min(0).optional(),
        shipping_carriers: z.object({
            usps: z.object({
                enabled: z.boolean(),
                services: z.array(z.string()),
                account_id: z.string().optional(),
            }).optional(),
            ups: z.object({
                enabled: z.boolean(),
                services: z.array(z.string()),
                account_id: z.string().optional(),
            }).optional(),
            fedex: z.object({
                enabled: z.boolean(),
                services: z.array(z.string()),
                account_id: z.string().optional(),
            }).optional(),
            dhl: z.object({
                enabled: z.boolean(),
                services: z.array(z.string()),
                account_id: z.string().optional(),
            }).optional(),
            preferred_carrier: z.string().optional(),
        }),
        international_shipping: z.boolean(),
        return_shipping_policy: z.string().min(50).max(5000).optional(),
        insurance_options: z.object({
            available: z.boolean(),
            provider: z.string().optional(),
            auto_insure_above: z.number().optional(),
            default_coverage_amount: z.number().optional(),
            free_insurance_threshold: z.number().optional(),
        }).optional(),
    })

    // Parse shipping carriers
    const shippingCarriers = {
        usps: {
            enabled: formData.get('usps_enabled') === 'true',
            services: formData.get('usps_services') ? JSON.parse(formData.get('usps_services') as string) : [],
            account_id: formData.get('usps_account_id') || undefined,
        },
        ups: {
            enabled: formData.get('ups_enabled') === 'true',
            services: formData.get('ups_services') ? JSON.parse(formData.get('ups_services') as string) : [],
            account_id: formData.get('ups_account_id') || undefined,
        },
        fedex: {
            enabled: formData.get('fedex_enabled') === 'true',
            services: formData.get('fedex_services') ? JSON.parse(formData.get('fedex_services') as string) : [],
            account_id: formData.get('fedex_account_id') || undefined,
        },
        dhl: {
            enabled: formData.get('dhl_enabled') === 'true',
            services: formData.get('dhl_services') ? JSON.parse(formData.get('dhl_services') as string) : [],
            account_id: formData.get('dhl_account_id') || undefined,
        },
        preferred_carrier: formData.get('preferred_carrier') || undefined,
    }

    // Parse insurance options
    let insuranceOptions = undefined
    if (formData.get('insurance_available') === 'true') {
        insuranceOptions = {
            available: true,
            provider: formData.get('insurance_provider') || undefined,
            auto_insure_above: formData.has('auto_insure_above')
                ? Number.parseFloat(formData.get('auto_insure_above') as string)
                : undefined,
            default_coverage_amount: formData.has('default_coverage_amount')
                ? Number.parseFloat(formData.get('default_coverage_amount') as string)
                : undefined,
            free_insurance_threshold: formData.has('free_insurance_threshold')
                ? Number.parseFloat(formData.get('free_insurance_threshold') as string)
                : undefined,
        }
    } else {
        insuranceOptions = { available: false }
    }

    // Parse and validate form data
    const parsed = schema.parse({
        shipping_type: formData.get('shipping_type'),
        domestic_processing_time: formData.has('domestic_processing_time')
            ? Number.parseInt(formData.get('domestic_processing_time') as string)
            : undefined,
        international_processing_time: formData.has('international_processing_time')
            ? Number.parseInt(formData.get('international_processing_time') as string)
            : undefined,
        free_shipping_threshold: formData.has('free_shipping_threshold')
            ? Number.parseFloat(formData.get('free_shipping_threshold') as string)
            : undefined,
        handling_fee: formData.has('handling_fee')
            ? Number.parseFloat(formData.get('handling_fee') as string)
            : undefined,
        shipping_carriers: shippingCarriers,
        international_shipping: formData.get('international_shipping') === 'true',
        return_shipping_policy: formData.get('return_shipping_policy') || undefined,
        insurance_options: insuranceOptions,
    })

    // Check if shipping policy exists
    const { data: existingPolicy } = await supabase
        .from('store_shipping_policy')
        .select('id')
        .eq('store_id', store.id)
        .single()

    if (existingPolicy) {
        // Update existing policy
        const { error } = await supabase
            .from('store_shipping_policy')
            .update(parsed)
            .eq('id', existingPolicy.id)

        if (error) throw new Error(`Failed to update shipping policy: ${error.message}`)
    } else {
        // Create new policy
        const { error } = await supabase
            .from('store_shipping_policy')
            .insert({
                ...parsed,
                store_id: store.id,
            })

        if (error) throw new Error(`Failed to create shipping policy: ${error.message}`)
    }

    revalidatePath('/dashboard/store/shipping')
    return { success: true }
}

/**
* Update store return policy
*/
export async function updateReturnPolicy(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current user's store
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .single()

    if (storeError || !store) throw new Error('Store not found')

    const schema = z.object({
        return_window: z.number().min(7).max(365),
        refund_method: z.enum(['full', 'store_credit', 'partial', 'exchange']),
        restocking_fee: z.number().min(0).max(100).optional(),
        condition_requirements: z.string().min(50).max(1000),
        return_shipping_paid_by: z.enum(['buyer', 'seller', 'conditional', 'free_over_threshold']),
        exceptions: z.string().max(2000).optional(),
        digital_return_policy: z.boolean(),
        refund_processing_time: z.number().min(3).max(30).optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        return_window: Number.parseInt(formData.get('return_window') as string),
        refund_method: formData.get('refund_method'),
        restocking_fee: formData.has('restocking_fee')
            ? Number.parseFloat(formData.get('restocking_fee') as string)
            : undefined,
        condition_requirements: formData.get('condition_requirements'),
        return_shipping_paid_by: formData.get('return_shipping_paid_by'),
        exceptions: formData.get('exceptions') || undefined,
        digital_return_policy: formData.get('digital_return_policy') === 'true',
        refund_processing_time: formData.has('refund_processing_time')
            ? Number.parseInt(formData.get('refund_processing_time') as string)
            : undefined,
    })

    // Check if return policy exists
    const { data: existingPolicy } = await supabase
        .from('store_return_policy')
        .select('id')
        .eq('store_id', store.id)
        .single()

    if (existingPolicy) {
        // Update existing policy
        const { error } = await supabase
            .from('store_return_policy')
            .update(parsed)
            .eq('id', existingPolicy.id)

        if (error) throw new Error(`Failed to update return policy: ${error.message}`)
    } else {
        // Create new policy
        const { error } = await supabase
            .from('store_return_policy')
            .insert({
                ...parsed,
                store_id: store.id,
            })

        if (error) throw new Error(`Failed to create return policy: ${error.message}`)
    }

    revalidatePath('/dashboard/store/returns')
    return { success: true }
}

/**
* Add store images
*/
export async function addStoreImages(imageData: {
    imageUrl: string;
    imageType: 'banner' | 'gallery' | 'product_showcase' | 'logo' | 'background' | 'other';
    displayOrder: number;
    altText?: string;
    isPrimary?: boolean;
}) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current user's store
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .single()

    if (storeError || !store) throw new Error('Store not found')

    const schema = z.object({
        image_url: z.string().url(),
        image_type: z.enum(['banner', 'gallery', 'product_showcase', 'logo', 'background', 'other']),
        display_order: z.number().int(),
        alt_text: z.string().max(300).optional(),
        is_primary: z.boolean().optional(),
    })

    const parsed = schema.parse(imageData)

    // If setting a new primary image, unset any existing primary for this type
    if (parsed.is_primary) {
        await supabase
            .from('store_images')
            .update({ is_primary: false })
            .eq('store_id', store.id)
            .eq('image_type', parsed.image_type)
    }

    // Add image
    const { error } = await supabase
        .from('store_images')
        .insert({
            ...parsed,
            store_id: store.id,
        })

    if (error) throw new Error(`Failed to add image: ${error.message}`)

    // If it's a logo and is primary, update the store's logo_url
    if (parsed.image_type === 'logo' && parsed.is_primary) {
        await supabase
            .from('stores')
            .update({ logo_url: parsed.image_url })
            .eq('id', store.id)
    }

    revalidatePath('/dashboard/store')
    return { success: true }
}

/**
* Update store categories
*/
export async function updateStoreCategories(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get current user's store
    const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('owner_id', user.id)
        .is('deleted_at', null)
        .single()

    if (storeError || !store) throw new Error('Store not found')

    const categoryIds = JSON.parse(formData.get('category_ids') as string)
    const primaryCategoryId = formData.get('primary_category_id') as string

    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        throw new Error('At least one category is required')
    }

    if (!primaryCategoryId || !categoryIds.includes(primaryCategoryId)) {
        throw new Error('Primary category must be one of the selected categories')
    }

    // Delete existing categories
    await supabase
        .from('store_categories')
        .delete()
        .eq('store_id', store.id)

    // Add new categories
    const categoryInserts = categoryIds.map(categoryId => ({
        store_id: store.id,
        category_id: categoryId,
        is_primary: categoryId === primaryCategoryId
    }))

    const { error } = await supabase
        .from('store_categories')
        .insert(categoryInserts)

    if (error) throw new Error(`Failed to update categories: ${error.message}`)

    revalidatePath('/dashboard/store')
    return { success: true }
}

/**
* Get featured stores
*/
export async function getFeaturedStores(limit = 6) {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('stores')
        .select(`
  id,
  name,
  slug,
  description,
  logo_url,
  total_listings,
  rating
`)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('rating', { ascending: false })
        .limit(limit)

    if (error) return []

    return data
}

/**
* Search stores
*/
export async function searchStores(params: {
    query?: string,
    categoryId?: string,
    page?: number,
    perPage?: number
}) {
    const {
        query,
        categoryId,
        page = 1,
        perPage = 20
    } = params

    const supabase = await createSession()


    let queryBuilder = supabase
        .from('stores')
        .select(`
  id,
  name, 
  slug,
  description,
  logo_url,
  total_listings,
  rating
`, { count: 'exact' })
        .eq('status', 'active')
        .is('deleted_at', null)

    // Apply search query if provided
    if (query && query.trim() !== '') {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Filter by category if provided
    if (categoryId) {
        queryBuilder = queryBuilder.eq('store_categories.category_id', categoryId)
    }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await queryBuilder
        .order('rating', { ascending: false })
        .range(from, to)

    if (error) return { stores: [], count: 0 }

    return {
        stores: data,
        count: count || 0
    }
}