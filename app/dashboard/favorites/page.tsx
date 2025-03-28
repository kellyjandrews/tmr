// app/dashboard/favorites/page.tsx
import { redirect } from 'next/navigation';
import { createSession } from '@/utils/supabase/serverSide';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import FavoritesClient from '@/components/favorites/FavoritesClient';
import { getWishlist, getFollowedStores } from '@/actions/favorites';
import type { WishlistWithListing, FollowWithStore } from '@/types/favorites';

export const metadata = {
  title: 'Favorites | Dashboard',
  description: 'View your favorited items and followed stores',
};

export default async function FavoritesPage() {
  // Get the user session
  const supabase = await createSession();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect('/login');
  }

  // Fetch the user's wishlist and followed stores
  const wishlistResult = await getWishlist();
  const followedStoresResult = await getFollowedStores();

  const wishlistItems: WishlistWithListing[] = wishlistResult.success ? wishlistResult.data || [] : [];
  const followedStores: FollowWithStore[] = followedStoresResult.success ? followedStoresResult.data || [] : [];

  return (
    <DashboardPageWrapper pageName="My Favorites">
      <FavoritesClient 
        wishlistItems={wishlistItems}
        followedStores={followedStores}
      />
    </DashboardPageWrapper>
  );
}