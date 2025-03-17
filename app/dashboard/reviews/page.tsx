// app/dashboard/reviews/page.tsx
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import { Star } from 'lucide-react';

export const metadata = {
  title: 'Reviews | Dashboard',
  description: 'View and manage your reviews',
};

export default async function ReviewsPage() {


  return (
    <DashboardPageWrapper pageName="Reviews">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-purple-900">Reviews of Your Items</h2>
          <div className="flex items-center bg-purple-50 px-4 py-2 rounded-lg">
            <span className="font-medium text-purple-900 mr-2">4.8</span>
            <div className="flex text-yellow-500">
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" />
              <Star size={16} fill="currentColor" strokeWidth={0} className="text-yellow-100 fill-current" />
            </div>
            <span className="text-sm text-gray-600 ml-2">(12 reviews)</span>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Review Item */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">Mystical Phoenix Feather Wand</h3>
                <div className="flex items-center mt-1">
                  <div className="flex text-yellow-500 mr-2">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <span className="text-sm text-gray-600">from Gandalf Greyhame</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">March 15, 2025</span>
            </div>
            <p className="mt-3 text-gray-700">
              Exceptional quality! The phoenix feather core responds beautifully to my magical style, and the craftsmanship is impeccable. Highly recommended seller.
            </p>
            <div className="mt-3 flex justify-end">
              <button type="button" className="text-sm text-purple-700 hover:text-purple-900">
                Reply to review
              </button>
            </div>
          </div>
          
          {/* Review Item */}
          <div className="border-b border-gray-200 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">Enchanted Oak Crystal</h3>
                <div className="flex items-center mt-1">
                  <div className="flex text-yellow-500 mr-2">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} strokeWidth={1} />
                  </div>
                  <span className="text-sm text-gray-600">from Willow Witchcraft</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">March 10, 2025</span>
            </div>
            <p className="mt-3 text-gray-700">
              Beautiful crystal with excellent energy. The enchantment is a bit weaker than I expected, hence the 4 stars, but overall very satisfied with my purchase.
            </p>
            <div className="mt-3 flex justify-end">
              <button type="button" className="text-sm text-purple-700 hover:text-purple-900">
                Reply to review
              </button>
            </div>
          </div>
          
          {/* Review Item */}
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">Ancient Spell Grimoire</h3>
                <div className="flex items-center mt-1">
                  <div className="flex text-yellow-500 mr-2">
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                    <Star size={16} fill="currentColor" />
                  </div>
                  <span className="text-sm text-gray-600">from Merlin Wizard</span>
                </div>
              </div>
              <span className="text-sm text-gray-500">February 28, 2025</span>
            </div>
            <p className="mt-3 text-gray-700">
              This grimoire is absolutely authentic! The spells are well-preserved and the binding is in remarkable condition for its age. A treasure for any serious practitioner.
            </p>
            <div className="mt-3 flex justify-end">
              <button type="button" className="text-sm text-purple-700 hover:text-purple-900">
                Reply to review
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}