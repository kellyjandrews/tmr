// app/dashboard/sell/edit-listing/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { createSession } from '@/lib/supabase/serverSide';
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

export default async function EditListingPage({ params }:{ params: Promise<{ id: string }> }) {
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