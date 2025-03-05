// app/marketplace/page.tsx
import { Suspense } from 'react';
import { fetchListings } from '@/actions/listings';
import ListingList from '@/components/ListingList';

export const metadata = {
  title: 'Marketplace',
  description: 'Browse magical items from our community of sellers',
};

// Make the page dynamic to avoid caching
export const dynamic = 'force-dynamic';

// Async component that fetches and displays listings
async function MarketplaceListings() {
  const listingsResult = await fetchListings({ limit: 12 });
  const listings = listingsResult.success ? listingsResult.data : [];

  return (
    <ListingList
      title="All Magical Items"
      initialListings={listings}
      showViewAll={false}
      emptyMessage="No listings are currently available in the marketplace."
    />
  );
}

// Loading fallback component
function MarketplaceLoading() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="w-full">
        <h2 className="text-2xl font-bold text-purple-900 mb-6">All Magical Items</h2>
        <div className="flex justify-center items-center h-48">
          <div className="animate-pulse text-purple-500">Loading marketplace listings...</div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <>
      <div className="bg-purple-800 py-8 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">Magical Marketplace</h1>
          <p className="mt-2 text-purple-200">Discover extraordinary magical items from sellers around the world</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Here we would add filtering controls in the future */}
        <Suspense fallback={<MarketplaceLoading />}>
          <MarketplaceListings />
        </Suspense>
      </div>
    </>
  );
}