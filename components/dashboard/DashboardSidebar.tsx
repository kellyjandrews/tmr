// components/dashboard/DashboardSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  ShoppingCart, 
  Store, 
  Book, 
  MessageSquare, 
  Heart,
  Star, 
  Settings, 
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
};

type DashboardSidebarProps = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  activePage: string;
};

export default function DashboardSidebar({ 
  isCollapsed, 
  toggleSidebar, 
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <Home size={20} /> },
    { name: 'Buy', href: '/dashboard/buy', icon: <ShoppingCart size={20} /> },
    { name: 'Sell', href: '/dashboard/sell', icon: <Store size={20} /> },
    { name: 'Favorites', href: '/dashboard/favorites', icon: <Heart size={20} /> },
    { name: 'Collection', href: '/dashboard/collection', icon: <Book size={20} /> },
    { name: 'Messages', href: '/dashboard/messages', icon: <MessageSquare size={20} /> },
    { name: 'Reviews', href: '/dashboard/reviews', icon: <Star size={20} /> },
    { name: 'Shop Admin', href: '/dashboard/shop-admin', icon: <Settings size={20} /> },
    { name: 'My Account', href: '/dashboard/account', icon: <User size={20} /> },
  ];

  return (
    <div 
      className={`fixed h-[calc(100vh-64px)] bg-white border-r border-gray-200 transition-all duration-300 shadow-sm ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="p-4 flex justify-end">
          <button
          type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-purple-100 text-purple-700"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                    }`}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    <span 
                      className={`ml-3 ${isCollapsed ? 'hidden' : 'block'}`}
                      aria-hidden={isCollapsed}
                    >
                      {item.name}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="h-8 w-8 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-white">
              U
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-gray-700 truncate">User Name</p>
                <p className="text-xs text-gray-500 truncate">user@example.com</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}