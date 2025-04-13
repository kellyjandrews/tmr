/**
 * SEO and metadata types and interfaces
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity } from '@/types/common';

/**
 * SEO entity types
 */
export enum SeoEntityType {
    LISTING = 'listing',
    STORE = 'store',
    CATEGORY = 'category',
    BRAND = 'brand',
    PAGE = 'page'
}

/**
 * JSON-LD Schema markup type
 */
export type SchemaMarkup = Record<string, string | number | boolean | Record<string, unknown> | null | undefined>;

/**
 * SEO metadata interface
 */
export interface SeoMetadata extends BaseEntity {
    entity_id: UUID;
    entity_type: SeoEntityType;
    title?: string;
    description?: string;
    keywords?: string;
    canonical_url?: string;
    og_title?: string;
    og_description?: string;
    og_image_url?: string;
    schema_markup?: SchemaMarkup;
}

/**
 * Redirect HTTP status codes
 */
export enum RedirectType {
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    TEMPORARY_REDIRECT = 307,
    PERMANENT_REDIRECT = 308
}

/**
 * URL redirect interface
 */
export interface UrlRedirect extends BaseEntity {
    source_path: string;
    destination_path: string;
    redirect_type: RedirectType;
    is_active: boolean;
    notes?: string;
    created_by?: UUID;
    hit_count: number;
    last_accessed?: Date;
}

/**
 * Device breakdown type for analytics
 */
export type DeviceBreakdown = {
    desktop?: { count: number; percentage: number };
    mobile?: { count: number; percentage: number };
    tablet?: { count: number; percentage: number };
    other?: { count: number; percentage: number };
};

/**
 * Referrer breakdown type for analytics
 */
export type ReferrerBreakdown = {
    direct?: { count: number; percentage: number };
    organic?: { count: number; percentage: number };
    social?: { count: number; percentage: number };
    email?: { count: number; percentage: number };
    referral?: { count: number; percentage: number };
    paid?: { count: number; percentage: number };
    [key: string]: { count: number; percentage: number } | undefined;
};

/**
 * Page analytics interface
 */
export interface PageAnalytics extends BaseEntity {
    page_path: string;
    page_type: string;
    entity_id?: UUID;
    entity_type?: string;
    view_count: number;
    unique_visitor_count: number;
    average_time_spent: number;
    bounce_rate?: number;
    exit_rate?: number;
    conversion_rate?: number;
    device_breakdown?: DeviceBreakdown;
    referrer_breakdown?: ReferrerBreakdown;
    date_period: string;
    period_start: Date;
    period_end: Date;
}

/**
 * SEO performance metrics
 */
export type SeoPerformance = {
    clicks: number;
    impressions: number;
    ctr: number;
    average_position: number;
    top_queries: Array<{
        query: string;
        clicks: number;
        impressions: number;
        position: number;
    }>;
    time_period: string;
};

/**
 * SEO recommendations
 */
export type SeoRecommendation = {
    entity_id: UUID;
    entity_type: SeoEntityType;
    recommendation_type: 'title' | 'description' | 'content' | 'technical' | 'link';
    severity: 'critical' | 'important' | 'suggestion';
    issue: string;
    recommendation: string;
    impact?: string;
    implemented: boolean;
    created_at: Date;
};