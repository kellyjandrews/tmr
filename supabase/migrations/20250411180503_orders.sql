-- Orders Database Migration
-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Orders Table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    store_id UUID NOT NULL,
    cart_id UUID NOT NULL,
    order_number TEXT NOT NULL UNIQUE
        CHECK (order_number ~* '^[A-Z]+-\d{8}-[A-Z0-9]+$'),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','processing','shipped','delivered','cancelled','refunded','partially_refunded','on_hold')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid','partially_paid','paid','refunded','failed','pending')),
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
        CHECK (fulfillment_status IN ('unfulfilled','partially_fulfilled','fulfilled','cancelled')),
    subtotal DECIMAL(10,2) NOT NULL 
        CHECK (subtotal >= 0),
    total_tax DECIMAL(10,2) NOT NULL 
        CHECK (total_tax >= 0),
    total_shipping DECIMAL(10,2) NOT NULL 
        CHECK (total_shipping >= 0),
    total_discounts DECIMAL(10,2) NOT NULL 
        CHECK (total_discounts >= 0),
    total_price DECIMAL(10,2) NOT NULL 
        CHECK (total_price >= 0),
    currency TEXT NOT NULL DEFAULT 'USD' 
        CHECK (length(currency) = 3),
    shipping_address_id UUID NOT NULL,
    billing_address_id UUID NOT NULL,
    payment_method_id UUID,
    shipping_method TEXT 
        CHECK (shipping_method IN ('standard','expedited','express','overnight','international','pickup')),
    tracking_number TEXT 
        CHECK (length(tracking_number) <= 100),
    notes TEXT 
        CHECK (length(notes) <= 1000),
    customer_email TEXT 
        CHECK (customer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    customer_phone TEXT 
        CHECK (customer_phone ~* '^\+?[1-9]\d{1,14}$'),
    metadata JSONB,
    ip_address TEXT 
        CHECK (ip_address ~* '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'),
    user_agent TEXT 
        CHECK (length(user_agent) <= 500),
    source TEXT 
        CHECK (source IN ('web','mobile','api','in_store','phone','marketplace')),
    device_id TEXT 
        CHECK (length(device_id) <= 100),
    refund_total DECIMAL(10,2) DEFAULT 0 
        CHECK (refund_total >= 0),
    gift_message TEXT 
        CHECK (length(gift_message) <= 500),
    is_gift BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id),
    FOREIGN KEY (store_id) REFERENCES public.stores(id),
    FOREIGN KEY (cart_id) REFERENCES public.carts(id),
    FOREIGN KEY (shipping_address_id) REFERENCES public.account_addresses(id),
    FOREIGN KEY (billing_address_id) REFERENCES public.account_addresses(id),
    FOREIGN KEY (payment_method_id) REFERENCES public.account_payment_info(id)
);

