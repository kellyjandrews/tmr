'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { getItemInterest } from '@/actions/cart';

type ItemInterestProps = {
  listingId: string;
  className?: string;
};

export default function ItemInterest({ listingId, className = '' }: ItemInterestProps) {
  const [interestCount, setInterestCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInterest = async () => {
      try {
        setIsLoading(true);
        const result = await getItemInterest(listingId);
        
        if (result.success && typeof result.data === 'number') {
          setInterestCount(result.data);
        }
      } catch (error) {
        console.error('Error fetching item interest:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInterest();
  }, [listingId]);

  // Don't show anything if there's no interest or still loading
  if (isLoading || !interestCount || interestCount === 0) {
    return null;
  }

  return (
    <div className={`flex items-center text-sm text-amber-600 ${className}`}>
      <Users size={16} className="mr-1" />
      <span>
        {interestCount} {interestCount === 1 ? 'person' : 'people'} have this in their cart
      </span>
    </div>
  );
}