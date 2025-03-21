// actions/messages.ts
'use server';

import { z } from 'zod';
import { createSession } from '@/utils/supabase/serverSide';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/common';
import type { Conversation, Message, NewConversationInput, NewMessageInput } from '@/types/message';

// Validation schemas
const newMessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1, 'Message content cannot be empty').max(5000, 'Message is too long')
});

const newConversationSchema = z.object({
  participant_ids: z.array(z.string().uuid()).min(1, 'At least one participant is required'),
  title: z.string().optional(),
  listing_id: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
  initial_message: z.string().min(1, 'Initial message cannot be empty').max(5000, 'Message is too long')
});

/**
 * Get all conversations for the current user
 */
export async function getUserConversations(): Promise<ActionResponse<Conversation[]>> {
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

    // Find all conversations where the user is a participant
    const { data: participations, error: participationsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userData.user.id);

    if (participationsError) {
      throw new Error(participationsError.message);
    }

    if (!participations || participations.length === 0) {
      return {
        success: true,
        data: [],
        message: 'No conversations found'
      };
    }

    const conversationIds = participations.map(p => p.conversation_id);

    // Get the conversations with the latest message and unread count
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(id, name, slug, image_url),
        order:orders(id, status),
        latest_message:messages(id, content, created_at, sender_id)
      `)
      .in('id', conversationIds)
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      throw new Error(conversationsError.message);
    }

    // Get the other participants for each conversation
    const enrichedConversations = await Promise.all(conversations.map(async (conversation) => {
      // Get all participants except the current user
      const { data: participants, error: participantsError } = await supabase
        .from('conversation_participants')
        .select(`
          user_id,
          last_read_at,
          profiles:user_id(id, email, full_name, avatar_url)
        `)
        .eq('conversation_id', conversation.id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return conversation;
      }

      // Calculate unread count for this conversation
      const currentUserParticipant = participants?.find(p => p.user_id === userData.user.id);
      const lastReadAt = currentUserParticipant?.last_read_at;

      let unreadCount = 0;
      if (lastReadAt) {
        const { count, error: countError } = await supabase
          .from('messages')
          .select('id', { count: 'exact' })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', userData.user.id) // Don't count user's own messages
          .gt('created_at', lastReadAt);

        if (!countError) {
          unreadCount = count || 0;
        }
      }

      // Filter out the current user from participants
      const otherParticipants = participants?.filter(p => p.user_id !== userData.user.id) || [];

      return {
        ...conversation,
        participants: otherParticipants,
        unread_count: unreadCount
      };
    }));

    return {
      success: true,
      data: enrichedConversations
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
export async function getConversationMessages(conversationId: string): Promise<ActionResponse<{ conversation: Conversation, messages: Message[] }>> {
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

    // Check if the user is a participant in this conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userData.user.id)
      .single();

    if (participantError || !participant) {
      return {
        success: false,
        error: 'You do not have access to this conversation'
      };
    }

    // Get the conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(id, name, slug, image_url),
        order:orders(id, status)
      `)
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) {
      return {
        success: false,
        error: 'Conversation not found'
      };
    }

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        last_read_at,
        profiles:user_id(id, email, full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId);

    if (participantsError) {
      throw new Error(participantsError.message);
    }

    // Get messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, email, full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw new Error(messagesError.message);
    }

    // Update last_read_at for current user to mark messages as read
    await supabase
      .from('conversation_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', userData.user.id);

    // Create enriched conversation object with participants
    const enrichedConversation = {
      ...conversation,
      participants
    };

    return {
      success: true,
      data: {
        conversation: enrichedConversation,
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
    // Validate the input
    const validatedData = newMessageSchema.parse(messageData);

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Check if the user is a participant in this conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', validatedData.conversation_id)
      .eq('user_id', userData.user.id)
      .single();

    if (participantError || !participant) {
      return {
        success: false,
        error: 'You do not have access to this conversation'
      };
    }

    // Create the message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: validatedData.conversation_id,
        sender_id: userData.user.id,
        content: validatedData.content
      })
      .select(`
        *,
        sender:sender_id(id, email, full_name, avatar_url)
      `)
      .single();

    if (messageError) {
      throw new Error(messageError.message);
    }

    // Update the conversation's last_message_at timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', validatedData.conversation_id);

    // Revalidate the messages page
    revalidatePath('/dashboard/messages');
    revalidatePath(`/dashboard/messages/${validatedData.conversation_id}`);

    return {
      success: true,
      data: message,
      message: 'Message sent successfully'
    };
  } catch (error) {
    console.error('Error sending message:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
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
    // Validate the input
    const validatedData = newConversationSchema.parse(data);

    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    // Check if the user is creating a conversation with themselves
    if (validatedData.participant_ids.length === 1 && validatedData.participant_ids[0] === userData.user.id) {
      return {
        success: false,
        error: 'Cannot create a conversation with yourself'
      };
    }

    // Check if a conversation already exists between these users
    if (validatedData.participant_ids.length === 1 && !validatedData.listing_id && !validatedData.order_id) {
      // This is a direct message conversation without any reference to a listing or order
      const otherUserId = validatedData.participant_ids[0];

      // Find conversations where both users are participants
      const { data: userConversations, error: userConversationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userData.user.id);

      if (userConversationsError) {
        throw new Error(userConversationsError.message);
      }

      if (userConversations && userConversations.length > 0) {
        const conversationIds = userConversations.map(c => c.conversation_id);

        // Check if the other user is also part of any of these conversations
        const { data: existingConversations, error: existingConversationsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', conversationIds);

        if (!existingConversationsError && existingConversations && existingConversations.length > 0) {
          // Check if any of these conversations don't have a listing or order associated
          for (const ec of existingConversations) {
            const { data: conv, error: convError } = await supabase
              .from('conversations')
              .select('id, listing_id, order_id')
              .eq('id', ec.conversation_id)
              .is('listing_id', null)
              .is('order_id', null)
              .single();

            if (!convError && conv) {
              // Found existing direct message conversation
              // Send the initial message to this existing conversation
              await sendMessage({
                conversation_id: conv.id,
                content: validatedData.initial_message
              });

              return {
                success: true,
                data: { conversation_id: conv.id },
                message: 'Message sent to existing conversation'
              };
            }
          }
        }
      }
    }

    // Create a new conversation
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .insert({
        title: validatedData.title,
        listing_id: validatedData.listing_id,
        order_id: validatedData.order_id,
      })
      .select()
      .single();

    if (conversationError) {
      throw new Error(conversationError.message);
    }

    // Add all participants to the conversation
    const allParticipantIds = [...validatedData.participant_ids, userData.user.id];
    const uniqueParticipantIds = [...new Set(allParticipantIds)];

    const participantEntries = uniqueParticipantIds.map(userId => ({
      conversation_id: conversation.id,
      user_id: userId,
      is_admin: userId === userData.user.id // The creator is an admin
    }));

    const { error: participantsError } = await supabase
      .from('conversation_participants')
      .insert(participantEntries);

    if (participantsError) {
      // Clean up the conversation if we couldn't add participants
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversation.id);

      throw new Error(participantsError.message);
    }

    // Send the initial message
    await sendMessage({
      conversation_id: conversation.id,
      content: validatedData.initial_message
    });

    // Revalidate the messages page
    revalidatePath('/dashboard/messages');

    return {
      success: true,
      data: { conversation_id: conversation.id },
      message: 'Conversation created successfully'
    };
  } catch (error) {
    console.error('Error creating conversation:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}

/**
 * Get a specific conversation by ID 
 */
export async function getConversation(conversationId: string): Promise<ActionResponse<Conversation>> {
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

    // Check if the user is a participant in this conversation
    const { data: participant, error: participantError } = await supabase
      .from('conversation_participants')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', userData.user.id)
      .single();

    if (participantError || !participant) {
      return {
        success: false,
        error: 'You do not have access to this conversation'
      };
    }

    // Get the conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select(`
        *,
        listing:listings(id, name, slug, image_url),
        order:orders(id, status)
      `)
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation) {
      return {
        success: false,
        error: 'Conversation not found'
      };
    }

    // Get all participants
    const { data: participants, error: participantsError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        last_read_at,
        profiles:user_id(id, email, full_name, avatar_url)
      `)
      .eq('conversation_id', conversationId);

    if (participantsError) {
      throw new Error(participantsError.message);
    }

    // Create enriched conversation object with participants
    const enrichedConversation = {
      ...conversation,
      participants
    };

    return {
      success: true,
      data: enrichedConversation
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
 * Create a new conversation with a seller about a listing
 */
export async function contactSeller(listingId: string, message: string): Promise<ActionResponse<{ conversation_id: string }>> {
  const supabase = await createSession();

  try {
    // Validate the input
    if (!listingId) {
      return {
        success: false,
        error: 'Listing ID is required'
      };
    }

    if (!message || message.trim() === '') {
      return {
        success: false,
        error: 'Message cannot be empty'
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

    // Get the listing to find the seller
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        id, 
        name,
        store_id, 
        stores(user_id)
      `)
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return {
        success: false,
        error: 'Listing not found'
      };
    }

    // Check that the user is not the seller
    if (listing.stores[0].user_id === userData.user.id) {
      return {
        success: false,
        error: 'You cannot contact yourself about your own listing'
      };
    }

    // Check if a conversation about this listing already exists between these users
    const { data: userConversations, error: userConversationsError } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userData.user.id);

    if (userConversationsError) {
      throw new Error(userConversationsError.message);
    }

    if (userConversations && userConversations.length > 0) {
      const conversationIds = userConversations.map(c => c.conversation_id);

      // Check if seller is part of any of these conversations
      const { data: sellerConversations, error: sellerConversationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', listing.stores[0].user_id)
        .in('conversation_id', conversationIds);

      if (!sellerConversationsError && sellerConversations && sellerConversations.length > 0) {
        // Find conversations specifically about this listing
        const commonConversationIds = sellerConversations.map(sc => sc.conversation_id);

        const { data: listingConversation, error: listingConversationError } = await supabase
          .from('conversations')
          .select('id')
          .eq('listing_id', listingId)
          .in('id', commonConversationIds)
          .single();

        if (!listingConversationError && listingConversation) {
          // Found existing conversation about this listing
          // Send the message to this existing conversation
          await sendMessage({
            conversation_id: listingConversation.id,
            content: message
          });

          return {
            success: true,
            data: { conversation_id: listingConversation.id },
            message: 'Message sent to existing conversation'
          };
        }
      }
    }

    // Create a new conversation
    const title = `Inquiry about: ${listing.name}`;
    return await createConversation({
      participant_ids: [listing.stores[0].user_id],
      title,
      listing_id: listing.id,
      initial_message: message
    });
  } catch (error) {
    console.error('Error contacting seller:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}