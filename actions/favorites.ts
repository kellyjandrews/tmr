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

        // Use the stored procedure to add to wishlist
        const { data: wishlistId, error: wishlistError } = await supabase
            .rpc('add_to_wishlist', {
                user_id_param: userData.user.id,
                listing_id_param: listingId
            });

        if (wishlistError) {
            throw new Error(wishlistError.message);
        }

        // Revalidate paths
        revalidatePath('/dashboard/favorites');
        revalidatePath(`/listing/${listingId}`);

        return {
            success: true,
            message: 'Item added to wishlist',
            data: wishlistId
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

        // Use the stored procedure to remove from wishlist
        const { data: success, error: removeError } = await supabase
            .rpc('remove_from_wishlist', {
                user_id_param: userData.user.id,
                listing_id_param: listingId
            });

        if (removeError) {
            throw new Error(removeError.message);
        }

        if (!success) {
            return {
                success: false,
                error: 'Item not found in wishlist'
            };
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

        // Use the stored procedure to check if in wishlist
        const { data: isInWishlist, error: checkError } = await supabase
            .rpc('is_in_wishlist', {
                user_id_param: userData.user.id,
                listing_id_param: listingId
            });

        if (checkError) {
            throw new Error(checkError.message);
        }

        return {
            success: true,
            data: isInWishlist
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

        // Use the stored procedure to get wishlist items with details
        const { data, error: wishlistError } = await supabase
            .rpc('get_user_wishlist', {
                user_id_param: userData.user.id
            });

        if (wishlistError) {
            throw new Error(wishlistError.message);
        }

        // Format the data to match the expected WishlistWithListing type
        const formattedItems: WishlistWithListing[] = data.map(item => ({
            id: item.id,
            user_id: item.user_id,
            listing_id: item.listing_id,
            notes: item.notes,
            created_at: item.created_at,
            listing: {
                id: item.listing_id,
                name: item.listing_name,
                slug: item.listing_slug,
                description: item.listing_description,
                price: item.listing_price,
                image_url: item.listing_image_url,
                status: item.listing_status,
                stores: {
                    id: item.store_id,
                    name: item.store_name,
                    slug: item.store_slug
                }
            }
        }));

        return {
            success: true,
            data: formattedItems
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

        // Use the stored procedure to follow store
        const { data: followId, error: followError } = await supabase
            .rpc('follow_store', {
                user_id_param: userData.user.id,
                store_id_param: storeId
            });

        if (followError) {
            throw new Error(followError.message);
        }

        // Revalidate paths
        revalidatePath('/dashboard/favorites');
        revalidatePath(`/store/${storeId}`);

        return {
            success: true,
            message: 'Store followed successfully',
            data: followId
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

        // Use the stored procedure to unfollow store
        const { data: success, error: unfollowError } = await supabase
            .rpc('unfollow_store', {
                user_id_param: userData.user.id,
                store_id_param: storeId
            });

        if (unfollowError) {
            throw new Error(unfollowError.message);
        }

        if (!success) {
            return {
                success: false,
                error: 'User was not following this store'
            };
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

        // Use the stored procedure to check if following store
        const { data: isFollowing, error: checkError } = await supabase
            .rpc('is_following_store', {
                user_id_param: userData.user.id,
                store_id_param: storeId
            });

        if (checkError) {
            throw new Error(checkError.message);
        }

        return {
            success: true,
            data: isFollowing
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

        // Use the stored procedure to get followed stores with details
        const { data, error: followsError } = await supabase
            .rpc('get_followed_stores', {
                user_id_param: userData.user.id
            });

        if (followsError) {
            throw new Error(followsError.message);
        }

        // Format the data to match the expected FollowWithStore type
        const formattedStores: FollowWithStore[] = data.map(item => ({
            id: item.id,
            user_id: item.user_id,
            store_id: item.store_id,
            created_at: item.created_at,
            store: {
                id: item.store_id,
                name: item.store_name,
                slug: item.store_slug,
                description: item.store_description,
                location: item.store_location
            }
        }));

        return {
            success: true,
            data: formattedStores
        };
    } catch (error) {
        console.error('Error fetching followed stores:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get the count of users who have favorited a listing
 */
export async function getListingFavoritesCount(listingId: string): Promise<ActionResponse<number>> {
    const supabase = await createSession();

    try {
        // Use the stored procedure to get favorites count
        const { data: count, error: countError } = await supabase
            .rpc('get_listing_favorites_count', {
                listing_id_param: listingId
            });

        if (countError) {
            throw new Error(countError.message);
        }

        return {
            success: true,
            data: count
        };
    } catch (error) {
        console.error('Error getting favorites count:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get the count of followers for a store
 */
export async function getStoreFollowersCount(storeId: string): Promise<ActionResponse<number>> {
    const supabase = await createSession();

    try {
        // Use the stored procedure to get followers count
        const { data: count, error: countError } = await supabase
            .rpc('get_store_followers_count', {
                store_id_param: storeId
            });

        if (countError) {
            throw new Error(countError.message);
        }

        return {
            success: true,
            data: count
        };
    } catch (error) {
        console.error('Error getting followers count:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}