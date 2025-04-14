// app/dashboard/page.tsx
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import DashboardHero from '@/components/dashboard/DashboardHero';
import { createSession } from '@/lib/supabase/serverSide';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard | The Magic Resource',
  description: 'Manage your magical marketplace experience',
};

export default async function DashboardPage() {
  const supabase = await createSession()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }
  
  // Fetch user profile if available
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user?.id)
    .single();

  const userData = {
    email: user?.email || null,
    id: user.id,
    name: profile?.full_name || null,
  };

  return (
    <DashboardPageWrapper pageName="Dashboard">
      <DashboardHero user={userData} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-purple-500 pl-4 py-1">
              <p className="text-sm text-gray-600">Yesterday</p>
              <p className="text-gray-800">New message from Aurora Nightshade</p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4 py-1">
              <p className="text-sm text-gray-600">3 days ago</p>
              <p className="text-gray-800">New review on your Mystical Crystal item</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-1">
              <p className="text-sm text-gray-600">Last week</p>
              <p className="text-gray-800">Item sold: Enchanted Oak Wand</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button type="button" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-lg text-center">
              <span className="block text-2xl mb-1">+</span>
              <span className="text-sm">Add New Item</span>
            </button>
            <button type="button" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-lg text-center">
              <span className="block text-2xl mb-1">✉️</span>
              <span className="text-sm">Messages</span>
            </button>
            <button type="button" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-lg text-center">
              <span className="block text-2xl mb-1">📊</span>
              <span className="text-sm">View Analytics</span>
            </button>
            <button type="button" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-lg text-center">
              <span className="block text-2xl mb-1">⚙️</span>
              <span className="text-sm">Settings</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 md:col-span-2">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Your Listed Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Mystical Phoenix Feather Wand</td>
                  <td className="px-6 py-4 whitespace-nowrap">$149.99</td>
                  <td className="px-6 py-4 whitespace-nowrap">42</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Enchanted Oak Crystal</td>
                  <td className="px-6 py-4 whitespace-nowrap">$89.99</td>
                  <td className="px-6 py-4 whitespace-nowrap">28</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">Ancient Spell Grimoire</td>
                  <td className="px-6 py-4 whitespace-nowrap">$249.99</td>
                  <td className="px-6 py-4 whitespace-nowrap">15</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}