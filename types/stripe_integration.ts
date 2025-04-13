/**
 * Stripe integration types and interfaces
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity } from '@/types/common';


/**
 * Payment transaction status
 */
export enum PaymentTransactionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    DISPUTED = 'disputed'
}

/**
 * Payment method types
 */
export enum PaymentMethodType {
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    BANK_TRANSFER = 'bank_transfer',
    WALLET = 'wallet'
}

/**
 * Transaction metadata
 */
export type TransactionMetadata = {
    order_number?: string;
    customer_reference?: string;
    invoice_id?: string;
    items?: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
    }>;
    shipping_details?: {
        method: string;
        carrier?: string;
        tracking_number?: string;
        estimated_delivery?: string;
    };
    tax_details?: {
        tax_rate: number;
        tax_amount: number;
        tax_category: string;
    };
    discount_details?: {
        code?: string;
        amount: number;
        type: string;
    };
    billing_address?: {
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
    user_agent?: string;
    ip_address?: string;
    platform?: string;
    device_id?: string;
};

/**
 * Payment transaction interface
 */
export interface PaymentTransaction extends BaseEntity {
    order_id?: UUID;
    account_id: UUID;
    stripe_payment_intent_id?: string;
    stripe_customer_id?: string;
    amount: number;
    currency: string;
    status?: PaymentTransactionStatus;
    payment_method_type?: PaymentMethodType;
    fee_amount?: number;
    net_amount?: number;
    description?: string;
    metadata?: TransactionMetadata;
    error_message?: string;
}

/**
 * Payment payout status
 */
export enum PayoutStatus {
    PENDING = 'pending',
    IN_TRANSIT = 'in_transit',
    PAID = 'paid',
    FAILED = 'failed',
    CANCELED = 'canceled'
}

/**
 * Payout metadata
 */
export type PayoutMetadata = {
    period_start?: Date;
    period_end?: Date;
    order_count?: number;
    transaction_summary?: {
        gross_volume: number;
        fees: number;
        refunds: number;
        disputes: number;
        net_payout: number;
    };
    settlement_type?: string;
    account_last4?: string;
    bank_name?: string;
    statement_descriptor?: string;
    automatic_payout?: boolean;
    tax_details?: {
        tax_id?: string;
        tax_year?: number;
        reported_amount?: number;
    };
};

/**
 * Payment payout interface
 */
export interface PaymentPayout extends BaseEntity {
    store_id: UUID;
    stripe_payout_id?: string;
    amount: number;
    currency: string;
    status?: PayoutStatus;
    arrival_date?: Date;
    destination: string;
    transactions?: UUID[];
    metadata?: PayoutMetadata;
}