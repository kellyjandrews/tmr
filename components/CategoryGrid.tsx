'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import type { Category } from '@/types';

// Define emoji mappings for main categories
const CATEGORY_EMOJIS: Record<string, string> = {
  'Wands': '🪄',
  'Potions': '🧪',
  'Grimoires': '📚',
  'Crystals': '💎',
  'Artifacts': '🔮',
  // Add fallback for any category we don't have a specific emoji for
  'default': '✨'
};

type CategoryGridProps = {
  initialCategories?: Category[];
  title?: string;
  loading?: boolean;
  error?: string;
};

export default function CategoryGrid({
  initialCategories,
  title = 'Explore Categories',
  loading = false,
  error = '',
}: CategoryGridProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCategories || loading);
  const [errorMessage, setErrorMessage] = useState<string>(error);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCategories) {
      setCategories(initialCategories);
      setIsLoading(false);
      return;
    }

    // If no initialCategories, we need to fetch them
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setErrorMessage('');

        const { getMainCategories } = await import('@/actions/categories');
        const result = await getMainCategories();
        
        if (!result.success || !result.data) {
          throw new Error(result.error || 'Failed to load categories');
        }
        
        setCategories(result.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setErrorMessage('Failed to load categories. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [initialCategories]);

  // Get the appropriate emoji for a category
  const getCategoryEmoji = (categoryName: string): string => {
    return CATEGORY_EMOJIS[categoryName] || CATEGORY_EMOJIS.default;
  };

  // Scroll handler for buttons
  const handleScroll = (direction: 'left' | 'right') => {
    if (!sliderRef.current) return;
    
    const scrollAmount = 300; // Adjust based on your design
    const newScrollLeft = direction === 'left' 
      ? sliderRef.current.scrollLeft - scrollAmount 
      : sliderRef.current.scrollLeft + scrollAmount;
    
    sliderRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  if (isLoading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-purple-50">
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 text-center">{title}</h2>
          <div className="flex justify-center items-center h-48">
            <div className="animate-pulse text-purple-500">Loading categories...</div>
          </div>
        </div>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-purple-50">
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 text-center">{title}</h2>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-2xl mx-auto">
            {errorMessage}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-purple-50">
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 text-center">{title}</h2>
          <p className="text-center text-gray-500">No categories available.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-purple-50">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-purple-900 text-center flex-grow">{title}</h2>
          <div className="flex space-x-2">
            <button 
            type="button"
              onClick={() => handleScroll('left')}
              className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-800 focus:outline-none"
              aria-label="Scroll left"
            >
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
            type="button"
              onClick={() => handleScroll('right')}
              className="p-2 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-800 focus:outline-none"
              aria-label="Scroll right"
            >
              {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div 
          ref={sliderRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide lg:justify-center snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <Link 
             key={category.id}
             href={`/category/${category.slug}`}
             className="bg-white p-6 rounded-lg text-center shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center justify-center flex-shrink-0 w-44 h-44 snap-start"
>
              <span className="text-3xl mb-3">{getCategoryEmoji(category.name)}</span>
              <h3 className="font-medium text-purple-800">{category.name}</h3>
              <p className="text-xs text-gray-500 mt-2">Browse Collection</p>
            </Link>
          ))}
        </div>
        
        {/* Add custom scrollbar styling to hide default scrollbar */}
        <style jsx>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          
          /* Hide scrollbar for IE, Edge and Firefox */
          .scrollbar-hide {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }
        `}</style>
      </div>
    </section>
  );
}