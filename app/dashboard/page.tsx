// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export default async function Dashboard() {
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
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome, {user.email}</h2>
        <p className="mb-4">Your account was successfully created.</p>
        <form action={async () => {
          'use server';
          const { logoutUser } = await import('@/actions/auth');
          await logoutUser();
        }}>
          <button type="submit" className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}