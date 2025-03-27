// components/auth/ForgotPasswordForm.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/actions/auth';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrors({ email: 'Email is required' });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      const result = await requestPasswordReset(email);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send password reset email');
      }
      
      setSuccess(true);
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : 'An unknown error occurred' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Reset Your Password</h2>
      
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>Check your email for a link to reset your password.</p>
          <p className="mt-2">If it doesn&apos;t appear within a few minutes, check your spam folder.</p>
        </div>
      ) : (
        <>
          {errors.form && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.form}
            </div>
          )}
          
          <p className="text-gray-600 mb-4">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        </>
      )}
      
      <p className="text-center text-sm">
        <Link href="/login" className="text-purple-700 hover:text-purple-900">
          Back to Login
        </Link>
      </p>
    </div>
  );
}