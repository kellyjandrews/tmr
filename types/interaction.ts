// types/interaction.ts
import type { UUID, BaseEntity } from './common';
import type { Listing } from './listing';
import type { Store } from './store';
import type { User } from './user';

/**
 * Wishlist item entity
 */
export type Wishlist = BaseEntity & {
    user_id: UUID;
    listing_id: UUID;
    notes?: string;
};

/**
 * Wishlist item with listing details
 */
export type WishlistWithListing = Wishlist & {
    listing: Listing;
};

/**
 * Store follow entity
 */
export type Follow = BaseEntity & {
    user_id: UUID;
    store_id: UUID;
};

/**
 * Follow with store details
 */
export type FollowWithStore = Follow & {
    store: Store;
};

/**
 * Follow with user details (for store owners)
 */
export type FollowWithUser = Follow & {
    user: User;
};

/**
 * View history entry
 */
export type ViewHistory = {
    id: UUID;
    user_id: UUID;
    listing_id: UUID;
    viewed_at: string;
    view_count: number;
};

/**
 * User interaction stats
 */
export type UserInteractionStats = {
    wishlist_count: number;
    followed_stores_count: number;
    review_count: number;
    purchased_items_count: number;
};

/**
 * Store interaction stats
 */
export type StoreInteractionStats = {
    follower_count: number;
    view_count: number;
    sales_count: number;
    average_rating: number;
    review_count: number;
};