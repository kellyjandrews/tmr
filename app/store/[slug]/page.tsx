// app/store/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/actions/store';
import { fetchListings } from '@/actions/listings';
import StoreDetailsClient from '@/components/store/StoreDetailsClient';
import type { Metadata } from 'next';
import type { Store } from '@/types/store';

export const dynamic = 'force-dynamic';


// refavtor here //
export async function generateMetadata({ params }: { params: Promise<{ slug: string }>}): Promise<Metadata> {
    const {slug} = await params;
    const storeResult = await getStoreBySlug(slug);
  
  if (!storeResult.success || !storeResult.data) {
    return {
      title: 'Store Not Found',
      description: 'The requested magical store could not be found',
    };
  }

  const store = storeResult.data as Store;
  
  return {
    title: `${store.name} | The Magic Resource`,
    description: store.description || `Browse magical items from ${store.name}`,
  };
}
// refavtor here //



export default async function StorePage({ params }: { params: Promise<{ slug: string }>}) {
  const {slug} = await params;
  const storeResult = await getStoreBySlug(slug);

  if (!storeResult.success || !storeResult.data) {
    notFound();
  }
  
  const store = storeResult.data as Store;

  // Get the store's listings
  const listingsResult = await fetchListings({ 
    storeId: store.id,
    limit: 12
  });
  
  const listings = listingsResult.success ? listingsResult.data : [];

  // Pass both store and listings data to the client component
  return <StoreDetailsClient store={store} listings={listings||[]} />;
}