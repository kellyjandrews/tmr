'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateListing } from '@/actions/listings-manage';
import ListingForm from '@/components/listings/ListingForm';
import type { ListingFormData } from '@/types/listing';
import type { Category } from '@/types/category';

type EditListingFormProps = {
  listing: ListingFormData;
  storeId: string;
  storeName: string;
  categories: Category[];
};

export default function EditListingForm({
  listing,
  storeId,
  storeName,
  categories
}: EditListingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: ListingFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Make sure the ID is included
      const dataWithIds = {
        ...formData,
        id: listing.id,
        store_id: storeId
      };

      const result = await updateListing(dataWithIds);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update listing');
      }

      // Navigate to the listing detail page or back to the dashboard
      if (formData.status === 'active') {
        router.push(`/listing/${listing.id}`);
      } else {
        router.push('/dashboard/sell');
      }
      router.refresh();
    } catch (err) {
      console.error('Error updating listing:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Edit Listing</h1>
        <p className="text-gray-600">Update your magical item in: {storeName}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      <ListingForm
        initialData={listing}
        categories={categories}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}