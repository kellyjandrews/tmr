// actions/listings.ts
'use server';

import { createSession } from '@/utils/supabase/serverSide';
import type { FetchListingsOptions, Listing } from '@/types/listing';
import type { ActionResponse } from '@/types/common';

/**
 * Fetch listings with filters and pagination
 */
export async function fetchListings(options: FetchListingsOptions = {}): Promise<ActionResponse<Listing[]>> {
    const supabase = await createSession();

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
            // We need to use a subquery for filtering by category since we're using a junction table
            const { data: listingIds } = await supabase
                .from('listing_categories')
                .select('listing_id')
                .eq('category_id', categoryId);

            if (listingIds && listingIds.length > 0) {
                const ids = listingIds.map(item => item.listing_id);
                query = query.in('id', ids);
            } else {
                // No listings in this category, return empty result
                return {
                    success: true,
                    data: [],
                    count: 0
                };
            }
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
            // Use the built-in text search for basic search functionality
            query = query.ilike('name', `%${search}%`);
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
    return fetchListings({
        limit,
        sortBy: 'created_at',
        sortOrder: 'desc',
        status: 'active'
    });
}

/**
 * Get a single listing by ID with full details
 */
export async function getListingById(listingId: string): Promise<ActionResponse<Listing>> {
    const supabase = await createSession();

    try {
        // Get the main listing data
        const { data, error } = await supabase
            .from('listings')
            .select('*, stores(id, name, slug, user_id)')
            .eq('id', listingId)
            .single();

        if (error) throw new Error(error.message);

        // Get categories for the listing
        const { data: categories } = await supabase
            .from('listing_categories')
            .select('categories(id, name)')
            .eq('listing_id', listingId);

        // Get all images for the listing
        const { data: images } = await supabase
            .from('listing_images')
            .select('image_url, display_order')
            .eq('listing_id', listingId)
            .order('display_order');

        // Get shipping info
        const { data: shipping } = await supabase
            .from('listing_shipping')
            .select('*')
            .eq('listing_id', listingId)
            .single();

        // Combine the data
        const enrichedListing = {
            ...data,
            categories: categories ? categories.map(c => c.categories) : [],
            images: images ? images.map(i => i.image_url) : [],
            shipping: shipping || null
        };

        return {
            success: true,
            data: enrichedListing as Listing
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
    const supabase = await createSession();

    try {
        // First, get the current listing to find its category and store
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('store_id')
            .eq('id', listingId)
            .single();

        if (listingError) throw new Error(listingError.message);

        // Get the categories of this listing
        const { data: listingCategories } = await supabase
            .from('listing_categories')
            .select('category_id')
            .eq('listing_id', listingId);

        const categoryIds = listingCategories ? listingCategories.map(lc => lc.category_id) : [];

        // Find listings with the same categories or from the same store, but not the current listing
        let query = supabase
            .from('listings')
            .select('*, stores(id, name, slug, user_id)')
            .neq('id', listingId) // Exclude the current listing
            .eq('status', 'active') // Only active listings
            .limit(limit);

        if (categoryIds.length > 0) {
            // Get listings that share categories with our listing
            const { data: relatedByCategory } = await supabase
                .from('listing_categories')
                .select('listing_id')
                .in('category_id', categoryIds)
                .neq('listing_id', listingId);

            const relatedListingIds = relatedByCategory ?
                relatedByCategory.map(item => item.listing_id) : [];

            if (relatedListingIds.length > 0) {
                // We have listings with same categories
                query = query.in('id', relatedListingIds);
            } else {
                // No category matches, fall back to just store-based relations
                query = query.eq('store_id', listing.store_id);
            }
        } else {
            // No categories for this listing, use store-based relations
            query = query.eq('store_id', listing.store_id);
        }

        const { data: relatedListings, error: relatedError } = await query;

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

/**
 * Get listings by category slug
 */
export async function getListingsByCategorySlug(slug: string, limit = 10, offset = 0): Promise<ActionResponse<Listing[]>> {
    const supabase = await createSession();

    try {
        // First get the category ID from the slug
        const { data: category, error: categoryError } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', slug)
            .single();

        if (categoryError) throw new Error(categoryError.message);

        // Then get listings with that category ID
        return await getListingsByCategory(category.id, limit, offset);
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get a single listing by slug with full details
 */
export async function getListingBySlug(slug: string): Promise<ActionResponse<Listing>> {
    const supabase = await createSession();

    try {
        // Get the main listing data
        const { data, error } = await supabase
            .from('listings')
            .select('*, stores(id, name, slug, user_id)')
            .eq('slug', slug)
            .single();

        if (error) throw new Error(error.message);

        // Get categories for the listing
        const { data: categories } = await supabase
            .from('listing_categories')
            .select('categories(id, name, slug)')
            .eq('listing_id', data.id);

        // Get all images for the listing
        const { data: images } = await supabase
            .from('listing_images')
            .select('image_url, display_order')
            .eq('listing_id', data.id)
            .order('display_order');

        // Get shipping info
        const { data: shipping } = await supabase
            .from('listing_shipping')
            .select('*')
            .eq('listing_id', data.id)
            .single();

        // Combine the data
        const enrichedListing = {
            ...data,
            categories: categories ? categories.map(c => c.categories) : [],
            images: images ? images.map(i => i.image_url) : [],
            shipping: shipping || null
        };

        return {
            success: true,
            data: enrichedListing as Listing
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}