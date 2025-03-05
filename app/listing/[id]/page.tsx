// app/listing/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getListingById, getRelatedListings } from '@/actions/listings';
import ListingList from '@/components/ListingList';
import  Image  from 'next/image';
export const dynamic = 'force-dynamic';

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingResult = await getListingById(id);
  
  if (!listingResult.success || !listingResult.data) {
    return {
      title: 'Listing Not Found',
      description: 'The requested magical item could not be found',
    };
  }

  const listing = listingResult.data;
  
  return {
    title: listing.name,
    description: listing.description || `Details for ${listing.name}`,
  };
}


export default async function ListingPage({ params }: {params: Promise<{id: string }>}) {
  const { id } = await params;
  
  // Fetch the listing data
  const listingResult = await getListingById(id);

  if (!listingResult.success || !listingResult.data) {
    notFound();
  }
  
  const listing = listingResult.data;

  // Fetch related listings (same category or from same store)
  const relatedListingsResult = await getRelatedListings(id);
  const relatedListings = relatedListingsResult.success ? relatedListingsResult.data : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-4">
        <Link href="/marketplace" className="text-purple-700 hover:text-purple-900">
          ← Back to Marketplace
        </Link>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Listing Image */}
          <div className="bg-purple-100 aspect-square rounded-lg flex items-center justify-center">
            {listing.image_url ? (
              <Image 
                src={listing.image_url} 
                alt={listing.name} 
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-6xl">✨</span>
            )}
          </div>
          
          {/* Listing Details */}
          <div>
            <h1 className="text-3xl font-bold text-purple-900">{listing.name}</h1>
            
            {listing.stores && (
              <p className="text-gray-600 mt-2">
                Sold by{' '}
                <Link href={`/store/${listing.stores.slug}`} className="text-purple-700 hover:text-purple-900">
                  {listing.stores.name}
                </Link>
              </p>
            )}
            
            <div className="mt-4 text-2xl font-bold text-purple-900">
              ${Number.parseFloat(listing.price.toString()).toFixed(2)}
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-purple-900">Description</h2>
              <p className="mt-2 text-gray-700">
                {listing.description || 'No description provided.'}
              </p>
            </div>
            
            <div className="mt-8">
              <button type="button" className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-4 rounded">
                Contact Seller
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Listings */}
      {relatedListings ? relatedListings.length > 0 && (
        <div className="mt-12">
          <ListingList
            title="You May Also Like"
            initialListings={relatedListings}
            showViewAll={false}
          />
        </div>
      ):null}
    </div>
  );
}