'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { StoreFormData } from '@/types/store';

// Validation schema for store creation
const storeSchema = z.object({
    name: z.string().min(3, 'Store name must be at least 3 characters'),
    slug: z.string().optional(),
});

// Type for server action responses
export type ActionResponse = {
    success: boolean;
    message?: string;
    error?: string;
    data?: unknown;
};

/**
 * Create a new store for the current user using cookies for auth
 */
export async function createStoreDirect(formData: StoreFormData): Promise<ActionResponse> {
    try {
        // Validate form data
        const validatedData = storeSchema.parse(formData);

        // Get the current user using cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'Authentication required. Please log in again.'
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
 * Get the current user's store directly using cookies for auth
 */
export async function getUserStoreDirect(): Promise<ActionResponse> {
    try {
        // Get the current user using cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'Authentication required. Please log in again.'
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

        // Get the user's store
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (storeError && storeError.code !== 'PGRST116') { // PGRST116 is "No rows returned" which is fine
            throw new Error(storeError.message);
        }

        return {
            success: true,
            data: store
        };
    } catch (error) {
        console.error('Get user store error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Update the current user's store using cookies for auth
 */
export async function updateStoreDirect(storeId: string, formData: StoreFormData): Promise<ActionResponse> {
    try {
        // Validate form data
        const validatedData = storeSchema.parse(formData);

        // Get the current user using cookies
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'Authentication required. Please log in again.'
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

        // Check if store belongs to the user
        const { error: storeCheckError } = await supabase
            .from('stores')
            .select('id')
            .eq('id', storeId)
            .eq('user_id', userId)
            .single();

        if (storeCheckError) {
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

        // Revalidate the paths
        revalidatePath('/dashboard');
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