-- Indexes for performance
CREATE INDEX idx_orders_account_id ON public.orders(account_id);
CREATE INDEX idx_orders_store_id ON public.orders(store_id);
CREATE INDEX idx_orders_cart_id ON public.orders(cart_id);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_fulfillment_status ON public.orders(fulfillment_status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_updated_at ON public.orders(updated_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_orders_modtime
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Order Items Table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    listing_id UUID NOT NULL,
    price_snapshot DECIMAL(10,2) NOT NULL 
        CHECK (price_snapshot >= 0),
    quantity INTEGER NOT NULL DEFAULT 1 
        CHECK (quantity > 0),
    selected_options JSONB,
    custom_instructions TEXT 
        CHECK (length(custom_instructions) <= 1000),
    discounted_price DECIMAL(10,2) 
        CHECK (discounted_price >= 0),
    item_subtotal DECIMAL(10,2) NOT NULL 
        CHECK (item_subtotal >= 0),
    is_gift BOOLEAN DEFAULT false,
    gift_message TEXT 
        CHECK (length(gift_message) <= 500),
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending','processing','shipped','delivered','cancelled','returned','exchanged')),
    fulfillment_status TEXT DEFAULT 'unfulfilled'
        CHECK (fulfillment_status IN ('unfulfilled','partially_fulfilled','fulfilled','cancelled')),
    refund_status TEXT DEFAULT 'none'
        CHECK (refund_status IN ('none','pending','approved','completed','rejected')),
    refund_amount DECIMAL(10,2) DEFAULT 0 
        CHECK (refund_amount >= 0),
    returned_quantity INTEGER DEFAULT 0 
        CHECK (returned_quantity >= 0),
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES public.listings(id)
);

-- Indexes for order_items
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_listing_id ON public.order_items(listing_id);
CREATE INDEX idx_order_items_status ON public.order_items(status);
CREATE INDEX idx_order_items_added_at ON public.order_items(added_at);

-- Trigger for order_items updated_at
CREATE TRIGGER update_order_items_modtime
    BEFORE UPDATE ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Order Refunds Table
CREATE TABLE public.order_refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    order_item_id UUID,
    account_id UUID NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL 
        CHECK (refund_amount >= 0),
    refund_method TEXT 
        CHECK (refund_method IN ('original_payment','store_credit','exchange','gift_card')),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','completed','rejected')),
    reason TEXT NOT NULL 
        CHECK (length(reason) BETWEEN 10 AND 1000),
    reason_category TEXT 
        CHECK (reason_category IN ('defective','not_as_described','wrong_item','shipping_damage','changed_mind','other')),
    evidence_urls TEXT[] 
        CHECK (array_length(evidence_urls, 1) <= 5),
    notes TEXT 
        CHECK (length(notes) <= 1000),
    processed_by UUID,
    original_payment_method_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES public.accounts(id),
    FOREIGN KEY (processed_by) REFERENCES public.accounts(id),
    FOREIGN KEY (original_payment_method_id) REFERENCES public.account_payment_info(id)
);

-- Indexes for order_refunds
CREATE INDEX idx_order_refunds_order_id ON public.order_refunds(order_id);
CREATE INDEX idx_order_refunds_account_id ON public.order_refunds(account_id);
CREATE INDEX idx_order_refunds_status ON public.order_refunds(status);
CREATE INDEX idx_order_refunds_created_at ON public.order_refunds(created_at);

-- Trigger for order_refunds updated_at
CREATE TRIGGER update_order_refunds_modtime
    BEFORE UPDATE ON public.order_refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Order Shipments Table
