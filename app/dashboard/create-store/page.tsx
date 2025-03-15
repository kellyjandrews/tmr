// app/dashboard/create-store/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import StoreForm from '@/components/store/StoreForm';

export const metadata = {
  title: 'Create Store | Dashboard',
  description: 'Create your magical store',
};

export default async function CreateStorePage() {
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

  // Check if the user already has a store
  const { data: existingStore } = await supabase
    .from('stores')
    .select('id, slug')
    .eq('user_id', user.id)
    .single();

  // If the user already has a store, redirect to the shop admin page
  if (existingStore) {
    redirect('/dashboard/shop-admin');
  }

  return (
    <DashboardPageWrapper pageName="Create Your Magical Shop">
      <div className="max-w-4xl mx-auto">
        <StoreForm />
        
        <div className="bg-purple-50 p-4 rounded-lg mt-6">
          <h3 className="font-medium text-purple-900 mb-2">What happens next?</h3>
          <p className="text-gray-700 text-sm">
            After creating your shop, you can start adding magical items for sale, customize your shop policies, 
            and share your shop URL with potential customers. You&apos;ll have access to analytics and order management tools.
          </p>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}