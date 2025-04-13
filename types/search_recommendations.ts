/**
 * Search history and recommendations types
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity } from '@/types/common';

/**
 * Recommendation types
 */
export enum RecommendationType {
    SIMILAR_ITEM = 'similar_item',
    FREQUENTLY_BOUGHT_TOGETHER = 'frequently_bought_together',
    VIEWED_ALSO_VIEWED = 'viewed_also_viewed',
    PERSONALIZED = 'personalized'
}

/**
 * Search filters type
 */
export type SearchFilterValues = Record<string, string | number | boolean | string[] | number[] | null | undefined>;

/**
 * Location data type
 */
export type LocationData = {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    ip_address?: string;
    postal_code?: string;
};

/**
 * Search history interface
 */
export interface SearchHistory extends BaseEntity {
    account_id?: UUID;
    session_id?: string;
    query: string;
    filters?: SearchFilterValues;
    results_count: number;
    clicked_results?: UUID[];
    device_type?: 'mobile' | 'desktop' | 'tablet';
    location?: LocationData;
}

/**
 * Product recommendation interface
 */
export interface ProductRecommendation extends BaseEntity {
    account_id: UUID;
    listing_id: UUID;
    confidence_score?: number; // 0-1 value representing recommendation strength
    recommendation_type: RecommendationType;
    source_listing_id?: UUID; // the listing that triggered this recommendation
    viewed: boolean;
    clicked: boolean;
    converted: boolean; // resulted in purchase
    expires_at?: Date;
}

/**
 * Term categories type
 */
export type TermCategories = {
    category_ids?: UUID[];
    category_names?: string[];
    relevance_scores?: Record<string, number>;
};

/**
 * Popular search term interface
 */
export interface PopularSearchTerm extends BaseEntity {
    term: string;
    search_count: number;
    result_count_avg: number;
    conversion_rate?: number; // 0-1 value
    time_period: string; // 'daily', 'weekly', 'monthly'
    start_date: Date;
    end_date: Date;
    trending_score: number; // higher means more trending
    related_terms?: string[];
    categories?: TermCategories;
}

/**
 * Search suggestion interface
 */
export interface SearchSuggestion extends BaseEntity {
    prefix: string;
    suggestion: string;
    category?: string;
    display_priority: number;
    is_promoted: boolean;
    is_curated: boolean;
    usage_count: number;
    conversion_rate?: number; // 0-1 value
    expires_at?: Date;
}

/**
 * Recommendation result for frontend display
 */
export type RecommendationResult = {
    listing_id: UUID;
    title: string;
    price: number;
    image_url?: string;
    slug: string;
    rating?: number;
    review_count?: number;
    recommendation_type: RecommendationType;
    reason?: string; // Human-readable explanation for recommendation
    confidence_score?: number;
};

/**
 * Search analytics for reporting
 */
export type SearchAnalytics = {
    total_searches: number;
    unique_searches: number;
    zero_results_searches: number;
    zero_results_percentage: number;
    average_results_count: number;
    click_through_rate: number;
    top_searches: Array<{
        term: string;
        count: number;
        conversion_rate?: number;
    }>;
    trending_searches: Array<{
        term: string;
        trend_percentage: number; // increase from previous period
    }>;
    time_period: string;
    start_date: Date;
    end_date: Date;
};