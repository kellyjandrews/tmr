// types/favorites.ts
import type { UUID, BaseEntity } from './common';
import type { ListingStatus } from './listing';

/**
 * Raw wishlist item from database
 */
export type WishlistItem = BaseEntity & {
    user_id: UUID;
    listing_id: UUID;
    notes?: string | null;
};

/**
 * Raw store follow from database
 */
export type StoreFollow = BaseEntity & {
    user_id: UUID;
    store_id: UUID;
};

/**
 * Response from get_user_wishlist stored procedure
 */
export type WishlistItemResponse = {
    id: UUID;
    user_id: UUID;
    listing_id: UUID;
    notes: string | null;
    created_at: string;
    listing_name: string;
    listing_slug: string;
    listing_description: string | null;
    listing_price: number;
    listing_image_url: string | null;
    listing_status: string;
    store_id: UUID;
    store_name: string;
    store_slug: string;
};

/**
 * Response from get_followed_stores stored procedure
 */
export type FollowedStoreResponse = {
    id: UUID;
    user_id: UUID;
    store_id: UUID;
    created_at: string;
    store_name: string;
    store_slug: string;
    store_description: string | null;
    store_location: string | null;
};

/**
 * Minimal listing type for wishlist items
 */
export type MinimalListing = BaseEntity & {
    store_id: UUID;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    quantity: number;
    status: ListingStatus;
    image_url: string | null;
    views_count: number;
    featured: boolean;
    is_digital: boolean;
    stores?: {
        id: UUID;
        name: string;
        slug: string;
        user_id: UUID;
    };
};

/**
 * Minimal store type for followed stores
 */
export type MinimalStore = BaseEntity & {
    user_id: UUID;
    name: string;
    slug: string;
    description?: string | null;
    welcome_message?: string | null;
    location?: string | null;
};

/**
 * Wishlist item with full listing details
 */
export type WishlistWithListing = WishlistItem & {
    listing: MinimalListing;
};

/**
 * Store follow with full store details
 */
export type FollowWithStore = StoreFollow & {
    store: MinimalStore;
};

/**
 * Favorites stats for listings and stores
 */
export type FavoritesStats = {
    listing_favorites_count?: number;
    store_followers_count?: number;
};