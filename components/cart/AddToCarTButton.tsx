'use client';

import { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { addToCart } from '@/actions/cart';

type AddToCartButtonProps = {
  listingId: string;
  quantity?: number;
  className?: string;
  fullWidth?: boolean;
  redirectToCart?: boolean;
  onSuccess?: () => void;
};

export default function AddToCartButton({
  listingId,
  quantity = 1,
  className = '',
  fullWidth = false,
  redirectToCart = false,
  onSuccess
}: AddToCartButtonProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      setError(null);
      setIsSuccess(false);
      
      const result = await addToCart(listingId, quantity);
      
      if (result.success) {
        setIsSuccess(true);
        
        // Call the onSuccess callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        // Redirect to cart if requested
        if (redirectToCart) {
          router.push('/cart');
          return;
        }
        
        // Reset success state after a delay
        setTimeout(() => {
          setIsSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsAdding(false);
    }
  };

  // Default button styling
  const defaultClass = `inline-flex items-center justify-center rounded-md transition-colors 
    ${isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'} 
    text-white font-bold py-2 px-4`;

  // Combine with custom class and fullWidth prop
  const buttonClass = `${defaultClass} ${className} ${fullWidth ? 'w-full' : ''}`;

  return (
    <div>
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={isAdding || isSuccess}
        className={buttonClass}
        aria-label="Add to cart"
      >
        {isAdding ? (
          <Loader2 size={18} className="mr-2 animate-spin" />
        ) : isSuccess ? (
          <Check size={18} className="mr-2" />
        ) : (
          <ShoppingCart size={18} className="mr-2" />
        )}
        
        <span>
          {isAdding ? 'Adding...' : isSuccess ? 'Added to Cart' : 'Add to Cart'}
        </span>
      </button>
      
      {error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}