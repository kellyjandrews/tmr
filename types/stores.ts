/**
 * Store types and interfaces for marketplace functionality
 */

import type { UUID } from 'node:crypto';
import type {
    BaseEntity,
    CountryCode,
    EmailAddress,
    MetadataRecord,
    PhoneNumber,
    URL,
    VerificationStatus
} from './common';

/**
 * Store status
 */
export enum StoreStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended',
    PENDING = 'pending',
}

/**
 * Store interface
 */
export interface Store extends BaseEntity {
    owner_id: UUID;
    name: string;
    slug: string;
    description?: string;
    email: EmailAddress;
    phone?: PhoneNumber;
    website?: URL;
    logo_url?: URL;
    status: StoreStatus;
    verification_status: VerificationStatus;
    total_listings: number;
    total_sales: number;
    rating?: number;
    metadata?: MetadataRecord;
    deleted_at?: Date;
}

/**
 * Store address types
 */
export enum StoreAddressType {
    PRIMARY = 'primary',
    BILLING = 'billing',
    SHIPPING = 'shipping',
    WAREHOUSE = 'warehouse',
    LEGAL = 'legal',
}

/**
 * Store address interface
 */
export interface StoreAddress extends BaseEntity {
    store_id: UUID;
    address_type: StoreAddressType;
    street_address: string;
    address_line_2?: string;
    city: string;
    state_province?: string;
    postal_code: string;
    country: CountryCode;
    latitude?: number;
    longitude?: number;
    is_default: boolean;
    geohash?: string;
}

/**
 * Store category association
 */
export interface StoreCategory extends BaseEntity {
    store_id: UUID;
    category_id: UUID;
    is_primary: boolean;
}

/**
 * Store image types
 */
export enum StoreImageType {
    BANNER = 'banner',
    GALLERY = 'gallery',
    PRODUCT_SHOWCASE = 'product_showcase',
    LOGO = 'logo',
    BACKGROUND = 'background',
    OTHER = 'other',
}

/**
 * Image dimensions type
 */
export type ImageDimensions = {
    width: number;
    height: number;
    aspect_ratio?: number;
};

/**
 * Store image interface
 */
export interface StoreImage extends BaseEntity {
    store_id: UUID;
    image_url: URL;
    image_type: StoreImageType;
    display_order: number;
    alt_text?: string;
    is_primary: boolean;
    image_size?: number;
    image_dimensions?: ImageDimensions;
}

/**
 * Store payment integration types
 */
export enum PaymentIntegrationType {
    STRIPE = 'stripe',
    DIRECT = 'direct',
}

/**
 * Payment method configuration
 */
export type PaymentMethodsConfig = {
    credit_card?: boolean;
    debit_card?: boolean;
    paypal?: boolean;
    apple_pay?: boolean;
    google_pay?: boolean;
    bank_transfer?: boolean;
    crypto?: boolean;
    venmo?: boolean;
    enabled_methods: string[];
    default_method?: string;
    fee_settings?: Record<string, number>;
};

/**
 * Store payment integration
 */
export interface StorePaymentIntegration extends BaseEntity {
    store_id: UUID;
    integration_type: PaymentIntegrationType;
    stripe_account_id?: string;
    payment_methods: PaymentMethodsConfig;
    onboarding_complete: boolean;
    is_test_mode: boolean;
    connected_at?: Date;
}

/**
 * Store shipping integration types
 */
export enum ShippingIntegrationType {
    SHIPPO = 'shippo',
    CUSTOM = 'custom',
}

/**
 * Store shipping integration
 */
export interface StoreShippingIntegration extends BaseEntity {
    store_id: UUID;
    integration_type: ShippingIntegrationType;
    shippo_account_id?: string;
    default_carrier_accounts?: string[];
    is_test_mode: boolean;
    connected_at?: Date;
}

/**
 * Store email integration types
 */
export enum EmailIntegrationType {
    RESEND = 'resend',
    CUSTOM = 'custom',
}

/**
 * Store email integration
 */
export interface StoreEmailIntegration extends BaseEntity {
    store_id: UUID;
    integration_type: EmailIntegrationType;
    resend_api_key_id?: string;
    default_from_email?: EmailAddress;
    custom_email_domain?: string;
    domain_verified: boolean;
    is_test_mode: boolean;
    connected_at?: Date;
}

/**
 * Store event types
 */
export enum StoreEventType {
    CREATE = 'create',
    UPDATE = 'update',
    STATUS_CHANGE = 'status_change',
    LISTING_ADDED = 'listing_added',
    REVIEW = 'review',
    MESSAGE = 'message',
    COUPON_CREATED = 'coupon_created',
    SALES_MILESTONE = 'sales_milestone',
    PERFORMANCE_CHANGE = 'performance_change',
    COMPLIANCE_UPDATE = 'compliance_update',
}

/**
 * Event data type
 */
