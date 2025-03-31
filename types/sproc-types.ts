// types/sproc-types.ts
import type { UUID } from './common';
import type { ListingStatus } from './listing';

/**
 * Base listing with store information returned by stored procedures
 */
export interface ListingWithStore {
    id: UUID;
    store_id: UUID;
    name: string;
    description: string;
    price: number;
    quantity: number;
    status: ListingStatus;
    image_url: string;
    slug: string;
    category_id: UUID | null;
    views_count: number;
    featured: boolean;
    is_digital: boolean;
    created_at: string;
    updated_at: string;
    store_name: string;
    store_slug: string;
    store_user_id: UUID;
    store_created_at: string;
}

/**
 * Category information returned by stored procedures
 */
export interface ListingCategory {
    id: UUID;
    name: string;
    slug: string;
}

/**
 * Shipping details returned by stored procedures
 */
export interface ListingShippingDetails {
    flat_rate: number | null;
    free_shipping: boolean | null;
    ships_from: string | null;
    ships_to: string[] | null;
    estimated_days_min: number | null;
    estimated_days_max: number | null;
}

/**
 * Response from get_listing_by_id and get_listing_by_slug
 */
export interface GetListingByIdResponse {
    listing_details: ListingWithStore;
    categories: ListingCategory[] | null;
    images: string[] | null;
    shipping: ListingShippingDetails | null;
}

/**
 * Response from fetch_listings and get_listings_by_category_slug
 */
export interface FetchListingsResponse {
    listing: ListingWithStore[];
    total_count: number;
}

/**
 * Response from get_featured_listings and get_related_listings
 */
export type GetFeaturedListingsResponse = ListingWithStore[];

/**
 * Response from increment_listing_view
 */
export type IncrementListingViewResponse = boolean;

/**
 * Response from get_listing_image_upload_url
 */
export interface ListingImageUploadUrlResponse {
    upload_url: string;
    storage_path: string;
}

/**
 * Response from can_delete_listing_image
 */
export type CanDeleteListingImageResponse = boolean;

/**
 * Types for create_listing, update_listing stored procedures
 */
export interface ListingCreateUpdateResult {
    id: UUID;
    name: string;
    description: string;
    price: number;
    quantity: number;
    status: string;
    store_id: UUID;
    image_url: string;
    slug: string;
    created_at: string;
    updated_at: string;
}

/**
 * Response from create_listing
 */
export type CreateListingResponse = ListingCreateUpdateResult;

/**
 * Response from update_listing
 */
export type UpdateListingResponse = ListingCreateUpdateResult;

/**
 * Response from delete_listing
 */
export type DeleteListingResponse = boolean;

/**
 * Response from get_listing_for_edit
 */
export interface GetListingForEditResponse {
    listing: {
        id: UUID;
        name: string;
        description: string;
        price: number;
        quantity: number;
        status: string;
        store_id: UUID;
        image_url: string;
        slug: string;
    };
    categories: UUID[] | null;
    images: Array<{
        image_url: string;
        display_order: number;
    }> | null;
    shipping: {
        flat_rate: number | null;
    } | null;
}