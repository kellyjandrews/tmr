// actions/listing.ts
'use server';

import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Validation schema for listing creation
const listingSchema = z.object({
    name: z.string().min(3, 'Listing name must be at least 3 characters'),
    description: z.string().optional(),
    price: z.number().min(0.01, 'Price must be greater than 0'),
    store_id: z.string().uuid('Invalid store ID'),
});

// Type for the listing form data
export type ListingFormData = z.infer<typeof listingSchema>;

// Type for server action responses
export type ActionResponse = {
    success: boolean;
    message?: string;
    error?: string;
    data?: unknown;
};

/**
 * Create a new listing for a store
 */
export async function createListing(formData: ListingFormData): Promise<ActionResponse> {
    try {
        // Validate form data
        const validatedData = listingSchema.parse(formData);

        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return {
                success: false,
                error: 'You must be logged in to create a listing'
            };
        }

        // Check if store belongs to the user
        const { data: store } = await supabase
            .from('stores')
            .select('id, slug')
            .eq('id', validatedData.store_id)
            .eq('user_id', session.user.id)
            .single();

        if (!store) {
            return {
                success: false,
                error: 'Store not found or you do not have permission to add listings to it'
            };
        }

        // Create the listing
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .insert({
                name: validatedData.name,
                description: validatedData.description || null,
                price: validatedData.price,
                store_id: validatedData.store_id
            })
            .select()
            .single();

        if (listingError) throw new Error(listingError.message);

        // Revalidate the paths after listing creation
        revalidatePath('/dashboard');
        revalidatePath(`/store/${store.slug}`);

        return {
            success: true,
            message: 'Listing created successfully',
            data: listing
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get listings for a store
 */
export async function getStoreListings(storeId: string): Promise<ActionResponse> {
    try {
        const { data: listings, error: listingsError } = await supabase
            .from('listings')
            .select('*')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (listingsError) throw new Error(listingsError.message);

        return {
            success: true,
            data: listings
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get a single listing by ID
 */
export async function getListingById(listingId: string): Promise<ActionResponse> {
    try {
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('*, stores(id, name, slug, user_id)')
            .eq('id', listingId)
            .single();

        if (listingError) throw new Error(listingError.message);

        return {
            success: true,
            data: listing
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Update a listing
 */
export async function updateListing(
    listingId: string,
    formData: Omit<ListingFormData, 'store_id'>
): Promise<ActionResponse> {
    try {
        // Validate form data (excluding store_id)
        const validationSchema = listingSchema.omit({ store_id: true });
        const validatedData = validationSchema.parse(formData);

        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return {
                success: false,
                error: 'You must be logged in to update a listing'
            };
        }

        // Get the listing to check ownership
        const { data: listing } = await supabase
            .from('listings')
            .select('*, stores(id, slug, user_id)')
            .eq('id', listingId)
            .single();

        if (!listing) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        // Check if store belongs to the user
        if (listing.stores.user_id !== session.user.id) {
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
                description: validatedData.description || null,
                price: validatedData.price,
                updated_at: new Date().toISOString()
            })
            .eq('id', listingId)
            .select()
            .single();

        if (updateError) throw new Error(updateError.message);

        // Revalidate the paths after listing update
        revalidatePath('/dashboard');
        revalidatePath(`/store/${listing.stores.slug}`);
        revalidatePath(`/listing/${listingId}`);

        return {
            success: true,
            message: 'Listing updated successfully',
            data: updatedListing
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                error: error.errors.map(e => `${e.path}: ${e.message}`).join(', ')
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
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return {
                success: false,
                error: 'You must be logged in to delete a listing'
            };
        }

        // Get the listing to check ownership and get the store slug
        const { data: listing } = await supabase
            .from('listings')
            .select('*, stores(id, slug, user_id)')
            .eq('id', listingId)
            .single();

        if (!listing) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        // Check if store belongs to the user
        if (listing.stores.user_id !== session.user.id) {
            return {
                success: false,
                error: 'You do not have permission to delete this listing'
            };
        }

        // Delete the listing
        const { error: deleteError } = await supabase
            .from('listings')
            .delete()
            .eq('id', listingId);

        if (deleteError) throw new Error(deleteError.message);

        // Revalidate the paths after listing deletion
        revalidatePath('/dashboard');
        revalidatePath(`/store/${listing.stores.slug}`);

        return {
            success: true,
            message: 'Listing deleted successfully'
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}