export type StoreEventData = Record<string, string | number | boolean | string[] | number[] | Record<string, unknown> | null | undefined>;

/**
 * Store event interface
 */
export interface StoreEvent extends BaseEntity {
    store_id: UUID;
    user_id?: UUID;
    event_type: StoreEventType;
    data: StoreEventData;
    severity?: string;
    ip_address?: string;
}

/**
 * Store message types
 */
export enum StoreMessageType {
    INQUIRY = 'inquiry',
    SUPPORT = 'support',
    ORDER_RELATED = 'order_related',
    GENERAL = 'general',
    DISPUTE = 'dispute',
    FEEDBACK = 'feedback',
}

/**
 * Message priority levels
 */
export enum MessagePriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

/**
 * Store message interface
 */
export interface StoreMessage extends BaseEntity {
    store_id: UUID;
    sender_id: UUID;
    recipient_id: UUID;
    content: string;
    read: boolean;
    message_type: StoreMessageType;
    parent_message_id?: UUID;
    priority?: MessagePriority;
    attachment_urls?: string[];
}

/**
 * Store favorite categories
 */
export enum FavoriteCategory {
    SHOPPING = 'shopping',
    WISHLIST = 'wishlist',
    RECOMMENDED = 'recommended',
}

/**
 * Notification preference settings for favorites
 */
export type FavoriteNotificationPreference = {
    price_drops?: boolean;
    back_in_stock?: boolean;
    sales?: boolean;
    new_listings?: boolean;
    frequency?: 'immediate' | 'daily' | 'weekly' | 'never';
    channels?: string[];
    minimum_discount_percent?: number;
};

/**
 * Store favorite
 */
export interface StoreFavorite extends BaseEntity {
    store_id: UUID;
    user_id: UUID;
    notification_preference?: FavoriteNotificationPreference;
    favorite_category?: FavoriteCategory;
    notes?: string;
}

/**
 * Discount types for coupons
 */
export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED_AMOUNT = 'fixed_amount',
    FREE_SHIPPING = 'free_shipping',
    BUNDLE = 'bundle',
    TIERED = 'tiered',
}

/**
 * Store coupon interface
 */
export interface StoreCoupon extends BaseEntity {
    store_id: UUID;
    code: string;
    description: string;
    discount_type: DiscountType;
    discount_value: number;
    minimum_purchase?: number;
    max_uses?: number;
    max_uses_per_user?: number;
    start_date: Date;
    expiration_date: Date;
    is_stackable: boolean;
    is_active: boolean;
    usage_count: number;
}

/**
 * Tax collection methods
 */
export enum TaxCollectionMethod {
    DESTINATION = 'destination',
    ORIGIN = 'origin',
    MIXED = 'mixed',
    MARKETPLACE = 'marketplace',
}

/**
 * Tax compliance status
 */
export enum TaxComplianceStatus {
    COMPLIANT = 'compliant',
    NON_COMPLIANT = 'non-compliant',
    PENDING_REVIEW = 'pending_review',
}

/**
 * State or region nexus information
 */
export type NexusState = {
    state_code: string;
    state_name: string;
    threshold_amount?: number;
    threshold_transactions?: number;
    has_economic_nexus: boolean;
    has_physical_nexus: boolean;
    effective_date?: Date;
    tax_registration_number?: string;
};

/**
 * Store tax policy interface
 */
export interface StoreTaxPolicy extends BaseEntity {
    store_id: UUID;
    tax_id_number?: string;
    tax_exemption_status: boolean;
    default_tax_rate?: number;
    tax_collection_method: TaxCollectionMethod;
    nexus_states?: Record<string, NexusState>;
    vat_registration?: string;
    tax_compliance_status?: TaxComplianceStatus;
}

/**
 * Refund methods
 */
export enum RefundMethod {
    FULL = 'full',
    STORE_CREDIT = 'store_credit',
    PARTIAL = 'partial',
    EXCHANGE = 'exchange',
}

/**
 * Return shipping payment options
 */
export enum ReturnShippingPaidBy {
    BUYER = 'buyer',
    SELLER = 'seller',
    CONDITIONAL = 'conditional',
    FREE_OVER_THRESHOLD = 'free_over_threshold',
}

/**
 * Store return policy interface
 */
export interface StoreReturnPolicy extends BaseEntity {
    store_id: UUID;
    return_window: number;
    refund_method: RefundMethod;
    restocking_fee?: number;
    condition_requirements: string;
    return_shipping_paid_by: ReturnShippingPaidBy;
    exceptions?: string;
    digital_return_policy: boolean;
    refund_processing_time?: number;
}

/**
 * Shipping types
 */
export enum ShippingType {
    FREE = 'free',
    FLAT = 'flat',
    CALCULATED = 'calculated',
    CUSTOM = 'custom',
    MIXED = 'mixed',
}

/**
 * Shipping carrier configuration
 */
