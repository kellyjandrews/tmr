'use client';

import { useRouter } from 'next/navigation';
import type { CartSummary as CartSummaryType } from '@/types/cart';

type CartSummaryProps = {
  cartData: CartSummaryType;
  className?: string;
};

export default function CartSummary({ cartData, className = '' }: CartSummaryProps) {
  const router = useRouter();
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return `${value.toFixed(2)}`;
  };

  // Calculate values
  const { subtotal, shipping, tax, total } = cartData;

  const handleCheckout = () => {
    // For now, just redirect to a placeholder checkout page
    // In future, this will initiate the checkout process
    router.push('/checkout');
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <p className="text-gray-600">Subtotal</p>
          <p className="text-gray-900 font-medium">{formatCurrency(subtotal)}</p>
        </div>
        
        <div className="flex justify-between">
          <p className="text-gray-600">Shipping</p>
          <p className="text-gray-900 font-medium">
            {shipping === 0 ? 'Free' : formatCurrency(shipping)}
          </p>
        </div>
        
        <div className="flex justify-between">
          <p className="text-gray-600">Tax (estimated)</p>
          <p className="text-gray-900 font-medium">{formatCurrency(tax)}</p>
        </div>
        
        <div className="border-t border-gray-200 pt-3 mt-3">
          <div className="flex justify-between">
            <p className="text-gray-900 font-semibold">Total</p>
            <p className="text-purple-700 font-semibold">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>
      
      <button
        type="button"
        onClick={handleCheckout}
        className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md"
      >
        Proceed to Checkout
      </button>
      
      <div className="mt-4 text-center text-xs text-gray-500">
        <p>Taxes and shipping calculated at checkout</p>
      </div>
    </div>
  );
}