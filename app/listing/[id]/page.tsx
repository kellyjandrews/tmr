// app/listing/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getListingById, getRelatedListings } from '@/actions/listings';
import ListingList from '@/components/ListingList';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

interface Category {
  id: number;
  name: string;
}
 
// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ id: string } >}) {
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

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch the listing data
  const listingResult = await getListingById(id);

  if (!listingResult.success || !listingResult.data) {
    notFound();
  }
  
  const listing = listingResult.data;

  // Only show active listings to the public
  if (listing.status !== 'active') {
    notFound();
  }

  // Get all images for the listing
  const { data: images } = await supabase
    .from('listing_images')
    .select('image_url, display_order')
    .eq('listing_id', id)
    .order('display_order');

  // Get shipping info
  const { data: shipping } = await supabase
    .from('listing_shipping')
    .select('flat_rate')
    .eq('listing_id', id)
    .single();

  // Get the listing's categories
  const { data: categoryData } = await supabase
    .from('listing_categories')
    .select('categories(id, name)')
    .eq('listing_id', id)

  // Format categories for easier use
  const categories: Category[] = (categoryData ? 
    categoryData.flatMap(({categories}) => 
      categories.map((category) => ({
        id: category.id,
        name: category.name
      }))
    ) : []);

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
          {/* Listing Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-purple-100 rounded-lg overflow-hidden relative">
              {(images && images.length > 0) ? (
                <Image 
                  src={images[0].image_url} 
                  alt={listing.name} 
                  fill
                  className="object-cover"
                  priority
                />
              ) : listing.image_url ? (
                <Image 
                  src={listing.image_url} 
                  alt={listing.name} 
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <span className="text-6xl">✨</span>
                </div>
              )}
            </div>
            
            {/* Thumbnail images */}
            {images && images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <div 
                    key={`${image.display_order}-${index}`}
                    className="w-20 h-20 flex-shrink-0 bg-purple-50 rounded-md overflow-hidden relative"
                  >
                    <Image 
                      src={image.image_url} 
                      alt={`${listing.name} thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
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
              ${typeof listing.price === 'number' ? listing.price.toFixed(2) : Number(listing.price).toFixed(2)}
            </div>
            
            {shipping && (
              <p className="text-sm text-gray-600 mt-1">
                {shipping.flat_rate > 0 
                  ? `+ $${shipping.flat_rate.toFixed(2)} shipping` 
                  : 'Free shipping'}
              </p>
            )}
            
            {/* Categories */}
            {categories && categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <Link 
                    key={cat.id}
                    href={`/category/${cat.id}`}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
            
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-purple-900">Description</h2>
              <div className="mt-2 text-gray-700 prose">
                {listing.description ? (
                  <p>{listing.description}</p>
                ) : (
                  <p className="text-gray-500 italic">No description provided.</p>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center mb-2">
                <div className="h-4 w-4 rounded-full bg-green-500 mr-2" />
                <p className="text-sm text-gray-800">
                  {listing.quantity > 0 
                    ? `In stock: ${listing.quantity} available` 
                    : 'Out of stock'}
                </p>
              </div>
            </div>
            
            <div className="mt-8">
              <button 
                type="button" 
                className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold py-3 px-4 rounded"
              >
                Contact Seller
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Related Listings */}
      {relatedListings && relatedListings.length > 0 && (
        <div className="mt-12">
          <ListingList
            title="You May Also Like"
            initialListings={relatedListings}
            showViewAll={false}
          />
        </div>
      )}
    </div>
  );
}