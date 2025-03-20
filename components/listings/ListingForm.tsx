'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Upload,
  DollarSign,
  Truck,
  CheckCircle,
  AlertCircle,
  Clock,
  EyeOff,
  Tag
} from 'lucide-react';
import {supabaseLoader} from '@/utils/supabase/clientSide';
import type { Category } from '@/types';
import type { ListingFormData } from '@/types';

type FormSection = 'basic' | 'description' | 'images' | 'categories' | 'pricing' | 'status';

type ListingFormProps = {
  initialData?: ListingFormData;
  categories: Category[];
  isSubmitting?: boolean;
  onSubmit: (data: ListingFormData) => Promise<void>;
};

const DEFAULT_FORM_DATA: ListingFormData = {
  name: '',
  description: '',
  slug: '',
  price: 0,
  shipping_cost: 0,
  quantity: 1,
  status: 'draft',
  categories: [],
  images: []
};

export default function ListingForm({
  initialData,
  categories,
  isSubmitting = false,
  onSubmit
}: ListingFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<ListingFormData>(initialData || DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSections, setExpandedSections] = useState<FormSection[]>(['basic']);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainCategoryGroups = categories.filter(cat => !cat.parent_id);
  const subcategories = categories.filter(cat => cat.parent_id);

  // Handle text field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle number field changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? 0 : Number.parseFloat(value);
    setFormData(prev => ({ ...prev, [name]: numValue }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Toggle section expansion
  const toggleSection = (section: FormSection) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  // Handle category selection
  const handleCategoryChange = (categoryId: string) => {
    setFormData(prev => {
      const categories = prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories };
    });
    if (errors.categories) {
      setErrors(prev => {
        const newErrors = { ...prev };
        return newErrors;
      });
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const file = files[0];
      
      // Import the uploadListingImage function dynamically
      const { uploadListingImage } = await import('@/actions/listings-manage');
      
      const result = await uploadListingImage(file);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }
      
      const imageUrl = result.data as string;
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
      
      if (errors.images) {
        setErrors(prev => {
          const newErrors = { ...prev };
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setErrors(prev => ({
        ...prev,
        images: 'Failed to upload image. Please try again.'
      }));
    } finally {
      setUploadingImage(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle image removal
  const handleRemoveImage = async (imageUrl: string) => {
    try {
      // Import the deleteListingImage function dynamically
      const { deleteListingImage } = await import('@/actions/listings-manage');
      
      // We don't want to block the UI, so we'll just log any errors
      deleteListingImage(imageUrl).catch(error => {
        console.error('Error deleting image:', error);
      });
      
      // Update the form data immediately
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(url => url !== imageUrl)
      }));
    } catch (error) {
      console.error('Error removing image:', error);
    }
  };

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }
    
    // Add slug validation - only validate if provided
    if (formData.slug) {
      if (formData.slug.length < 3) {
        newErrors.slug = 'Slug must be at least 3 characters';
      } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
        newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
      }
    }
  
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (formData.shipping_cost < 0) {
      newErrors.shipping_cost = 'Shipping cost cannot be negative';
    }
    
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    
    if (formData.categories.length === 0) {
      newErrors.categories = 'Select at least one category';
    }
    
    if (formData.images.length === 0) {
      newErrors.images = 'Add at least one image';
    }
    
    return newErrors;
  }, [formData]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Expand sections with errors
      const sectionsWithErrors: FormSection[] = [];
      if (validationErrors.name) sectionsWithErrors.push('basic');
      if (validationErrors.slug) sectionsWithErrors.push('basic');
      if (validationErrors.description) sectionsWithErrors.push('description');
      if (validationErrors.images) sectionsWithErrors.push('images');
      if (validationErrors.categories) sectionsWithErrors.push('categories');
      if (validationErrors.price || validationErrors.shipping_cost || validationErrors.quantity) {
        sectionsWithErrors.push('pricing');
      }
      
      setExpandedSections(prev => [...new Set([...prev, ...sectionsWithErrors])]);
      return;
    }
    
    await onSubmit(formData);
  };

  // Get subcategories for a parent category
  const getSubcategories = (parentId: string) => {
    return subcategories.filter(cat => cat.parent_id === parentId);
  };

  // Get status badge color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'draft':
        return { color: 'bg-yellow-100 text-yellow-800', icon: <Clock size={16} className="mr-1" /> };
      case 'active':
        return { color: 'bg-green-100 text-green-800', icon: <CheckCircle size={16} className="mr-1" /> };
      case 'hidden':
        return { color: 'bg-gray-100 text-gray-800', icon: <EyeOff size={16} className="mr-1" /> };
      case 'sold':
        return { color: 'bg-blue-100 text-blue-800', icon: <Tag size={16} className="mr-1" /> };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: <AlertCircle size={16} className="mr-1" /> };
    }
  };

  const statusInfo = getStatusInfo(formData.status);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('basic')}
          onKeyUp={(e) => {
            e.preventDefault();
            console.log(e.altKey)
            console.log(e.ctrlKey)
            console.log(e.shiftKey)
            console.log(e.key.charAt)
          }}
        >
          <h3 className="font-medium text-gray-900">Basic Information</h3>
          <button type="button" className="text-gray-500">
            {expandedSections.includes('basic') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {expandedSections.includes('basic') && (
          <div className="p-6 space-y-4">
                       <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Listing Name*
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="Enter a descriptive name for your magical item"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            
            {initialData?.id && (
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
                  Listing URL Slug
                </label>
                <div className="flex items-center">
                  <span className="bg-gray-100 px-3 py-2 rounded-l-md text-gray-500 border border-r-0">
                    /listing/
                  </span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    value={formData.slug}
                    onChange={handleInputChange}
                    className="shadow-sm border border-gray-300 rounded-r-md w-full py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    placeholder="custom-listing-url"
                  />
                </div>
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  Customize the URL for your listing. Use only lowercase letters, numbers, and hyphens.
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Listing Status
              </label>
              <div className="flex items-center">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="shadow-sm border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500 mr-3"
                >
                  <option value="draft">Draft - Not visible to others</option>
                  <option value="active">Active - Visible in marketplace</option>
                  <option value="hidden">Hidden - Temporarily unavailable</option>
                  <option value="sold">Sold - No longer available</option>
                </select>
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.icon}
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Draft listings are only visible to you until you publish them.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Description Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('description')}
          onKeyUp={(e) => {
            e.preventDefault();
            console.log(e.altKey)
            console.log(e.ctrlKey)
            console.log(e.shiftKey)
            console.log(e.key.charAt)
          }}
        >
          <h3 className="font-medium text-gray-900">Description</h3>
          <button type="button" className="text-gray-500">
            {expandedSections.includes('description') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {expandedSections.includes('description') && (
          <div className="p-6">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Item Description*
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              value={formData.description}
              onChange={handleInputChange}
              className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="Describe your magical item in detail. Include its powers, history, materials, etc."
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
            <p className="text-xs text-gray-500 mt-1">
              A detailed description helps buyers understand the value of your magical item.
            </p>
          </div>
        )}
      </div>
      
      {/* Images Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('images')}
          onKeyUp={(e) => {
            e.preventDefault();
            console.log(e.altKey)
            console.log(e.ctrlKey)
            console.log(e.shiftKey)
            console.log(e.key.charAt)
          }}
        >
          <h3 className="font-medium text-gray-900">Images</h3>
          <button type="button" className="text-gray-500">
            {expandedSections.includes('images') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {expandedSections.includes('images') && (
          <div className="p-6">
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Item Images*
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Add up to 5 images. The first image will be the main image displayed in the marketplace.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                {formData.images.map((imageUrl, index) => (
                  <div 
                    key={imageUrl} 
                    className="relative w-24 h-24 rounded-md overflow-hidden border border-gray-200"
                  >
                    <Image
                      loader={supabaseLoader}
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(imageUrl)}
                      className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white hover:bg-opacity-80"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-purple-600 bg-opacity-80 text-white text-xs py-1 text-center">
                        Main
                      </div>
                    )}
                  </div>
                ))}
                
                {formData.images.length < 5 && (
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-purple-500 hover:text-purple-500"
                    onClick={() => fileInputRef.current?.click()}
                    onKeyUp={(e) => {
                      e.preventDefault();
                      console.log(e.altKey)
                      console.log(e.ctrlKey)
                      console.log(e.shiftKey)
                      console.log(e.key.charAt)
                    }}
                  >
                    <Upload size={20} />
                    <span className="text-xs mt-1">Add Image</span>
                  </div>
                )}
              </div>
              
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              
              {uploadingImage && (
                <div className="text-sm text-purple-600">
                  Uploading image...
                </div>
              )}
              
              {errors.images && <p className="text-red-500 text-xs mt-1">{errors.images}</p>}
            </div>
          </div>
        )}
      </div>
      
      {/* Categories Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('categories')}
          onKeyUp={(e) => {
            e.preventDefault();
            console.log(e.altKey)
            console.log(e.ctrlKey)
            console.log(e.shiftKey)
            console.log(e.key.charAt)
          }}
        >
          <h3 className="font-medium text-gray-900">Categories</h3>
          <button type="button" className="text-gray-500">
            {expandedSections.includes('categories') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {expandedSections.includes('categories') && (
          <div className="p-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Item Categories*
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Select all categories that apply to your magical item.
            </p>
            
            <div className="space-y-4">
              {mainCategoryGroups.map(mainCategory => (
                <div key={mainCategory.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id={`category-${mainCategory.id}`}
                      checked={formData.categories.includes(mainCategory.id)}
                      onChange={() => handleCategoryChange(mainCategory.id)}
                      className="h-4 w-4 mt-1 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`category-${mainCategory.id}`} className="ml-2 block font-medium text-gray-800">
                      {mainCategory.name}
                    </label>
                  </div>
                  
                  <div className="mt-2 ml-6 grid grid-cols-2 gap-2">
                    {getSubcategories(mainCategory.id).map(subcategory => (
                      <div key={subcategory.id} className="flex items-start">
                        <input
                          type="checkbox"
                          id={`category-${subcategory.id}`}
                          checked={formData.categories.includes(subcategory.id)}
                          onChange={() => handleCategoryChange(subcategory.id)}
                          className="h-4 w-4 mt-1 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`category-${subcategory.id}`} className="ml-2 block text-gray-700 text-sm">
                          {subcategory.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {errors.categories && <p className="text-red-500 text-xs mt-2">{errors.categories}</p>}
          </div>
        )}
      </div>
      
      {/* Pricing Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div 
          className="p-4 flex justify-between items-center border-b border-gray-200 cursor-pointer"
          onClick={() => toggleSection('pricing')}
          onKeyUp={(e) => {
            e.preventDefault();
            console.log(e.altKey)
            console.log(e.ctrlKey)
            console.log(e.shiftKey)
            console.log(e.key.charAt)
          }}
        >
          <h3 className="font-medium text-gray-900">Pricing & Inventory</h3>
          <button type="button" className="text-gray-500">
            {expandedSections.includes('pricing') ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {expandedSections.includes('pricing') && (
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price*
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign size={16} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  name="price"
                  id="price"
                  min="0.01"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={handleNumberChange}
                  className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
            </div>
            
            <div>
              <label htmlFor="shipping_cost" className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Cost
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Truck size={16} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  name="shipping_cost"
                  id="shipping_cost"
                  min="0"
                  step="0.01"
                  value={formData.shipping_cost || ''}
                  onChange={handleNumberChange}
                  className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                  placeholder="0.00"
                />
              </div>
              {errors.shipping_cost && <p className="text-red-500 text-xs mt-1">{errors.shipping_cost}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Enter 0 for free shipping.
              </p>
            </div>
            
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Available*
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                min="1"
                step="1"
                value={formData.quantity || ''}
                onChange={handleNumberChange}
                className="focus:ring-purple-500 focus:border-purple-500 block w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        
        <div className="space-x-2 flex">
          <button
            type="button"
            onClick={() => {
              setFormData(prev => ({ ...prev, status: 'draft' }));
              setTimeout(() => handleSubmit({ preventDefault: () => {} } as React.FormEvent), 0);
            }}
            className="px-4 py-2 text-purple-700 bg-purple-50 rounded-md hover:bg-purple-100 flex items-center"
            disabled={isSubmitting}
          >
            <Clock size={16} className="mr-1" />
            Save as Draft
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (
              <>
                <CheckCircle size={16} className="mr-1" />
                {formData.id ? 'Update Listing' : 'Create Listing'}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}