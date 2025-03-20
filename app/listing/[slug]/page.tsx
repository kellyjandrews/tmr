// app/listing/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getListingBySlug } from '@/actions/listings';
import ListingDetailsClient from '@/components/listings/ListingDetailsClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
 
// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const {slug} = await params;
  const listingResult = await getListingBySlug(slug);

  if (!listingResult.success || !listingResult.data) {
    return {
      title: 'Listing Not Found',
      description: 'The requested magical item could not be found',
    };
  }

  const listing = listingResult.data;
  
  return {
    title: `${listing.name} | The Magic Resource`,
    description: listing.description || `Details for ${listing.name}`,
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  // Fetch the listing data
  const {slug} = await params;
  const listingResult = await getListingBySlug(slug);

  if (!listingResult.success || !listingResult.data) {
    notFound();
  }
  
  const listing = listingResult.data;

  // Only show active listings to the public
  if (listing.status !== 'active') {
    notFound();
  }

  return <ListingDetailsClient listing={listing} />;
}