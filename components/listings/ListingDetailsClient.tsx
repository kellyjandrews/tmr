'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabaseLoader } from '@/utils/supabase/clientSide';
import ContactSeller from '@/components/messages/ContactSeller';
import type { Listing } from '@/types/listing';

type ListingDetailsClientProps = {
  listing: Listing;
};

export default function ListingDetailsClient({ listing }: ListingDetailsClientProps) {
  // Keep track of the currently selected image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Prepare images array - use listing images if available, otherwise use the main image
  const images = listing.images && listing.images.length > 0 
    ? listing.images 
    : (listing.image_url ? [listing.image_url] : []);
  
  // Get the shipping cost from the shipping object if available
  const shippingCost = listing.shipping?.flat_rate ?? 0;
  
  // Extract categories if they exist
  const categories = listing.categories || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href="/marketplace" className="text-purple-700 hover:text-purple-900">
          ← Back to Marketplace
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="aspect-square bg-purple-100 rounded-lg overflow-hidden relative">
              {images.length > 0 ? (
                <Image 
                  loader={supabaseLoader}
                  src={`${images[selectedImageIndex]}`} 
                  alt={listing.name} 
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-6xl">✨</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail images - only show if we have more than one image */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((imageUrl, index) => (
                  <button
                    key={`${imageUrl}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 flex-shrink-0 rounded-md overflow-hidden relative ${
                      selectedImageIndex === index ? 'ring-2 ring-purple-500' : 'ring-1 ring-gray-200'
                    }`}
                  >
                    <Image 
                      loader={supabaseLoader}
                      src={`${imageUrl}`} 
                      alt={`${listing.name} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Listing Details */}
          <div>
            <h1 className="text-3xl font-bold text-purple-900">{listing.name}</h1>
            
            {listing.stores && (
              <p className="text-gray-600 mt-2">
                Sold by{' '}
                <Link href={`/store/${listing.stores.slug}`} className="text-purple-700 hover:text-purple-900">
                  {listing.stores.name}
                </Link>
              </p>
            )}
            
            <div className="mt-4 text-2xl font-bold text-purple-900">
              ${typeof listing.price === 'number' ? listing.price.toFixed(2) : Number(listing.price).toFixed(2)}
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              {shippingCost > 0 
                ? `+ $${shippingCost.toFixed(2)} shipping` 
                : 'Free shipping'}
            </p>
            
            {/* Categories */}
            {categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((category) => (
                    <Link 
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    >
                    {category.name}
                    </Link>
                ))}
              </div>
            )}
            
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-purple-900">Description</h2>
              <div className="mt-2 text-gray-700 prose">
                {listing.description ? (
                  <p>{listing.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description provided.</p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center mb-2">
                <div className="h-4 w-4 rounded-full bg-green-500 mr-2" />
                <p className="text-sm text-gray-800">
                  {listing.quantity > 0 
                    ? `In stock: ${listing.quantity} available` 
                    : 'Out of stock'}
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <ContactSeller 
                listingId={listing.id}
                listingName={listing.name}
                buttonFullWidth={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}