// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-purple-800 text-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full">
        <div className="md:flex md:justify-between">
          <div className="mb-8 md:mb-0">
            <h3 className="text-xl font-bold flex items-center space-x-2">
              <span className="text-yellow-300">✨</span>
              <span>The Magic Resource</span>
            </h3>
            <p className="mt-2 text-purple-200 text-sm">
              Your gateway to magical tools and resources.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-wider">Resources</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/help" className="text-purple-200 hover:text-yellow-300">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className="text-purple-200 hover:text-yellow-300">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-wider">Legal</h4>
              <ul className="mt-4 space-y-2">
                <li>
                  <Link href="/privacy" className="text-purple-200 hover:text-yellow-300">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-purple-200 hover:text-yellow-300">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-purple-700 pt-8 md:flex md:items-center md:justify-between">
          <p className="text-purple-200 text-sm">
            &copy; {new Date().getFullYear()} The Magic Resource. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}