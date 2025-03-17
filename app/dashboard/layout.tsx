// app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/clientSide';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the session server-side
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <>
      {children}
    </>
  );
}