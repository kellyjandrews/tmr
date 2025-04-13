/**
 * User analytics types and interfaces for tracking user behavior
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity } from '@/types/common';

/**
 * User analytics interface from user_analytics table
 */
export interface UserAnalytics extends BaseEntity {
    account_id: UUID;
    visit_count: number;
    last_visit?: Date;
    favorite_categories?: Record<string, unknown>;
    time_spent?: Record<string, unknown>;
    device_preferences?: Record<string, unknown>;
    referral_source?: string;
    abandoned_cart_count: number;
    conversion_rate?: number;
}

/**
 * User analytics favorite categories structure
 */
export type FavoriteCategories = {
    category_ids?: UUID[];
    category_names?: string[];
    visit_counts?: Record<string, number>;
    purchase_counts?: Record<string, number>;
};

/**
 * Time spent analytics structure
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
 * Device preferences structure
 */
export type DevicePreferences = {
    primary_device?: string;
    device_types?: Record<string, number>;
    browsers?: Record<string, number>;
    os_types?: Record<string, number>;
    screen_sizes?: Record<string, number>;
};