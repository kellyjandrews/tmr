// types/store.ts
import type { UUID, BaseEntity } from './common';
import type { User } from './user';

/**
 * Store entity
 */
export type Store = BaseEntity & {
    user_id: UUID;
    name: string;
    slug: string;
    description?: string | null;
    welcome_message?: string | null;
    shipping_policy?: string | null;
    return_policy?: string | null;
    tax_policy?: string | null;
    location?: string | null;
};

/**
 * Store with user information
 */
export type StoreWithOwner = Store & {
    owner: User;
};

/**
 * Store form data for creation/updates
 */
export type StoreFormData = {
    name: string;
    slug?: string;
    description?: string;
    welcome_message?: string;
    shipping_policy?: string;
    return_policy?: string;
    tax_policy?: string;
    location?: string;
};

/**
 * Store statistics
 */
export type StoreStats = {
    total_listings: number;
    active_listings: number;
    total_sales: number;
    total_revenue: number;
    average_rating: number;
    review_count: number;
    view_count: number;
};

/**
 * Store filter options
 */
export type StoreFilterOptions = {
    query?: string;
    location?: string;
    sortBy?: 'name' | 'created_at' | 'rating';
    sortOrder?: 'asc' | 'desc';
};