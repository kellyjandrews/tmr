// actions/favorites.ts
'use server';

import { createSession } from '@/utils/supabase/serverSide';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types/common';
import type { WishlistWithListing, FollowWithStore } from '@/types/interaction';

/**
 * Add a listing to the user's wishlist
 */
export async function addToWishlist(listingId: string): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Check if the listing exists
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('id')
            .eq('id', listingId)
            .single();

        if (listingError || !listing) {
            return {
                success: false,
                error: 'Listing not found'
            };
        }

        // Check if already in wishlist
        const { data: existingWishlist } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('listing_id', listingId)
            .single();

        // If already exists, return success
        if (existingWishlist) {
            return {
                success: true,
                message: 'Item already in wishlist'
            };
        }

        // Add to wishlist
        const { error: insertError } = await supabase
            .from('wishlists')
            .insert({
                user_id: userData.user.id,
                listing_id: listingId
            });

        if (insertError) {
            throw new Error(insertError.message);
        }

        // Revalidate paths
        revalidatePath('/dashboard/favorites');
        revalidatePath(`/listing/${listingId}`);

        return {
            success: true,
            message: 'Item added to wishlist'
        };
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Remove a listing from the user's wishlist
 */
export async function removeFromWishlist(listingId: string): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Remove from wishlist
        const { error: deleteError } = await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', userData.user.id)
            .eq('listing_id', listingId);

        if (deleteError) {
            throw new Error(deleteError.message);
        }

        // Revalidate paths
        revalidatePath('/dashboard/favorites');
        revalidatePath(`/listing/${listingId}`);

        return {
            success: true,
            message: 'Item removed from wishlist'
        };
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Check if a listing is in the user's wishlist
 */
export async function isInWishlist(listingId: string): Promise<ActionResponse<boolean>> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Check if in wishlist
        const { data, error: wishlistError } = await supabase
            .from('wishlists')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('listing_id', listingId)
            .single();

        if (wishlistError && wishlistError.code !== 'PGRST116') {
            // PGRST116 is "No rows returned" which is fine
            throw new Error(wishlistError.message);
        }

        return {
            success: true,
            data: !!data
        };
    } catch (error) {
        console.error('Error checking wishlist:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get all listings in the user's wishlist
 */
export async function getWishlist(): Promise<ActionResponse<WishlistWithListing[]>> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Get wishlist items with listing details
        const { data } = await supabase
            .from('wishlists')
            .select(`
        *,
        listing:listings(
          id, name, slug, description, price, image_url, status,
          stores:store_id(id, name, slug)
        )
      `)
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false });



        return {
            success: true,
            data: data as WishlistWithListing[]
        };
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Follow a store
 */
export async function followStore(storeId: string): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Check if the store exists
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('id')
            .eq('id', storeId)
            .single();

        if (storeError || !store) {
            return {
                success: false,
                error: 'Store not found'
            };
        }

        // Check if already following
        const { data: existingFollow } = await supabase
            .from('follows')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('store_id', storeId)
            .single();

        // If already following, return success
        if (existingFollow) {
            return {
                success: true,
                message: 'Already following this store'
            };
        }


        // Follow the store
        const { error: insertError } = await supabase
            .from('follows')
            .insert({
                user_id: userData.user.id,
                store_id: storeId
            });

        if (insertError) {
            throw new Error(insertError.message);
        }

        // Revalidate paths
        revalidatePath('/dashboard/favorites');
        revalidatePath(`/store/${storeId}`);

        return {
            success: true,
            message: 'Store followed successfully'
        };
    } catch (error) {
        console.error('Error following store:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Unfollow a store
 */
export async function unfollowStore(storeId: string): Promise<ActionResponse> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Unfollow the store
        const { error: deleteError } = await supabase
            .from('follows')
            .delete()
            .eq('user_id', userData.user.id)
            .eq('store_id', storeId);

        if (deleteError) {
            throw new Error(deleteError.message);
        }

        // Revalidate paths
        revalidatePath('/dashboard/favorites');
        revalidatePath(`/store/${storeId}`);

        return {
            success: true,
            message: 'Store unfollowed successfully'
        };
    } catch (error) {
        console.error('Error unfollowing store:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Check if a user is following a store
 */
export async function isFollowingStore(storeId: string): Promise<ActionResponse<boolean>> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Check if following
        const { data, error: followError } = await supabase
            .from('follows')
            .select('id')
            .eq('user_id', userData.user.id)
            .eq('store_id', storeId)
            .single();

        if (followError && followError.code !== 'PGRST116') {
            // PGRST116 is "No rows returned" which is fine
            throw new Error(followError.message);
        }

        return {
            success: true,
            data: !!data
        };
    } catch (error) {
        console.error('Error checking follow status:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get all stores followed by the user
 */
export async function getFollowedStores(): Promise<ActionResponse<FollowWithStore[]>> {
    const supabase = await createSession();

    try {
        // Get the current user
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
            return {
                success: false,
                error: 'Authentication required'
            };
        }

        // Get followed stores
        const { data, error: followsError } = await supabase
            .from('follows')
            .select(`
        *,
        store:store_id(id, name, slug, description, location)
      `)
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false });

        if (followsError) {
            throw new Error(followsError.message);
        }

        return {
            success: true,
            data: data as FollowWithStore[]
        };
    } catch (error) {
        console.error('Error fetching followed stores:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}