// actions/reviews.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { Review, ReviewResponse, ReviewVote } from '@/types/stores'

/**
 * Get reviews for a listing
 */
export async function getListingReviews(listingId: string, page: number = 1, perPage: number = 10) {
    const supabase = createSession()

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await supabase
        .from('reviews')
        .select(`
      *,
      account:accounts(id, username, profile_picture_url),
      responses:review_responses(
        id, content, is_seller, created_at,
        responder:accounts(id, username, profile_picture_url)
      )
    `, { count: 'exact' })
        .eq('listing_id', listingId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) return { reviews: [], count: 0 }

    // Get current user's votes on these reviews
    const { data: { user } } = await supabase.auth.getUser()

    let userVotes: Record<string, boolean> = {}

    if (user) {
        const { data: votes } = await supabase
            .from('review_votes')
            .select('review_id, is_helpful')
            .eq('account_id', user.id)
            .in('review_id', data.map(review => review.id))

        if (votes) {
            userVotes = votes.reduce((acc, vote) => {
                acc[vote.review_id] = vote.is_helpful
                return acc
            }, {} as Record<string, boolean>)
        }
    }

    return {
        reviews: data.map(review => ({
            ...review,
            user_vote: userVotes[review.id]
        })),
        count: count || 0
    }
}

/**
 * Get review summary for a listing
 */
export async function getListingReviewSummary(listingId: string) {
    const supabase = createSession()

    const { data, error } = await supabase
        .rpc('get_listing_review_summary', {
            p_listing_id: listingId
        })

    if (error) return null

    return data
}

/**
 * Create a new review
 */
export async function createReview(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to leave a review')

    const listingId = formData.get('listing_id') as string
    const orderId = formData.get('order_id') as string || null

    // Verify the listing exists
    const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, store_id')
        .eq('id', listingId)
        .single()

    if (listingError || !listing) throw new Error('Listing not found')

    // Check if user has already reviewed this listing
    const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('listing_id', listingId)
        .eq('account_id', user.id)
        .single()

    if (existingReview) throw new Error('You have already reviewed this listing')

    const schema = z.object({
        rating: z.number().min(1).max(5),
        title: z.string().max(200).optional(),
        content: z.string().min(10).max(2000).optional(),
        photos: z.array(z.object({
            url: z.string().url(),
            caption: z.string().max(200).optional()
        })).optional()
    })

    // Parse and validate form data
    const parsed = schema.parse({
        rating: parseInt(formData.get('rating') as string),
        title: formData.get('title') || undefined,
        content: formData.get('content') || undefined,
        photos: formData.has('photos') ? JSON.parse(formData.get('photos') as string) : undefined
    })

    // Determine if this is a verified purchase
    let verifiedPurchase = false
    if (orderId) {
        const { data: order } = await supabase
            .from('orders')
            .select('id')
            .eq('id', orderId)
            .eq('account_id', user.id)
            .eq('status', 'delivered')
            .single()

        verifiedPurchase = !!order
    } else {
        // Check if user has any delivered orders with this listing
        const { data: orders } = await supabase
            .from('orders')
            .select(`
                id,
                items:order_items(listing_id)
            `)
            .eq('account_id', user.id)
            .eq('status', 'delivered')

        if (orders) {
            verifiedPurchase = orders.some(order =>
                order.items.some((item: any) => item.listing_id === listingId)
            )
        }
    }

    // Format photos object if present
    let photosObject = null
    if (parsed.photos && parsed.photos.length > 0) {
        photosObject = {
            urls: parsed.photos.map(p => p.url),
            captions: parsed.photos.reduce((acc, p, index) => {
                if (p.caption) acc[index.toString()] = p.caption
                return acc
            }, {} as Record<string, string>),
            primary_index: 0
        }
    }

    // Create review
    const { data: review, error } = await supabase
        .from('reviews')
        .insert({
            account_id: user.id,
            listing_id: listingId,
            order_id: orderId,
            store_id: listing.store_id,
            rating: parsed.rating,
            title: parsed.title,
            content: parsed.content,
            verified_purchase: verifiedPurchase,
            status: 'pending', // Requires approval
            photos: photosObject
        })
        .select()
        .single()

    if (error) throw new Error(`Failed to create review: ${error.message}`)

    revalidatePath(`/listings/${listingId}`)
    return { success: true, reviewId: review.id }
}

/**
 * Respond to a review
 */
export async function respondToReview(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to respond to a review')

    const reviewId = formData.get('review_id') as string
    const content = formData.get('content') as string

    if (!content || content.trim().length === 0) {
        throw new Error('Response content is required')
    }

    // Determine if user is a seller for this listing
    const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('listing_id, store_id, stores!inner(owner_id)')
        .eq('id', reviewId)
        .single()

    if (reviewError || !review) throw new Error('Review not found')

    const isSeller = review.stores.owner_id === user.id

    // Create response
    const { error } = await supabase
        .from('review_responses')
        .insert({
            review_id: reviewId,
            account_id: user.id,
            content,
            is_seller: isSeller,
            status: 'active'
        })

    if (error) throw new Error(`Failed to respond to review: ${error.message}`)

    revalidatePath(`/listings/${review.listing_id}`)
    return { success: true }
}

