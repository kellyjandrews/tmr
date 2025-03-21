'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type NavbarProps = {
  user?: {
    email?: string | null;
    id: string;
  } | null;
};

export default function Navbar({ user }: NavbarProps) {
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
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                MyApp
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user.email || 'User'}
                  </span>
                </div>
                <button
                  type='button'
                  onClick={handleLogout}
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-1 px-3 rounded"
                >
                  {isLoading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="space-x-2">
                <Link
                  href="/login"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-1 px-3 rounded"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}