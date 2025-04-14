'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { supabaseLoader } from '@/lib/supabase/clientSide';
import FollowButton from '@/components/store/FollowButton';
import type { Store } from '@/types/store';
import type { Listing } from '@/types/listing';
import CategoryNavMenu from '@/components/layout/NavMenu';


type StoreDetailsClientProps = {
  store: Store;
  listings: Listing[];
};

export default function StoreDetailsClient({ store, listings }: StoreDetailsClientProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'about'>('products');

  return (
    <>
    <CategoryNavMenu />

      {/* Store header - full width */}
      <div className="bg-purple-800 py-8 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto">
  <h1 className="text-3xl font-bold">{store.name}</h1>
  <div className="flex items-center justify-between"> {/* Add this wrapper div */}
    <div>
      <p className="mt-2 text-purple-200">@{store.slug}</p>
      {store.location && (
        <p className="mt-1 text-purple-200 text-sm">
          Located in: {store.location}
        </p>
      )}
    </div>

    {/* Add the follow button */}
    <FollowButton 
      storeId={store.id}
      variant="primary"
    />
  </div>
  </div>

</div>
      <div className="max-w-7xl mx-auto" />
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'products'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'about'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            About
          </button>
        </nav>
      </div>
      
      {/* Content based on active tab */}
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'products' ? (
          <>
            <h2 className="text-2xl font-bold text-purple-900 mb-6">Products</h2>
            {listings.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">This store doesn&apos;t have any listings yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {listings.map((listing) => (
                  <div key={listing.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="h-48 bg-purple-100 flex items-center justify-center relative">
                      {listing.image_url ? (
                        <Image
                          loader={supabaseLoader}
                          src={listing.image_url} 
                          alt={listing.name} 
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="text-3xl">✨</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-purple-800 truncate">{listing.name}</h3>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="font-bold text-purple-900">${Number(listing.price).toFixed(2)}</span>
                        <Link 
                        href={`/listing/${listing.slug}`} 
                        className="text-sm text-purple-700 hover:text-purple-900"
                        >
                        View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-purple-900 mb-6">About {store.name}</h2>
            <div className="bg-white rounded-lg shadow-sm p-6">
              {store.description ? (
                <div className="prose max-w-none">
                  <p>{store.description}</p>
                </div>
              ) : (
                <p className="text-gray-500 italic">No store description available.</p>
              )}
              
              {store.welcome_message && (
                <div className="mt-6 bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <h3 className="text-lg font-medium text-purple-900 mb-2">Welcome Message</h3>
                  <p className="text-gray-700">{store.welcome_message}</p>
                </div>
              )}
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {store.shipping_policy && (
                  <div>
                    <h3 className="text-lg font-medium text-purple-900 mb-2">Shipping Policy</h3>
                    <p className="text-gray-700">{store.shipping_policy}</p>
                  </div>
                )}
                
                {store.return_policy && (
                  <div>
                    <h3 className="text-lg font-medium text-purple-900 mb-2">Return Policy</h3>
                    <p className="text-gray-700">{store.return_policy}</p>
                  </div>
                )}
              </div>
              
              {!store.description && !store.welcome_message && !store.shipping_policy && !store.return_policy && (
                <div className="text-center py-4">
                  <p className="text-gray-500">This store hasn&apos;t added any additional information yet.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}