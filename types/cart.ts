// types/cart.ts
import type { UUID, BaseEntity } from './common';
import type { Listing } from './listing';

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
export type CartItemWithListing = CartItem & {
    listing: Listing;
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