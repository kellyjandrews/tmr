// app/dashboard/edit-store/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import StoreForm from '@/components/store/StoreForm';

export const metadata = {
  title: 'Edit Store | Dashboard',
  description: 'Edit your magical store',
};

export default async function EditStorePage() {
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

  // Get the user's store
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // If the user doesn't have a store, redirect to create store page
  if (!store || storeError) {
    redirect('/dashboard/create-store');
  }

  // Convert store data to the required format for the form
  const storeData = {
    name: store.name,
    slug: store.slug,
    description: store.description || '',
    welcome_message: store.welcome_message || '',
    shipping_policy: store.shipping_policy || '',
    return_policy: store.return_policy || '',
    tax_policy: store.tax_policy || '',
    location: store.location || '',
  };

  return (
    <DashboardPageWrapper pageName="Edit Your Magical Shop">
      <div className="max-w-4xl mx-auto">
        <StoreForm 
          initialData={storeData} 
          isEdit={true} 
          storeId={store.id} 
        />
      </div>
    </DashboardPageWrapper>
  );
}