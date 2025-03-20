// app/listing/[slug]/not-found.tsx
import Link from 'next/link';

export default function ListingNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Magical Item Not Found</h1>
        <p className="text-lg text-gray-600 mb-8">
          The magical item you&apos;re looking for doesn&apos;t exist or has vanished mysteriously.
        </p>
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <Link 
            href="/marketplace"
            className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-md"
          >
            Browse Marketplace
          </Link>
          <Link 
            href="/"
            className="bg-white border border-purple-700 text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-md"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}