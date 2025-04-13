export type Cart = {
    id: string;
    account_id: string | null;
    status: 'active' | 'checkout' | 'completed' | 'abandoned' | 'merged';
    subtotal: number;
    total_discounts: number;
    total_shipping: number;
    total_tax: number;
    total_price: number;
    currency: string;
    shipping_address_id: string | null;
    billing_address_id: string | null;
    selected_payment_id: string | null;
    notes: string | null;
    metadata: Record<string, unknown> | null;
    expires_at: string | null;
    last_activity_at: string;
    merged_to_cart_id: string | null;
    device_id: string | null;
    ip_address: string | null;
    user_agent: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
};

export type CartItem = {
    id: string;
    cart_id: string;
    listing_id: string;
    price_snapshot: number;
    quantity: number;
    selected_options: Record<string, unknown> | null;
    custom_instructions: string | null;
    discounted_price: number | null;
    item_subtotal: number;
    is_gift: boolean;
    gift_message: string | null;
    added_at: string;
    updated_at: string;
};

export type CartCoupon = {
    id: string;
    cart_id: string;
    coupon_id: string;
    coupon_code: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | null;
    discount_value: number;
    applied_discount: number;
    affects_items: string[];
    applies_to_shipping: boolean;
    is_active: boolean;
    application_order: number;
    created_at: string;
    updated_at: string;
};

export type SavedCartItem = {
    id: string;
    account_id: string;
    listing_id: string;
    collection_name: string | null;
    notes: string | null;
    price_at_save: number | null;
    selected_options: Record<string, unknown> | null;
    quantity: number;
    is_in_stock: boolean | null;
    moved_to_cart_at: string | null;
    is_public: boolean;
    notify_on_price_drop: boolean;
    notify_on_back_in_stock: boolean;
    created_at: string;
    updated_at: string;
};

export type CartShippingOption = {
    id: string;
    cart_id: string;
    shipping_method: 'standard' | 'expedited' | 'express' | 'overnight' | 'international' | 'pickup' | null;
    carrier: string | null;
    estimated_cost: number;
    estimated_delivery_min: number | null;
    estimated_delivery_max: number | null;
    is_selected: boolean;
    tracking_available: boolean;
    insurance_available: boolean;
    insurance_cost: number | null;
    created_at: string;
    updated_at: string;
};

export type CartEvent = {
    id: string;
    cart_id: string;
    account_id: string | null;
    event_type: 'create' | 'update' | 'add_item' | 'remove_item' | 'update_quantity' |
    'apply_coupon' | 'remove_coupon' | 'checkout_start' | 'checkout_complete' |
    'merge_carts' | 'abandon';
    data: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
};

// Address and payment types needed for cart functionality
export type AccountAddress = {
    id: string;
    account_id: string;
    address_type: 'shipping' | 'billing' | 'primary' | 'work' | 'home' | 'temporary' | 'pickup' | null;
    full_name: string;
    organization_name: string | null;
    street_address: string;
    street_address_2: string | null;
    city: string;
    state_province: string | null;
    postal_code: string;
    country: string;
    phone: string | null;
    is_default: boolean;
    is_commercial: boolean;
    latitude: number | null;
    longitude: number | null;
    address_verification_status: 'unverified' | 'verified' | 'invalid' | 'pending' | null;
    verification_source: 'usps' | 'third_party' | 'manual' | 'user_confirmed' | null;
    plus_four_code: string | null;
    created_at: string;
    updated_at: string;
};

export type AccountPaymentInfo = {
    id: string;
    account_id: string;
    payment_type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'crypto' |
    'apple_pay' | 'google_pay' | 'venmo' | null;
    provider: string | null;
    last_four: string | null;
    bin_category: 'debit' | 'credit' | 'prepaid' | 'corporate' | null;
    expiration_month: number | null;
    expiration_year: number | null;
    cardholder_name: string | null;
    billing_address_id: string | null;
    is_default: boolean;
    token: string;
    verification_attempts: number;
    last_verification_attempt: string | null;
    status: 'active' | 'expired' | 'invalid' | 'suspended' | 'pending_verification';
    created_at: string;
    updated_at: string;
};

export type StoreCoupon = {
    id: string;
    store_id: string;
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'bundle' | 'tiered';
    discount_value: number;
    minimum_purchase: number | null;
    max_uses: number | null;
    max_uses_per_user: number | null;
    start_date: string;
    expiration_date: string;
    is_stackable: boolean;
    is_active: boolean;
    usage_count: number;
    created_at: string;
    updated_at: string;
};

// Composite types for frontend use
export type CartWithItems = Cart & {
    items: (CartItem & {
        listing: {
            id: string;
            title: string;
            slug: string;
            image_url?: string;
        };
    })[];
    coupons: CartCoupon[];
    shipping_options: CartShippingOption[];
    shipping_address?: AccountAddress;
    billing_address?: AccountAddress;
    payment_method?: AccountPaymentInfo;
};

export type CartSummary = {
    id: string;
    item_count: number;
    total_price: number;
    currency: string;
    status: Cart['status'];
};