// app/login/page.tsx
import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default async function LoginPage() {
  // Check if user is already logged in
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-auth-token')?.value;

  if (token) {
    const { data } = await supabase.auth.getUser(token);
    if (data.user) {
      redirect('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}