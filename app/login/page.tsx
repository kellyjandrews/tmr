// app/login/page.tsx
import type { Metadata } from 'next';
import LoginForm from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Login to your account',
};

export default function LoginPage() {
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}