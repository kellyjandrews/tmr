// app/store/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getStoreBySlug } from '@/actions/store';
import { getStoreListings } from '@/actions/listing';

export const dynamic = 'force-dynamic';


export type Listing = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
  updated_at: string;
};

export type Store = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};


export default async function StorePage({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  
  // Get the store data
  const storeResult = await getStoreBySlug(slug);

  if (!storeResult.success || !storeResult.data) {
    notFound();
  }
  
  const store = storeResult.data as Store;

  // Get the store's listings
  const listingsResult = await getStoreListings(store.id);
  const listings = listingsResult.success ? listingsResult.data as Listing[] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{store.name}</h1>
        <p className="text-gray-500 mt-2">@{store.slug}</p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Products</h2>
        
        {listings.length === 0 ? (
          <p className="text-gray-500">No products available.</p>
        ) : (
          <ul className="space-y-2 divide-y divide-gray-200">
            {listings.map((listing) => (
              <li key={listing.id} className="py-3">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{listing.name}</h3>
                    {listing.description && (
                      <p className="text-gray-600 text-sm mt-1">{listing.description}</p>
                    )}
                  </div>
                  <div className="text-lg font-semibold">
                    ${listing.price.toFixed(2)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}