// app/page.tsx
import Link from 'next/link';
import ListingList from '@/components/ListingList';
import { getFeaturedListings } from '@/actions/listings';

export default async function HomePage() {
  // Fetch featured listings directly in the server component
  const featuredListingsResult = await getFeaturedListings(4);
  const featuredListings = featuredListingsResult.success ? featuredListingsResult.data : [];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-purple-900 py-16 px-4 sm:px-6 lg:px-8 text-white">
        <div className="w-full text-center">
          <h2 className="text-4xl font-extrabold sm:text-5xl">
            The Magical Marketplace
          </h2>
          <p className="mt-4 text-xl text-purple-200 max-w-2xl mx-auto">
            Discover, buy, and sell enchanting items in our peer-to-peer marketplace for magical enthusiasts.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/register"
              className="px-8 py-3 text-base font-medium text-purple-900 bg-yellow-500 rounded-md hover:bg-yellow-400"
            >
              Start Trading
            </Link>
            <Link
              href="/marketplace"
              className="px-8 py-3 text-base font-medium text-white bg-purple-700 rounded-md border border-purple-600 hover:bg-purple-600"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section - Using our new component */}
      <ListingList 
        title="Featured Listings" 
        initialListings={featuredListings} 
        showViewAll={true}
        viewAllLink="/marketplace"
      />

      {/* Categories Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-purple-50">
        <div className="w-full">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">Explore Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['Wands', 'Potions', 'Spellbooks', 'Crystals', 'Artifacts', 'Ingredients'].map((category) => (
              <Link 
                key={category}
                href={`/category/${category.toLowerCase()}`}
                className="bg-white p-4 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <h3 className="font-medium text-purple-800">{category}</h3>
                <p className="text-xs text-gray-500 mt-1">Browse Collection</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 text-center">How The Magic Resource Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-purple-900 font-bold mb-4">1</div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Create Your Shop</h3>
              <p className="text-gray-600">Register and set up your magical storefront in minutes. Customize your profile and start listing your items.</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-purple-900 font-bold mb-4">2</div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Buy & Sell Items</h3>
              <p className="text-gray-600">List your magical items for sale or browse our marketplace to find the perfect additions to your collection.</p>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-purple-900 font-bold mb-4">3</div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Secure Transactions</h3>
              <p className="text-gray-600">Our secure platform ensures safe transactions between buyers and sellers in the magical community.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}