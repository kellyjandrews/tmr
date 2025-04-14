// app/actions/taxonomy.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Category, Tag, Brand } from '@/types/listings'

/**
 * Get all categories
 */
export async function getCategories(taxonomyType: string = 'product') {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('taxonomy_type', taxonomyType)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

    if (error) return []

    return data as Category[]
}

/**
 * Get category tree (hierarchical)
 */
export async function getCategoryTree(taxonomyType = 'product') {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('taxonomy_type', taxonomyType)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

    if (error) return []

    // Build tree structure
    const categoriesById: Record<string, any> = {}
    const root: any[] = []

    // First pass: create dictionary by ID
    data.forEach(category => {
        categoriesById[category.id] = {
            ...category,
            children: []
        }
    })

    // Second pass: build hierarchy
    data.forEach(category => {
        if (category.parent_category_id) {
            const parent = categoriesById[category.parent_category_id]
            if (parent) {
                parent.children.push(categoriesById[category.id])
            } else {
                // Fallback if parent is missing
                root.push(categoriesById[category.id])
            }
        } else {
            root.push(categoriesById[category.id])
        }
    })

    return root
}

/**
 * Get category by ID
 */
export async function getCategoryById(id: string) {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('categories')
        .select(`
      *,
      parent:categories!parent_category_id(id, name, slug),
      subcategories:categories!subcategories(id, name, slug)
    `)
        .eq('id', id)
        .single()

    if (error) return null

    return data
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug: string) {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('categories')
        .select(`
      *,
      parent:categories!parent_category_id(id, name, slug),
      subcategories:categories!subcategories(id, name, slug)
    `)
        .eq('slug', slug)
        .single()

    if (error) return null

    return data
}

/**
 * Create a new category
 */
export async function createCategory(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify admin access
    const { data: account } = await supabase
        .from('accounts')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!account || !['admin', 'moderator'].includes(account.role)) {
        throw new Error('You do not have permission to create categories')
    }

    const schema = z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(1000).optional(),
        taxonomy_type: z.enum(['product', 'store', 'content', 'system']),
        parent_category_id: z.string().uuid().optional(),
        display_order: z.number().int().min(0).optional(),
        metadata: z.record(z.any()).optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        taxonomy_type: formData.get('taxonomy_type') || 'product',
        parent_category_id: formData.get('parent_category_id') || undefined,
        display_order: formData.has('display_order')
            ? Number.parseInt(formData.get('display_order') as string)
            : undefined,
        metadata: formData.has('metadata')
            ? JSON.parse(formData.get('metadata') as string)
            : undefined,
    })

    // Generate slug from name
    const slug = parsed.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    // Determine level based on parent
    let level = 1
    if (parsed.parent_category_id) {
        const { data: parent } = await supabase
            .from('categories')
            .select('level')
            .eq('id', parsed.parent_category_id)
            .single()

        if (parent) {
            level = parent.level + 1
        }
    }

    // Create category
    const { data, error } = await supabase
        .from('categories')
        .insert({
            ...parsed,
            slug,
            level,
            is_active: true
        })
        .select()
        .single()

    if (error) throw new Error(`Failed to create category: ${error.message}`)

    revalidatePath('/admin/categories')
    return { success: true, categoryId: data.id }
}

/**
 * Update a category
 */
export async function updateCategory(id: string, formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify admin access
    const { data: account } = await supabase
        .from('accounts')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!account || !['admin', 'moderator'].includes(account.role)) {
        throw new Error('You do not have permission to update categories')
    }

    const schema = z.object({
        name: z.string().min(2).max(100).optional(),
        description: z.string().max(1000).optional().nullable(),
        parent_category_id: z.string().uuid().optional().nullable(),
        display_order: z.number().int().min(0).optional(),
        metadata: z.record(z.any()).optional().nullable(),
        is_active: z.boolean().optional(),
    })

    // Parse and validate form data
    const updateData: Record<string, any> = {}

    if (formData.has('name')) updateData.name = formData.get('name')
    if (formData.has('description')) updateData.description = formData.get('description')
    if (formData.has('parent_category_id')) updateData.parent_category_id = formData.get('parent_category_id')
    if (formData.has('display_order')) updateData.display_order = Number.parseInt(formData.get('display_order') as string)
    if (formData.has('metadata')) updateData.metadata = JSON.parse(formData.get('metadata') as string)
    if (formData.has('is_active')) updateData.is_active = formData.get('is_active') === 'true'

    const parsed = schema.parse(updateData)

    // If name is updated, update slug
    if (parsed.name) {
        parsed.slug = parsed.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    // If parent is updated, update level
    if ('parent_category_id' in parsed) {
        if (parsed.parent_category_id) {
            const { data: parent } = await supabase
                .from('categories')
                .select('level')
                .eq('id', parsed.parent_category_id)
                .single()

            if (parent) {
                parsed.level = parent.level + 1
            } else {
                parsed.level = 1
            }
        } else {
            parsed.level = 1
        }
    }

    // Update category
    const { error } = await supabase
        .from('categories')
        .update(parsed)
        .eq('id', id)

    if (error) throw new Error(`Failed to update category: ${error.message}`)

    revalidatePath('/admin/categories')
    return { success: true }
}

