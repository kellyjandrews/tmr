'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { supabaseLoader } from '@/utils/supabase/clientSide';
import { addToCart } from '@/actions/cart';
import type { Listing } from '@/types/listing';

type ListingCardProps = {
  listing: Listing;
  className?: string;
};

export default function ListingCard({ listing, className = '' }: ListingCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent navigating to listing details
    e.stopPropagation(); // Stop event propagation
    
    try {
      setIsAddingToCart(true);
      const result = await addToCart(listing.id, 1);
      
      if (result.success) {
        setAddSuccess(true);
        
        // Reset success state after a delay
        setTimeout(() => {
          setAddSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <Link 
      href={`/listing/${listing.slug}`}
      className={`block border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
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
        
        {/* Quick add to cart button */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAddingToCart || addSuccess}
          className={`absolute bottom-2 right-2 p-2 rounded-full transition-colors ${
            addSuccess 
              ? 'bg-green-500 text-white' 
              : 'bg-white text-purple-700 hover:bg-purple-100'
          }`}
          aria-label="Add to cart"
        >
          <ShoppingCart size={18} />
        </button>
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-purple-800 truncate">{listing.name}</h3>
        {listing.stores && (
          <p className="text-sm text-gray-600 mt-1 truncate">
            Sold by{' '}
            <span className="hover:text-purple-700">
              {listing.stores.name}
            </span>
          </p>
        )}
        <div className="mt-2 flex justify-between items-center">
          <span className="font-bold text-purple-900">${Number(listing.price).toFixed(2)}</span>
        </div>
      </div>
    </Link>
  );
}