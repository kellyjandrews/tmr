// types/message.ts
import type { UUID, BaseEntity } from './common';
import type { User } from './user';
import type { Listing } from './listing';
import type { Order } from './order';

/**
 * Conversation entity
 */
export type Conversation = BaseEntity & {
    title?: string;
    listing_id?: UUID;
    order_id?: UUID;
    last_message_at: string;
};

/**
 * Conversation with additional details
 */
export type ConversationWithDetails = Conversation & {
    participants: ConversationParticipant[];
    listing?: Listing;
    order?: Order;
    latest_message?: Message;
    unread_count?: number;
};

/**
 * Conversation participant
 */
export type ConversationParticipant = {
    id: UUID;
    conversation_id: UUID;
    user_id: UUID;
    is_admin: boolean;
    last_read_at?: string;
    created_at: string;
    user?: User;
};

/**
 * Message entity
 */
export type Message = {
    id: UUID;
    conversation_id: UUID;
    sender_id: UUID;
    content: string;
    is_system_message: boolean;
    created_at: string;
    sender?: User;
};

/**
 * New message input
 */
export type NewMessageInput = {
    conversation_id: UUID;
    content: string;
};

/**
 * New conversation input
 */
export type NewConversationInput = {
    participant_ids: UUID[];
    title?: string;
    listing_id?: UUID;
    order_id?: UUID;
    initial_message?: string;
};

/**
 * Message filter options
 */
export type MessageFilterOptions = {
    conversation_id?: UUID;
    since?: string;
    limit?: number;
};