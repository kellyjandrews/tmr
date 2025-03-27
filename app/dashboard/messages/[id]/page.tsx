// app/dashboard/messages/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { createSession } from '@/utils/supabase/serverSide';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import Conversation from '@/components/messages/Conversation';
import { getConversation } from '@/actions/messages';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata = {
  title: 'Conversation | Dashboard',
  description: 'View and respond to messages',
};

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  // Get the user ID for the conversation page
  const supabase = await createSession();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }
  
  const userId = data.user.id;
  const conversation = await params;
  const conversationId =  conversation.id;
  
  // Verify the user has access to this conversation
  const conversationResult = await getConversation(conversationId);
  
  if (!conversationResult.success) {
    notFound();
  }

  return (
    <DashboardPageWrapper pageName="Conversation">
      <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
        <Link 
          href="/dashboard/messages" 
          className="text-purple-700 hover:text-purple-900 flex items-center"
        >
          <ChevronLeft size={16} className="mr-1" />
          Back to Messages
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-240px)]">
        <Conversation 
          conversationId={conversationId}
          currentUserId={userId}
        />
      </div>
    </DashboardPageWrapper>
  );
}