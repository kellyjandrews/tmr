// app/category/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCategoryById } from '@/actions/categories';
import { getListingsByCategory } from '@/actions/listings';
import ListingList from '@/components/ListingList';

export const dynamic = 'force-dynamic';

// Generate metadata for the page
export async function generateMetadata({ params }: { params: { id: string } }) {
  const categoryResult = await getCategoryById(params.id);
  
  if (!categoryResult.success || !categoryResult.data) {
    return {
      title: 'Category Not Found',
      description: 'The requested category could not be found',
    };
  }

  const category = categoryResult.data;
  
  return {
    title: `${category.name} | The Magic Resource`,
    description: category.description || `Browse ${category.name} in our magical marketplace`,
  };
}

export default async function CategoryPage({ params }: { params: { id: string } }) {
  // Fetch the category data
  const categoryResult = await getCategoryById(params.id);

  if (!categoryResult.success || !categoryResult.data) {
    notFound();
  }
  
  const category = categoryResult.data;

  // Fetch listings for this category
  const listingsResult = await getListingsByCategory(category.id, 12);
  const listings = listingsResult.success ? listingsResult.data : [];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Category Header */}
      <div className="bg-purple-800 py-8 px-4 sm:px-6 lg:px-8 text-white">
        <div className="max-w-7xl mx-auto">
          <Link href="/marketplace" className="text-purple-200 hover:text-white mb-2 inline-block">
            ← Back to Marketplace
          </Link>
          <h1 className="text-3xl font-bold mt-2">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-purple-200">{category.description}</p>
          )}
        </div>
      </div>
      
      {/* Category Listings */}
      <ListingList
        title={`${category.name} Collection`}
        initialListings={listings}
        showViewAll={false}
        emptyMessage={`No ${category.name.toLowerCase()} are currently available.`}
      />
    </div>
  );
}