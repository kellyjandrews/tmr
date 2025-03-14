// actions/listings-manage.ts
'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Type for the listing form data
export type ListingFormData = {
    id?: string;
    name: string;
    description: string;
    price: number;
    shipping_cost: number;
    quantity: number;
    status: 'draft' | 'active' | 'hidden' | 'sold';
    categories: string[];
    images: string[];
    store_id?: string;
};

// Validation schema for listing form
const listingSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.coerce.number().positive('Price must be greater than 0'),
    shipping_cost: z.coerce.number().min(0, 'Shipping cost must be 0 or greater'),
    quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
    status: z.enum(['draft', 'active', 'hidden', 'sold']),
    categories: z.array(z.string().uuid()).min(1, 'Select at least one category'),
    images: z.array(z.string()).min(1, 'Add at least one image'),
    store_id: z.string().uuid().optional()
});

// Type for server action responses
export type ActionResponse = {
    success: boolean;
    message?: string;
    error?: string;
    data?: unknown;
};

/**
 * Create a new listing
 */
export async function createListing(formData: ListingFormData): Promise<ActionResponse> {
    try {
        // Validate form data
        const validatedData = listingSchema.parse(formData);

        // Get current user and verify they own the store
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'You must be logged in to create a listing'
            };
        }

        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) {
            return {
                success: false,
                error: 'Authentication failed'
            };
        }

        // Get the user's store if store_id wasn't provided
        let storeId = validatedData.store_id;
        if (!storeId) {
            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .select('id')
                .eq('user_id', userData.user.id)
                .single();

            if (storeError) {
                return {
                    success: false,
                    error: 'You need to create a store before adding listings'
                };
            }

            storeId = storeData.id;
        } else {
            // Verify the user owns this store
            const { data: storeData, error: storeError } = await supabase
                .from('stores')
                .select('id')
                .eq('id', storeId)
                .eq('user_id', userData.user.id)
                .single();

            if (storeError || !storeData) {
                return {
                    success: false,
                    error: 'You do not have permission to add listings to this store'
                };
            }
        }

        // Insert the listing
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .insert({
                name: validatedData.name,
                description: validatedData.description,
                price: validatedData.price,
                quantity: validatedData.quantity,
                status: validatedData.status,
                store_id: storeId,
                // Use the first image as the main image_url
                image_url: validatedData.images[0]
            })
            .select()
            .single();

        if (listingError) {
            throw new Error(listingError.message);
        }

        // Create listing_categories entries for each category
        if (validatedData.categories.length > 0) {
            const categoryEntries = validatedData.categories.map(categoryId => ({
                listing_id: listing.id,
                category_id: categoryId
            }));

            const { error: categoriesError } = await supabase
                .from('listing_categories')
                .insert(categoryEntries);

            if (categoriesError) {
                // If categories fail, we should try to clean up the listing
                await supabase.from('listings').delete().eq('id', listing.id);
                throw new Error(`Failed to add categories: ${categoriesError.message}`);
            }
        }

        // Create listing_images entries for each image
        if (validatedData.images.length > 0) {
            const imageEntries = validatedData.images.map((imageUrl, index) => ({
                listing_id: listing.id,
                image_url: imageUrl,
                display_order: index
            }));

            const { error: imagesError } = await supabase
                .from('listing_images')
                .insert(imageEntries);

            if (imagesError) {
                // If images fail, we should try to clean up the listing and categories
                await supabase.from('listing_categories').delete().eq('listing_id', listing.id);
                await supabase.from('listings').delete().eq('id', listing.id);
                throw new Error(`Failed to add images: ${imagesError.message}`);
            }
        }

        // Add shipping information if provided
        if (validatedData.shipping_cost >= 0) {
            const { error: shippingError } = await supabase
                .from('listing_shipping')
                .insert({
                    listing_id: listing.id,
                    flat_rate: validatedData.shipping_cost
                });

            if (shippingError) {
                console.error('Failed to add shipping info:', shippingError);
                // Not critical, so we won't roll back the listing
            }
        }

        // Revalidate the dashboard and store pages
        revalidatePath('/dashboard/sell');
        revalidatePath('/dashboard');
        revalidatePath('/marketplace');
        revalidatePath(`/listing/${listing.id}`);

        return {
            success: true,
            message: 'Listing created successfully',
            data: listing
        };
    } catch (error) {
        console.error('Create listing error:', error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Update an existing listing
 */
export async function updateListing(formData: ListingFormData): Promise<ActionResponse> {
    try {
        // Validate form data
        const validatedData = listingSchema.parse(formData);

        if (!validatedData.id) {
            return {
                success: false,
                error: 'Listing ID is required for updates'
            };
        }

        // Get current user
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'You must be logged in to update a listing'
            };
        }

        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) {
            return {
                success: false,
                error: 'Authentication failed'
            };
        }

        // Verify the user owns the listing's store
        const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .select('store_id, stores!inner(user_id)')
            .eq('id', validatedData.id)
            .single();

        if (listingError || !listingData) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        // Check if the user owns the store
        if (listingData.stores.user_id !== userData.user.id) {
            return {
                success: false,
                error: 'You do not have permission to update this listing'
            };
        }

        // Update the listing
        const { data: updatedListing, error: updateError } = await supabase
            .from('listings')
            .update({
                name: validatedData.name,
                description: validatedData.description,
                price: validatedData.price,
                quantity: validatedData.quantity,
                status: validatedData.status,
                image_url: validatedData.images[0], // Use the first image as the main image
                updated_at: new Date().toISOString()
            })
            .eq('id', validatedData.id)
            .select()
            .single();

        if (updateError) {
            throw new Error(updateError.message);
        }

        // Update categories - delete existing and insert new ones
        const { error: deleteCategoriesError } = await supabase
            .from('listing_categories')
            .delete()
            .eq('listing_id', validatedData.id);

        if (deleteCategoriesError) {
            throw new Error(`Failed to update categories: ${deleteCategoriesError.message}`);
        }

        if (validatedData.categories.length > 0) {
            const categoryEntries = validatedData.categories.map(categoryId => ({
                listing_id: validatedData.id,
                category_id: categoryId
            }));

            const { error: insertCategoriesError } = await supabase
                .from('listing_categories')
                .insert(categoryEntries);

            if (insertCategoriesError) {
                throw new Error(`Failed to update categories: ${insertCategoriesError.message}`);
            }
        }

        // Update images - delete existing and insert new ones
        const { error: deleteImagesError } = await supabase
            .from('listing_images')
            .delete()
            .eq('listing_id', validatedData.id);

        if (deleteImagesError) {
            throw new Error(`Failed to update images: ${deleteImagesError.message}`);
        }

        if (validatedData.images.length > 0) {
            const imageEntries = validatedData.images.map((imageUrl, index) => ({
                listing_id: validatedData.id!,
                image_url: imageUrl,
                display_order: index
            }));

            const { error: insertImagesError } = await supabase
                .from('listing_images')
                .insert(imageEntries);

            if (insertImagesError) {
                throw new Error(`Failed to update images: ${insertImagesError.message}`);
            }
        }

        // Update shipping information
        const { error: deleteShippingError } = await supabase
            .from('listing_shipping')
            .delete()
            .eq('listing_id', validatedData.id);

        if (deleteShippingError) {
            console.error('Failed to update shipping info:', deleteShippingError);
            // Not critical, so we'll continue
        }

        // Add new shipping information
        const { error: insertShippingError } = await supabase
            .from('listing_shipping')
            .insert({
                listing_id: validatedData.id,
                flat_rate: validatedData.shipping_cost
            });

        if (insertShippingError) {
            console.error('Failed to update shipping info:', insertShippingError);
            // Not critical, so we'll continue
        }

        // Revalidate the dashboard and store pages
        revalidatePath('/dashboard/sell');
        revalidatePath('/dashboard');
        revalidatePath('/marketplace');
        revalidatePath(`/listing/${validatedData.id}`);

        return {
            success: true,
            message: 'Listing updated successfully',
            data: updatedListing
        };
    } catch (error) {
        console.error('Update listing error:', error);
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Delete a listing
 */
export async function deleteListing(listingId: string): Promise<ActionResponse> {
    try {
        if (!listingId) {
            return {
                success: false,
                error: 'Listing ID is required'
            };
        }

        // Get current user
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'You must be logged in to delete a listing'
            };
        }

        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) {
            return {
                success: false,
                error: 'Authentication failed'
            };
        }

        // Verify the user owns the listing's store
        const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .select('store_id, stores!inner(user_id)')
            .eq('id', listingId)
            .single();

        if (listingError || !listingData) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        // Check if the user owns the store
        if (listingData.stores.user_id !== userData.user.id) {
            return {
                success: false,
                error: 'You do not have permission to delete this listing'
            };
        }

        // Delete related records first (cascade doesn't always work well with Supabase)
        await supabase.from('listing_categories').delete().eq('listing_id', listingId);
        await supabase.from('listing_images').delete().eq('listing_id', listingId);
        await supabase.from('listing_shipping').delete().eq('listing_id', listingId);

        // Delete the listing
        const { error: deleteError } = await supabase
            .from('listings')
            .delete()
            .eq('id', listingId);

        if (deleteError) {
            throw new Error(deleteError.message);
        }

        // Revalidate the dashboard and store pages
        revalidatePath('/dashboard/sell');
        revalidatePath('/dashboard');
        revalidatePath('/marketplace');

        return {
            success: true,
            message: 'Listing deleted successfully'
        };
    } catch (error) {
        console.error('Delete listing error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Change listing status
 */
export async function changeListingStatus(
    listingId: string,
    status: 'draft' | 'active' | 'hidden' | 'sold'
): Promise<ActionResponse> {
    try {
        if (!listingId) {
            return {
                success: false,
                error: 'Listing ID is required'
            };
        }

        // Get current user
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'You must be logged in to update a listing'
            };
        }

        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) {
            return {
                success: false,
                error: 'Authentication failed'
            };
        }

        // Verify the user owns the listing's store
        const { data: listingData, error: listingError } = await supabase
            .from('listings')
            .select('store_id, stores!inner(user_id)')
            .eq('id', listingId)
            .single();

        if (listingError || !listingData) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        // Check if the user owns the store
        if (listingData.stores.user_id !== userData.user.id) {
            return {
                success: false,
                error: 'You do not have permission to update this listing'
            };
        }

        // Update just the status
        const { error: updateError } = await supabase
            .from('listings')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', listingId);

        if (updateError) {
            throw new Error(updateError.message);
        }

        // Revalidate the dashboard and store pages
        revalidatePath('/dashboard/sell');
        revalidatePath('/dashboard');
        revalidatePath('/marketplace');
        revalidatePath(`/listing/${listingId}`);

        return {
            success: true,
            message: `Listing status changed to ${status}`
        };
    } catch (error) {
        console.error('Change listing status error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get a listing with all related data for editing
 */
export async function getListingForEdit(listingId: string): Promise<ActionResponse> {
    try {
        if (!listingId) {
            return {
                success: false,
                error: 'Listing ID is required'
            };
        }

        // Get current user
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'You must be logged in to view this listing'
            };
        }

        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) {
            return {
                success: false,
                error: 'Authentication failed'
            };
        }

        // Get the basic listing data
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select(`
        *,
        stores!inner(
          id,
          name,
          user_id
        )
      `)
            .eq('id', listingId)
            .single();

        if (listingError || !listing) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        // Verify the user owns the store
        if (listing.stores.user_id !== userData.user.id) {
            return {
                success: false,
                error: 'You do not have permission to view this listing'
            };
        }

        // Get the categories
        const { data: categories, error: categoriesError } = await supabase
            .from('listing_categories')
            .select('category_id')
            .eq('listing_id', listingId);

        if (categoriesError) {
            console.error('Error fetching categories:', categoriesError);
            // Not critical, so we'll continue
        }

        // Get the images
        const { data: images, error: imagesError } = await supabase
            .from('listing_images')
            .select('image_url, display_order')
            .eq('listing_id', listingId)
            .order('display_order');

        if (imagesError) {
            console.error('Error fetching images:', imagesError);
            // Not critical, so we'll continue
        }

        // Get the shipping info
        const { data: shipping, error: shippingError } = await supabase
            .from('listing_shipping')
            .select('flat_rate')
            .eq('listing_id', listingId)
            .single();

        if (shippingError && shippingError.code !== 'PGRST116') {
            // PGRST116 is "No rows returned" which is fine - we'll use a default
            console.error('Error fetching shipping:', shippingError);
            // Not critical, so we'll continue
        }

        // Combine all the data
        const listingFormData: ListingFormData = {
            id: listing.id,
            name: listing.name,
            description: listing.description || '',
            price: listing.price,
            shipping_cost: shipping?.flat_rate || 0,
            quantity: listing.quantity || 1,
            status: listing.status as 'draft' | 'active' | 'hidden' | 'sold',
            categories: categories?.map(c => c.category_id) || [],
            images: images?.map(i => i.image_url) || (listing.image_url ? [listing.image_url] : []),
            store_id: listing.store_id
        };

        return {
            success: true,
            data: listingFormData
        };
    } catch (error) {
        console.error('Get listing for edit error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Upload an image to Supabase storage
 */
export async function uploadListingImage(file: File): Promise<ActionResponse> {
    try {
        if (!file) {
            return {
                success: false,
                error: 'No file provided'
            };
        }

        // Get current user
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'You must be logged in to upload images'
            };
        }

        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) {
            return {
                success: false,
                error: 'Authentication failed'
            };
        }

        // Generate a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${userData.user.id}/${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const buffer = await file.arrayBuffer();

        const { data, error } = await supabase.storage
            .from('listing-images')
            .upload(fileName, buffer, {
                contentType: file.type,
            });

        if (error) {
            throw new Error(error.message);
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
            .from('listing-images')
            .getPublicUrl(data.path);

        return {
            success: true,
            message: 'Image uploaded successfully',
            data: publicUrl
        };
    } catch (error) {
        console.error('Upload image error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Delete an image from Supabase storage
 */
export async function deleteListingImage(imageUrl: string): Promise<ActionResponse> {
    try {
        if (!imageUrl) {
            return {
                success: false,
                error: 'No image URL provided'
            };
        }

        // Get current user
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-auth-token')?.value;

        if (!token) {
            return {
                success: false,
                error: 'You must be logged in to delete images'
            };
        }

        const { data: userData } = await supabase.auth.getUser(token);
        if (!userData.user) {
            return {
                success: false,
                error: 'Authentication failed'
            };
        }

        // Extract the file path from the URL
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/');
        const storagePath = pathParts.slice(pathParts.indexOf('storage') + 2).join('/');

        if (!storagePath) {
            return {
                success: false,
                error: 'Invalid image URL'
            };
        }

        // Delete from Supabase Storage
        const { error } = await supabase.storage
            .from('listing-images')
            .remove([storagePath]);

        if (error) {
            throw new Error(error.message);
        }

        return {
            success: true,
            message: 'Image deleted successfully'
        };
    } catch (error) {
        console.error('Delete image error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}