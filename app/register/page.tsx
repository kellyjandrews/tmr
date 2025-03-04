// app/register/page.tsx
import type { Metadata } from 'next';
import RegisterForm from '@/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Register',
  description: 'Create a new account',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
}