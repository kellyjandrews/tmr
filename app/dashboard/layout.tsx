// app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the session server-side
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) {
    redirect('/login');
  }

  return (
    <>
      {children}
    </>
  );
}