// components/dashboard/DashboardLayout.tsx
'use client';

import { useState, type ReactNode } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';

type DashboardLayoutProps = {
  children: ReactNode;
  pageName: string;
};

export default function DashboardLayout({ children, pageName }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <DashboardSidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar}
        activePage={pageName}
      />
      <main className={`flex-1 overflow-auto bg-gray-50 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-purple-900 mb-6">{pageName}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}