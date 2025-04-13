/**
 * Resend email integration types and interfaces
 */

import type { UUID } from 'node:crypto';
import type { BaseEntity, EmailAddress } from '@/types/common';

/**
 * Email template types
 */
export enum EmailTemplateType {
    TRANSACTIONAL = 'transactional',
    MARKETING = 'marketing',
    NOTIFICATION = 'notification',
    SYSTEM = 'system'
}

/**
 * Email variables type
 */
export type EmailVariables = {
    required?: string[];
    optional?: string[];
    defaults?: Record<string, string>;
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
    UNSUBSCRIBED = 'unsubscribed'
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