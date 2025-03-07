// app/dashboard/collection/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';

export const metadata = {
  title: 'Collection | Dashboard',
  description: 'View your magical item collection',
};

export default async function CollectionPage() {
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
    <DashboardPageWrapper pageName="Collection">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-purple-900 mb-4">Your Magical Collection</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="h-40 bg-purple-100 flex items-center justify-center">
              <span className="text-3xl">✨</span>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-purple-800">Crystal Ball of Clarity</h3>
              <p className="text-sm text-gray-600 mt-1">Purchased on March 15, 2025</p>
              <div className="mt-2 flex justify-between items-center">
                <button type="button" className="text-sm text-purple-700 hover:text-purple-900">
                  View Details
                </button>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="h-40 bg-purple-100 flex items-center justify-center">
              <span className="text-3xl">🔮</span>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-purple-800">Lunar Phase Potion</h3>
              <p className="text-sm text-gray-600 mt-1">Purchased on February 3, 2025</p>
              <div className="mt-2 flex justify-between items-center">
                <button type="button" className="text-sm text-purple-700 hover:text-purple-900">
                  View Details
                </button>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="h-40 bg-purple-100 flex items-center justify-center">
              <span className="text-3xl">📜</span>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-purple-800">Ancient Runes Scroll</h3>
              <p className="text-sm text-gray-600 mt-1">Purchased on January 12, 2025</p>
              <div className="mt-2 flex justify-between items-center">
                <button type="button" className="text-sm text-purple-700 hover:text-purple-900">
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}