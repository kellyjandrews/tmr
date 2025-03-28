// utils/favorites.ts
import type {
    WishlistItemResponse,
    WishlistWithListing,
    FollowedStoreResponse,
    FollowWithStore,
    MinimalListing,
    MinimalStore
} from '@/types/favorites';
import type { ListingStatus } from '@/types/listing';

/**
 * Convert wishlist responses from stored procedure to typed objects
 */
export function mapWishlistResponsesToTyped(responses: WishlistItemResponse[]): WishlistWithListing[] {
    return responses.map(item => {
        // Create the MinimalListing object
        const listing: MinimalListing = {
            id: item.listing_id,
            store_id: item.store_id,
            name: item.listing_name,
            slug: item.listing_slug,
            description: item.listing_description,
            price: item.listing_price,
            quantity: 1, // Default value since we don't have this info
            status: item.listing_status as ListingStatus,
            image_url: item.listing_image_url,
            views_count: 0, // Default value
            featured: false, // Default value
            is_digital: false, // Default value
            created_at: item.created_at, // Using wishlist creation date as a fallback
            updated_at: item.created_at, // Using wishlist creation date as a fallback
            stores: {
                id: item.store_id,
                name: item.store_name,
                slug: item.store_slug,
                user_id: '' // Required field but not available in response
            }
        };

        // Return the WishlistWithListing object
        return {
            id: item.id,
            user_id: item.user_id,
            listing_id: item.listing_id,
            notes: item.notes,
            created_at: item.created_at,
            updated_at: item.created_at, // Using creation date for updated_at
            listing
        };
    });
}

/**
 * Convert followed store responses from stored procedure to typed objects
 */
export function mapFollowedStoresResponsesToTyped(responses: FollowedStoreResponse[]): FollowWithStore[] {
    return responses.map(item => {
        // Create the MinimalStore object
        const store: MinimalStore = {
            id: item.store_id,
            user_id: '', // Required field but not available in response
            name: item.store_name,
            slug: item.store_slug,
            description: item.store_description,
            location: item.store_location,
            created_at: item.created_at, // Using follow creation date as a fallback
            updated_at: item.created_at // Using follow creation date as a fallback
        };

        // Return the FollowWithStore object
        return {
            id: item.id,
            user_id: item.user_id,
            store_id: item.store_id,
            created_at: item.created_at,
            updated_at: item.created_at, // Using creation date for updated_at
            store
        };
    });
}