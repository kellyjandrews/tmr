'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getUserConversations } from '@/actions/messages';
import type { Conversation } from '@/types/message';

export default function MessageList({ 
  selectedConversationId = null,
  onSelectConversation 
}: { 
  selectedConversationId?: string | null;
  onSelectConversation?: (conversationId: string) => void;
}) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await getUserConversations();
        if (result.success) {
          setConversations(result.data || []);
        } else {
          setError(result.error || 'Failed to load conversations');
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    
    // Search in conversation title
    if (conversation.title?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in listing name if exists
    if (conversation.listing?.name?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in participant names/emails
    if (conversation.participants?.some(p => 
      p.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      p.profiles?.email?.toLowerCase().includes(searchLower)
    )) {
      return true;
    }
    
    // Search in the latest message if exists
    if (Array.isArray(conversation.latest_message) && conversation.latest_message[0]?.content?.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    return false;
  });

  // Get the conversation title or generate one from participants
  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.title) {
      return conversation.title;
    }
    
    if (conversation.listing?.name) {
      return `Inquiry about: ${conversation.listing.name}`;
    }
    
    // Generate title from participants
    const participantNames = conversation.participants?.map(p => 
      p.profiles?.full_name || p.profiles?.email?.split('@')[0] || 'Unknown User'
    ) || [];
    
    return participantNames.join(', ') || 'Conversation';
  };

  // Get the latest message preview
  const getMessagePreview = (conversation: Conversation) => {
    if (Array.isArray(conversation.latest_message) && conversation.latest_message[0]) {
      return conversation.latest_message[0].content;
    }
    return 'No messages yet';
  };

  // Get the time display for the conversation
  const getTimeDisplay = (conversation: Conversation) => {
    const timestamp = conversation.last_message_at;
    if (!timestamp) return '';
    
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const handleSelectConversation = (id: string) => {
    if (onSelectConversation) {
      onSelectConversation(id);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 rounded-md bg-gray-200 animate-pulse">
              <div className="h-6 w-3/4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          <p>Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
      </div>
      
      {filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          {conversations.length === 0 ? (
            <>
              <MessageSquare size={32} className="mb-2 text-gray-400" />
              <p>No messages yet</p>
              <p className="text-sm mt-1">Start a conversation from a listing page</p>
            </>
          ) : (
            <>
              <Search size={32} className="mb-2 text-gray-400" />
              <p>No conversations match your search</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2 overflow-y-auto">
          {filteredConversations.map(conversation => {
            const isSelected = selectedConversationId === conversation.id;
            const hasUnread = (conversation.unread_count || 0) > 0;
            
            return (
              <div 
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation.id)}
                className={`p-3 rounded-md cursor-pointer ${
                  isSelected 
                    ? 'bg-purple-50' 
                    : hasUnread 
                      ? 'bg-purple-50' 
                      : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className={`font-medium ${hasUnread ? 'text-purple-900' : 'text-gray-900'}`}>
                    {getConversationTitle(conversation)}
                  </h3>
                  <span className="text-xs text-gray-500">{getTimeDisplay(conversation)}</span>
                </div>
                
                <div className="flex items-center mt-1">
                  {hasUnread && (
                    <span className="w-2 h-2 bg-purple-600 rounded-full mr-2"></span>
                  )}
                  <p className={`text-sm truncate ${hasUnread ? 'text-gray-800' : 'text-gray-600'}`}>
                    {getMessagePreview(conversation)}
                  </p>
                </div>
                
                {conversation.listing && (
                  <div className="mt-2 flex items-center">
                    <div className="w-8 h-8 rounded-md bg-purple-100 flex-shrink-0 mr-2 overflow-hidden">
                      {conversation.listing.image_url ? (
                        <Image 
                          src={conversation.listing.image_url}
                          alt={conversation.listing.name}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full text-purple-500">
                          <span className="text-xs">✨</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-600">
                      Re: {conversation.listing.name}
                    </span>
                  </div>
                )}
                
                {conversation.unread_count && conversation.unread_count > 0 && (
                  <div className="flex justify-end">
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-purple-600 text-white rounded-full">
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}