CREATE TABLE public.order_shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    carrier TEXT NOT NULL 
        CHECK (length(carrier) <= 100),
    tracking_number TEXT NOT NULL UNIQUE 
        CHECK (length(tracking_number) <= 100),
    tracking_url TEXT 
        CHECK (tracking_url ~* '^https?://'),
    shipment_method TEXT NOT NULL 
        CHECK (shipment_method IN ('standard','expedited','express','overnight','international','pickup')),
    estimated_delivery_min TIMESTAMPTZ,
    estimated_delivery_max TIMESTAMPTZ,
    actual_delivery_date TIMESTAMPTZ,
    status TEXT DEFAULT 'processing'
        CHECK (status IN ('processing','in_transit','out_for_delivery','delivered','lost','returned')),
    weight DECIMAL(10,2) 
        CHECK (weight >= 0),
    dimensions JSONB,
    insurance_amount DECIMAL(10,2) 
        CHECK (insurance_amount >= 0),
    signature_required BOOLEAN DEFAULT false,
    notes TEXT 
        CHECK (length(notes) <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- Indexes for order_shipments
CREATE INDEX idx_order_shipments_order_id ON public.order_shipments(order_id);
CREATE INDEX idx_order_shipments_tracking_number ON public.order_shipments(tracking_number);
CREATE INDEX idx_order_shipments_status ON public.order_shipments(status);
CREATE INDEX idx_order_shipments_created_at ON public.order_shipments(created_at);

-- Trigger for order_shipments updated_at
CREATE TRIGGER update_order_shipments_modtime
    BEFORE UPDATE ON public.order_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Order Events Table
CREATE TABLE public.order_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    account_id UUID,
    event_type TEXT NOT NULL
        CHECK (event_type IN ('create','update','status_change','payment_received','refund_processed','shipment_created','delivery_confirmed','cancellation','return_initiated','return_completed')),
    data JSONB NOT NULL,
    ip_address TEXT 
        CHECK (ip_address ~* '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Indexes for order_events
CREATE INDEX idx_order_events_order_id ON public.order_events(order_id);
CREATE INDEX idx_order_events_account_id ON public.order_events(account_id);
CREATE INDEX idx_order_events_event_type ON public.order_events(event_type);
CREATE INDEX idx_order_events_created_at ON public.order_events(created_at);

-- Shipment Item Association Table (tracking which items are in which shipment)
CREATE TABLE public.shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL,
    order_item_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 
        CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (shipment_id) REFERENCES public.order_shipments(id) ON DELETE CASCADE,
    FOREIGN KEY (order_item_id) REFERENCES public.order_items(id) ON DELETE CASCADE,
    
    -- Ensure unique combinations
    UNIQUE (shipment_id, order_item_id)
);

-- Indexes for shipment_items
CREATE INDEX idx_shipment_items_shipment_id ON public.shipment_items(shipment_id);
CREATE INDEX idx_shipment_items_order_item_id ON public.shipment_items(order_item_id);

-- Order Notes Table (for internal and customer communication)
CREATE TABLE public.order_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    account_id UUID,
    note_type TEXT NOT NULL
        CHECK (note_type IN ('internal','customer','system')),
    content TEXT NOT NULL
        CHECK (length(content) BETWEEN 1 AND 2000),
    is_customer_visible BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Foreign key constraints
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Indexes for order_notes
CREATE INDEX idx_order_notes_order_id ON public.order_notes(order_id);
CREATE INDEX idx_order_notes_note_type ON public.order_notes(note_type);

-- Order Billing Summary View
CREATE OR REPLACE VIEW order_billing_summary AS
SELECT 
    o.id as order_id,
    o.order_number,
    o.store_id,
    o.account_id,
    o.total_price,
    o.payment_status,
    o.created_at as order_date,
    SUM(COALESCE(r.refund_amount, 0)) as total_refunded,
    o.total_price - SUM(COALESCE(r.refund_amount, 0)) as net_revenue,
    COUNT(s.id) as shipment_count,
    COUNT(DISTINCT oi.id) as item_count
FROM 
    public.orders o
LEFT JOIN 
    public.order_refunds r ON o.id = r.order_id AND r.status = 'completed'
LEFT JOIN 
    public.order_shipments s ON o.id = s.order_id
LEFT JOIN
    public.order_items oi ON o.id = oi.order_id
GROUP BY 
    o.id, o.order_number, o.store_id, o.account_id, o.total_price, o.payment_status, o.created_at;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    store_prefix TEXT;
    date_part TEXT;
    random_part TEXT;
    new_order_number TEXT;
    attempts INTEGER := 0;
BEGIN
    -- Get prefix from store table (assuming first 3 letters of store name)
    -- In a real scenario, you'd get this from the store record
    store_prefix := 'ORD';
    
    -- Format date as YYYYMMDD
    date_part := to_char(now(), 'YYYYMMDD');
    
    -- Generate random alphanumeric string (6 characters)
    LOOP
        random_part := upper(substring(md5(random()::text) from 1 for 6));
        new_order_number := store_prefix || '-' || date_part || '-' || random_part;
        
        -- Check if this order number already exists
        IF NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_order_number) THEN
            RETURN new_order_number;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= 10 THEN
            RAISE EXCEPTION 'Failed to generate unique order number after 10 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order total
