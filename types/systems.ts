/**
 * System types and interfaces for taxonomy, events, and core functionality
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity, EventSeverity, EventSource, MetadataRecord } from '@/types/common';

/**
 * Tag types
 */
export enum TagType {
    PRODUCT = 'product',
    STORE = 'store',
    USER = 'user',
    SYSTEM = 'system',
}

/**
 * Tag model interface
 */
export interface Tag extends BaseEntity {
    name: string;
    slug: string;
    description?: string;
    type: TagType;
    parent_tag_id?: UUID;
    is_active: boolean;
}

/**
 * Taxonomy types for categories
 */
export enum TaxonomyType {
    PRODUCT = 'product',
    STORE = 'store',
    CONTENT = 'content',
    SYSTEM = 'system',
}

/**
 * Category model interface
 */
export interface Category extends BaseEntity {
    name: string;
    slug: string;
    description?: string;
    parent_category_id?: UUID;
    taxonomy_type: TaxonomyType;
    level: number;
    is_active: boolean;
    display_order: number;
    metadata?: MetadataRecord;
}

/**
 * Brand model interface
 */
export interface Brand extends BaseEntity {
    name: string;
    slug: string;
    description?: string;
    primary_category_id?: UUID;
    verification_status: string;
    metadata?: MetadataRecord;
    is_active: boolean;
}

/**
 * Brand Category relationship
 */
export interface BrandCategory extends BaseEntity {
    brand_id: UUID;
    category_id: UUID;
    is_primary: boolean;
}

/**
 * Event namespace for global events
 */
export enum EventNamespace {
    ACCOUNTS = 'accounts',
    STORES = 'stores',
    LISTINGS = 'listings',
    ORDERS = 'orders',
    CARTS = 'carts',
    GLOBAL = 'global',
    SYSTEM = 'system',
}

/**
 * Event data type
 */
export type EventData = Record<string, string | number | boolean | string[] | number[] | Record<string, unknown> | null | undefined>;

/**
 * Global event model interface
 */
export interface GlobalEvent extends BaseEntity {
    event_namespace: EventNamespace;
    event_type: string;
    entity_id: UUID;
    related_entity_id?: UUID;
    account_id?: UUID;
    ip_address?: string;
    user_agent?: string;
    severity: EventSeverity;
    data: EventData;
    source: EventSource;
}

/**
 * SEO entity types
 */
export enum SeoEntityType {
    LISTING = 'listing',
    STORE = 'store',
    CATEGORY = 'category',
    BRAND = 'brand',
    PAGE = 'page',
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
 * Device breakdown type for analytics
 */
export type DeviceBreakdown = Record<string, number | { count: number; percentage: number }>;

/**
 * Referrer breakdown type for analytics
 */
export type ReferrerBreakdown = Record<string, number | { count: number; percentage: number }>;

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
 * URL redirect HTTP status codes
 */
export enum RedirectType {
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    TEMPORARY_REDIRECT = 307,
    PERMANENT_REDIRECT = 308,
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
    conversion_rate?: number;
    expires_at?: Date;
}

/**
 * Recommendation types
 */
export enum RecommendationType {
    SIMILAR_ITEM = 'similar_item',
    FREQUENTLY_BOUGHT_TOGETHER = 'frequently_bought_together',
    VIEWED_ALSO_VIEWED = 'viewed_also_viewed',
    PERSONALIZED = 'personalized',
}

/**
 * Product recommendation interface
 */
export interface ProductRecommendation extends BaseEntity {
    account_id: UUID;
    listing_id: UUID;
    confidence_score?: number;
    recommendation_type: RecommendationType;
    source_listing_id?: UUID;
    viewed: boolean;
    clicked: boolean;
    converted: boolean;
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
    conversion_rate?: number;
    time_period: string;
    start_date: Date;
    end_date: Date;
    trending_score: number;
    related_terms?: string[];
    categories?: TermCategories;
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
    device_type?: string;
    location?: LocationData;
}