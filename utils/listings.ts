// utils/listings.ts
import type {
    Listing,
    ListingStatus
} from '@/types/listing';
import type {
    GetListingByIdResponse,
    ListingWithStore,
    ListingCategory,
    FetchListingsResponse
} from '@/types/sproc-types';
import type { Category } from '@/types/category';

/**
 * Convert a database listing to the application Listing type
 */
export function mapDbListingToListing(dbListing: ListingWithStore): Listing {
    return {
        id: dbListing.id,
        store_id: dbListing.store_id,
        name: dbListing.name,
        description: dbListing.description,
        price: dbListing.price,
        quantity: dbListing.quantity,
        status: dbListing.status,
        image_url: dbListing.image_url,
        slug: dbListing.slug,
        category_id: dbListing.category_id || undefined,
        views_count: dbListing.views_count,
        featured: dbListing.featured,
        is_digital: dbListing.is_digital,
        created_at: dbListing.created_at,
        updated_at: dbListing.updated_at,
        stores: {
            id: dbListing.store_id,
            name: dbListing.store_name,
            slug: dbListing.store_slug,
            user_id: dbListing.store_user_id,
            created_at: dbListing.store_created_at
        }
    };
}

/**
 * Convert a stored procedure category to the application Category type
 */
export function mapSprocCategoryToCategory(cat: ListingCategory): Category {
    return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: null,
        parent_id: null,
        display_order: 0,
        is_featured: false,
        created_at: '',
        updated_at: ''
    };
}

/**
 * Transform a listing detail response to the full Listing type including relations
 */
export function mapListingDetailToListing(response: GetListingByIdResponse): Listing {
    // First map the base listing
    const listing = mapDbListingToListing(response.listing_details);

    // Add relations
    listing.categories = response.categories?.map(cat =>
        mapSprocCategoryToCategory(cat)
    ) || [];

    listing.images = response.images || [];
    listing.shipping = response.shipping || null;

    return listing;
}

/**
 * Transform fetch listings response to array of Listing objects
 */
export function mapFetchListingsResponse(response: FetchListingsResponse[]): {
    listings: Listing[];
    totalCount: number;
} {
    const listings = response.map(item => mapDbListingToListing(item.listing));
    const totalCount = response.length > 0 ? Number(response[0].total_count) : 0;

    return {
        listings,
        totalCount
    };
}

/**
 * Generate a URL-friendly slug from a string
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 50); // Limit slug length
}

/**
 * Format price for display
 */
export function formatPrice(price: number | string): string {
    const numericPrice = typeof price === 'string' ? Number.parseFloat(price) : price;
    return numericPrice.toFixed(2);
}

/**
 * Check if a listing can be edited by a user
 */
export function canEditListing(listing: Listing, userId: string): boolean {
    return listing.stores?.user_id === userId;
}

/**
 * Get status display information (color class and label)
 */
export function getStatusInfo(status: ListingStatus): {
    colorClass: string;
    label: string;
} {
    switch (status) {
        case 'draft':
            return {
                colorClass: 'bg-yellow-100 text-yellow-800',
                label: 'Draft'
            };
        case 'active':
            return {
                colorClass: 'bg-green-100 text-green-800',
                label: 'Active'
            };
        case 'hidden':
            return {
                colorClass: 'bg-gray-100 text-gray-800',
                label: 'Hidden'
            };
        case 'sold':
            return {
                colorClass: 'bg-blue-100 text-blue-800',
                label: 'Sold'
            };
        default:
            return {
                colorClass: 'bg-gray-100 text-gray-800',
                label: status
            };
    }
}