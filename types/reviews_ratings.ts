/**
 * Review and rating types and interfaces
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity } from '@/types/common';
/**
 * Review status
 */
export enum ReviewStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    FLAGGED = 'flagged'
}

/**
 * Review response status
 */
export enum ReviewResponseStatus {
    ACTIVE = 'active',
    REMOVED = 'removed'
}

/**
 * Review photos type
 */
export type ReviewPhotos = {
    urls: string[];
    thumbnails?: string[];
    captions?: Record<string, string>;
    primary_index?: number;
    dimensions?: Record<string, {
        width: number;
        height: number;
        aspect_ratio?: number;
    }>;
    approved?: boolean[];
};

/**
 * Review interface
 */
export interface Review extends BaseEntity {
    account_id: UUID;
    listing_id: UUID;
    order_id?: UUID;
    store_id: UUID;
    rating: number;
    title?: string;
    content?: string;
    verified_purchase: boolean;
    status: ReviewStatus;
    helpful_votes: number;
    approved_at?: Date;
    photos?: ReviewPhotos;
}

/**
 * Review response interface
 */
export interface ReviewResponse extends BaseEntity {
    review_id: UUID;
    account_id: UUID;
    content: string;
    is_seller: boolean;
    status: ReviewResponseStatus;
}

/**
 * Review vote interface
 */
export interface ReviewVote extends BaseEntity {
    review_id: UUID;
    account_id: UUID;
    is_helpful: boolean;
}

// Types suitable for API responses and frontend use
export type ReviewWithResponses = Review & {
    responses: ReviewResponse[];
    vote_count: number;
    user_vote?: boolean;
};

export type ReviewSummary = {
    listing_id: UUID;
    average_rating: number;
    total_reviews: number;
    rating_distribution: Record<number, number>; // key: rating (1-5), value: count
    verified_purchase_count: number;
    review_with_photos_count: number;
};