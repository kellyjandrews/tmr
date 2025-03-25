// app/dashboard/messages/page.tsx
import { redirect } from 'next/navigation';
import { createSession } from '@/utils/supabase/serverSide';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';

export const metadata = {
  title: 'Messages | Dashboard',
  description: 'View and manage your messages',
};

export default async function MessagesPage({ 
  searchParams 
}: { 
  searchParams?: { conversation?: string } 
}) {
  // Get the user ID for the messages page
  const supabase = await createSession();
  const { data } = await supabase.auth.getUser();
  
  if (!data.user) {
    redirect('/login');
  }
  
  const userId = data.user.id;
  const conversationId = searchParams?.conversation || null;

  return (
    <DashboardPageWrapper pageName="Messages">
      <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-180px)]">
        {/* We directly render the client component in the page but keep server-side auth check */}
        <div className="flex h-full">
          {/* Message List - hidden on mobile when a conversation is selected */}
          <div className={`${conversationId ? 'hidden md:block' : 'block'} md:w-1/3 border-r border-gray-200 p-4 overflow-y-auto`}>
            <MessageListServer />
          </div>
          
          {/* Conversation Content */}
          <div className={`${conversationId ? 'block' : 'hidden md:block'} w-full md:w-2/3 flex flex-col`}>
            {conversationId ? (
              <ConversationServer 
                id={conversationId}
                userId={userId}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p className="text-lg">Select a conversation</p>
                <p className="text-sm mt-1">Choose a conversation from the sidebar to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}

// Server component to fetch conversations
async function MessageListServer() {
  // Import the client component
  const MessageList = (await import('@/components/messages/MessagesList')).default;
  return <MessageList />;
}

// Server component to fetch and render a conversation
async function ConversationServer({ id, userId }: { id: string, userId: string }) {
  // Import the client component
  const Conversation = (await import('@/components/messages/Conversation')).default;
  
  // Verify the user has access to this conversation
  const { getConversation } = await import('@/actions/messages');
  const conversationResult = await getConversation(id);
  
  if (!conversationResult.success) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <p className="text-lg">Conversation not found</p>
        <p className="text-sm mt-1">The conversation might have been deleted or you don&apos;t have access</p>
      </div>
    );
  }
  
  return <Conversation conversationId={id} currentUserId={userId} />;
}