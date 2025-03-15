// app/dashboard/sell/edit-listing/[id]/page.tsx
import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import EditListingForm from '@/components/listings/EditListingForm';
import { getListingForEdit } from '@/actions/listings-manage';
import { getMainCategories } from '@/actions/categories';

export const metadata = {
  title: 'Edit Listing | Dashboard',
  description: 'Edit your magical listing',
};

export default async function EditListingPage({ params }: { params: { id: string } }) {
  // Check if the user is authenticated
  const cookieStore = await cookies();
  const token = cookieStore.get('sb-auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  const { data: { user } } = await supabase.auth.getUser(token);
  
  if (!user) {
    redirect('/login');
  }

  // Get the listing to edit
  const { id } = params;
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
  const categories = categoriesResult.success ? categoriesResult.data : [];

  return (
    <DashboardPageWrapper pageName="Edit Listing">
      <EditListingForm 
        listing={listingResult.data}
        storeId={store.id}
        storeName={store.name}
        categories={categories}
      />
    </DashboardPageWrapper>
  );
}