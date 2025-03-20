// app/category/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getCategoryBySlug } from '@/actions/categories';
import { getListingsByCategory } from '@/actions/listings';
import CategoryDetailsClient from '@/components/category/CategoryDetailsClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }>}): Promise<Metadata> {
  const {slug} = await params; 
  const categoryResult = await getCategoryBySlug(slug);
  
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

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }>}) {
  // Get the category data
  const {slug} = await params; 
  const categoryResult = await getCategoryBySlug(slug);

  if (!categoryResult.success || !categoryResult.data) {
    notFound();
  }
  
  const category = categoryResult.data;

  // Fetch listings for this category
  const listingsResult = await getListingsByCategory(category.id, 12);
  const listings = listingsResult.success ? listingsResult.data : [];

  // Pass both category and listings data to the client component
  return <CategoryDetailsClient category={category} listings={listings || []} />;
}