// types/category.ts
import type { UUID, BaseEntity } from './common';

/**
 * Category entity
 */
export type Category = BaseEntity & {
    name: string;
    description: string | null;
    parent_id: UUID | null;
    display_order: number;
    slug: string;
    is_featured: boolean;
};


/**
 * Category with subcategories
 */
export type CategoryWithSubcategories = Category & {
    subcategories?: Category[];
};

/**
 * Tag entity
 */
export type Tag = BaseEntity & {
    name: string;
    description: string | null;
    color: string | null;
    is_system: boolean;
};

/**
 * Category form data
 */
export type CategoryFormData = {
    name: string;
    slug?: string;
    description?: string;
    parent_id?: UUID | null;
    display_order?: number;
    is_featured?: boolean;
};

/**
 * Listing category junction
 */
export type ListingCategory = {
    id: UUID;
    listing_id: UUID;
    category_id: UUID;
    created_at: string;
};

/**
 * Listing tag junction
 */
export type ListingTag = {
    id: UUID;
    listing_id: UUID;
    tag_id: UUID;
    created_at: string;
};