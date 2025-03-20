// app/dashboard/sell/edit-listing/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { createSession } from '@/utils/supabase/serverSide';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import EditListingForm from '@/components/listings/EditListingForm';
import { getListingForEdit } from '@/actions/listings-manage';
import { getMainCategories } from '@/actions/categories';
import type { ListingFormData } from '@/types/listing';
import type { Category } from '@/types/category';

export const metadata = {
  title: 'Edit Listing | Dashboard',
  description: 'Edit your magical listing',
};

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  // Check if the user is authenticated
  const supabase = await createSession();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Get the listing to edit
  const { id } = await params;
  const listingResult = await getListingForEdit(id);

  if (!listingResult.success || !listingResult.data) {
    if (listingResult.error?.includes('permission')) {
      // This is a permission error, let's show a better error page
      return (
        <DashboardPageWrapper pageName="Permission Denied">
          <div className="bg-red-50 p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Permission Denied</h2>
            <p className="text-red-700">
              You do not have permission to edit this listing. This may be because:
            </p>
            <ul className="list-disc ml-6 mt-2 text-red-700">
              <li>The listing belongs to another user&apos;s store</li>
              <li>The listing no longer exists</li>
            </ul>
            <div className="mt-4">
              <a 
                href="/dashboard/sell" 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md inline-block"
              >
                Return to Your Listings
              </a>
            </div>
          </div>
        </DashboardPageWrapper>
      );
    }
    
    // For other errors, use the standard not found page
    notFound();
  }

  // Check if the user's store exists
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('id, name')
    .eq('user_id', user.id)
    .single();

  if (storeError || !store) {
    // If user doesn't have a store, redirect to create store page
    redirect('/dashboard/create-store');
  }

  // Get all categories for the form
  const categoriesResult = await getMainCategories();
  const categories = categoriesResult.success ? (categoriesResult.data as Category[]) : [];

   // Ensure listingResult.data is correctly typed as ListingFormData
   const listingData = listingResult.data as ListingFormData;

  return (
    <DashboardPageWrapper pageName="Edit Listing">
      <EditListingForm 
        listing={listingData}
        storeId={store.id}
        storeName={store.name}
        categories={categories}
      />
    </DashboardPageWrapper>
  );
}