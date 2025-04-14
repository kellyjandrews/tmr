// app/actions/search.ts
'use server'

import { createSession } from '@/lib/supabase/serverSide'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * Search listings
 */
export async function searchListings(params: {
    query?: string,
    categoryId?: string,
    brandId?: string,
    minPrice?: number,
    maxPrice?: number,
    condition?: string[],
    page?: number,
    perPage?: number,
    sortBy?: string,
    sortDirection?: 'asc' | 'desc'
}) {
    const {
        query,
        categoryId,
        brandId,
        minPrice,
        maxPrice,
        condition,
        page = 1,
        perPage = 20,
        sortBy = 'created_at',
        sortDirection = 'desc'
    } = params

    const supabase = createSession()

    let queryBuilder = supabase
        .from('listings')
        .select(`
      *,
      store:stores(id, name, slug),
      images:listing_images(image_url, is_primary),
      currentPrice:listing_prices(price)
    `, { count: 'exact' })
        .eq('status', 'published')
        .is('deleted_at', null)
        .eq('listing_prices.is_current', true)

    // Apply search query if provided
    if (query && query.trim() !== '') {
        queryBuilder = queryBuilder.textSearch('search_vector', query)
    }

    // Apply filters if provided
    if (categoryId) {
        queryBuilder = queryBuilder.eq('listing_categories.category_id', categoryId)
    }

    if (brandId) {
        queryBuilder = queryBuilder.eq('brand_id', brandId)
    }

    if (minPrice !== undefined) {
        queryBuilder = queryBuilder.gte('listing_prices.price', minPrice)
    }

    if (maxPrice !== undefined) {
        queryBuilder = queryBuilder.lte('listing_prices.price', maxPrice)
    }

    if (condition && condition.length > 0) {
        queryBuilder = queryBuilder.in('condition', condition)
    }

    // Apply sorting
    if (sortBy === 'price') {
        queryBuilder = queryBuilder.order('listing_prices.price', { ascending: sortDirection === 'asc' })
    } else if (sortBy === 'rating') {
        // Join with review data for rating sort
        queryBuilder = queryBuilder
            .select(`
        *,
        store:stores(id, name, slug),
        images:listing_images(image_url, is_primary),
        currentPrice:listing_prices(price),
        reviews:reviews(rating)
      `)
            .order('reviews.avg(rating)', { ascending: sortDirection === 'asc' })
    } else {
        queryBuilder = queryBuilder.order(sortBy, { ascending: sortDirection === 'asc' })
    }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    queryBuilder = queryBuilder.range(from, to)

    const { data, error, count } = await queryBuilder

    if (error) return { listings: [], count: 0 }

    // Transform the results for easier use in the UI
    return {
        listings: data.map(listing => ({
            ...listing,
            price: listing.currentPrice?.[0]?.price || 0,
            primaryImage: listing.images?.find(img => img.is_primary)?.image_url || listing.images?.[0]?.image_url,
            averageRating: listing.reviews
                ? listing.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / listing.reviews.length
                : null
        })),
        count: count || 0
    }
}

/**
 * Search stores
 */
