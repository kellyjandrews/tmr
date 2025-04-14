// app/dashboard/account/page.tsx
import { redirect } from 'next/navigation';
import { createSession } from '@/lib/supabase/serverSide';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import AccountForm from '@/components/account/AccountForm';
import { getUserProfile } from '@/actions/account';
import type { UserProfile } from '@/types/user';

export const metadata = {
  title: 'My Account | Dashboard',
  description: 'Manage your account settings',
};

export default async function AccountPage() {
  // Get the session server-side
  const supabase = await createSession();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile using the new action
  const profileResult = await getUserProfile();
  
  if (!profileResult.success) {
    console.error('Error fetching profile:', profileResult.error);
  }

  // Prepare user profile data, ensuring it matches the UserProfile type
  const userProfile: UserProfile = profileResult.success && profileResult.data ? 
    profileResult.data as UserProfile : 
    {
      id: user.id,
      email: user.email || '',
      full_name: null,
      avatar_url: null,
      bio: null,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

  return (
    <DashboardPageWrapper pageName="My Account">
      <AccountForm initialProfile={userProfile} />
    </DashboardPageWrapper>
  );
}