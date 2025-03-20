// app/dashboard/sell/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSession } from '@/utils/supabase/serverSide';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import ManageListingsClient from '@/components/listings/ManageListingsClient';
import { PlusCircle, AlertCircle } from 'lucide-react';
import type { Listing } from '@/types/listing';

export const metadata = {
  title: 'Sell | Dashboard',
  description: 'Manage your magical listings',
};

export default async function SellPage() {
  // Get the session server-side
  const supabase = await createSession();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check if the user has a store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name, slug')
    .eq('user_id', user.id)
    .single();

  if (storeError || !store) {
    // If user doesn't have a store, redirect to create store page
    redirect('/dashboard/create-store');
  }

  // Get the user's listings
  const { data: listings, error: listingsError } = await supabase
    .from('listings')
    .select(`
      id,
      name,
      description,
      price,
      quantity,
      status,
      image_url,
      created_at,
      updated_at
    `)
    .eq('store_id', store.id)
    .order('created_at', { ascending: false });

  // Handle error gracefully
  if (listingsError) {
    console.error('Error fetching listings:', listingsError);
  }

  return (
    <DashboardPageWrapper pageName="Your Magical Listings">
      <div className="space-y-6">
        {/* Store Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {store.name}
              </h2>
              <Link 
                href={`/store/${store.slug}`} 
                target="_blank"
                className="text-sm text-purple-700 hover:text-purple-900"
              >
                View Your Store →
              </Link>
            </div>
            
            <Link 
              href="/dashboard/sell/create-listing"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center"
            >
              <PlusCircle size={16} className="mr-1" />
              Add New Listing
            </Link>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Listings</h3>
            
            {!listings || listings.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                  <AlertCircle size={32} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Yet</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  Your magical shop is empty. Start adding magical items that you want to sell.
                </p>
                <Link 
                  href="/dashboard/sell/create-listing"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-md inline-flex items-center"
                >
                  <PlusCircle size={16} className="mr-2" />
                  Create Your First Listing
                </Link>
              </div>
            ) : (
              <ManageListingsClient initialListings={listings as Listing[]} />
            )}
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}