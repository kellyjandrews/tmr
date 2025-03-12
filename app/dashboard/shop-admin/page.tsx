'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import Link from 'next/link';
import type { Store } from '@/types/store';

export default function ShopAdminPage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setLoading(true);
        // Use our new direct server action
        const { getUserStoreDirect } = await import('@/app/dashboard/actions');
        const storeResult = await getUserStoreDirect();
        
        if (storeResult.success && storeResult.data) {
          setStore(storeResult.data as Store);
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoreData();
  }, []);

  const handleCreateStore = () => {
    router.push('/dashboard/create-store');
  };

  if (loading) {
    return (
      <DashboardPageWrapper pageName="Shop Admin">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper pageName="Shop Admin">
      <div className="space-y-6">
        {/* Shop Details Card */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-4">Shop Details</h2>
          
          {store ? (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Shop Name</p>
                  <p className="font-medium text-gray-900">{store.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Shop URL</p>
                  <p className="font-medium text-gray-900">
                    <Link href={`/store/${store.slug}`} className="text-purple-700 hover:text-purple-900">
                      /store/{store.slug}
                    </Link>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Created On</p>
                  <p className="font-medium text-gray-900">
                    {new Date(store.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <p className="font-medium text-green-600">Active</p>
                </div>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/dashboard/edit-store" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md inline-block">
                  Edit Shop Details
                </Link>
                <Link href={`/store/${store.slug}`} className="bg-white hover:bg-gray-50 text-purple-700 border border-purple-700 px-4 py-2 rounded-md inline-block">
                  Preview Shop
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">You haven&apos;t set up your magical shop yet!</p>
              <button
              type="button"
                onClick={handleCreateStore}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md"
              >
                Create Your Shop
              </button>
            </div>
          )}
        </div>
        
        {/* Shop Analytics Card */}
        {store && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-purple-900 mb-4">Shop Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-900">Total Views</h3>
                <p className="text-2xl font-bold text-purple-800 mt-2">245</p>
                <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-900">Items Sold</h3>
                <p className="text-2xl font-bold text-purple-800 mt-2">8</p>
                <p className="text-xs text-green-600 mt-1">↑ 33% from last month</p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-900">Shop Rating</h3>
                <p className="text-2xl font-bold text-purple-800 mt-2">4.8/5.0</p>
                <p className="text-xs text-gray-600 mt-1">From 12 reviews</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Shop Policies Card */}
        {store && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-purple-900">Shop Policies</h2>
              <button type="button" className="text-sm text-purple-700 hover:text-purple-900">
                Edit Policies
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Returns & Exchanges</h3>
                <p className="text-gray-700 text-sm">
                  We accept returns within 14 days of delivery for unopened magical items.
                  Please note that some enchanted products may lose potency if returned improperly.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Shipping Policy</h3>
                <p className="text-gray-700 text-sm">
                  Standard delivery via magical courier takes 3-5 business days.
                  Express delivery via phoenix transport available for an additional fee.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Safety Guidelines</h3>
                <p className="text-gray-700 text-sm">
                  All magical items come with safety instructions.
                  Please read carefully before use to avoid unexpected enchantments.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardPageWrapper>
  );
}