'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, Loader2 } from 'lucide-react';
import { updateCartItem, removeFromCart } from '@/actions/cart';
import { supabaseLoader } from '@/utils/supabase/clientSide';
import type { CartItemWithListing } from '@/types/cart';

type CartItemProps = {
  item: CartItemWithListing;
  onUpdate?: () => void;
};

export default function CartItem({ item, onUpdate }: CartItemProps) {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle quantity change
  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity <= 0) return;
    if (newQuantity === quantity) return;
    
    try {
      setIsUpdating(true);
      setError(null);
      
      const result = await updateCartItem({
        listing_id: item.listing_id,
        quantity: newQuantity
      });
      
      if (result.success) {
        setQuantity(newQuantity);
        if (onUpdate) onUpdate();
      } else {
        setError(result.error || 'Failed to update quantity');
        // Revert to previous quantity on error
        setQuantity(item.quantity);
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError('An unexpected error occurred');
      setQuantity(item.quantity);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle item removal
  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      setError(null);
      
      const result = await removeFromCart(item.listing_id);
      
      if (result.success) {
        if (onUpdate) onUpdate();
      } else {
        setError(result.error || 'Failed to remove item');
      }
    } catch (err) {
      console.error('Error removing item:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsRemoving(false);
    }
  };

  // Calculate item total price
  const totalPrice = Number(item.listing.price) * quantity;

  return (
    <div className="flex items-start border-b border-gray-200 py-6">
      {/* Item image */}
      <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
        {item.listing.image_url ? (
          <Image
            loader={supabaseLoader}
            src={item.listing.image_url}
            alt={item.listing.name}
            width={96}
            height={96}
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-purple-100">
            <span className="text-2xl">✨</span>
          </div>
        )}
      </div>

      <div className="ml-4 flex flex-1 flex-col">
        <div>
          <div className="flex justify-between text-base font-medium text-gray-900">
            <h3>
              <Link href={`/listing/${item.listing_id}`} className="hover:text-purple-700">
                {item.listing.name}
              </Link>
            </h3>
            <p className="ml-4">${totalPrice.toFixed(2)}</p>
          </div>
          {item.listing.stores && (
            <p className="mt-1 text-sm text-gray-500">
              Sold by{' '}
              <Link 
                href={`/store/${item.listing.stores.slug}`} 
                className="text-purple-700 hover:text-purple-900"
              >
                {item.listing.stores.name}
              </Link>
            </p>
          )}
        </div>
        
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
        
        <div className="flex flex-1 items-end justify-between text-sm">
          <div className="flex items-center border border-gray-300 rounded">
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isUpdating || quantity <= 1}
              className="px-2 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            
            <span className="px-2 py-1 min-w-8 text-center">
              {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : quantity}
            </span>
            
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isUpdating}
              className="px-2 py-1 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex">
            <button
              type="button"
              onClick={handleRemove}
              disabled={isRemoving}
              className="font-medium text-red-600 hover:text-red-500 flex items-center"
            >
              {isRemoving ? (
                <Loader2 size={16} className="animate-spin mr-1" />
              ) : (
                <Trash2 size={16} className="mr-1" />
              )}
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}