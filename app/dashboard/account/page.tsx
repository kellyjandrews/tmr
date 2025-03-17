// app/dashboard/account/page.tsx
import { createSession } from '@/lib/supabase/serverSide';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import AccountForm from '@/components/account/AccountForm';
import type { UserProfile } from '@/types/user';

export const metadata = {
  title: 'My Account | Dashboard',
  description: 'Manage your account settings',
};

export default async function AccountPage() {
  // Get the session server-side
  const supabase = await createSession();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error;
  
  const user = data.user;

  // Fetch user profile if available
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching profile:', profileError);
  }

  // Prepare user profile data, ensuring it matches the UserProfile type
  const userProfile: UserProfile = {
    id: user.id,
    email: user.email || '',
    full_name: profile?.full_name || null,
    avatar_url: profile?.avatar_url || null,
    bio: profile?.bio || null,
    created_at: profile?.created_at || user.created_at || new Date().toISOString(),
    updated_at: profile?.updated_at || new Date().toISOString(),
  };

  return (
    <DashboardPageWrapper pageName="My Account">
      <AccountForm initialProfile={userProfile} />
    </DashboardPageWrapper>
  );
}