// components/store/StoreForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StoreFormData } from '@/types/store';

type StoreFormProps = {
  initialData?: StoreFormData;
  isEdit?: boolean;
  storeId?: string;
  onSuccess?: () => void;
};

export default function StoreForm({ 
  initialData, 
  isEdit = false, 
  storeId,
  onSuccess 
}: StoreFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<StoreFormData>(initialData || {
    name: '',
    slug: '',
    description: '',
    location: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    } else if (formData.name.length > 100) {
      newErrors.name = 'Store name must be less than 100 characters';
    }
    
    if (formData.slug) {
      if (formData.slug.length < 3) {
        newErrors.slug = 'Store slug must be at least 3 characters';
      } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
      }
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
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
    setErrors({});
    
    try {
      if (isEdit && storeId) {
        // Import the updateStore action
        const { updateStore } = await import('@/actions/store');
        
        const result = await updateStore(storeId, formData);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update store');
        }
      } else {
        // Import the createStore action
        const { createStore } = await import('@/actions/store');
        
        const result = await createStore(formData);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create store');
        }
      }
      
      // Call onSuccess if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Redirect to shop admin
      router.push('/dashboard/shop-admin');
      router.refresh();
    } catch (error) {
      console.error(isEdit ? 'Error updating store:' : 'Error creating store:', error);
      setErrors({ form: error instanceof Error ? error.message : 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">
        {isEdit ? 'Edit Your Magical Shop' : 'Create Your Magical Shop'}
      </h2>
      
      {errors.form && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.form}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Shop Name*
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            onBlur={!isEdit ? generateSlug : undefined}
            placeholder="Enchanted Emporium"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          <p className="text-xs text-gray-500 mt-1">Choose a unique name for your magical shop</p>
        </div>
        
        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Shop URL {isEdit ? '' : '(optional)'}
          </label>
          <div className="flex items-center">
            <span className="bg-gray-100 px-3 py-2 rounded-l-md text-gray-500 border border-r-0">
              /store/
            </span>
            <input
              id="slug"
              name="slug"
              type="text"
              value={formData.slug}
              onChange={handleChange}
              placeholder="enchanted-emporium"
              className="shadow appearance-none border rounded-r-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
          <p className="text-xs text-gray-500 mt-1">
            {isEdit 
              ? 'Changing your shop URL might affect existing links to your shop'
              : 'Custom URL for your shop (automatically generated if left blank)'}
          </p>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Shop Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="Describe your magical shop and what you sell..."
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-purple-500 h-24"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>
        
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={formData.location || ''}
            onChange={handleChange}
            placeholder="Diagon Alley, London"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>
        
        <div className="flex justify-between items-center pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isSubmitting 
              ? (isEdit ? 'Saving...' : 'Creating...') 
              : (isEdit ? 'Save Changes' : 'Create Shop')
            }
          </button>
        </div>
      </form>
    </div>
    )}