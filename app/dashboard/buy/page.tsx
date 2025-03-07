// app/dashboard/buy/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Filter, 
  Search, 
  Download, 
  Star, 
  MessageSquare, 
  Flag, 
  ChevronDown, 
  X, 
  Book, 
  Store
} from 'lucide-react';

export const metadata = {
  title: 'Purchase History | Dashboard',
  description: 'View and manage your magical item purchases',
};

export default async function BuyPage() {
  // Get the session server-side
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) {
    redirect('/login');
  }

  // Placeholder purchase data
  const purchases = [
    {
      id: 'ORD-12345',
      date: '2025-03-10T10:30:00Z',
      item: {
        name: 'Crystal Ball of Clarity',
        image: '/api/placeholder/60/60',
      },
      store: {
        name: 'Enchanted Emporium',
        slug: 'enchanted-emporium',
      },
      status: 'Delivered',
      total: 129.99,
      shipping: 'Phoenix Express',
    },
    {
      id: 'ORD-12278',
      date: '2025-02-28T14:15:00Z',
      item: {
        name: 'Moonlight Incense Collection',
        image: '/api/placeholder/60/60',
      },
      store: {
        name: 'Lunar Apothecary',
        slug: 'lunar-apothecary',
      },
      status: 'Shipped',
      total: 49.95,
      shipping: 'Standard Delivery',
    },
    {
      id: 'ORD-11986',
      date: '2025-02-15T09:45:00Z',
      item: {
        name: 'Ancient Runes Translation Guide',
        image: '/api/placeholder/60/60',
      },
      store: {
        name: 'Arcane Archives',
        slug: 'arcane-archives',
      },
      status: 'Delivered',
      total: 89.50,
      shipping: 'Standard Delivery',
    },
    {
      id: 'ORD-11834',
      date: '2025-01-23T16:20:00Z',
      item: {
        name: 'Enchanted Quill Set',
        image: '/api/placeholder/60/60',
      },
      store: {
        name: 'Spell & Scroll Shoppe',
        slug: 'spell-and-scroll-shoppe',
      },
      status: 'Processing',
      total: 35.25,
      shipping: 'Phoenix Express',
    },
  ];

  return (
    <DashboardPageWrapper pageName="Purchase History">
      <div className="space-y-6">
        {/* Collapsible Filter Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center">
              <Filter className="text-purple-700 mr-2" size={18} />
              <h3 className="font-medium text-gray-900">Filters</h3>
            </div>
            <button type="button" className="text-gray-500 hover:text-gray-700">
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Filter Controls (expanded by default for demonstration) */}
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <div>
                <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">
                  Order Status
                </label>
                <select className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
                  <option value="">All Statuses</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="180">Last 6 months</option>
                  <option value="365">Last year</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              {/* Shipping Method */}
              <div>
                <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Method
                </label>
                <select className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
                  <option value="">All Methods</option>
                  <option value="standard">Standard Delivery</option>
                  <option value="express">Phoenix Express</option>
                  <option value="teleport">Teleportation</option>
                </select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label htmlFor="" className="block text-sm font-medium text-gray-700 mb-1">
                  Price Range
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-1/2 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-1/2 border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {/* Store Filter - Multiple select with checkboxes (collapsed, would expand) */}
              <button type="button" className="inline-flex items-center px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100">
                Store <ChevronDown size={16} className="ml-1" />
              </button>

              {/* Category Filter - Multiple select with checkboxes (collapsed, would expand) */}
              <button type="button" className="inline-flex items-center px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100">
                Category <ChevronDown size={16} className="ml-1" />
              </button>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex flex-wrap gap-2">
                {/* Active Filters (Example) */}
                <div className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
                  Last 30 days
                  <button type="button" className="ml-1 text-purple-600 hover:text-purple-900">
                    <X size={14} />
                  </button>
                </div>
                <div className="inline-flex items-center px-3 py-1 text-sm bg-purple-100 text-purple-800 rounded-full">
                  Phoenix Express
                  <button type="button" className="ml-1 text-purple-600 hover:text-purple-900">
                    <X size={14} />
                  </button>
                </div>
              </div>
              <button type="button" className="text-sm text-purple-700 hover:text-purple-900">
                Clear All Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders List Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:w-1/2">
              <input
                type="text"
                placeholder="Search orders by item name, order ID, or seller..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>

            {/* Export Controls */}
            <div className="flex space-x-2">
              <button type="button" className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                <Download size={16} className="mr-1" />
                Export All Orders
              </button>
              <select className="border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500">
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="high">Highest Price</option>
                <option value="low">Lowest Price</option>
              </select>
            </div>
          </div>

          {/* Orders List */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{purchase.id}</p>
                        <p className="text-sm text-gray-500">{new Date(purchase.date).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">{purchase.shipping}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-purple-100 mr-3">
                          <Image
                            src={purchase.item.image}
                            alt={purchase.item.name}
                            width={40}
                            height={40}
                            className="rounded"
                          />
                        </div>
                        <span className="text-sm text-gray-900">{purchase.item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/store/${purchase.store.slug}`}
                        className="text-sm text-purple-700 hover:text-purple-900"
                      >
                        {purchase.store.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`inline-flex px-2 py-1 text-xs rounded-full ${
                          purchase.status === 'Delivered' 
                            ? 'bg-green-100 text-green-800' 
                            : purchase.status === 'Shipped' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${purchase.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button type="button" 
                          title="Add to Collection"
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Book size={18} />
                        </button>
                        <button type="button" 
                          title="Add to Store"
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Store size={18} />
                        </button>
                        <button type="button" 
                          title="Contact Seller"
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <MessageSquare size={18} />
                        </button>
                        <button type="button" 
                          title="Add Review"
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Star size={18} />
                        </button>
                        <button type="button" 
                          title="Report Issue"
                          className="text-purple-600 hover:text-purple-900"
                        >
                          <Flag size={18} />
                        </button>
                      </div>
                      <Link
                        href={`/dashboard/buy/order/${purchase.id}`}
                        className="mt-2 inline-block text-xs text-purple-700 hover:text-purple-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">4</span> of <span className="font-medium">12</span> orders
            </div>
            <div className="flex space-x-2">
              <button type="button" className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Previous</button>
              <button type="button" className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700">1</button>
              <button type="button" className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">2</button>
              <button type="button" className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">3</button>
              <button type="button" className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}