// types/listing.ts

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
    flat_rate: number;
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

// Utility type for pagination
export interface PaginatedListings {
    items: ListingResult[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
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
