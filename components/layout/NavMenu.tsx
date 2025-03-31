'use client'

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

// This component represents a dedicated category navigation menu
// that sits below the main header

export default function CategoryNavMenu() {
  const [activeCategory, setActiveCategory] = useState('');

  // Main category groups from the database
  const mainCategories = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Stage',
      slug: 'stage-magic',
      subcategories: [
        { id: 'sub-1-1', name: 'Grand Illusions', slug: 'grand-illusions' },
        { id: 'sub-1-2', name: 'Mentalism Props', slug: 'mentalism-props' },
        { id: 'sub-1-3', name: 'Stage Accessories', slug: 'stage-accessories' },
        { id: 'sub-1-4', name: 'Lighting & Effects', slug: 'lighting-effects' },
        { id: 'sub-1-5', name: 'Backdrops & Scenery', slug: 'backdrops-scenery' },
      ]
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'Close-Up',
      slug: 'close-up-magic',
      subcategories: [
        { id: 'sub-2-1', name: 'Card Tricks', slug: 'card-tricks' },
        { id: 'sub-2-2', name: 'Coin Magic', slug: 'coin-magic' },
        { id: 'sub-2-3', name: 'Small Props', slug: 'small-props' },
        { id: 'sub-2-4', name: 'Walkaround Items', slug: 'walkaround-items' },
        { id: 'sub-2-5', name: 'Table Magic', slug: 'table-magic' },
      ]
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Parlor',
      slug: 'parlor-magic',
      subcategories: [
        { id: 'sub-3-1', name: 'Medium-sized Illusions', slug: 'medium-sized-illusions' },
        { id: 'sub-3-2', name: 'Audience Participation', slug: 'audience-participation' },
        { id: 'sub-3-3', name: 'Parlor Sets', slug: 'parlor-sets' },
        { id: 'sub-3-4', name: 'Ambient Props', slug: 'ambient-props' },
      ]
    },
    {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Mentalism',
      slug: 'mentalism',
      subcategories: [
        { id: 'sub-4-1', name: 'Prediction Tools', slug: 'prediction-tools' },
        { id: 'sub-4-2', name: 'Mind Reading Devices', slug: 'mind-reading-devices' },
        { id: 'sub-4-3', name: 'Psychological Forces', slug: 'psychological-forces' },
        { id: 'sub-4-4', name: 'Mentalism Books', slug: 'mentalism-books' },
      ]
    },
    {
      id: '00000000-0000-0000-0000-000000000005',
      name: 'Books & Learning',
      slug: 'magic-books-learning',
      subcategories: [
        { id: 'sub-5-1', name: 'Tutorials', slug: 'tutorials' },
        { id: 'sub-5-2', name: 'Performance Theory', slug: 'performance-theory' },
        { id: 'sub-5-3', name: 'Magic History', slug: 'magic-history' },
        { id: 'sub-5-4', name: 'Technique Guides', slug: 'technique-guides' },
      ]
    },
    {
      id: '00000000-0000-0000-0000-000000000006',
      name: 'Card Magic',
      slug: 'cards-card-magic',
      subcategories: [
        { id: 'sub-6-1', name: 'Playing Cards', slug: 'playing-cards' },
        { id: 'sub-6-2', name: 'Gimmicked Cards', slug: 'gimmicked-cards' },
        { id: 'sub-6-3', name: 'Card Accessories', slug: 'card-accessories' },
        { id: 'sub-6-4', name: 'Card Magic Sets', slug: 'card-magic-sets' },
      ]
    },
    {
      id: '00000000-0000-0000-0000-000000000007',
      name: 'Coins & Money',
      slug: 'coins-money-magic',
      subcategories: [
        { id: 'sub-7-1', name: 'Trick Coins', slug: 'trick-coins' },
        { id: 'sub-7-2', name: 'Coin Sets', slug: 'coin-sets' },
        { id: 'sub-7-3', name: 'Money Gimmicks', slug: 'money-gimmicks' },
        { id: 'sub-7-4', name: 'Coin Magic Tools', slug: 'coin-magic-tools' },
      ]
    },
    {
      id: '00000000-0000-0000-0000-000000000008',
      name: 'Illusions',
      slug: 'illusions-props',
      subcategories: [
        { id: 'sub-8-1', name: 'Small Illusions', slug: 'small-illusions' },
        { id: 'sub-8-2', name: 'Medium Illusions', slug: 'medium-illusions' },
        { id: 'sub-8-3', name: 'Grand Illusions', slug: 'grand-illusions-prop' },
        { id: 'sub-8-4', name: 'Prop Construction', slug: 'prop-construction' },
      ]
    },
  ];

  const handleMouseEnter = (categoryId:string) => {
    setActiveCategory(categoryId);
  };

  const handleMouseLeave = () => {
    setActiveCategory('');
  };

  return (
    <nav className="bg-purple-800 text-white shadow-md" onMouseLeave={handleMouseLeave}>
      <div className="mx-auto">
        <ul className="flex justify-center">
          {/* All Products Link
          <li className="relative group">
            <Link 
              href="/marketplace" 
              className="block px-4 py-3 hover:bg-purple-700 font-medium"
            >
              All Products
            </Link>
          </li> */}
          
          {/* Category Navigation Links with Dropdowns */}
          {mainCategories.map((category) => (
            <li 
              key={category.id} 
              className="relative group"
              onMouseEnter={() => handleMouseEnter(category.id)}
            >
              <Link 
                href={`/category/${category.slug}`} 
                className="block px-4 py-3 hover:bg-purple-700 font-medium flex items-center"
              >
                {category.name}
                <ChevronDown size={16} className="ml-1" />
              </Link>
              
              {/* Dropdown Menu */}
              {activeCategory === category.id && (
                <div className="absolute left-0 z-10 w-64 bg-white shadow-lg text-gray-800 py-2 mt-0 rounded-b-md">
                  <div className="px-4 py-2 border-b border-gray-200 mb-2">
                    <h3 className="font-semibold text-purple-900">
                      {category.name}
                    </h3>
                  </div>
                  <ul>
                    {category.subcategories.map((subcategory) => (
                      <li key={subcategory.id}>
                        <Link 
                          href={`/category/${subcategory.slug}`}
                          className="block px-4 py-2 hover:bg-purple-100 hover:text-purple-700 text-gray-700"
                        >
                          {subcategory.name}
                        </Link>
                      </li>
                    ))}
                    <li className="mt-2 pt-2 border-t border-gray-200">
                      <Link 
                        href={`/category/${category.slug}`}
                        className="block px-4 py-2 text-purple-700 font-medium"
                      >
                        View All {category.name}
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </li>
          ))}
          
          {/* Featured and Sale Items Links */}
          {/* <li className="relative group">
            <Link 
              href="/marketplace/featured" 
              className="block px-4 py-3 hover:bg-purple-700 font-medium"
            >
              Featured Items
            </Link>
          </li>
          <li className="relative group">
            <Link 
              href="/marketplace/sale" 
              className="block px-4 py-3 hover:bg-purple-700 font-medium"
            >
              On Sale
            </Link>
          </li> */}
        </ul>
      </div>
    </nav>
  );
}