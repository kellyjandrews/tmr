'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createListing } from '@/actions/listings-manage';
import ListingForm from '@/components/listings/ListingForm';
import type { ListingFormData } from '@/actions/listings-manage';
import type { Category } from '@/actions/categories';

type CreateListingFormProps = {
  storeId: string;
  storeName: string;
  categories: Category[];
};

export default function CreateListingForm({
  storeId,
  storeName,
  categories
}: CreateListingFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: ListingFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Add the store ID to the form data
      const dataWithStore = {
        ...formData,
        store_id: storeId
      };

      const result = await createListing(dataWithStore);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create listing');
      }

      // Navigate to the listing detail page or back to the dashboard
      if (formData.status === 'active') {
        router.push(`/listing/${result.data.id}`);
      } else {
        router.push('/dashboard/sell');
      }
      router.refresh();
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Create New Listing</h1>
        <p className="text-gray-600">Add a new magical item to your store: {storeName}</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      )}

      <ListingForm
        categories={categories}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
    </div>
  );
}