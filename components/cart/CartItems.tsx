'use client';

import { useState} from 'react';
import { getCart } from '@/actions/cart';
import CartItem from '@/components/cart/CartItem';
import type { CartItemWithListing } from '@/types/cart';

type CartItemsProps = {
  initialItems: CartItemWithListing[];
};

export default function CartItems({ initialItems }: CartItemsProps) {
  const [items, setItems] = useState<CartItemWithListing[]>(initialItems);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to refresh cart data
  const refreshCart = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      const result = await getCart();
      
      if (result.success && result.data) {
        setItems(result.data.items);
      }
    } catch (error) {
      console.error('Error refreshing cart:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-gray-500">No items in your cart</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {items.map((item) => (
        <CartItem 
          key={item.id} 
          item={item} 
          onUpdate={refreshCart}
        />
      ))}
    </div>
  );
}