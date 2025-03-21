'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MessageList from '@/components/messages/MessagesList';
import Conversation from '@/components/messages/Conversation';

type MessagesClientProps = {
  userId: string;
};

export default function MessagesClient({ userId }: MessagesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get('conversation')
  );
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  // Check screen size to handle responsive layout
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    
    // Update URL with the selected conversation
    const params = new URLSearchParams(searchParams);
    params.set('conversation', conversationId);
    router.push(`/dashboard/messages?${params.toString()}`);
  };

  // Handle back button (for mobile)
  const handleBack = () => {
    setSelectedConversationId(null);
    
    // Remove conversation from URL
    const params = new URLSearchParams(searchParams);
    params.delete('conversation');
    router.push(`/dashboard/messages${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <div className="flex h-full">
      {/* Message List Sidebar - hide on small screens when a conversation is selected */}
      {(!isSmallScreen || !selectedConversationId) && (
        <div className="w-full md:w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
          <MessageList 
            selectedConversationId={selectedConversationId} 
            onSelectConversation={handleSelectConversation}
          />
        </div>
      )}
      
      {/* Conversation Content */}
      {(!isSmallScreen || selectedConversationId) && (
        <div className="w-full md:w-2/3 flex flex-col">
          {selectedConversationId ? (
            <Conversation 
              conversationId={selectedConversationId}
              currentUserId={userId}
              onBack={isSmallScreen ? handleBack : undefined}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm mt-1">Choose a conversation from the sidebar to view messages</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}