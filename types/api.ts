// types/api.ts
import type { ActionResponse } from './common';

/**
 * API error structure
 */
export type ApiError = {
    code: string;
    message: string;
    details?: unknown;
};

/**
 * Supabase error response
 */
export type SupabaseErrorResponse = {
    error: string;
    error_description?: string;
    code?: string;
    status?: number;
    hint?: string;
};

/**
 * Validation error details
 */
export type ValidationError = {
    field: string;
    message: string;
};

/**
 * Custom error response with field validation errors
 */
export type ValidationErrorResponse = ActionResponse & {
    validationErrors?: ValidationError[];
};

/**
 * Data fetching states
 */
export type FetchState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Pagination response metadata
 */
export type PaginationMeta = {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
};

/**
 * Paginated API response
 */
export type PaginatedResponse<T> = ActionResponse<T> & {
    pagination: PaginationMeta;
};

/**
 * File upload response
 */
export type FileUploadResponse = ActionResponse & {
    url?: string;
    path?: string;
    size?: number;
    contentType?: string;
};