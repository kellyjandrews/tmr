// app/store/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/actions/store';
import { fetchListings } from '@/actions/listings';
import ListingList from '@/components/ListingList';

export const dynamic = 'force-dynamic';


export type Store = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};


export async function generateMetadata({ params }: {params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const storeResult = await getStoreBySlug(slug);
  
  if (!storeResult.success || !storeResult.data) {
    return {
      title: 'Store Not Found',
      description: 'The requested magical store could not be found',
    };
  }

  const store = storeResult.data as Store;
  
  return {
    title: store.name,
    description: `Browse magical items from ${store.name}`,
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Get the store data
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Store header */}
      <div className="bg-purple-800 py-8 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">{store.name}</h1>
          <p className="mt-2 text-purple-200">@{store.slug}</p>
        </div>
      </div>
      
      {/* Store listings */}
      <div className="max-w-7xl mx-auto">
        <ListingList
          title="Products"
          initialListings={listings}
          showViewAll={false}
          emptyMessage="This store doesn't have any listings yet."
        />
      </div>
    </div>
  );
}