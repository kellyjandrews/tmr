// types/common.ts

/**
 * UUID string type
 */
export type UUID = string;

/**
 * Standard API response format
 */
export type ActionResponse<T = unknown> = {
    success: boolean;
    message?: string;
    error?: string;
    data?: T;
    count?: number;
};

/**
 * Pagination parameters
 */
export type PaginationParams = {
    limit?: number;
    offset?: number;
};

/**
 * Sorting parameters
 */
export type SortingParams = {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
};

/**
 * Base entity with standard fields
 */
export type BaseEntity = {
    id: UUID;
    created_at: string;
    updated_at?: string;
};