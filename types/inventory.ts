/**
 * Inventory management types and interfaces
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity } from '@/types/common';

/**
 * Transaction types for inventory
 */
export enum TransactionType {
    PURCHASE = 'purchase',
    SALE = 'sale',
    RETURN = 'return',
    ADJUSTMENT = 'adjustment',
    RESTOCK = 'restock',
    RESERVATION = 'reservation'
}

/**
 * Inventory interface for tracking stock levels
 */
export interface Inventory extends BaseEntity {
    listing_id: UUID;
    sku?: string;
    quantity_available: number;
    quantity_reserved: number;
    restock_threshold?: number;
    warehouse_location?: string;
    last_restock_date?: Date;
    next_restock_date?: Date;
}

/**
 * Inventory transaction interface for tracking stock movements
 */
export interface InventoryTransaction extends BaseEntity {
    inventory_id: UUID;
    quantity_change: number;
    transaction_type: TransactionType;
    order_id?: UUID;
    cart_id?: UUID;
    notes?: string;
    created_by?: UUID;
}

/**
 * Inventory status for display purposes
 */
export enum InventoryStatus {
    IN_STOCK = 'in_stock',
    LOW_STOCK = 'low_stock',
    OUT_OF_STOCK = 'out_of_stock',
    BACKORDERED = 'backordered',
    DISCONTINUED = 'discontinued'
}

/**
 * Inventory with stock status for frontend use
 */
export type InventoryWithStatus = Inventory & {
    status: InventoryStatus;
    days_until_restock?: number;
    available_to_purchase: number; // quantity_available - quantity_reserved
};

/**
 * Inventory levels for reporting
 */
export type InventoryLevel = {
    listing_id: UUID;
    sku?: string;
    title: string;
    quantity_available: number;
    quantity_reserved: number;
    restock_threshold?: number;
    status: InventoryStatus;
    last_sale_date?: Date;
    turnover_rate?: number; // sales velocity
    days_of_supply?: number; // how long current stock will last based on sales velocity
};

/**
 * Inventory transaction history item
 */
export type InventoryHistoryItem = InventoryTransaction & {
    timestamp: Date;
    reference_number?: string; // Order number, cart ID, etc.
    performed_by?: string; // Username of the person who made the change
    resulting_quantity: number; // Quantity after this transaction
};