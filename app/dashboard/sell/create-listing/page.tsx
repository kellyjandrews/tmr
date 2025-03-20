// app/dashboard/sell/create-listing/page.tsx
import { redirect } from 'next/navigation';
import { createSession } from '@/utils/supabase/serverSide';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import CreateListingForm from '@/components/listings/CreateListingForm';
import { getMainCategories } from '@/actions/categories';
import type { Category } from '@/types/category';

export const metadata = {
  title: 'Create Listing | Dashboard',
  description: 'Create a new magical listing',
};

export default async function CreateListingPage() {
  // Get the session server-side
  const supabase = await createSession();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }


  // Check if the user has a store
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

  return (
    <DashboardPageWrapper pageName="Create New Listing">
      <CreateListingForm 
        storeId={store.id}
        storeName={store.name}
        categories={categories}
      />
    </DashboardPageWrapper>
  );
}