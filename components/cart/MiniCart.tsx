'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ShoppingCart, X } from 'lucide-react';
import { getCart } from '@/actions/cart';
import { useRouter } from 'next/navigation';
import { supabaseLoader } from '@/lib/supabase/clientSide';
import type { CartSummary } from '@/types/cart';

export default function MiniCart() {
  const [isOpen, setIsOpen] = useState(false);
  const [cartData, setCartData] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch cart on mount and when opening
  useEffect(() => {
    const fetchCart = async () => {
        try {
          setLoading(true);
          const result = await getCart();
          
          if (result.success && result.data) {
            setCartData(result.data);
          }
        } catch (error) {
          console.error('Error fetching cart:', error);
        } finally {
          setLoading(false);
        }
      };

    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format currency
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  // Handle navigation to cart
  const handleViewCart = () => {
    setIsOpen(false);
    router.push('/cart');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Button */}
      <button
        type="button"
        className="inline-flex items-center p-2 text-sm text-gray-500 rounded-full relative"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <ShoppingCart size={20} className="text-gray-600" />
        
        {/* Cart Item Count Badge */}
        {cartData && cartData.itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {cartData.itemCount > 9 ? '9+' : cartData.itemCount}
          </span>
        )}
      </button>
      
      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg z-10 w-72 origin-top-right ring-1 ring-black ring-opacity-5">
          <div className="py-2 px-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">Your Cart</h3>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="py-2 px-4 max-h-64 overflow-y-auto">
            {loading ? (
              <div className="py-4 text-center">
                <div className="w-8 h-8 border-t-2 border-b-2 border-purple-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-500 mt-2">Loading cart...</p>
              </div>
            ) : !cartData || cartData.items.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-sm text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cartData.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center py-2">
                      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        {item.listing.image_url ? (
                          <Image
                            loader={supabaseLoader}
                            src={item.listing.image_url}
                            alt={item.listing.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover object-center"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-purple-100">
                            <span className="text-lg">✨</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {item.listing.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.quantity} × ${Number(item.listing.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {cartData.items.length > 3 && (
                    <div className="text-xs text-center text-purple-700">
                      +{cartData.items.length - 3} more items
                    </div>
                  )}
                </div>
                
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(cartData.subtotal)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-100">
            <button
              type="button"
              onClick={handleViewCart}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-sm"
              disabled={loading || !cartData || cartData.items.length === 0}
            >
              View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
}