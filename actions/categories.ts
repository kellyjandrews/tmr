// actions/categories.ts
'use server';

import { createSession } from '@/lib/supabase/serverSide';

export type Category = {
    id: string;
    name: string;
    description: string | null;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
};

export type ActionResponse<T = unknown> = {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
};

/**
 * Fetch all main categories (those without a parent)
 */
export async function getMainCategories(): Promise<ActionResponse<Category[]>> {
    const supabase = await createSession();

    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .is('parent_id', null)
            .order('name');

        if (error) throw new Error(error.message);

        return {
            success: true,
            data: data as Category[]
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Fetch subcategories for a specific parent category
 */
export async function getSubcategories(parentId: string): Promise<ActionResponse<Category[]>> {
    const supabase = await createSession();

    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('parent_id', parentId)
            .order('name');

        if (error) throw new Error(error.message);

        return {
            success: true,
            data: data as Category[]
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Fetch a specific category by ID
 */
export async function getCategoryById(categoryId: string): Promise<ActionResponse<Category>> {
    const supabase = await createSession();

    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', categoryId)
            .single();

        if (error) throw new Error(error.message);

        return {
            success: true,
            data: data as Category
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}