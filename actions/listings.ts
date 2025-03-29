// actions/listings.ts
'use server';

import { createSession } from '@/utils/supabase/serverSide';
import {
    mapDbListingToListing,
    mapListingDetailToListing,
    mapFetchListingsResponse
} from '@/utils/listings';
import type { FetchListingsOptions, Listing } from '@/types/listing';
import type { ActionResponse } from '@/types/common';
import type {
    FetchListingsResponse,
    GetFeaturedListingsResponse,
    GetListingByIdResponse
} from '@/types/sproc-types';
import type { SupabaseClient, PostgrestSingleResponse } from '@supabase/supabase-js';

let cachedSupabase: null | SupabaseClient = null;
async function getSupabaseClient() {
    if (!cachedSupabase) {
        cachedSupabase = await createSession();
    }
    return cachedSupabase;
}

// Centralized error handler
function handleError<T>(error: unknown, operation: string): ActionResponse<T> {
    console.error(`Error in ${operation}:`, error);
    return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
}


/**
 * Fetch listings with filters and pagination
 */
export async function fetchListings(options: FetchListingsOptions = {}): Promise<ActionResponse<Listing[]>> {
    const supabase = await getSupabaseClient();

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

        const { data, error } = await supabase.rpc<string, FetchListingsResponse[]>('fetch_listings', {
            store_id_param: storeId ?? null,
            category_id_param: categoryId ?? null,
            limit_param: limit,
            offset_param: offset,
            sort_by_param: sortBy,
            sort_order_param: sortOrder,
            search_param: search ?? null,
            min_price_param: minPrice ?? null,
            max_price_param: maxPrice ?? null,
            status_param: status
        });

        if (error) throw error;

        const { listings, totalCount } = mapFetchListingsResponse(data as FetchListingsResponse[]);

        return {
            success: true,
            data: listings,
            count: totalCount
        };
    } catch (error) {
        return handleError(error, 'fetchListings');
    }
}

/**
 * Get featured listings (newest active listings)
 */
export async function getFeaturedListings(limit = 4): Promise<ActionResponse<Listing[]>> {
    const supabase = await getSupabaseClient();

    try {
        const { data, error } = await supabase.rpc<string, GetFeaturedListingsResponse>('get_featured_listings', {
            limit_param: limit
        }) as PostgrestSingleResponse<GetFeaturedListingsResponse>;

        if (error) throw error;

        return {
            success: true,
            data: data?.map(mapDbListingToListing) || []
        };
    } catch (error) {
        return handleError(error, 'getFeaturedListings');
    }
}

/**
 * Get a single listing by ID with full details
 */
export async function getListingById(listingId: string): Promise<ActionResponse<Listing>> {
    const supabase = await getSupabaseClient();

    try {
        const [listingResult] = await Promise.all([
            supabase.rpc<string, GetListingByIdResponse>('get_listing_by_id', {
                listing_id_param: listingId
            }),
            supabase.rpc<string, GetListingByIdResponse>('increment_listing_view', {
                listing_id_param: listingId
            })
        ]);

        const { data, error } = listingResult as PostgrestSingleResponse<GetListingByIdResponse[]>;

        if (error) throw error;
        if (!data?.length) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        return {
            success: true,
            data: mapListingDetailToListing(data[0])
        };
    } catch (error) {
        return handleError(error, 'getListingById');
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
export async function getListingsByCategory(
    categoryId: string,
    limit = 10,
    offset = 0
): Promise<ActionResponse<Listing[]>> {
    return fetchListings({ categoryId, limit, offset });
}

/**
 * Get related listings (same category or from same store)
 */
export async function getRelatedListings(listingId: string, limit = 4): Promise<ActionResponse<Listing[]>> {
    const supabase = await getSupabaseClient();

    try {
        const { data, error } = await supabase.rpc<string, GetFeaturedListingsResponse>('get_related_listings', {
            listing_id_param: listingId,
            limit_param: limit
        }) as PostgrestSingleResponse<GetFeaturedListingsResponse>;

        if (error) throw error;

        return {
            success: true,
            data: data?.map(mapDbListingToListing) || []
        };
    } catch (error) {
        return handleError(error, 'getRelatedListings');
    }
}

/**
 * Get listings by category slug
 */
export async function getListingsByCategorySlug(
    slug: string,
    limit = 10,
    offset = 0
): Promise<ActionResponse<Listing[]>> {
    const supabase = await getSupabaseClient();

    try {
        const { data, error } = await supabase.rpc<string, FetchListingsResponse[]>('get_listings_by_category_slug', {
            slug_param: slug,
            limit_param: limit,
            offset_param: offset
        });

        if (error) throw error;

        const { listings, totalCount } = mapFetchListingsResponse(data as FetchListingsResponse[]);

        return {
            success: true,
            data: listings,
            count: totalCount
        };
    } catch (error) {
        return handleError(error, 'getListingsByCategorySlug');
    }
}

/**
 * Get a single listing by slug with full details
 */
export async function getListingBySlug(slug: string): Promise<ActionResponse<Listing>> {
    const supabase = await getSupabaseClient();

    try {
        const { data, error } = await supabase.rpc<string, GetListingByIdResponse[]>('get_listing_by_slug', {
            slug_param: slug
        }) as PostgrestSingleResponse<GetListingByIdResponse[]>;

        if (error) throw error;

        if (!data?.length) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        const listing = mapListingDetailToListing(data[0]);

        // Increment view count asynchronously
        void supabase.rpc('increment_listing_view', {
            listing_id_param: listing.id
        });

        return {
            success: true,
            data: listing
        };
    } catch (error) {
        return handleError(error, 'getListingBySlug');
    }
}

/**
 * Increment listing view count
 */
export async function incrementListingView(listingId: string): Promise<ActionResponse<boolean>> {
    const supabase = await getSupabaseClient();

    try {
        const { data, error } = await supabase.rpc<string, boolean>('increment_listing_view', {
            listing_id_param: listingId
        });

        if (error) throw error;

        return {
            success: true,
            data: !!data
        };
    } catch (error) {
        return handleError(error, 'incrementListingView');
    }
}