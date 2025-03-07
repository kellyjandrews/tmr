// components/dashboard/DashboardHero.tsx
'use client';

import { useMemo } from 'react';

type DashboardHeroProps = {
  user: {
    email?: string | null;
    id: string;
    name?: string | null;
  };
};

export default function DashboardHero({ user }: DashboardHeroProps) {
  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good Morning';
    if (currentHour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const displayName = user.name || user.email?.split('@')[0] || 'Wizard';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center">
        <div className="h-16 w-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl mr-6">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            {greeting}, {displayName}
          </h2>
          <p className="text-gray-600">
            Welcome to your magical dashboard
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-900">Shop Status</h3>
          <p className="text-2xl font-bold text-purple-800 mt-2">Active</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-900">Listed Items</h3>
          <p className="text-2xl font-bold text-purple-800 mt-2">8</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-purple-900">Unread Messages</h3>
          <p className="text-2xl font-bold text-purple-800 mt-2">3</p>
        </div>
      </div>
    </div>
  );
}