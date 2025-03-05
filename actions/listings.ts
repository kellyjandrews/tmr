// actions/listings.ts
'use server';

import { supabase } from '@/lib/supabase';

export type Listing = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    store_id: string;
    category_id?: string | null;
    image_url?: string | null;
    status?: string;
    stores?: {
        id: string;
        name: string;
        slug: string;
        user_id: string;
    };
    created_at: string;
    updated_at: string;
};

export type FetchListingsOptions = {
    storeId?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
};

export type ActionResponse<T = unknown> = {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
    count?: number;
};

/**
 * Fetch listings with filters and pagination
 */
export async function fetchListings(options: FetchListingsOptions = {}): Promise<ActionResponse<Listing[]>> {
    try {
        const {
            storeId,
            categoryId,
            limit = 10,
            offset = 0,
            sortBy = 'created_at',
            sortOrder = 'desc',
            search,
            minPrice,
            maxPrice,
            status = 'active',
        } = options;

        // Start building the query
        let query = supabase
            .from('listings')
            .select('*, stores(id, name, slug, user_id)', { count: 'exact' })
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1);

        // Add filters if provided
        if (storeId) {
            query = query.eq('store_id', storeId);
        }

        if (categoryId) {
            query = query.eq('category_id', categoryId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (minPrice !== undefined) {
            query = query.gte('price', minPrice);
        }

        if (maxPrice !== undefined) {
            query = query.lte('price', maxPrice);
        }

        if (search) {
            // Basic search on the name field
            query = query.ilike('name', `%${search}%`);

            // For more advanced search, we would use the search_vector column
            // that we created in our migration, but that requires a different approach
            // with RPC calls that's beyond the scope of this simple example
        }

        const { data, error, count } = await query;

        if (error) throw new Error(error.message);

        return {
            success: true,
            data: data as Listing[],
            count: count || 0
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get featured listings (newest active listings)
 */
export async function getFeaturedListings(limit = 4): Promise<ActionResponse<Listing[]>> {
    return fetchListings({ limit, sortBy: 'created_at', sortOrder: 'desc', status: 'active' });
}

/**
 * Get a single listing by ID
 */
export async function getListingById(listingId: string): Promise<ActionResponse<Listing>> {
    try {
        const { data, error } = await supabase
            .from('listings')
            .select('*, stores(id, name, slug, user_id)')
            .eq('id', listingId)
            .single();

        if (error) throw new Error(error.message);

        return {
            success: true,
            data: data as Listing
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Search listings with full text search
 * Note: For basic search, we use the ilike operator
 * For more advanced search, we would use the search_vector column
 */
export async function searchListings(query: string, limit = 10): Promise<ActionResponse<Listing[]>> {
    return fetchListings({ search: query, limit });
}

/**
 * Get listings by category
 */
export async function getListingsByCategory(categoryId: string, limit = 10, offset = 0): Promise<ActionResponse<Listing[]>> {
    return fetchListings({ categoryId, limit, offset });
}

/**
 * Get related listings (same category or from same store)
 */
export async function getRelatedListings(listingId: string, limit = 4): Promise<ActionResponse<Listing[]>> {
    try {
        // First, get the current listing to find its category and store
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('category_id, store_id')
            .eq('id', listingId)
            .single();

        if (listingError) throw new Error(listingError.message);

        // Then fetch related listings based on category or store
        const { data: relatedListings, error: relatedError } = await supabase
            .from('listings')
            .select('*, stores(id, name, slug, user_id)')
            .neq('id', listingId) // Exclude the current listing
            .eq('status', 'active')
            .or(`category_id.eq.${listing.category_id},store_id.eq.${listing.store_id}`)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (relatedError) throw new Error(relatedError.message);

        return {
            success: true,
            data: relatedListings as Listing[]
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}