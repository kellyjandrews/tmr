/**
 * Account types and interfaces for user management
 */

import type { UUID } from 'node:crypto';
import type { Address, BaseEntity, DeviceType, EmailAddress, PhoneNumber, URL } from '@/types/common';
import type { NotificationType } from './notifications';

/**
 * Account authentication types
 */
export enum AuthType {
    EMAIL = 'email',
    GOOGLE = 'google',
    FACEBOOK = 'facebook',
    APPLE = 'apple',
    X = 'x',
    LINKEDIN = 'linkedin',
}

/**
 * Account status
 */
export enum AccountStatus {
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    DELETED = 'deleted',
    PENDING = 'pending',
    LIMITED = 'limited',
}

/**
 * User roles
 */
export enum UserRole {
    USER = 'user',
    SELLER = 'seller',
    ADMIN = 'admin',
    MODERATOR = 'moderator',
    SUPPORT = 'support',
    CONTENT_CREATOR = 'content_creator',
}

/**
 * Account interface
 */
export interface Account extends BaseEntity {
    email: EmailAddress;
    username: string;
    auth_type: AuthType;
    email_verified: boolean;
    two_factor_enabled: boolean;
    last_login?: Date;
    login_attempts: number;
    lockout_until?: Date;
    account_status: AccountStatus;
    role: UserRole;
    profile_picture_url?: URL;
    preferred_language?: string;
    timezone?: string;
    marketing_opt_in: boolean;
    referral_code?: string;
    referred_by?: UUID;
    last_activity?: Date;
    deleted_at?: Date;
}

/**
 * Login method types
 */
export enum LoginMethod {
    PASSWORD = 'password',
    OAUTH = 'oauth',
    TWO_FACTOR = 'two_factor',
    MAGIC_LINK = 'magic_link',
    BIOMETRIC = 'biometric',
}

/**
 * Security level for sessions
 */
export enum SecurityLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
}

/**
 * Session location data
 */
export type SessionLocation = {
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    ip_address?: string;
    postal_code?: string;
    timezone?: string;
};

/**
 * Account session interface
 */
export interface AccountSession extends BaseEntity {
    account_id: UUID;
    session_token: string;
    refresh_token?: string;
    ip_address?: string;
    user_agent?: string;
    device_fingerprint?: string;
    device_type: DeviceType;
    login_method: LoginMethod;
    location?: SessionLocation;
    is_active: boolean;
    security_level: SecurityLevel;
    mfa_authenticated: boolean;
    expires_at: Date;
    last_activity_at: Date;
}

/**
 * Address types for account
 */
export enum AddressType {
    SHIPPING = 'shipping',
    BILLING = 'billing',
    PRIMARY = 'primary',
    WORK = 'work',
    HOME = 'home',
    TEMPORARY = 'temporary',
    PICKUP = 'pickup',
}

/**
 * Address verification status
 */
export enum AddressVerificationStatus {
    UNVERIFIED = 'unverified',
    VERIFIED = 'verified',
    INVALID = 'invalid',
    PENDING = 'pending',
}

/**
 * Address verification source
 */
export enum AddressVerificationSource {
    USPS = 'usps',
    THIRD_PARTY = 'third_party',
    MANUAL = 'manual',
    USER_CONFIRMED = 'user_confirmed',
}

/**
 * Account address interface
 */
export interface AccountAddress extends Address {
    account_id: UUID;
    address_type: AddressType;
    address_verification_status: AddressVerificationStatus;
    verification_source?: AddressVerificationSource;
    plus_four_code?: string;
}

/**
 * Payment method types
 */
export enum PaymentType {
    CREDIT_CARD = 'credit_card',
    DEBIT_CARD = 'debit_card',
    PAYPAL = 'paypal',
    BANK_TRANSFER = 'bank_transfer',
    CRYPTO = 'crypto',
    APPLE_PAY = 'apple_pay',
    GOOGLE_PAY = 'google_pay',
    VENMO = 'venmo',
}

/**
 * Card bin category
 */
export enum BinCategory {
    DEBIT = 'debit',
    CREDIT = 'credit',
    PREPAID = 'prepaid',
    CORPORATE = 'corporate',
}

/**
 * Payment method status
 */
export enum PaymentMethodStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    INVALID = 'invalid',
    SUSPENDED = 'suspended',
    PENDING_VERIFICATION = 'pending_verification',
}

/**
 * Account payment info interface
 */
export interface AccountPaymentInfo extends BaseEntity {
    account_id: UUID;
    payment_type: PaymentType;
    provider?: string;
    last_four?: string;
    bin_category?: BinCategory;
    expiration_month?: number;
    expiration_year?: number;
    cardholder_name?: string;
    billing_address_id?: UUID;
    is_default: boolean;
    token: string;
    verification_attempts: number;
    last_verification_attempt?: Date;
    status: PaymentMethodStatus;
}

/**
 * Billing types
 */
export enum BillingType {
    INDIVIDUAL = 'individual',
    BUSINESS = 'business',
    NONPROFIT = 'nonprofit',
    GOVERNMENT = 'government',
}

/**
 * Annual spending tier
 */
export enum SpendingTier {
    STANDARD = 'standard',
    SILVER = 'silver',
    GOLD = 'gold',
    PLATINUM = 'platinum',
}

/**
 * Account billing interface
 */