CREATE OR REPLACE FUNCTION calculate_order_total(order_id UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    items_total DECIMAL(10,2);
    shipping_total DECIMAL(10,2);
    tax_total DECIMAL(10,2);
    discount_total DECIMAL(10,2);
    grand_total DECIMAL(10,2);
BEGIN
    -- Calculate items subtotal
    SELECT COALESCE(SUM(item_subtotal), 0)
    INTO items_total
    FROM public.order_items
    WHERE order_id = calculate_order_total.order_id;
    
    -- Get other components from order
    SELECT 
        total_shipping,
        total_tax,
        total_discounts
    INTO
        shipping_total,
        tax_total,
        discount_total
    FROM public.orders
    WHERE id = calculate_order_total.order_id;
    
    -- Calculate grand total
    grand_total := items_total + shipping_total + tax_total - discount_total;
    
    RETURN grand_total;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update order totals when items change
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the order total
    UPDATE public.orders
    SET 
        subtotal = (
            SELECT COALESCE(SUM(item_subtotal), 0)
            FROM public.order_items
            WHERE order_id = NEW.order_id
        ),
        total_price = calculate_order_total(NEW.order_id),
        updated_at = now()
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_totals_on_item_change
AFTER INSERT OR UPDATE OR DELETE ON public.order_items
FOR EACH ROW EXECUTE FUNCTION update_order_totals();

-- Row Level Security Policies
-- Note: These are basic examples and should be customized based on specific requirements

-- Orders RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can view their own orders
CREATE POLICY "Customers can view their own orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() = account_id);
    
-- Stores can view orders for their store
CREATE POLICY "Stores can view their store orders" 
    ON public.orders FOR SELECT 
    USING (auth.uid() IN (
        SELECT owner_id FROM public.stores WHERE id = store_id
    ));

-- Order Items RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customers can view their own order items
CREATE POLICY "Customers can view their own order items" 
    ON public.order_items FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE public.orders.id = order_id AND public.orders.account_id = auth.uid()
    ));
    
-- Stores can view order items for their store's orders
CREATE POLICY "Stores can view their store order items" 
    ON public.order_items FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.orders 
        WHERE public.orders.id = order_id AND public.orders.store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
        )
    ));

-- Order Refunds RLS
ALTER TABLE public.order_refunds ENABLE ROW LEVEL SECURITY;

-- Similar policies for other tables
-- ...

-- Comments for future reference
COMMENT ON TABLE public.orders IS 'Stores order information with comprehensive order lifecycle tracking';
COMMENT ON TABLE public.order_items IS 'Individual line items within orders';
COMMENT ON TABLE public.order_refunds IS 'Refund records for orders and order items';
COMMENT ON TABLE public.order_shipments IS 'Shipment tracking for orders';
COMMENT ON TABLE public.order_events IS 'Event log for order-related activities';
COMMENT ON TABLE public.shipment_items IS 'Links order items to specific shipments';
COMMENT ON TABLE public.order_notes IS 'Internal and customer notes for orders';

-- Create an order stats materialized view for reporting
CREATE MATERIALIZED VIEW order_stats_monthly AS
SELECT
    date_trunc('month', o.created_at) AS month,
    o.store_id,
    COUNT(o.id) AS total_orders,
    SUM(o.total_price) AS total_revenue,
    SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
    SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) AS completed_orders,
    AVG(o.total_price) AS average_order_value,
    SUM(o.total_shipping) AS total_shipping_revenue,
    SUM(o.total_discounts) AS total_discounts_applied
FROM 
    public.orders o
GROUP BY
    date_trunc('month', o.created_at),
    o.store_id;

-- Index for materialized view
CREATE UNIQUE INDEX order_stats_monthly_idx ON order_stats_monthly (month, store_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_order_stats_monthly()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY order_stats_monthly;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stats when orders change
CREATE TRIGGER refresh_order_stats
AFTER INSERT OR UPDATE OR DELETE ON public.orders
FOR EACH STATEMENT EXECUTE FUNCTION refresh_order_stats_monthly();