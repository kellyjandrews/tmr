// types/listing.ts
import type { UUID, BaseEntity, PaginationParams, SortingParams } from './common';
import type { Store } from './store';
import type { Category } from './category';

/**
 * Listing entity
 */
export type Listing = BaseEntity & {
    store_id: UUID;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    quantity: number;
    status: ListingStatus;
    image_url: string | null;
    category_id?: string | null;
    views_count: number;
    featured: boolean;
    is_digital: boolean;
    stores?: Store;
    images?: ListingImage[];
    shipping?: ListingShipping;
    categories?: Category[];
};

/**
 * Listing status values
 */
export type ListingStatus = 'draft' | 'active' | 'hidden' | 'sold';

/**
 * Listing with additional store information
 */
export type ListingWithStore = Listing & {
    stores: {
        id: UUID;
        name: string;
        slug: string;
        user_id: UUID;
    };
};

/**
 * Listing with categories
 */
export type ListingWithCategories = Listing & {
    categories: Category[];
};

/**
 * Listing form data for creation/updates
 */
export type ListingFormData = {
    id?: UUID;
    name: string;
    slug?: string;
    description: string;
    price: number;
    shipping_cost: number;
    quantity: number;
    status: ListingStatus;
    categories: UUID[];
    images: string[];
    store_id?: UUID;
};

/**
 * Listing image
 */
export type ListingImage = {
    id?: UUID;
    listing_id: UUID;
    image_url: string;
    display_order: number;
    alt_text?: string;
    is_primary?: boolean;
};

/**
 * Listing shipping information
 */
export type ListingShipping = {
    id?: UUID;
    listing_id: UUID;
    flat_rate: number;
    free_shipping: boolean;
    ships_from?: string;
    ships_to?: string[];
    estimated_days_min?: number;
    estimated_days_max?: number;
};

/**
 * Listing search/filter options
 */
export type FetchListingsOptions = PaginationParams & SortingParams & {
    storeId?: UUID;
    categoryId?: UUID;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: ListingStatus;
};