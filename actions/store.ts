// actions/store.ts
'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Validation schema for store creation
const storeSchema = z.object({
    name: z.string().min(3, 'Store name must be at least 3 characters'),
    slug: z.string().optional(),
});

// Type for the store form data
export type StoreFormData = z.infer<typeof storeSchema>;

// Type for server action responses
export type ActionResponse = {
    success: boolean;
    message?: string;
    error?: string;
    data?: unknown;
};

/**
 * Create a new store for the current user
 */
export async function createStore(formData: StoreFormData): Promise<ActionResponse> {
    try {
        // Validate form data
        const validatedData = storeSchema.parse(formData);

        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return {
                success: false,
                error: 'You must be logged in to create a store'
            };
        }

        // Check if user already has a store
        const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

        if (existingStore) {
            return {
                success: false,
                error: 'You already have a store'
            };
        }

        // Create the store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .insert({
                name: validatedData.name,
                slug: validatedData.slug || undefined, // Let the database trigger handle this if not provided
                user_id: session.user.id
            })
            .select()
            .single();

        if (storeError) throw new Error(storeError.message);

        // Revalidate the path after store creation
        revalidatePath('/dashboard');

        return {
            success: true,
            message: 'Store created successfully',
            data: store
        };
    } catch (error) {
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
    try {
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return {
                success: false,
                error: 'You must be logged in to view your store'
            };
        }

        // Get the user's store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', session.user.id)
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
    try {
        // Validate form data
        const validatedData = storeSchema.parse(formData);

        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return {
                success: false,
                error: 'You must be logged in to update your store'
            };
        }

        // Check if store belongs to the user
        const { data: existingStore } = await supabase
            .from('stores')
            .select('id')
            .eq('id', storeId)
            .eq('user_id', session.user.id)
            .single();

        if (!existingStore) {
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
                updated_at: new Date().toISOString()
            })
            .eq('id', storeId)
            .select()
            .single();

        if (storeError) throw new Error(storeError.message);

        // Revalidate the path after store update
        revalidatePath('/dashboard');
        revalidatePath(`/store/${store.slug}`);

        return {
            success: true,
            message: 'Store updated successfully',
            data: store
        };
    } catch (error) {
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