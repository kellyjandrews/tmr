/**
 * Notification types and interfaces
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity } from '@/types/common';

/**
 * Notification types
 */
export enum NotificationType {
    ORDER_UPDATE = 'order_update',
    PRICE_DROP = 'price_drop',
    BACK_IN_STOCK = 'back_in_stock',
    MESSAGE = 'message',
    SYSTEM_ALERT = 'system_alert',
    PROMOTION = 'promotion',
    ACCOUNT = 'account'
}

/**
 * Notification importance
 */
export enum NotificationImportance {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
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