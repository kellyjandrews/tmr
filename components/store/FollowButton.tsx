// components/store/FollowButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { followStore, unfollowStore, isFollowingStore } from '@/actions/favorites';

type FollowButtonProps = {
  storeId: string;
  className?: string;
  iconOnly?: boolean;
  variant?: 'primary' | 'secondary';
  onStatusChange?: (isFollowing: boolean) => void;
};

export default function FollowButton({
  storeId,
  className = '',
  iconOnly = false,
  variant = 'primary',
  onStatusChange
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if already following the store
  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await isFollowingStore(storeId);
        
        if (result.success && result.data !== undefined) {
          setIsFollowing(result.data);
          if (onStatusChange) {
            onStatusChange(result.data);
          }
        } else {
          setError(result.error || 'Failed to check follow status');
        }
      } catch (err) {
        console.error('Error checking follow status:', err);
        setError('Failed to check if following store');
      } finally {
        setIsLoading(false);
      }
    };

    checkFollowStatus();
  }, [storeId, onStatusChange]);

  // Toggle follow status
  const toggleFollow = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = isFollowing
        ? await unfollowStore(storeId)
        : await followStore(storeId);

      if (result.success) {
        const newStatus = !isFollowing;
        setIsFollowing(newStatus);
        if (onStatusChange) {
          onStatusChange(newStatus);
        }
      } else {
        setError(result.error || 'Failed to update follow status');
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
      setError('Failed to update follow status');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine button styles based on variant and state
  let buttonClass = '';
  
  if (variant === 'primary') {
    buttonClass = isFollowing
      ? 'bg-yellow-500 hover:bg-yellow-600 text-purple-900 font-medium'
      : 'bg-purple-600 hover:bg-purple-700 text-white font-medium';
  } else {
    buttonClass = isFollowing
      ? 'border border-yellow-500 text-yellow-600 hover:bg-yellow-50 font-medium'
      : 'border border-purple-600 text-purple-700 hover:bg-purple-50 font-medium';
  }

  // Add shared button styles
  buttonClass = `${buttonClass} rounded-md px-4 py-2 transition-colors focus:outline-none ${className}`;

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={isLoading}
      className={buttonClass}
      title={isFollowing ? 'Unfollow Store' : 'Follow Store'}
    >
      <div className="flex items-center justify-center">
        <Star
          size={18}
          className={isFollowing ? 'fill-current' : ''}
        />
        
        {!iconOnly && (
          <span className="ml-2">
            {isFollowing ? 'Following' : 'Follow Store'}
          </span>
        )}
      </div>
      
      {error && (
        <span className="sr-only" role="alert">
          Error: {error}
        </span>
      )}
    </button>
  );
}