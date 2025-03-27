// actions/cart.ts
'use server';

import { createSession } from '@/utils/supabase/serverSide';
import { revalidatePath } from 'next/cache';
import type { CartSummary, CartUpdateInput, CartSprocData, CartItemWithListing } from '@/types/cart';
import type { ActionResponse } from '@/types/common';



/**
 * Get the current user's cart
 */
export async function getCart(): Promise<ActionResponse<CartSummary>> {
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

        // Get cart items with listing details using stored procedure
        const { data, error: cartError } = await supabase
            .rpc('get_cart_with_details', { user_id_param: userData.user.id })

        const cartItems: CartSprocData[] = data;

        if (cartError) {
            throw new Error(cartError.message);
        }

        // Calculate totals
        let subtotal = 0;
        let itemCount = 0;

        // Format the cart items to match our expected structure
        const formattedItems: CartItemWithListing[] = cartItems.map(item => {
            const price = Number(item.listing_price) || 0;
            subtotal += price * item.quantity;
            itemCount += item.quantity;

            return {
                id: item.id,
                user_id: item.user_id,
                listing_id: item.listing_id,
                quantity: item.quantity,
                added_at: item.added_at,
                updated_at: item.updated_at,
                listing: {
                    id: item.listing_id,
                    name: item.listing_name,
                    price: item.listing_price,
                    image_url: item.listing_image_url,
                    stores: {
                        id: item.store_id,
                        name: item.store_name,
                        slug: item.store_slug
                    }
                }
            };
        });

        // Simple calculation for shipping and tax
        const shipping = 0; // Free shipping for now
        const tax = subtotal * 0.1; // 10% tax rate
        const total = subtotal + shipping + tax;

        return {
            success: true,
            data: {
                items: formattedItems,
                itemCount,
                subtotal,
                shipping,
                tax,
                total
            }
        };
    } catch (error) {
        console.error('Error fetching cart:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Add an item to the cart
 */
export async function addToCart(listingId: string, quantity = 1): Promise<ActionResponse> {
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

        // Check if the listing exists and is active
        const { data: listing, error: listingError } = await supabase
            .from('listings')
            .select('id, status')
            .eq('id', listingId)
            .eq('status', 'active')
            .single();

        if (listingError || !listing) {
            return {
                success: false,
                error: 'Item not available or does not exist'
            };
        }

        // Validate quantity
        if (quantity <= 0) {
            return {
                success: false,
                error: 'Quantity must be greater than 0'
            };
        }

        // Use stored procedure to add to cart
        const { error: addError } = await supabase
            .rpc('add_to_cart', {
                user_id_param: userData.user.id,
                listing_id_param: listingId,
                quantity_param: quantity
            });

        if (addError) {
            throw new Error(addError.message);
        }

        // Revalidate cart page and listing page
        revalidatePath('/cart');
        revalidatePath(`/listing/${listingId}`);

        return {
            success: true,
            message: 'Item added to cart'
        };
    } catch (error) {
        console.error('Error adding to cart:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(data: CartUpdateInput): Promise<ActionResponse> {
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
            .select('id, status')
            .eq('id', data.listing_id)
            .single();

        if (listingError || !listing) {
            return {
                success: false,
                error: 'Item not found'
            };
        }

        // Validate quantity
        if (data.quantity <= 0) {
            // If quantity is 0 or negative, remove from cart
            return await removeFromCart(data.listing_id);
        }

        // Update cart item
        const { error: updateError } = await supabase
            .from('shopping_cart')
            .update({
                quantity: data.quantity,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userData.user.id)
            .eq('listing_id', data.listing_id);

        if (updateError) {
            throw new Error(updateError.message);
        }

        // Revalidate cart page
        revalidatePath('/cart');

        return {
            success: true,
            message: 'Cart updated'
        };
    } catch (error) {
        console.error('Error updating cart:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Remove an item from the cart
 */
export async function removeFromCart(listingId: string): Promise<ActionResponse> {
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

        // Remove the item from cart
        const { error: removeError } = await supabase
            .from('shopping_cart')
            .delete()
            .eq('user_id', userData.user.id)
            .eq('listing_id', listingId);

        if (removeError) {
            throw new Error(removeError.message);
        }

        // Revalidate cart page and listing page
        revalidatePath('/cart');
        revalidatePath(`/listing/${listingId}`);

        return {
            success: true,
            message: 'Item removed from cart'
        };
    } catch (error) {
        console.error('Error removing from cart:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Clear the entire cart
 */
export async function clearCart(): Promise<ActionResponse> {
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

        // Clear the entire cart
        const { error: clearError } = await supabase
            .from('shopping_cart')
            .delete()
            .eq('user_id', userData.user.id);

        if (clearError) {
            throw new Error(clearError.message);
        }

        // Revalidate cart page
        revalidatePath('/cart');

        return {
            success: true,
            message: 'Cart cleared'
        };
    } catch (error) {
        console.error('Error clearing cart:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}

/**
 * Get the number of users interested in an item
 */
export async function getItemInterest(listingId: string): Promise<ActionResponse<number>> {
    const supabase = await createSession();

    try {
        // Use stored procedure to get interest count
        const { data: interestCount, error: countError } = await supabase
            .rpc('get_item_interest', { listing_id_param: listingId });

        if (countError) {
            throw new Error(countError.message);
        }

        return {
            success: true,
            data: interestCount
        };
    } catch (error) {
        console.error('Error getting item interest:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unknown error occurred'
        };
    }
}