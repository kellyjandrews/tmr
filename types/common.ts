/**
 * Common types, interfaces, and utility types for the application
 */

import type { UUID } from 'node:crypto';

/**
 * Base entity interface with common fields
 */
export interface BaseEntity {
    id: UUID;
    created_at: Date;
    updated_at: Date;
}

/**
 * Status of verification process
 */
export enum VerificationStatus {
    UNVERIFIED = 'unverified',
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
}

/**
 * Common event severity levels
 */
export enum EventSeverity {
    INFO = 'info',
    WARNING = 'warning',
    CRITICAL = 'critical',
    SECURITY = 'security',
}

/**
 * Source of events
 */
export enum EventSource {
    WEB = 'web',
    MOBILE = 'mobile',
    API = 'api',
    INTERNAL = 'internal',
    SYSTEM = 'system',
}

/**
 * Device types for analytics and user agent tracking
 */
export enum DeviceType {
    MOBILE = 'mobile',
    DESKTOP = 'desktop',
    TABLET = 'tablet',
    SMART_TV = 'smart_tv',
    CONSOLE = 'console',
    OTHER = 'other',
}

/**
 * Currency code (ISO 4217)
 */
export type CurrencyCode = string;

/**
 * Phone number type with E.164 format validation
 */
export type PhoneNumber = string;

/**
 * Email address type with validation
 */
export type EmailAddress = string;

/**
 * URL type with validation
 */
export type URL = string;

/**
 * ISO 3166-1 alpha-2 country code
 */
export type CountryCode = string;

/**
 * Geolocation coordinates
 */
export interface GeoCoordinates {
    latitude: number;
    longitude: number;
}

/**
 * Date range with start and end
 */
export interface DateRange {
    start_date: Date;
    end_date: Date;
}

/**
 * Price information
 */
export interface Price {
    amount: number;
    currency: CurrencyCode;
}

/**
 * Address interface for shipping and billing
 */
export interface Address {
    id: UUID;
    full_name: string;
    organization_name?: string;
    street_address: string;
    street_address_2?: string;
    city: string;
    state_province?: string;
    postal_code: string;
    country: CountryCode;
    phone?: PhoneNumber;
    is_default: boolean;
    is_commercial: boolean;
    coordinates?: GeoCoordinates;
    created_at: Date;
    updated_at: Date;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
    page: number;
    limit: number;
}

/**
 * Pagination result metadata
 */
export interface PaginationMeta {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

/**
 * Sort direction
 */
export enum SortDirection {
    ASC = 'asc',
    DESC = 'desc',
}

/**
 * Sort parameter
 */
export interface SortParam {
    field: string;
    direction: SortDirection;
}

/**
 * Search result with relevance score
 */
export interface SearchResult<T> {
    item: T;
    score: number;
}

/**
 * Search filter parameters base interface
 */
export interface SearchFilters {
    [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

/**
 * Search parameters
 */
export interface SearchParams<T extends SearchFilters = SearchFilters> {
    query: string;
    filters?: T;
    sort?: SortParam;
    pagination?: PaginationParams;
}

/**
 * Error details record type
 */
export type ErrorDetails = Record<string, string | number | boolean | null | undefined>;

/**
 * Custom error with error code
 */
export interface AppError extends Error {
    code: string;
    details?: ErrorDetails;
}

/**
 * Response status
 */
export enum ResponseStatus {
    SUCCESS = 'success',
    ERROR = 'error',
}

/**
 * Metadata record type
 */
export type MetadataRecord = Record<string, string | number | boolean | null | undefined | string[] | number[]>;

/**
 * Standard API response
 */
export interface ApiResponse<T> {
    status: ResponseStatus;
    data?: T;
    error?: AppError;
    meta?: MetadataRecord;
}