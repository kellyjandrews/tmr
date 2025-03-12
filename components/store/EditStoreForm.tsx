'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Store, StoreFormData } from '@/types/store';

type EditStoreFormProps = {
  store: Store;
  onSuccess?: () => void;
};

export default function EditStoreForm({ store, onSuccess }: EditStoreFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<StoreFormData>({
    name: store.name,
    slug: store.slug,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) {
      newErrors.name = 'Store name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Store name must be at least 3 characters';
    }
    
    // Slug is optional, but if provided, validate it
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
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
    
    setIsLoading(true);
    
    try {
      const { updateStore } = await import('@/actions/store');
      
      const result = await updateStore(store.id, {
        name: formData.name,
        slug: formData.slug || undefined,
      });
      
      if (!result.success) throw new Error(result.error || 'Failed to update store');
      
      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Redirect to dashboard
      router.push('/dashboard/shop-admin');
      router.refresh();
    } catch (error) {
      setErrors({ form: (error as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Edit Your Magical Shop</h2>
      
      {errors.form && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
            Shop Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your magical shop name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="slug">
            Shop URL
          </label>
          <div className="flex items-center">
            <span className="bg-gray-100 px-3 py-2 rounded-l-md text-gray-500 border border-r-0">
              /store/
            </span>
            <input
              id="slug"
              name="slug"
              type="text"
              className="shadow appearance-none border rounded-r-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.slug}
              onChange={handleChange}
              placeholder="your-shop-url"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Changing your shop URL might affect existing links to your shop
          </p>
          {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}