export async function searchStores(params: {
    query?: string,
    categoryId?: string,
    page?: number,
    perPage?: number,
    sortBy?: string,
    sortDirection?: 'asc' | 'desc'
}) {
    const {
        query,
        categoryId,
        page = 1,
        perPage = 20,
        sortBy = 'rating',
        sortDirection = 'desc'
    } = params

    const supabase = createSession()

    let queryBuilder = supabase
        .from('stores')
        .select(`
      id,
      name, 
      slug,
      description,
      logo_url,
      total_listings,
      rating
    `, { count: 'exact' })
        .eq('status', 'active')
        .is('deleted_at', null)

    // Apply search query if provided
    if (query && query.trim() !== '') {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    // Filter by category if provided
    if (categoryId) {
        queryBuilder = queryBuilder.eq('store_categories.category_id', categoryId)
    }

    // Apply sorting
    if (sortBy === 'total_listings') {
        queryBuilder = queryBuilder.order('total_listings', { ascending: sortDirection === 'asc' })
    } else if (sortBy === 'name') {
        queryBuilder = queryBuilder.order('name', { ascending: sortDirection === 'asc' })
    } else {
        queryBuilder = queryBuilder.order('rating', { ascending: sortDirection === 'asc' })
    }

    // Apply pagination
    const from = (page - 1) * perPage
    const to = from + perPage - 1

    const { data, error, count } = await queryBuilder.range(from, to)

    if (error) return { stores: [], count: 0 }

    return {
        stores: data,
        count: count || 0
    }
}

/**
 * Auto-complete search suggestions
 */
export async function getSearchSuggestions(prefix: string, limit = 10) {
    const supabase = createSession()

    if (!prefix || prefix.trim().length < 2) return []

    const { data, error } = await supabase
        .from('search_suggestions')
        .select('suggestion, category, is_promoted')
        .ilike('prefix', `${prefix.toLowerCase()}%`)
        .order('is_promoted', { ascending: false })
        .order('display_priority', { ascending: true })
        .order('usage_count', { ascending: false })
        .limit(limit)

    if (error) return []

    return data
}

/**
 * Popular search terms
 */
export async function getPopularSearchTerms(limit = 10) {
    const supabase = createSession()

    const { data, error } = await supabase
        .from('popular_search_terms')
        .select('term, search_count, trending_score')
        .order('trending_score', { ascending: false })
        .limit(limit)

    if (error) return []

    return data
}

/**
 * Record search history
 */
export async function recordSearch(searchData: {
    query: string,
    filters?: Record<string, any>,
    resultsCount: number,
    deviceType?: string,
    coordinates?: { latitude: number, longitude: number }
}) {
    const supabase = createSession()

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Get session ID from cookies for guest users
    let sessionId = null
    // In a real implementation, you would get the session ID from cookies here

    // Record search history
    const { error } = await supabase
        .from('search_history')
        .insert({
            account_id: user?.id || null,
            session_id: !user ? sessionId : null,
            query: searchData.query,
            filters: searchData.filters || null,
            results_count: searchData.resultsCount,
            device_type: searchData.deviceType || null,
            location: searchData.coordinates ? {
                latitude: searchData.coordinates.latitude,
                longitude: searchData.coordinates.longitude
            } : null
        })

    // Increment search count in popular search terms (upsert)
    await supabase.rpc('increment_search_term', {
        p_term: searchData.query.toLowerCase(),
        p_result_count: searchData.resultsCount
    })

    return { success: !error }
}

/**
 * Record search result click
 */
export async function recordSearchClick(searchHistoryId: string, clickedId: string) {
    const supabase = createSession()

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser()

    // Update search history with clicked result
    const { error } = await supabase
        .from('search_history')
        .update({
            clicked_results: supabase.rpc('append_to_array', {
                arr: 'clicked_results',
                new_element: clickedId
            })
        })
        .eq('id', searchHistoryId)
        .eq('account_id', user?.id || null)

    return { success: !error }
}

/**
 * Get product recommendations
 */
export async function getRecommendations(params: {
    listingId?: string,
    type?: 'similar_item' | 'frequently_bought_together' | 'viewed_also_viewed' | 'personalized',
    limit?: number
}) {
    const {
        listingId,
        type = 'similar_item',
        limit = 5
    } = params

    const supabase = createSession()

    // Get current user if logged in
    const { data: { user } } = await supabase.auth.getUser()

    let queryBuilder = supabase
        .from('product_recommendations')
        .select(`
      listing_id,
      recommendation_type,
      confidence_score,
      listing:listings(
        id, title, slug,
        currentPrice:listing_prices(price),
        images:listing_images(image_url, is_primary),
        reviews:reviews(rating)
      )
    `)
        .eq('listing_prices.is_current', true)
        .eq('listings.status', 'published')
        .is('listings.deleted_at', null)
        .limit(limit)

    if (listingId) {
        queryBuilder = queryBuilder.eq('source_listing_id', listingId)
    }

    if (type) {
        queryBuilder = queryBuilder.eq('recommendation_type', type)
    }

    // For personalized recommendations, filter to current user
    if (type === 'personalized' && user) {
        queryBuilder = queryBuilder.eq('account_id', user.id)
    }

    // Apply ordering
    queryBuilder = queryBuilder.order('confidence_score', { ascending: false })

    // Execute query
    const { data, error } = await queryBuilder

    if (error) return []

    // Transform results to more useful format
    return data.map(item => ({
        id: item.listing_id,
        title: item.listing.title,
        slug: item.listing.slug,
        price: item.listing.currentPrice?.[0]?.price || 0,
        image_url: item.listing.images?.find((img: any) => img.is_primary)?.image_url ||
            item.listing.images?.[0]?.image_url,
        rating: item.listing.reviews
            ? (item.listing.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) /
                item.listing.reviews.length)
            : null,
        review_count: item.listing.reviews?.length || 0,
        confidence_score: item.confidence_score,
        recommendation_type: item.recommendation_type
    }))
}

/**
 * Get search analytics
 */
export async function getSearchAnalytics(timeRange: 'day' | 'week' | 'month' = 'week') {
    const supabase = createSession()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Verify admin access
    const { data: account } = await supabase
        .from('accounts')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!account || !['admin', 'moderator'].includes(account.role)) {
        throw new Error('You do not have permission to view analytics')
    }

    // Get analytics data
    const { data, error } = await supabase
        .rpc('get_search_analytics', {
            p_time_range: timeRange
        })

    if (error) return null

    return data
}