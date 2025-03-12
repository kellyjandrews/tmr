'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardPageWrapper from '@/components/dashboard/DashboardPageWrapper';
import type { Store, StoreFormData } from '@/types/store';

export default function EditStorePage() {
  const router = useRouter();
  const [store, setStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<StoreFormData>({
    name: '',
    slug: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        setIsLoading(true);
        // Use our new direct server action
        const { getUserStoreDirect } = await import('@/app/dashboard/actions');
        const storeResult = await getUserStoreDirect();
        
        if (storeResult.success && storeResult.data) {
          const storeData = storeResult.data as Store;
          setStore(storeData);
          setFormData({
            name: storeData.name,
            slug: storeData.slug
          });
        } else {
          // No store found, redirect to create page
          router.push('/dashboard/create-store');
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
        setErrors({ form: 'Failed to load store data' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreData();
  }, [router]);

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
    
    if (!store) return;
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use our new direct server action
      const { updateStoreDirect } = await import('@/app/dashboard/actions');
      
      const result = await updateStoreDirect(store.id, formData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update store');
      }
      
      // Redirect to shop admin on success
      router.push('/dashboard/shop-admin');
      router.refresh(); // Force a refresh to get the latest data
    } catch (error) {
      console.error('Error updating store:', error);
      setErrors({ 
        form: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardPageWrapper pageName="Edit Shop">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
        </div>
      </DashboardPageWrapper>
    );
  }

  if (!store) {
    return (
      <DashboardPageWrapper pageName="Edit Shop">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Store not found. Please create a store first.
        </div>
      </DashboardPageWrapper>
    );
  }

  return (
    <DashboardPageWrapper pageName="Edit Your Magical Shop">
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
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-1 focus:ring-purple-500"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            <div className="mb-6">
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                Shop URL
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">/store/</span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  value={formData.slug}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-1 focus:ring-purple-500"
                />
              </div>
              {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
              <p className="text-xs text-gray-500 mt-1">Changing your shop URL may affect existing links to your shop</p>
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardPageWrapper>
  );
}