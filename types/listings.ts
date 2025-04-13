
export type Listing = {
    id: string;
    store_id: string;
    title: string;
    slug: string;
    description: string | null;
    brand_id: string | null;
    year: number | null;
    condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor' | null;
    model: string | null;
    as_is: boolean;
    is_digital: boolean;
    status: 'draft' | 'published' | 'sold' | 'archived';
    location: Record<string, unknown> | null;
    metadata: Record<string, unknown> | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    search_vector: unknown | null; // tsvector type
};

export type ListingImage = {
    id: string;
    listing_id: string;
    image_url: string;
    display_order: number;
    alt_text: string | null;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
};

export type ListingShipping = {
    id: string;
    listing_id: string;
    shipping_type: 'flat' | 'free' | 'calculated' | 'pickup' | null;
    flat_rate: number | null;
    dimensions: Record<string, unknown> | null;
    weight: number | null;
    carrier: string | null;
    international_shipping: boolean;
    created_at: string;
    updated_at: string;
};

export type ListingPrice = {
    id: string;
    listing_id: string;
    price: number;
    previous_price_id: string | null;
    is_current: boolean;
    created_at: string;
};

export type ListingMessage = {
    id: string;
    listing_id: string;
    sender_id: string;
    recipient_id: string;
    content: string;
    read: boolean;
    parent_message_id: string | null;
    created_at: string;
};

export type ListingOffer = {
    id: string;
    listing_id: string;
    sender_id: string;
    offer_amount: number;
    shipping_amount: number;
    min_acceptable_offer: number | null;
    status: 'active' | 'declined' | 'accepted' | 'expired' | 'countered';
    counter_offer_id: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
};

export type ListingFavorite = {
    id: string;
    listing_id: string;
    user_id: string;
    notification_preference: Record<string, unknown> | null;
    created_at: string;
};

export type ListingEvent = {
    id: string;
    listing_id: string;
    user_id: string | null;
    event_type: 'create' | 'update' | 'status_change' | 'price_change' | 'view' | 'share' | 'favorite';
    data: Record<string, unknown>;
    created_at: string;
};

export type ListingStatusHistory = {
    id: string;
    listing_id: string;
    status: 'draft' | 'published' | 'sold' | 'archived' | null;
    changed_by: string | null;
    reason: string | null;
    created_at: string;
};

export type ListingCategory = {
    id: string;
    listing_id: string;
    category_id: string;
    is_primary: boolean;
};

export type ListingTag = {
    id: string;
    listing_id: string;
    tag_id: string;
};

export type Inventory = {
    id: string;
    listing_id: string;
    sku: string | null;
    quantity_available: number;
    quantity_reserved: number;
    restock_threshold: number | null;
    warehouse_location: string | null;
    last_restock_date: string | null;
    next_restock_date: string | null;
    created_at: string;
    updated_at: string;
};

export type InventoryTransaction = {
    id: string;
    inventory_id: string;
    quantity_change: number;
    transaction_type: 'purchase' | 'sale' | 'return' | 'adjustment' | 'restock' | 'reservation' | null;
    order_id: string | null;
    cart_id: string | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
};

// Types for related entities
export type Brand = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    primary_category_id: string | null;
    verification_status: 'unverified' | 'pending' | 'verified' | null;
    metadata: Record<string, unknown> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type Category = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parent_category_id: string | null;
    taxonomy_type: 'product' | 'store' | 'content' | 'system' | null;
    level: number | null;
    is_active: boolean;
    display_order: number;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
};

export type Tag = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    type: 'product' | 'store' | 'user' | 'system' | null;
    parent_tag_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

// Composite types for frontend use
export type ListingWithDetails = Listing & {
    images: ListingImage[];
    currentPrice: ListingPrice | null;
    shipping: ListingShipping | null;
    brand: Brand | null;
    categories: (ListingCategory & { category: Category })[];
    tags: (ListingTag & { tag: Tag })[];
    inventory: Inventory | null;
};

export type ListingSearchResult = {
    id: string;
    title: string;
    price: number;
    condition: string | null;
    brand_name: string | null;
    primary_image_url: string | null;
    slug: string;
    rank: number;
};