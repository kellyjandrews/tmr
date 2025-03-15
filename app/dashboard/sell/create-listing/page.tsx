// app/dashboard/sell/create-listing/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import CreateListingForm from '@/components/listings/CreateListingForm';
import { getMainCategories } from '@/actions/categories';

export const metadata = {
  title: 'Create Listing | Dashboard',
  description: 'Create a new magical listing',
};

export default async function CreateListingPage() {
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
  const categories = categoriesResult.success ? categoriesResult.data : [];

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