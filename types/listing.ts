// types/listing.ts
import type { UUID, BaseEntity } from './common';
import type { Category } from './category';
import type { Store } from './store';
import type { ListingShippingDetails } from './sproc-types';

// Base listing data structure that matches the PostgreSQL listing_data type
export interface ListingData {
    id?: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    status: ListingStatus;
    store_id: string;
    image_url: string;
    slug: string;
    created_at?: string;
    updated_at?: string;
}

// Complete Listing entity
export interface Listing extends BaseEntity {
    store_id: UUID;
    name: string;
    description: string;
    price: number;
    quantity: number;
    status: ListingStatus;
    image_url: string;
    slug: string;
    category_id?: UUID;
    views_count: number;
    featured: boolean;
    is_digital: boolean;

    // Relations
    categories?: Category[];
    stores?: Store;
    images?: string[];
    shipping?: ListingShippingDetails | null;
}

// Full listing result that matches the PostgreSQL listing_result type
export interface ListingResult extends ListingData {
    id: string;
    created_at: string;
    updated_at: string;
}

// Enum for listing status
export type ListingStatus = 'draft' | 'active' | 'hidden' | 'sold';

// Form data interface for creating/updating listings
export interface ListingFormData {
    id?: string;
    name: string;
    description: string;
    price: number;
    shipping_cost: number;
    quantity: number;
    status: ListingStatus;
    categories: string[];
    images: string[];
    store_id?: string;
    slug?: string;
}

// Image data structure
export interface ListingImage {
    image_url: string;
    display_order: number;
}

// Shipping data structure
export interface ListingShipping {
    flat_rate?: number;
    free_shipping?: boolean;
    ships_from?: string;
    ships_to?: string[];
    estimated_days_min?: number;
    estimated_days_max?: number;
}

// Response type for get_listing_for_edit stored procedure
export interface GetListingForEditResult {
    listing: {
        id: string;
        name: string;
        description: string;
        price: number;
        quantity: number;
        status: ListingStatus;
        store_id: string;
        image_url: string;
        slug: string;
    };
    categories: string[];
    images: ListingImage[];
    shipping: ListingShipping;
}

// Pagination result for listings
export interface PaginatedListings {
    listings: Listing[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

// Parameters for create_listing stored procedure
export interface CreateListingParams {
    p_listing: ListingData;
    p_categories: string[];
    p_images: ListingImage[];
    p_shipping_cost: number;
    p_user_id: string;
}

// Parameters for update_listing stored procedure
export interface UpdateListingParams {
    p_listing_id: string;
    p_listing: ListingData;
    p_categories: string[];
    p_images: ListingImage[];
    p_shipping_cost: number;
    p_user_id: string;
}

// Parameters for delete_listing stored procedure
export interface DeleteListingParams {
    p_listing_id: string;
    p_user_id: string;
}

// Parameters for get_listing_for_edit stored procedure
export interface GetListingForEditParams {
    p_listing_id: string;
    p_user_id: string;
}

// Response types for stored procedures
export interface StoredProcedureResponse<T> {
    data: T | null;
    error: Error | null;
}

export type CreateListingResponse = StoredProcedureResponse<ListingResult>;
export type UpdateListingResponse = StoredProcedureResponse<ListingResult>;
export type DeleteListingResponse = StoredProcedureResponse<boolean>;
export type GetListingForEditResponse = StoredProcedureResponse<GetListingForEditResult>;

// Options for fetching listings
export interface FetchListingsOptions {
    storeId?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: ListingStatus;
}

// Query options for fetching listings
export interface ListingQueryOptions {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    status?: ListingStatus;
    categoryId?: string;
    storeId?: string;
    search?: string;
}

// Store procedure error types
export interface StoredProcedureError {
    code: string;
    message: string;
    details?: string;
}

export interface GetListingsParams {
    p_limit: number;
    p_offset: number;
    p_sort_by?: string;
    p_sort_order?: 'asc' | 'desc';
    p_status?: ListingStatus;
    p_category_id?: string;
    p_store_id?: string;
    p_search?: string;
}