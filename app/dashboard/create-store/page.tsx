'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import type { StoreFormData } from '@/types/store';

export default function CreateStorePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    slug: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const generateSlug = () => {
    if (!formData.name) return;
    
    const slug = formData.name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .replace(/\s+/g, '-')      // Replace spaces with hyphens
      .replace(/-+/g, '-')       // Replace multiple hyphens with a single hyphen
      .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
    
    setFormData(prev => ({ ...prev, slug }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Store name must be at least 3 characters';
    }
    
    if (formData.slug && formData.slug.length < 3) {
      newErrors.slug = 'Store slug must be at least 3 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use our new direct server action
      const { createStoreDirect } = await import('@/app/dashboard/actions');
      
      const result = await createStoreDirect(formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create store');
      }
      
      // Redirect to shop admin on success
      router.push('/dashboard/shop-admin');
      router.refresh(); // Force a refresh to get the latest data
    } catch (error) {
      console.error('Error creating store:', error);
      setErrors({ 
        form: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardPageWrapper pageName="Create Your Magical Shop">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-purple-900 mb-6">Shop Details</h2>
          
          {errors.form && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {errors.form}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Shop Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={generateSlug}
                placeholder="Enchanted Emporium"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-1 focus:ring-purple-500"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              <p className="text-xs text-gray-500 mt-1">Choose a unique name for your magical shop</p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Shop URL (optional)
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">/store/</span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="enchanted-emporium"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-1 focus:ring-purple-500"
                />
              </div>
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
              <p className="text-xs text-gray-500 mt-1">Custom URL for your shop (automatically generated if left blank)</p>
            </div>
            
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Shop'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg mt-6">
          <h3 className="font-medium text-purple-900 mb-2">What happens next?</h3>
          <p className="text-gray-700 text-sm">
            After creating your shop, you can start adding magical items for sale, customize your shop policies, 
            and share your shop URL with potential customers. You&apos;ll have access to analytics and order management tools.
          </p>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}