'use client';

import Link from 'next/link';
import Image from 'next/image';
import { supabaseLoader } from '@/utils/supabase/clientSide';
import type { Category } from '@/types/category';
import type { Listing } from '@/types/listing';

type CategoryDetailsClientProps = {
  category: Category;
  listings: Listing[];
};

export default function CategoryDetailsClient({ category, listings }: CategoryDetailsClientProps) {
  return (
    <>
      {/* Category Header - full width */}
      <div className="bg-purple-800 py-8 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto">
          <Link href="/marketplace" className="text-purple-200 hover:text-white mb-2 inline-block">
            ← Back to Marketplace
          </Link>
          <h1 className="text-3xl font-bold mt-2">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-purple-200">{category.description}</p>
          )}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Listings */}
        <h2 className="text-2xl font-bold text-purple-900 mb-6">{category.name} Collection</h2>
        
        {listings.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No {category.name.toLowerCase()} items are currently available.</p>
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
                  {listing.stores && (
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      Sold by{' '}
                      <Link 
                        href={`/store/${listing.stores.slug}`} 
                        className="hover:text-purple-700"
                      >
                        {listing.stores.name}
                      </Link>
                    </p>
                  )}
                  <div className="mt-2 flex justify-between items-center">
                    <span className="font-bold text-purple-900">${Number(listing.price).toFixed(2)}</span>
                    <Link 
                      href={`/listing/${listing.id}`} 
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
        
        {/* Add subcategories display if needed */}
        {/* {subcategories.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-purple-900 mb-4">Related Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  href={`/category/${subcategory.slug}`}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md border border-gray-200 text-center"
                >
                  {subcategory.name}
                </Link>
              ))}
            </div>
          </div>
        )} */}
      </div>
    </>
  );
}