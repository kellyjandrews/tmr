// types/review.ts
import type { UUID, BaseEntity } from './common';
import type { User } from './user';
import type { Listing } from './listing';

/**
 * Review entity
 */
export type Review = BaseEntity & {
    listing_id: UUID;
    user_id: UUID;
    order_item_id?: UUID;
    rating: number;
    title?: string;
    content?: string;
    response?: string;
    response_date?: string;
    is_verified_purchase: boolean;
    is_hidden: boolean;
};

/**
 * Review with user information
 */
export type ReviewWithUser = Review & {
    user: User;
};

/**
 * Review with listing information
 */
export type ReviewWithListing = Review & {
    listing: Listing;
};

/**
 * Review form data
 */
export type ReviewFormData = {
    listing_id: UUID;
    rating: number;
    title?: string;
    content?: string;
};

/**
 * Review response form data
 */
export type ReviewResponseFormData = {
    review_id: UUID;
    response: string;
};

/**
 * Review summary statistics
 */
export type ReviewSummary = {
    average_rating: number;
    total_reviews: number;
    rating_breakdown: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
    verified_purchase_percentage: number;
};

/**
 * Review filter options
 */
export type ReviewFilterOptions = {
    listing_id?: UUID;
    store_id?: UUID;
    rating?: number;
    verified_only?: boolean;
    with_content_only?: boolean;
};