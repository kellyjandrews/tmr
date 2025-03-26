// actions/messages.ts
'use server';

import { createSession } from '@/utils/supabase/serverSide';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/common';
import type { ConversationWithDetails, Message, NewConversationInput, NewMessageInput } from '@/types/message';

/**
 * Get all conversations for the current user
 */
export async function getUserConversations(): Promise<ActionResponse<ConversationWithDetails[]>> {
  const supabase = await createSession();

  try {
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Use the stored procedure to get all conversations with details
    const { data, error } = await supabase
      .rpc('get_user_conversations_with_details', {
        user_id_param: userData.user.id
      });

    if (error) {
      console.error('Error fetching conversations:', error);
      throw new Error(error.message);
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Get messages for a specific conversation
 */
export async function getConversationMessages(conversationId: string): Promise<ActionResponse<{ conversation: ConversationWithDetails, messages: Message[] }>> {
  const supabase = await createSession();

  try {
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Get the conversation details
    const { data: conversation, error: conversationError } = await supabase
      .rpc('get_conversation_details', {
        conversation_id: conversationId,
        user_id_param: userData.user.id
      });

    if (conversationError) {
      throw new Error(conversationError.message);
    }

    if (!conversation) {
      return {
        success: false,
        error: 'Conversation not found or you do not have access'
      };
    }

    // Get the messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .rpc('get_conversation_messages', {
        user_id: userData.user.id,
        conversation_id: conversationId,
        page_size: 50 // Fetch the last 50 messages
      });

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    return {
      success: true,
      data: {
        conversation,
        messages: messages || []
      }
    };
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Send a new message in a conversation
 */
export async function sendMessage(messageData: NewMessageInput): Promise<ActionResponse<Message>> {
  const supabase = await createSession();

  try {
    if (!messageData.conversation_id || !messageData.content.trim()) {
      return {
        success: false,
        error: 'Conversation ID and message content are required'
      };
    }

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Use the stored procedure to send a message
    const { data: messageId, error: sendError } = await supabase
      .rpc('send_message', {
        sender_id: userData.user.id,
        conversation_id: messageData.conversation_id,
        message_content: messageData.content.trim()
      });

    if (sendError) {
      throw new Error(sendError.message);
    }

    // Get the newly created message
    const { data: message, error: fetchError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, email, full_name, avatar_url)
      `)
      .eq('id', messageId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    // Revalidate the messages page
    revalidatePath('/dashboard/messages');
    revalidatePath(`/dashboard/messages/${messageData.conversation_id}`);

    return {
      success: true,
      data: message,
      message: 'Message sent successfully'
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Create a new conversation with another user
 */
export async function createConversation(data: NewConversationInput): Promise<ActionResponse<{ conversation_id: string }>> {
  const supabase = await createSession();

  try {
    if (!data.participant_ids || data.participant_ids.length === 0) {
      return {
        success: false,
        error: 'At least one participant is required'
      };
    }

    if (!data.initial_message || data.initial_message.trim() === '') {
      return {
        success: false,
        error: 'Initial message is required'
      };
    }

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Use the stored procedure to create a new conversation
    const { data: conversationId, error: createError } = await supabase
      .rpc('create_conversation', {
        creator_id: userData.user.id,
        participant_ids: data.participant_ids,
        title: data.title || null,
        listing_id: data.listing_id || null,
        order_id: data.order_id || null,
        initial_message: data.initial_message.trim()
      });

    if (createError) {
      throw new Error(createError.message);
    }

    // Revalidate the messages page
    revalidatePath('/dashboard/messages');

    return {
      success: true,
      data: { conversation_id: conversationId },
      message: 'Conversation created successfully'
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Get a specific conversation by ID 
 */
export async function getConversation(conversationId: string): Promise<ActionResponse<ConversationWithDetails>> {
  const supabase = await createSession();

  try {
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Use the stored procedure to get conversation details
    const { data: conversation, error: conversationError } = await supabase
      .rpc('get_conversation_details', {
        conversation_id: conversationId,
        user_id: userData.user.id
      });

    if (conversationError) {
      throw new Error(conversationError.message);
    }

    if (!conversation) {
      return {
        success: false,
        error: 'Conversation not found or you do not have access'
      };
    }

    return {
      success: true,
      data: conversation
    };
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Mark a conversation as read
 */
export async function markConversationAsRead(conversationId: string): Promise<ActionResponse> {
  const supabase = await createSession();

  try {
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Use the stored procedure to mark the conversation as read
    const { data: success, error: markError } = await supabase
      .rpc('mark_conversation_as_read', {
        user_id: userData.user.id,
        conversation_id: conversationId
      });

    if (markError) {
      throw new Error(markError.message);
    }

    if (!success) {
      return {
        success: false,
        error: 'Failed to mark conversation as read'
      };
    }

    // Revalidate the messages page
    revalidatePath('/dashboard/messages');
    revalidatePath(`/dashboard/messages/${conversationId}`);

    return {
      success: true,
      message: 'Conversation marked as read'
    };
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}