// app/dashboard/sell/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';

export const metadata = {
  title: 'Sell | Dashboard',
  description: 'List and manage your magical items for sale',
};

export default async function SellPage() {
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

  return (
    <DashboardPageWrapper pageName="Sell">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">Your Product Listings</h2>
        
        <div className="mb-6 flex justify-end">
          <button type="button" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center">
            <span className="mr-2">+</span> Add New Item
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Mystical Phoenix Feather Wand</td>
                <td className="px-6 py-4 whitespace-nowrap">$149.99</td>
                <td className="px-6 py-4 whitespace-nowrap">3</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button type="button" className="text-purple-600 hover:text-purple-900 mr-3">Edit</button>
                  <button type="button" className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Enchanted Oak Crystal</td>
                <td className="px-6 py-4 whitespace-nowrap">$89.99</td>
                <td className="px-6 py-4 whitespace-nowrap">5</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button type="button" className="text-purple-600 hover:text-purple-900 mr-3">Edit</button>
                  <button type="button" className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">Ancient Spell Grimoire</td>
                <td className="px-6 py-4 whitespace-nowrap">$249.99</td>
                <td className="px-6 py-4 whitespace-nowrap">1</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button type="button" className="text-purple-600 hover:text-purple-900 mr-3">Edit</button>
                  <button type="button" className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}