// actions/listings-manage.ts
'use server';

import { z } from 'zod';
import { createSession } from '@/utils/supabase/serverSide';
import { revalidatePath } from 'next/cache';
import type {
    ListingData,
    ListingImage,
    ListingFormData
} from '@/types/listing';
import type { ActionResponse } from '@/types/common';

// Zod schema for validation
const listingSchema = z.object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, 'Name is required'),
    description: z.string(),
    price: z.number().positive('Price must be greater than 0'),
    quantity: z.number().int().nonnegative(),
    status: z.enum(['draft', 'active', 'hidden', 'sold']),
    store_id: z.string().uuid(),
    images: z.array(z.string().url()).min(1, 'At least one image is required'),
    categories: z.array(z.string().uuid()),
    shipping_cost: z.number().nonnegative(),
    slug: z.string().optional()
});

export async function createListing(formData: ListingFormData): Promise<ActionResponse<ListingData>> {
    const supabase = await createSession();

    try {
        const validatedData = listingSchema.parse(formData);
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
            return { success: false, error: 'Authentication required' };
        }

        const listingData: ListingData = {
            name: validatedData.name,
            description: validatedData.description,
            price: validatedData.price,
            quantity: validatedData.quantity,
            status: validatedData.status,
            store_id: validatedData.store_id,
            image_url: validatedData.images[0],
            slug: validatedData.slug || generateSlug(validatedData.name)
        };

        const images: ListingImage[] = validatedData.images.map((url, index) => ({
            image_url: url,
            display_order: index
        }));

        const { data, error } = await supabase.rpc('create_listing', {
            p_listing: listingData,
            p_categories: validatedData.categories,
            p_images: images,
            p_shipping_cost: validatedData.shipping_cost,
            p_user_id: userData.user.id
        });

        if (error) throw error;

        if (!data) {
            return {
                success: false,
                error: 'Failed to create listing'
            };
        }

        revalidatePath('/dashboard/sell');
        revalidatePath('/dashboard');
        revalidatePath('/marketplace');

        return {
            success: true,
            message: 'Listing created successfully',
            data
        };
    } catch (error) {
        return handleError(error);
    }
}

export async function updateListing(formData: ListingFormData): Promise<ActionResponse<ListingData>> {
    const supabase = await createSession();

    try {
        const validatedData = listingSchema.parse(formData);
        if (!validatedData.id) {
            return { success: false, error: 'Listing ID is required for updates' };
        }

        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            return { success: false, error: 'Authentication required' };
        }

        const listingData: ListingData = {
            name: validatedData.name,
            description: validatedData.description,
            price: validatedData.price,
            quantity: validatedData.quantity,
            status: validatedData.status,
            store_id: validatedData.store_id,
            image_url: validatedData.images[0],
            slug: validatedData.slug || generateSlug(validatedData.name)
        };

        const images: ListingImage[] = validatedData.images.map((url, index) => ({
            image_url: url,
            display_order: index
        }));

        const { data, error } = await supabase.rpc('update_listing', {
            p_listing_id: validatedData.id,
            p_listing: listingData,
            p_categories: validatedData.categories,
            p_images: images,
            p_shipping_cost: validatedData.shipping_cost,
            p_user_id: userData.user.id
        });

        if (error) throw error;

        if (!data) {
            return {
                success: false,
                error: 'Listing not found or you do not have permission to update it'
            };
        }

        revalidatePath('/dashboard/sell');
        revalidatePath('/dashboard');
        revalidatePath('/marketplace');
        revalidatePath(`/listing/${validatedData.slug}`);

        return {
            success: true,
            message: 'Listing updated successfully',
            data
        };
    } catch (error) {
        return handleError(error);
    }
}

export async function deleteListing(listingId: string): Promise<ActionResponse<boolean>> {
    const supabase = await createSession();

    try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            return { success: false, error: 'Authentication required' };
        }

        const { data, error } = await supabase.rpc('delete_listing', {
            p_listing_id: listingId,
            p_user_id: userData.user.id
        });

        if (error) throw error;

        if (!data) {
            return {
                success: false,
                error: 'Listing not found or you do not have permission to delete it'
            };
        }

        revalidatePath('/dashboard/sell');
        revalidatePath('/dashboard');
        revalidatePath('/marketplace');

        return {
            success: true,
            message: 'Listing deleted successfully',
            data
        };
    } catch (error) {
        return handleError(error);
    }
}

export async function getListingForEdit(listingId: string): Promise<ActionResponse<ListingFormData>> {
    const supabase = await createSession();

    try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
            return { success: false, error: 'Authentication required' };
        }

        const { data, error } = await supabase.rpc('get_listing_for_edit', {
            p_listing_id: listingId,
            p_user_id: userData.user.id
        });

        if (error) throw error;

        if (!data) {
            return {
                success: false,
                error: 'Listing not found or you do not have permission to edit it'
            };
        }

        return {
            success: true,
            data: {
                ...data.listing,
                categories: data.categories || [],
                images: (data.images || []).map((img: { image_url: string; }) => img.image_url),
                shipping_cost: data.shipping?.flat_rate || 0
            }
        };
    } catch (error) {
        return handleError(error);
    }
}

/**
 * Uploads an image file for a listing
 */
export { uploadListingImage } from '@/actions/listings-image-upload';

/**
 * Deletes an image file for a listing
 */
export { deleteListingImage } from '@/actions/listings-image-upload';

function handleError(error: unknown) {
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

// Helper function to generate slug from name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}