export type ShippingCarriers = {
    usps?: {
        enabled: boolean;
        services: string[];
        account_id?: string;
    };
    ups?: {
        enabled: boolean;
        services: string[];
        account_id?: string;
    };
    fedex?: {
        enabled: boolean;
        services: string[];
        account_id?: string;
    };
    dhl?: {
        enabled: boolean;
        services: string[];
        account_id?: string;
    };
    custom_carriers?: Record<string, {
        enabled: boolean;
        services: string[];
        account_id?: string;
    }>;
    preferred_carrier?: string;
};

/**
 * Insurance option configuration
 */
export type InsuranceOptions = {
    available: boolean;
    provider?: string;
    auto_insure_above?: number;
    default_coverage_amount?: number;
    rates?: Record<string, number>;
    free_insurance_threshold?: number;
};

/**
 * Store shipping policy interface
 */
export interface StoreShippingPolicy extends BaseEntity {
    store_id: UUID;
    shipping_type: ShippingType;
    domestic_processing_time?: number;
    international_processing_time?: number;
    free_shipping_threshold?: number;
    handling_fee?: number;
    shipping_carriers: ShippingCarriers;
    international_shipping: boolean;
    return_shipping_policy?: string;
    insurance_options?: InsuranceOptions;
}

/**
 * Email template types
 */
export enum EmailTemplateType {
    TRANSACTIONAL = 'transactional',
    MARKETING = 'marketing',
    NOTIFICATION = 'notification',
    SYSTEM = 'system',
}

/**
 * Email variables type
 */
export type EmailVariables = {
    required: string[];
    optional: string[];
    defaults: Record<string, string>;
    validations?: Record<string, string>;
};

/**
 * Email template interface
 */
export interface EmailTemplate extends BaseEntity {
    name: string;
    subject: string;
    html_content: string;
    text_content: string;
    template_type?: EmailTemplateType;
    variables?: EmailVariables;
    is_active: boolean;
}

/**
 * Email status
 */
export enum EmailStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    OPENED = 'opened',
    CLICKED = 'clicked',
    BOUNCED = 'bounced',
    COMPLAINED = 'complained',
    UNSUBSCRIBED = 'unsubscribed',
}

/**
 * Email metadata
 */
export type EmailMetadata = {
    client?: {
        name?: string;
        version?: string;
        os?: string;
        device?: string;
    };
    campaign_id?: string;
    user_agent?: string;
    ip_address?: string;
    geoip?: {
        country?: string;
        region?: string;
        city?: string;
    };
    tags?: string[];
    custom_fields?: Record<string, string | number | boolean>;
};

/**
 * Email log interface
 */
export interface EmailLog extends BaseEntity {
    account_id?: UUID;
    email_address: EmailAddress;
    template_id?: UUID;
    subject: string;
    email_type?: EmailTemplateType;
    related_entity_id?: UUID;
    related_entity_type?: string;
    status?: EmailStatus;
    opens: number;
    clicks: number;
    resend_message_id?: string;
    metadata?: EmailMetadata;
    ip_address?: string;
    sent_at: Date;
}

/**
 * Review status
 */
export enum ReviewStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    FLAGGED = 'flagged',
}

/**
 * Review photos
 */
export type ReviewPhotos = {
    urls: string[];
    thumbnails?: string[];
    captions?: Record<string, string>;
    primary_index?: number;
    dimensions?: Record<string, ImageDimensions>;
    approved?: boolean[];
};

/**
 * Review interface
 */
export interface Review extends BaseEntity {
    account_id: UUID;
    listing_id: UUID;
    order_id?: UUID;
    store_id: UUID;
    rating: number;
    title?: string;
    content?: string;
    verified_purchase: boolean;
    status: ReviewStatus;
    helpful_votes: number;
    approved_at?: Date;
    photos?: ReviewPhotos;
}

/**
 * Review response status
 */
export enum ReviewResponseStatus {
    ACTIVE = 'active',
    REMOVED = 'removed',
}

/**
 * Review response interface
 */
export interface ReviewResponse extends BaseEntity {
    review_id: UUID;
    account_id: UUID;
    content: string;
    is_seller: boolean;
    status: ReviewResponseStatus;
}

/**
 * Review vote interface
 */
export interface ReviewVote extends BaseEntity {
    review_id: UUID;
    account_id: UUID;
    is_helpful: boolean;
}

/**
 * Payment transaction status
 */
export enum PaymentTransactionStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    SUCCEEDED = 'succeeded',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    DISPUTED = 'disputed',
}

/**
 * Payment method types for transactions
 */
export enum PaymentMethodType {
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    BANK_TRANSFER = 'bank_transfer',
    WALLET = 'wallet',
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
    CANCELED = 'canceled',
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

/**
 * Shipping label status
 */
export enum ShippingLabelStatus {
    CREATED = 'created',
    USED = 'used',
    REFUNDED = 'refunded',
    INVALID = 'invalid',
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
    metadata?: TransactionMetadata;
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