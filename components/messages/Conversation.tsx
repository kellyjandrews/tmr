'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Send, ArrowLeft, ExternalLink } from 'lucide-react';
import { getConversationMessages, sendMessage } from '@/actions/messages';
import type { ConversationWithDetails, Message } from '@/types/message';

type ConversationProps = {
  conversationId: string;
  onBack?: () => void;
  currentUserId: string;
};

export default function Conversation({ conversationId, onBack, currentUserId }: ConversationProps) {
  const router = useRouter();
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages for this conversation
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getConversationMessages(conversationId);
        if (result.success && result.data) {
          setConversation(result.data.conversation);
          setMessages(result.data.messages);
        } else {
          setError(result.error || 'Failed to load conversation');
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId) return;
    
    try {
      setSending(true);
      
      const result = await sendMessage({
        conversation_id: conversationId,
        content: newMessage.trim()
      });
      
      if (result.success && result.data) {
        // Add the new message to the list
        setMessages(prev => [...prev, result.data as Message]);
        setNewMessage('');
      } else {
        setError(result.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Get the conversation title or generate one from participants
  const getConversationTitle = () => {
    if (!conversation) return 'Loading...';
    
    if (conversation.title) {
      return conversation.title;
    }
    
    if (conversation.listing?.name) {
      return `Inquiry about: ${conversation.listing.name}`;
    }
    
    // Generate title from participants' names
    const participantNames = conversation.participants
      ?.filter(p => p.user_id !== currentUserId)
      .map(p => 
        p.profiles?.full_name || p.profiles?.email?.split('@')[0] || 'Unknown User'
      ) || [];
    
    return participantNames.join(', ') || 'Conversation';
  };

  // Format message timestamp
  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true }) || '';
  };

  // Determine if the next message is from the same sender (for grouping)
  const isNextMessageFromSameSender = (currentIndex: number) => {
    if (currentIndex === messages.length - 1) return false;
    const currentMessage = messages[currentIndex];
    const nextMessage = messages[currentIndex + 1];
    return currentMessage.sender_id === nextMessage.sender_id;
  };


  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check screen size to handle responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // Handle back button on mobile
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (pathname.includes('/messages/')) {
      // If we're on the conversation detail page, go back to the messages page
      router.push('/dashboard/messages');
    } else {
      // Otherwise, just remove the conversation param
      router.push('/dashboard/messages');
    }
  };

  // Check if we should show the back button (on mobile or on the conversation detail page)
  const showBackButton = onBack || pathname.includes('/messages/') || isMobile;

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b border-gray-200 p-4 bg-white">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg p-3 max-w-xs ${i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-200'} animate-pulse`}>
                <div className="h-4 w-32 bg-gray-300 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-300 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 bg-white">
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="border-b border-gray-200 p-4 bg-white flex justify-between items-center">
        <div className="flex items-center">
          {showBackButton && (
            <button 
              type="button"
              onClick={handleBack} 
              className="mr-2 text-gray-600 hover:text-gray-900"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 className="font-medium text-purple-900 text-lg">{getConversationTitle()}</h2>
        </div>
        
        {conversation?.listing && (
          <Link
            href={`/listing/${conversation.listing.slug}`}
            className="text-sm text-purple-700 hover:text-purple-900 flex items-center"
            target="_blank"
          >
            View Listing
            <ExternalLink size={14} className="ml-1" />
          </Link>
        )}
      </div>
      
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg">
            <p>{error}</p>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No messages yet</p>
            <p className="text-sm mt-1">Start the conversation below</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === currentUserId;
              const showSenderInfo = index === 0 || messages[index - 1].sender_id !== message.sender_id;
              const continueGroup = !isNextMessageFromSameSender(index);
              
              return (
                <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`rounded-lg p-3 max-w-xs lg:max-w-md ${
                    isCurrentUser 
                      ? 'bg-purple-100 text-gray-800' 
                      : 'bg-white border border-gray-200 text-gray-800'
                  } ${!continueGroup ? 'mb-1' : 'mb-3'}`}>
                    {showSenderInfo && !isCurrentUser && message.sender && (
                      <div className="flex items-center mb-1">
                        <span className="text-xs font-medium text-purple-700">
                          {message.sender.full_name || message.sender.email?.split('@')[0] || 'Unknown'}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-sm break-words">{message.content}</p>
                    
                    <div className={`text-xs mt-1 ${isCurrentUser ? 'text-gray-500 text-right' : 'text-gray-500'}`}>
                      {formatMessageTime(message.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-l-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            disabled={sending}
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-r-md flex items-center justify-center disabled:bg-purple-400"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}