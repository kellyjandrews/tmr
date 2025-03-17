// app/login/page.tsx
import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/clientSide';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default async function LoginPage() {
 const supabase = await createClient()
 const { data } = await supabase.auth.getUser();

    if (data.user) {
      redirect('/dashboard');
    }
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}