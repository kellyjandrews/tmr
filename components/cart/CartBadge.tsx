'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { getCart } from '@/actions/cart';

export default function CartBadge() {
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCartCount = async () => {
      try {
        setLoading(true);
        const result = await getCart();
        
        if (result.success && result.data) {
          setItemCount(result.data.itemCount);
        }
      } catch (error) {
        console.error('Error fetching cart count:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartCount();
    
    // Set up interval to refresh cart count
    const interval = setInterval(fetchCartCount, 30000); // every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Link 
      href="/cart" 
      className="relative inline-flex items-center p-1 text-sm text-gray-700 rounded-full hover:bg-gray-100"
    >
      <ShoppingCart size={20} />
      
      {!loading && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </Link>
  );
}