/**
 * Vote on a review
 */
export async function voteOnReview(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to vote on reviews')

    const reviewId = formData.get('review_id') as string
    const isHelpful = formData.get('is_helpful') === 'true'

    // Check if user has already voted on this review
    const { data: existingVote } = await supabase
        .from('review_votes')
        .select('id, is_helpful')
        .eq('review_id', reviewId)
        .eq('account_id', user.id)
        .single()

    if (existingVote) {
        // Update existing vote
        if (existingVote.is_helpful !== isHelpful) {
            await supabase
                .from('review_votes')
                .update({ is_helpful: isHelpful })
                .eq('id', existingVote.id)
        } else {
            // Delete vote if same (toggle off)
            await supabase
                .from('review_votes')
                .delete()
                .eq('id', existingVote.id)
        }
    } else {
        // Create new vote
        await supabase
            .from('review_votes')
            .insert({
                review_id: reviewId,
                account_id: user.id,
                is_helpful: isHelpful
            })
    }

    // The review's helpful_votes count is updated automatically by database trigger

    // Get the listing ID for this review to revalidate path
    const { data: review } = await supabase
        .from('reviews')
        .select('listing_id')
        .eq('id', reviewId)
        .single()

    if (review) {
        revalidatePath(`/listings/${review.listing_id}`)
    }

    return { success: true }
}

/**
 * Get user's reviews
 */
export async function getUserReviews(page: number = 1, perPage: number = 10) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { reviews: [], count: 0 }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await supabase
        .from('reviews')
        .select(`
      *,
      listing:listings(id, title, slug, images:listing_images(image_url, is_primary)),
      responses:review_responses(*)
    `, { count: 'exact' })
        .eq('account_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) return { reviews: [], count: 0 }

    return {
        reviews: data.map(review => ({
            ...review,
            listing: {
                ...review.listing,
                image_url: review.listing?.images?.find((img: any) => img.is_primary)?.image_url ||
                    review.listing?.images?.[0]?.image_url
            }
        })),
        count: count || 0
    }
}

/**
 * Get store reviews (continued)
 */
export async function getStoreReviews(storeId: string, page: number = 1, perPage: number = 10) {
    const supabase = createSession()

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await supabase
        .from('reviews')
        .select(`
      *,
      account:accounts(id, username, profile_picture_url),
      listing:listings(id, title, slug, images:listing_images(image_url, is_primary)),
      responses:review_responses(
        id, content, is_seller, created_at,
        responder:accounts(id, username, profile_picture_url)
      )
    `, { count: 'exact' })
        .eq('store_id', storeId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(from, to)

    if (error) return { reviews: [], count: 0 }

    return {
        reviews: data.map(review => ({
            ...review,
            listing: {
                ...review.listing,
                image_url: review.listing?.images?.find((img: any) => img.is_primary)?.image_url ||
                    review.listing?.images?.[0]?.image_url
            }
        })),
        count: count || 0
    }
}

/**
 * Get store review summary
 */
export async function getStoreReviewSummary(storeId: string) {
    const supabase = createSession()

    const { data, error } = await supabase
        .rpc('get_store_review_summary', {
            p_store_id: storeId
        })

    if (error) return null

    return data
}

/**
 * Moderate a review (for store owners and admins)
 */
export async function moderateReview(formData: FormData) {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const reviewId = formData.get('review_id') as string
    const action = formData.get('action') as 'approve' | 'reject' | 'flag'

    // Verify the user has permission to moderate this review
    const { data: review, error: reviewError } = await supabase
        .from('reviews')
        .select('store_id, stores!inner(owner_id)')
        .eq('id', reviewId)
        .single()

    if (reviewError || !review) throw new Error('Review not found')

    // Check if user is the store owner
    if (review.stores.owner_id !== user.id) {
        // Check if user is an admin
        const { data: account } = await supabase
            .from('accounts')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!account || !['admin', 'moderator'].includes(account.role)) {
            throw new Error('You do not have permission to moderate this review')
        }
    }

    // Update review status
    const { error } = await supabase
        .from('reviews')
        .update({
            status: action === 'approve' ? 'approved' : (action === 'reject' ? 'rejected' : 'flagged'),
            approved_at: action === 'approve' ? new Date().toISOString() : null
        })
        .eq('id', reviewId)

    if (error) throw new Error(`Failed to moderate review: ${error.message}`)

    revalidatePath('/dashboard/reviews')
    return { success: true }
}