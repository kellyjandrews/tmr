/**
 * Shippo integration types and interfaces
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity } from '@/types/common';


/**
 * Shipping label status
 */
export enum ShippingLabelStatus {
    CREATED = 'created',
    USED = 'used',
    REFUNDED = 'refunded',
    INVALID = 'invalid'
}

/**
 * Address format for shipping labels
 */
export type ShippingAddress = {
    name: string;
    company?: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
    email?: string;
    is_residential: boolean;
    metadata?: Record<string, string>;
};

/**
 * Parcel dimensions and weight
 */
export type Parcel = {
    length: number;
    width: number;
    height: number;
    distance_unit: 'in' | 'cm';
    weight: number;
    weight_unit: 'lb' | 'oz' | 'kg' | 'g';
    value?: number;
    value_currency?: string;
    value_amount?: number;
    package_type?: string;
    signature_confirmation?: boolean;
    contains_dangerous_goods?: boolean;
};

/**
 * Shipping label interface
 */
export interface ShippingLabel extends BaseEntity {
    order_id: UUID;
    shipment_id?: UUID;
    shippo_transaction_id?: string;
    carrier: string;
    service_level: string;
    label_url: string;
    tracking_number?: string;
    tracking_url_provider?: string;
    status?: ShippingLabelStatus;
    rate_amount: number;
    insurance_amount?: number;
    is_return_label: boolean;
    from_address: ShippingAddress;
    to_address: ShippingAddress;
    parcel: Parcel;
    metadata?: Record<string, unknown>;
}

/**
 * Shipping dimensions
 */
export type ShippingDimensions = {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
};

/**
 * Shipping rate cache interface
 */
export interface ShippingRateCache extends BaseEntity {
    origin_postal_code: string;
    destination_postal_code: string;
    weight: number;
    dimensions: ShippingDimensions;
    carrier: string;
    service_level: string;
    rate_amount: number;
    currency: string;
    transit_days_min?: number;
    transit_days_max?: number;
    expires_at: Date;
}