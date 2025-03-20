// components/Header.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type HeaderProps = {
  user?: {
    email?: string | null;
    id: string;
  } | null;
};

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const { logoutUser } = await import('@/actions/auth');
      await logoutUser();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <header className="bg-purple-800 text-white py-4 px-4 sm:px-6 lg:px-8">
      <div className="w-full flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center space-x-2">
          <span className="text-yellow-300">✨</span>
          <span>The Magic Resource</span>
        </Link>
        
        <div className="space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-sm font-medium hover:text-yellow-300">
                Dashboard
              </Link>
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white border-2 border-yellow-300">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium hidden md:inline">
                  {user.email || 'User'}
                </span>
              </div>
              
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium bg-purple-700 rounded-md hover:bg-purple-600 border border-purple-600"
              >
                {isLoading ? 'Logging out...' : 'Logout'}
              </button>
            </div>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-medium hover:text-yellow-300"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 text-sm font-medium bg-yellow-500 text-purple-900 rounded-md hover:bg-yellow-400"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}