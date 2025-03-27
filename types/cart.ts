import type { UUID, BaseEntity } from './common';

/**
 * Shopping cart item entity
 */
export type CartItem = BaseEntity & {
    user_id: UUID;
    listing_id: UUID;
    quantity: number;
    added_at: string;
    updated_at: string;
};

/**
 * Shopping cart item with listing details
 */
export type CartItemWithListing = {
    id: UUID;
    user_id: UUID;
    listing_id: UUID;
    quantity: number;
    added_at: string;
    updated_at: string;
    listing: {
        id: UUID;
        name: string;
        price: number;
        image_url: string;
        stores: {
            id: UUID;
            name: string;
            slug: string;
        }
    }
};




export type CartSprocData = CartItem & {
    listing_id: UUID;
    listing_name: string;
    listing_price: number;
    listing_image_url: string;
    store_id: UUID;
    store_name: string;
    store_slug: string;
};

/**
 * Shopping cart summary
 */
export type CartSummary = {
    items: CartItemWithListing[];
    itemCount: number;
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
};

/**
 * Cart update input
 */
export type CartUpdateInput = {
    listing_id: UUID;
    quantity: number;
};

/**
 * Cart operations
 */
export type CartOperation = 'add' | 'update' | 'remove' | 'clear';

/**
 * Cart item interest count
 */
export type ItemInterestCount = {
    listing_id: UUID;
    interest_count: number;
};