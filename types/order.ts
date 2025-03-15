// types/order.ts
import type { UUID, BaseEntity } from './common';
import type { Listing } from './listing';
import type { Store } from './store';

/**
 * Order status values
 */
export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

/**
 * Payment status values
 */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/**
 * Shipping address structure
 */
export type ShippingAddress = {
    name: string;
    street: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
};

/**
 * Order entity
 */
export type Order = BaseEntity & {
    user_id: UUID;
    status: OrderStatus;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    shipping_address: ShippingAddress;
    shipping_method?: string;
    shipping_cost: number;
    tracking_number?: string;
    payment_method?: string;
    payment_status?: PaymentStatus;
    subtotal: number;
    tax: number;
    total: number;
    customer_notes?: string;
    private_notes?: string;
    paid_at?: string;
    shipped_at?: string;
    delivered_at?: string;
};

/**
 * Order item entity
 */
export type OrderItem = BaseEntity & {
    order_id: UUID;
    listing_id: UUID;
    store_id: UUID;
    item_name: string;
    item_description?: string;
    item_image_url?: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    status: OrderStatus;
};

/**
 * Order item with listing details
 */
export type OrderItemWithDetails = OrderItem & {
    listing?: Listing;
    store?: Store;
};

/**
 * Order with items
 */
export type OrderWithItems = Order & {
    items: OrderItemWithDetails[];
};

/**
 * Order status history entry
 */
export type OrderStatusHistory = {
    id: UUID;
    order_id: UUID;
    status: OrderStatus;
    comment?: string;
    created_by?: UUID;
    created_at: string;
};

/**
 * Order checkout input
 */
export type OrderCheckoutInput = {
    shipping_address: ShippingAddress;
    shipping_method: string;
    payment_method: string;
    customer_notes?: string;
};

/**
 * Order filter options
 */
export type OrderFilterOptions = {
    status?: OrderStatus;
    dateStart?: string;
    dateEnd?: string;
    minTotal?: number;
    maxTotal?: number;
};