// actions/listings.ts
'use server';

import { createSession } from '@/utils/supabase/serverSide';
import type { FetchListingsOptions, Listing } from '@/types/listing';
import type { ActionResponse } from '@/types/common';
import type { Category } from '@/types/category';
import type {
    ListingWithStore,
    FetchListingsResponse,
    GetFeaturedListingsResponse,
    GetListingByIdResponse
} from '@/types/sproc-types';

/**
 * Convert database result to Listing type
 */
function mapDbListingToListing(dbListing: ListingWithStore): Listing {
    return {
        id: dbListing.id,
        store_id: dbListing.store_id,
        name: dbListing.name,
        description: dbListing.description,
        price: dbListing.price,
        quantity: dbListing.quantity,
        status: dbListing.status,
        image_url: dbListing.image_url,
        slug: dbListing.slug,
        category_id: dbListing.category_id || undefined,
        views_count: dbListing.views_count,
        featured: dbListing.featured,
        is_digital: dbListing.is_digital,
        created_at: dbListing.created_at,
        updated_at: dbListing.updated_at,
        stores: {
            id: dbListing.store_id,
            name: dbListing.store_name,
            slug: dbListing.store_slug,
            user_id: dbListing.store_user_id
        }
    };
}

/**
 * Convert category from stored procedure to Category type
 */
function mapSprocCategoryToCategory(cat: { id: string; name: string; slug: string }): Category {
    return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: null,
        parent_id: null,
        display_order: 0,
        is_featured: false,
        created_at: '',
        updated_at: ''
    };
}

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

        // Call the stored procedure
        const { data, error } = await supabase.rpc<FetchListingsResponse>('fetch_listings', {
            store_id_param: storeId || null,
            category_id_param: categoryId || null,
            limit_param: limit,
            offset_param: offset,
            sort_by_param: sortBy,
            sort_order_param: sortOrder,
            search_param: search || null,
            min_price_param: minPrice || null,
            max_price_param: maxPrice || null,
            status_param: status
        });

        if (error) throw new Error(error.message);

        // Extract listings and count from the results
        const listings = data?.map(item => mapDbListingToListing(item.listing)) || [];
        const count = data?.length > 0 ? Number(data[0].total_count) : 0;

        return {
            success: true,
            data: listings,
            count
        };
    } catch (error) {
        console.error('Error fetching listings:', error);
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
    const supabase = await createSession();

    try {
        // Call the stored procedure
        const { data, error } = await supabase.rpc<GetFeaturedListingsResponse>('get_featured_listings', {
            limit_param: limit
        });

        if (error) throw new Error(error.message);

        // Map the results to Listing type
        const listings = data?.map(item => mapDbListingToListing(item)) || [];

        return {
            success: true,
            data: listings
        };
    } catch (error) {
        console.error('Error fetching featured listings:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get a single listing by ID with full details
 */
export async function getListingById(listingId: string): Promise<ActionResponse<Listing>> {
    const supabase = await createSession();

    try {
        // Call the stored procedure
        const { data, error } = await supabase.rpc<GetListingByIdResponse>('get_listing_by_id', {
            listing_id_param: listingId
        });

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        // Map the result to Listing type
        const listingData = data[0];
        const listing = mapDbListingToListing(listingData.listing_details);

        // Add categories, images, and shipping
        listing.categories = listingData.categories?.map(cat =>
            mapSprocCategoryToCategory(cat)
        ) || [];

        listing.images = listingData.images || [];
        listing.shipping = listingData.shipping || null;

        // Increment view count
        await supabase.rpc('increment_listing_view', {
            listing_id_param: listingId
        });

        return {
            success: true,
            data: listing
        };
    } catch (error) {
        console.error('Error fetching listing by ID:', error);
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
    return await fetchListings({ search: query, limit });
}

/**
 * Get listings by category
 */
export async function getListingsByCategory(categoryId: string, limit = 10, offset = 0): Promise<ActionResponse<Listing[]>> {
    return await fetchListings({ categoryId, limit, offset });
}

/**
 * Get related listings (same category or from same store)
 */
export async function getRelatedListings(listingId: string, limit = 4): Promise<ActionResponse<Listing[]>> {
    const supabase = await createSession();

    try {
        // Call the stored procedure
        const { data, error } = await supabase.rpc<GetFeaturedListingsResponse>('get_related_listings', {
            listing_id_param: listingId,
            limit_param: limit
        });

        if (error) throw new Error(error.message);

        // Map the results to Listing type
        const listings = data?.map(item => mapDbListingToListing(item)) || [];

        return {
            success: true,
            data: listings
        };
    } catch (error) {
        console.error('Error fetching related listings:', error);
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
        // Call the stored procedure
        const { data, error } = await supabase.rpc<FetchListingsResponse>('get_listings_by_category_slug', {
            slug_param: slug,
            limit_param: limit,
            offset_param: offset
        });

        if (error) throw new Error(error.message);

        // Extract listings from the results
        const listings = data?.map(item => mapDbListingToListing(item.listing)) || [];
        const count = data?.length > 0 ? Number(data[0].total_count) : 0;

        return {
            success: true,
            data: listings,
            count
        };
    } catch (error) {
        console.error('Error fetching listings by category slug:', error);
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
        // Call the stored procedure
        const { data, error } = await supabase.rpc<GetListingByIdResponse>('get_listing_by_slug', {
            slug_param: slug
        });

        if (error) throw new Error(error.message);
        if (!data || data.length === 0) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        // Map the result to Listing type
        const listingData = data[0];
        const listing = mapDbListingToListing(listingData.listing_details);

        // Add categories, images, and shipping
        listing.categories = listingData.categories?.map(cat =>
            mapSprocCategoryToCategory(cat)
        ) || [];

        listing.images = listingData.images || [];
        listing.shipping = listingData.shipping || null;

        // Increment view count
        await supabase.rpc('increment_listing_view', {
            listing_id_param: listing.id
        });

        return {
            success: true,
            data: listing
        };
    } catch (error) {
        console.error('Error fetching listing by slug:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Increment listing view count
 */
export async function incrementListingView(listingId: string): Promise<ActionResponse<boolean>> {
    const supabase = await createSession();

    try {
        const { data, error } = await supabase.rpc<boolean>('increment_listing_view', {
            listing_id_param: listingId
        });

        if (error) throw new Error(error.message);

        return {
            success: true,
            data: !!data
        };
    } catch (error) {
        console.error('Error incrementing listing view count:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}