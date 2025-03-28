// components/favorites/FavoritesClient.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ExternalLink } from 'lucide-react';
import { supabaseLoader } from '@/utils/supabase/clientSide';
import type { WishlistWithListing, FollowWithStore } from '@/types/favorites';

type FavoritesClientProps = {
  wishlistItems: WishlistWithListing[];
  followedStores: FollowWithStore[];
};

export default function FavoritesClient({ wishlistItems, followedStores }: FavoritesClientProps) {
  return (
    <div className="space-y-8">
      {/* Favorited Items Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Heart size={20} className="text-red-500 mr-2" />
          <h2 className="text-lg font-semibold text-purple-900">Favorited Items</h2>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">You haven&apos;t favorited any items yet.</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50"
            >
              Browse the Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlistItems.map((item) => {
              const listing = item.listing;
              if (!listing) return null;

              return (
                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-40 bg-purple-100 relative">
                    {listing.image_url ? (
                      <Image
                        loader={supabaseLoader}
                        src={listing.image_url}
                        alt={listing.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-3xl">✨</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-purple-800 truncate">{listing.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {listing.stores && (
                        <Link href={`/store/${listing.stores.slug}`} className="hover:text-purple-700">
                          {listing.stores.name}
                        </Link>
                      )}
                    </p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="font-bold text-purple-900">
                        ${typeof listing.price === 'number' ? listing.price.toFixed(2) : Number(listing.price).toFixed(2)}
                      </span>
                      <Link
                        href={`/listing/${listing.slug}`}
                        className="text-sm text-purple-700 hover:text-purple-900 flex items-center"
                      >
                        View <ExternalLink size={14} className="ml-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Followed Stores Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-4">
          <Star size={20} className="text-yellow-500 mr-2" />
          <h2 className="text-lg font-semibold text-purple-900">Followed Stores</h2>
        </div>

        {followedStores.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">You&apos;re not following any stores yet.</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center px-4 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50"
            >
              Discover Stores
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {followedStores.map((follow) => {
              const store = follow.store;
              if (!store) return null;

              return (
                <Link
                  key={follow.id}
                  href={`/store/${store.slug}`}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-medium text-purple-800">{store.name}</h3>
                  {store.location && (
                    <p className="text-sm text-gray-600 mt-1">
                      Located in: {store.location}
                    </p>
                  )}
                  {store.description && (
                    <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                      {store.description}
                    </p>
                  )}
                  <div className="mt-2 text-sm text-purple-700">
                    Visit Store →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}