export interface AccountBilling extends BaseEntity {
    account_id: UUID;
    payment_method_id?: UUID;
    billing_email?: EmailAddress;
    billing_phone?: PhoneNumber;
    tax_id_number?: string;
    billing_type?: BillingType;
    business_name?: string;
    business_tax_exempt: boolean;
    vat_registered: boolean;
    credit_balance: number;
    total_spend: number;
    last_invoice_date?: Date;
    annual_spending_tier?: SpendingTier;
}

/**
 * Theme preference
 */
export enum ThemePreference {
    LIGHT = 'light',
    DARK = 'dark',
    SYSTEM = 'system',
    HIGH_CONTRAST = 'high_contrast',
}

/**
 * Color scheme for accessibility
 */
export enum ColorScheme {
    DEFAULT = 'default',
    DEUTERANOPIA = 'deuteranopia',
    PROTANOPIA = 'protanopia',
    TRITANOPIA = 'tritanopia',
}

/**
 * Email notification frequency
 */
export enum EmailFrequency {
    IMMEDIATE = 'immediate',
    DAILY = 'daily',
    WEEKLY = 'weekly',
    NEVER = 'never',
    DIGEST = 'digest',
}

/**
 * Content filter level
 */
export enum ContentFilterLevel {
    NONE = 'none',
    MILD = 'mild',
    MODERATE = 'moderate',
    STRICT = 'strict',
}

/**
 * Notification preference settings
 */
export type NotificationPreferences = {
    order_updates?: boolean;
    price_drops?: boolean;
    back_in_stock?: boolean;
    messages?: boolean;
    system_alerts?: boolean;
    promotions?: boolean;
    account_activity?: boolean;
    marketing_emails?: boolean;
    newsletter?: boolean;
};

/**
 * Privacy settings
 */
export type PrivacySettings = {
    profile_visibility?: 'public' | 'private' | 'friends';
    show_activity?: boolean;
    show_purchases?: boolean;
    allow_data_collection?: boolean;
    allow_recommendations?: boolean;
    allow_search_engines?: boolean;
    show_online_status?: boolean;
};

/**
 * Display preferences
 */
export type DisplayPreferences = {
    density?: 'compact' | 'comfortable' | 'spacious';
    list_view?: 'grid' | 'list';
    show_thumbnails?: boolean;
    animations_enabled?: boolean;
    font_size?: 'small' | 'medium' | 'large';
    currency_display?: string;
};

/**
 * Communication channels
 */
export type CommunicationChannels = {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    in_app?: boolean;
    phone_call?: boolean;
    postal_mail?: boolean;
    preferred_channel?: string;
};

/**
 * Account settings interface
 */
export interface AccountSettings extends BaseEntity {
    account_id: UUID;
    notification_preferences?: NotificationPreferences;
    privacy_settings?: PrivacySettings;
    display_preferences?: DisplayPreferences;
    communication_channels?: CommunicationChannels;
    theme_preference?: ThemePreference;
    color_scheme?: ColorScheme;
    email_notification_frequency: EmailFrequency;
    sms_notifications_enabled: boolean;
    push_notifications_enabled: boolean;
    data_sharing_consent: boolean;
    accessibility_mode: boolean;
    content_filter_level: ContentFilterLevel;
}


/**
 * Notification importance
 */
export enum NotificationImportance {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

/**
 * Notification interface
 */
export interface Notification extends BaseEntity {
    account_id: UUID;
    notification_type: NotificationType;
    title: string;
    content: string;
    is_read: boolean;
    related_entity_id?: UUID;
    related_entity_type?: string;
    action_url?: string;
    expiration?: Date;
    importance: NotificationImportance;
    icon?: string;
}

/**
 * Favorite categories type
 */
export type FavoriteCategories = {
    category_ids?: UUID[];
    category_names?: string[];
    visit_counts?: Record<string, number>;
    purchase_counts?: Record<string, number>;
};

/**
 * Time spent analytics
 */
export type TimeSpentAnalytics = {
    total_seconds?: number;
    average_session?: number;
    by_section?: Record<string, number>;
    by_page_type?: Record<string, number>;
    by_day_of_week?: Record<string, number>;
    by_hour_of_day?: Record<string, number>;
};

/**
 * Device preferences
 */
export type DevicePreferences = {
    primary_device?: string;
    device_types?: Record<string, number>;
    browsers?: Record<string, number>;
    os_types?: Record<string, number>;
    screen_sizes?: Record<string, number>;
};

/**
 * User analytics interface
 */
export interface UserAnalytics extends BaseEntity {
    account_id: UUID;
    visit_count: number;
    last_visit?: Date;
    favorite_categories?: FavoriteCategories;
    time_spent?: TimeSpentAnalytics;
    device_preferences?: DevicePreferences;
    referral_source?: string;
    abandoned_cart_count: number;
    conversion_rate?: number;
}

/**
 * Account audit log action type
 */
export enum AuditActionType {
    INSERT = 'INSERT',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

/**
 * Account data state
 */
export type AccountDataState = Record<string, string | number | boolean | null | Record<string, unknown>>;

/**
 * Account audit log interface
 */
export interface AccountAuditLog extends BaseEntity {
    account_id: UUID;
    action_type: AuditActionType;
    old_data?: AccountDataState;
    new_data?: AccountDataState;
    changed_by?: UUID;
    ip_address?: string;
    user_agent?: string;
}