/**
 * Get all tags
 */
export async function getTags(type: string = 'product') {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('name', { ascending: true })

    if (error) return []

    return data as Tag[]
}

/**
 * Get tag by ID
 */
export async function getTagById(id: string) {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single()

    if (error) return null

    return data as Tag
}

/**
 * Create a new tag
 */
export async function createTag(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify access (seller or admin)
    const { data: account } = await supabase
        .from('accounts')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!account || !['admin', 'moderator', 'seller'].includes(account.role)) {
        throw new Error('You do not have permission to create tags')
    }

    const schema = z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(500).optional(),
        type: z.enum(['product', 'store', 'user', 'system']),
        parent_tag_id: z.string().uuid().optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        type: formData.get('type') || 'product',
        parent_tag_id: formData.get('parent_tag_id') || undefined,
    })

    // Generate slug from name
    const slug = parsed.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    // Create tag
    const { data, error } = await supabase
        .from('tags')
        .insert({
            ...parsed,
            slug,
            is_active: true
        })
        .select()
        .single()

    if (error) throw new Error(`Failed to create tag: ${error.message}`)

    revalidatePath('/dashboard/catalog')
    return { success: true, tagId: data.id }
}

/**
 * Update a tag
 */
export async function updateTag(id: string, formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify access
    const { data: account } = await supabase
        .from('accounts')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!account || !['admin', 'moderator', 'seller'].includes(account.role)) {
        throw new Error('You do not have permission to update tags')
    }

    const schema = z.object({
        name: z.string().min(2).max(100).optional(),
        description: z.string().max(500).optional().nullable(),
        parent_tag_id: z.string().uuid().optional().nullable(),
        is_active: z.boolean().optional(),
    })

    // Parse and validate form data
    const updateData: Record<string, any> = {}

    if (formData.has('name')) updateData.name = formData.get('name')
    if (formData.has('description')) updateData.description = formData.get('description')
    if (formData.has('parent_tag_id')) updateData.parent_tag_id = formData.get('parent_tag_id')
    if (formData.has('is_active')) updateData.is_active = formData.get('is_active') === 'true'

    const parsed = schema.parse(updateData)

    // If name is updated, update slug
    if (parsed.name) {
        parsed.slug = parsed.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    // Update tag
    const { error } = await supabase
        .from('tags')
        .update(parsed)
        .eq('id', id)

    if (error) throw new Error(`Failed to update tag: ${error.message}`)

    revalidatePath('/dashboard/catalog')
    return { success: true }
}

/**
 * Get all brands
 */
export async function getBrands() {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

    if (error) return []

    return data as Brand[]
}

/**
 * Get brand by ID
 */
export async function getBrandById(id: string) {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('brands')
        .select(`
      *,
      primary_category:categories!primary_category_id(id, name, slug),
      categories:brand_categories(
        category:categories(id, name, slug)
      )
    `)
        .eq('id', id)
        .single()

    if (error) return null

    return data
}

/**
 * Get brand by slug
 */
export async function getBrandBySlug(slug: string) {
    const supabase = await createSession()


    const { data, error } = await supabase
        .from('brands')
        .select(`
      *,
      primary_category:categories!primary_category_id(id, name, slug),
      categories:brand_categories(
        category:categories(id, name, slug)
      )
    `)
        .eq('slug', slug)
        .single()

    if (error) return null

    return data
}

