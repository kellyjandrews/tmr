'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/clientSide';
import type { Listing } from '@/types/listing';
import ListingCard from '@/components/listings/ListingCard';

type ListingListProps = {
  title?: string;
  storeId?: string;
  categoryId?: string;
  limit?: number;
  showViewAll?: boolean;
  viewAllLink?: string;
  emptyMessage?: string;
  initialListings?: Listing[];
};

export default function ListingList({
  title = 'Featured Listings',
  storeId,
  categoryId,
  limit = 4,
  showViewAll = true,
  viewAllLink = '/marketplace',
  emptyMessage = 'No listings available.',
  initialListings,
}: ListingListProps) {
  const [listings, setListings] = useState<Listing[]>(initialListings || []);
  const [loading, setLoading] = useState(!initialListings);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // If we have initialListings, don't fetch more
    if (initialListings) {
      return;
    }

    const fetchListings = async () => {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('listings')
          .select('*, stores(id, name, slug)')
          .eq('status', 'active') // Only get active listings
          .order('created_at', { ascending: false })
          .limit(limit);

        // Add filters if provided
        if (storeId) {
          query = query.eq('store_id', storeId);
        }

        if (categoryId) {
          // For category filtering, we need to use a more complex approach with the junction table
          const { data: listingIds } = await supabase
            .from('listing_categories')
            .select('listing_id')
            .eq('category_id', categoryId);
          
          if (listingIds && listingIds.length > 0) {
            const ids = listingIds.map(item => item.listing_id);
            query = query.in('id', ids);
          } else {
            // No listings in this category
            setListings([]);
            setLoading(false);
            return;
          }
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw new Error(queryError.message);
        }

        setListings(data || []);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [supabase, storeId, categoryId, limit, initialListings]);

  if (loading) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">{title}</h2>
          <div className="flex justify-center items-center h-48">
            <div className="animate-pulse text-purple-500">Loading listings...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">{title}</h2>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="w-full">
        <h2 className="text-2xl font-bold text-purple-900 mb-6">{title}</h2>
        
        {listings.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{emptyMessage}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        {showViewAll && listings.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href={viewAllLink}
              className="inline-block px-6 py-2 text-purple-800 border border-purple-800 rounded-md hover:bg-purple-50"
            >
              View All Listings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}