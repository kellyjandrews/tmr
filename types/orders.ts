export type Order = {
    id: string;
    account_id: string;
    store_id: string;
    cart_id: string;
    order_number: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'partially_refunded' | 'on_hold';
    payment_status: 'unpaid' | 'partially_paid' | 'paid' | 'refunded' | 'failed' | 'pending';
    fulfillment_status: 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';
    subtotal: number;
    total_tax: number;
    total_shipping: number;
    total_discounts: number;
    total_price: number;
    currency: string;
    shipping_address_id: string;
    billing_address_id: string;
    payment_method_id: string | null;
    shipping_method: 'standard' | 'expedited' | 'express' | 'overnight' | 'international' | 'pickup' | null;
    tracking_number: string | null;
    notes: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    metadata: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    source: 'web' | 'mobile' | 'api' | 'in_store' | 'phone' | 'marketplace' | null;
    device_id: string | null;
    refund_total: number;
    gift_message: string | null;
    is_gift: boolean;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
};

export type OrderItem = {
    id: string;
    order_id: string;
    listing_id: string;
    price_snapshot: number;
    quantity: number;
    selected_options: Record<string, unknown> | null;
    custom_instructions: string | null;
    discounted_price: number | null;
    item_subtotal: number;
    is_gift: boolean;
    gift_message: string | null;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'exchanged';
    fulfillment_status: 'unfulfilled' | 'partially_fulfilled' | 'fulfilled' | 'cancelled';
    refund_status: 'none' | 'pending' | 'approved' | 'completed' | 'rejected';
    refund_amount: number;
    returned_quantity: number;
    added_at: string;
    updated_at: string;
};

export type OrderRefund = {
    id: string;
    order_id: string;
    order_item_id: string | null;
    account_id: string;
    refund_amount: number;
    refund_method: 'original_payment' | 'store_credit' | 'exchange' | 'gift_card' | null;
    status: 'pending' | 'approved' | 'completed' | 'rejected';
    reason: string;
    reason_category: 'defective' | 'not_as_described' | 'wrong_item' | 'shipping_damage' | 'changed_mind' | 'other' | null;
    evidence_urls: string[] | null;
    notes: string | null;
    processed_by: string | null;
    original_payment_method_id: string | null;
    created_at: string;
    updated_at: string;
};

export type OrderShipment = {
    id: string;
    order_id: string;
    carrier: string;
    tracking_number: string;
    tracking_url: string | null;
    shipment_method: 'standard' | 'expedited' | 'express' | 'overnight' | 'international' | 'pickup';
    estimated_delivery_min: string | null;
    estimated_delivery_max: string | null;
    actual_delivery_date: string | null;
    status: 'processing' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'lost' | 'returned';
    weight: number | null;
    dimensions: Record<string, unknown> | null;
    insurance_amount: number | null;
    signature_required: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type ShipmentItem = {
    id: string;
    shipment_id: string;
    order_item_id: string;
    quantity: number;
    created_at: string;
};

export type OrderEvent = {
    id: string;
    order_id: string;
    account_id: string | null;
    event_type: 'create' | 'update' | 'status_change' | 'payment_received' | 'refund_processed' |
    'shipment_created' | 'delivery_confirmed' | 'cancellation' | 'return_initiated' | 'return_completed';
    data: Record<string, unknown>;
    ip_address: string | null;
    created_at: string;
};

export type OrderNote = {
    id: string;
    order_id: string;
    account_id: string | null;
    note_type: 'internal' | 'customer' | 'system';
    content: string;
    is_customer_visible: boolean;
    created_at: string;
};

export type ShippingLabel = {
    id: string;
    order_id: string;
    shipment_id: string | null;
    shippo_transaction_id: string | null;
    carrier: string;
    service_level: string;
    label_url: string;
    tracking_number: string | null;
    tracking_url_provider: string | null;
    status: 'created' | 'used' | 'refunded' | 'invalid' | null;
    rate_amount: number;
    insurance_amount: number | null;
    is_return_label: boolean;
    from_address: Record<string, unknown>;
    to_address: Record<string, unknown>;
    parcel: Record<string, unknown>;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
};

export type PaymentTransaction = {
    id: string;
    order_id: string | null;
    account_id: string;
    stripe_payment_intent_id: string | null;
    stripe_customer_id: string | null;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'disputed' | null;
    payment_method_type: 'credit_card' | 'debit_card' | 'bank_transfer' | 'wallet' | null;
    fee_amount: number | null;
    net_amount: number | null;
    description: string | null;
    metadata: Record<string, unknown> | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
};

export type PaymentPayout = {
    id: string;
    store_id: string;
    stripe_payout_id: string | null;
    amount: number;
    currency: string;
    status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled' | null;
    arrival_date: string | null;
    destination: string;
    transactions: string[] | null;
    metadata: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
};

export type OrderReview = {
    id: string;
    account_id: string;
    listing_id: string;
    order_id: string | null;
    store_id: string;
    rating: number;
    title: string | null;
    content: string | null;
    verified_purchase: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'flagged';
    helpful_votes: number;
    approved_at: string | null;
    photos: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
};

export type ReviewResponse = {
    id: string;
    review_id: string;
    account_id: string;
    content: string;
    is_seller: boolean;
    status: 'active' | 'removed';
    created_at: string;
    updated_at: string;
};

export type ReviewVote = {
    id: string;
    review_id: string;
    account_id: string;
    is_helpful: boolean;
    created_at: string;
};

// Composite types for frontend use
export type OrderWithDetails = Order & {
    items: (OrderItem & {
        listing: {
            id: string;
            title: string;
            slug: string;
            image_url?: string;
        };
    })[];
    shipments: (OrderShipment & {
        items: (ShipmentItem & {
            order_item: Pick<OrderItem, 'id' | 'listing_id' | 'quantity'>;
        })[];
    })[];
    refunds: OrderRefund[];
    events: OrderEvent[];
    notes: OrderNote[];
    payment_transactions: PaymentTransaction[];
    shipping_address: {
        full_name: string;
        street_address: string;
        street_address_2: string | null;
        city: string;
        state_province: string | null;
        postal_code: string;
        country: string;
        phone: string | null;
    };
    billing_address: {
        full_name: string;
        street_address: string;
        street_address_2: string | null;
        city: string;
        state_province: string | null;
        postal_code: string;
        country: string;
        phone: string | null;
    };
    store: {
        id: string;
        name: string;
        slug: string;
    };
};

export type OrderSummary = {
    id: string;
    order_number: string;
    status: Order['status'];
    total_price: number;
    currency: string;
    created_at: string;
    item_count: number;
    store: {
        id: string;
        name: string;
    };
};

export type OrderBillingSummary = {
    order_id: string;
    order_number: string;
    store_id: string;
    account_id: string;
    total_price: number;
    payment_status: Order['payment_status'];
    order_date: string;
    total_refunded: number;
    net_revenue: number;
    shipment_count: number;
    item_count: number;
};