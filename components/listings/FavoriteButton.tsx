// components/listings/FavoriteButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { addToWishlist, removeFromWishlist, isInWishlist } from '@/actions/favorites';

type FavoriteButtonProps = {
  listingId: string;
  className?: string;
  iconOnly?: boolean;
  onStatusChange?: (isFavorited: boolean) => void;
};

export default function FavoriteButton({
  listingId,
  className = '',
  iconOnly = false,
  onStatusChange
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the listing is already in the wishlist
  useEffect(() => {
    const checkWishlistStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await isInWishlist(listingId);
        
        if (result.success && result.data !== undefined) {
          setIsFavorited(result.data);
          if (onStatusChange) {
            onStatusChange(result.data);
          }
        } else {
          setError(result.error || 'Failed to check favorite status');
        }
      } catch (err) {
        console.error('Error checking wishlist status:', err);
        setError('Failed to check if item is in wishlist');
      } finally {
        setIsLoading(false);
      }
    };

    checkWishlistStatus();
  }, [listingId, onStatusChange]);

  // Toggle the favorite status
  const toggleFavorite = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = isFavorited
        ? await removeFromWishlist(listingId)
        : await addToWishlist(listingId);

      if (result.success) {
        const newStatus = !isFavorited;
        setIsFavorited(newStatus);
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      } else {
        setError(result.error || 'Failed to update favorite status');
      }
    } catch (err) {
      console.error('Error toggling favorite status:', err);
      setError('Failed to update favorite status');
    } finally {
      setIsLoading(false);
    }
  };

  // Base button styles
  const baseButtonClass = 'flex items-center justify-center transition-colors focus:outline-none';
  
  // Calculate button class based on props and state
  const buttonClass = `${baseButtonClass} ${
    isFavorited
      ? 'text-red-600 hover:text-red-700'
      : 'text-gray-400 hover:text-red-600'
  } ${className}`;

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={isLoading}
      className={buttonClass}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={20}
        className={isFavorited ? 'fill-current' : ''}
      />
      
      {!iconOnly && (
        <span className="ml-2">
          {isFavorited ? 'Favorited' : 'Add to Favorites'}
        </span>
      )}
      
      {error && (
        <span className="sr-only" role="alert">
          Error: {error}
        </span>
      )}
    </button>
  );
}