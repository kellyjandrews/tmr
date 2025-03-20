// actions/store.ts
'use server';

import { z } from 'zod';
import { createSession } from '@/utils/supabase/serverSide';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import type { StoreFormData } from '@/types/store';
import type { ActionResponse } from '@/types/common';

// Validation schema for store creation/updates
const storeSchema = z.object({
    name: z.string().min(3, 'Store name must be at least 3 characters').max(100, 'Store name must be less than 100 characters'),
    slug: z.string().min(3, 'Store slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    welcome_message: z.string().max(1000, 'Welcome message must be less than 1000 characters').optional(),
    shipping_policy: z.string().max(3000, 'Shipping policy must be less than 3000 characters').optional(),
    return_policy: z.string().max(3000, 'Return policy must be less than 3000 characters').optional(),
    tax_policy: z.string().max(3000, 'Tax policy must be less than 3000 characters').optional(),
    location: z.string().max(100, 'Location must be less than 100 characters').optional(),
});

/**
 * Create a new store for the current user
 */
export async function createStore(formData: StoreFormData): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Validate form data
        const validatedData = storeSchema.parse(formData);

        // Get the current user
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'You must be logged in to create a store'
            };
        }

        // Get user from the token
        const { data: userData, error: userError } = await supabase.auth.getUser(token);

        if (userError || !userData.user) {
            return {
                success: false,
                error: userError?.message || 'Failed to authenticate user'
            };
        }

        const userId = userData.user.id;

        // Check if user already has a store
        const { data: existingStore, error: existingStoreError } = await supabase
            .from('stores')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (existingStoreError && existingStoreError.code !== 'PGRST116') {
            return {
                success: false,
                error: existingStoreError.message
            };
        }

        if (existingStore) {
            return {
                success: false,
                error: 'You already have a store'
            };
        }

        // Prepare the store data
        const storeData = {
            name: validatedData.name,
            slug: validatedData.slug || undefined, // Let the database trigger handle this if not provided
            description: validatedData.description || null,
            welcome_message: validatedData.welcome_message || null,
            shipping_policy: validatedData.shipping_policy || null,
            return_policy: validatedData.return_policy || null,
            tax_policy: validatedData.tax_policy || null,
            location: validatedData.location || null,
            user_id: userId
        };

        // Create the store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .insert(storeData)
            .select()
            .single();

        if (storeError) {
            console.error('Store creation error:', storeError);
            throw new Error(storeError.message);
        }

        // Revalidate the dashboard path
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/shop-admin');

        return {
            success: true,
            message: 'Store created successfully',
            data: store
        };
    } catch (error) {
        console.error('Create store error:', error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get the current user's store
 */
export async function getUserStore(): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return {
                success: false,
                error: userError?.message || 'Failed to authenticate user'
            };
        }

        // Get the user's store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', userData.user.id)
            .single();

        if (storeError && storeError.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is fine
            throw new Error(storeError.message);
        }

        return {
            success: true,
            data: store
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Update the current user's store
 */
export async function updateStore(storeId: string, formData: StoreFormData): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Validate form data
        const validatedData = storeSchema.parse(formData);

        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData.user) {
            return {
                success: false,
                error: userError?.message || 'Failed to authenticate user'
            };
        }

        const userId = userData.user.id;

        // Check if store belongs to the user
        const { data: existingStore, error: storeCheckError } = await supabase
            .from('stores')
            .select('id')
            .eq('id', storeId)
            .eq('user_id', userId)
            .single();

        if (storeCheckError || !existingStore) {
            return {
                success: false,
                error: 'Store not found or you do not have permission to update it'
            };
        }

        // Update the store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .update({
                name: validatedData.name,
                slug: validatedData.slug || undefined,
                description: validatedData.description || null,
                welcome_message: validatedData.welcome_message || null,
                shipping_policy: validatedData.shipping_policy || null,
                return_policy: validatedData.return_policy || null,
                tax_policy: validatedData.tax_policy || null,
                location: validatedData.location || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', storeId)
            .select()
            .single();

        if (storeError) throw new Error(storeError.message);

        // Revalidate the paths
        revalidatePath('/dashboard');
        revalidatePath('/dashboard/shop-admin');
        revalidatePath(`/store/${store.slug}`);

        return {
            success: true,
            message: 'Store updated successfully',
            data: store
        };
    } catch (error) {
        console.error('Update store error:', error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get a store by slug
 */
export async function getStoreBySlug(slug: string): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('slug', slug)
            .single();

        if (storeError) throw new Error(storeError.message);

        return {
            success: true,
            data: store
        };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get store by ID
 */
export async function getStoreById(id: string): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('id', id)
            .single();

        if (storeError) throw new Error(storeError.message);

        return {
            success: true,
            data: store
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}