/**
 * Create a new brand
 */
export async function createBrand(formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify access (seller or admin)
    const { data: account } = await supabase
        .from('accounts')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!account || !['admin', 'moderator', 'seller'].includes(account.role)) {
        throw new Error('You do not have permission to create brands')
    }

    const schema = z.object({
        name: z.string().min(2).max(100),
        description: z.string().max(1000).optional(),
        primary_category_id: z.string().uuid().optional(),
        metadata: z.record(z.any()).optional(),
        category_ids: z.array(z.string().uuid()).optional(),
    })

    // Parse and validate form data
    const parsed = schema.parse({
        name: formData.get('name'),
        description: formData.get('description') || undefined,
        primary_category_id: formData.get('primary_category_id') || undefined,
        metadata: formData.has('metadata')
            ? JSON.parse(formData.get('metadata') as string)
            : undefined,
        category_ids: formData.has('category_ids')
            ? JSON.parse(formData.get('category_ids') as string)
            : undefined,
    })

    // Generate slug from name
    const slug = parsed.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

    // Create brand
    const { data, error } = await supabase
        .from('brands')
        .insert({
            name: parsed.name,
            slug,
            description: parsed.description,
            primary_category_id: parsed.primary_category_id,
            metadata: parsed.metadata,
            verification_status: 'unverified',
            is_active: true
        })
        .select()
        .single()

    if (error) throw new Error(`Failed to create brand: ${error.message}`)

    // Add brand categories if provided
    if (parsed.category_ids && parsed.category_ids.length > 0) {
        const categoryInserts = parsed.category_ids.map(categoryId => ({
            brand_id: data.id,
            category_id: categoryId,
            is_primary: categoryId === parsed.primary_category_id
        }))

        await supabase
            .from('brand_categories')
            .insert(categoryInserts)
    }

    revalidatePath('/dashboard/catalog')
    return { success: true, brandId: data.id }
}

/**
 * Update a brand
 */
export async function updateBrand(id: string, formData: FormData) {
    const supabase = await createSession()


    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify access
    const { data: account } = await supabase
        .from('accounts')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!account || !['admin', 'moderator', 'seller'].includes(account.role)) {
        throw new Error('You do not have permission to update brands')
    }

    const schema = z.object({
        name: z.string().min(2).max(100).optional(),
        description: z.string().max(1000).optional().nullable(),
        primary_category_id: z.string().uuid().optional().nullable(),
        metadata: z.record(z.any()).optional().nullable(),
        is_active: z.boolean().optional(),
        verification_status: z.enum(['unverified', 'pending', 'verified']).optional(),
        category_ids: z.array(z.string().uuid()).optional(),
    })

    // Parse and validate form data
    const updateData: Record<string, any> = {}

    if (formData.has('name')) updateData.name = formData.get('name')
    if (formData.has('description')) updateData.description = formData.get('description')
    if (formData.has('primary_category_id')) updateData.primary_category_id = formData.get('primary_category_id')
    if (formData.has('metadata')) updateData.metadata = JSON.parse(formData.get('metadata') as string)
    if (formData.has('is_active')) updateData.is_active = formData.get('is_active') === 'true'
    if (formData.has('verification_status')) updateData.verification_status = formData.get('verification_status')

    // Categories need special handling outside of the main update
    const categoryIds = formData.has('category_ids')
        ? JSON.parse(formData.get('category_ids') as string)
        : undefined

    const parsed = schema.parse(updateData)

    // If name is updated, update slug
    if (parsed.name) {
        parsed.slug = parsed.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
    }

    // Update brand
    const { error } = await supabase
        .from('brands')
        .update(parsed)
        .eq('id', id)

    if (error) throw new Error(`Failed to update brand: ${error.message}`)

    // Update brand categories if provided
    if (categoryIds) {
        // Delete existing categories
        await supabase
            .from('brand_categories')
            .delete()
            .eq('brand_id', id)

        // Add new categories
        if (categoryIds.length > 0) {
            const categoryInserts = categoryIds.map((categoryId: string) => ({
                brand_id: id,
                category_id: categoryId,
                is_primary: categoryId === parsed.primary_category_id
            }))

            await supabase
                .from('brand_categories')
                .insert(categoryInserts)
        }
    }

    revalidatePath('/dashboard/catalog')
    return { success: true }
}