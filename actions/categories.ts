// actions/categories.ts
'use server';

import { createSession } from '@/utils/supabase/serverSide';
import type { ActionResponse, Category } from '@/types';


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

/**
 * Fetch a specific category by slug
 */
export async function getCategoryBySlug(slug: string): Promise<ActionResponse<Category>> {
    const supabase = await createSession();

    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
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