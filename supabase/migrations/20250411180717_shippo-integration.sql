-- Shippo Integration Tables
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Shipping Labels Table
CREATE TABLE public.shipping_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL,
    shipment_id UUID,
    shippo_transaction_id TEXT UNIQUE,
    carrier TEXT NOT NULL,
    service_level TEXT NOT NULL,
    label_url TEXT NOT NULL,
    tracking_number TEXT UNIQUE,
    tracking_url_provider TEXT,
    status TEXT 
        CHECK (status IN ('created','used','refunded','invalid')),
    rate_amount DECIMAL(10,2) NOT NULL 
        CHECK (rate_amount >= 0),
    insurance_amount DECIMAL(10,2) 
        CHECK (insurance_amount >= 0),
    is_return_label BOOLEAN DEFAULT false,
    from_address JSONB NOT NULL,
    to_address JSONB NOT NULL,
    parcel JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
    FOREIGN KEY (shipment_id) REFERENCES public.order_shipments(id) ON DELETE SET NULL
);

-- Shipping Rate Cache Table
CREATE TABLE public.shipping_rate_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_postal_code TEXT NOT NULL,
    destination_postal_code TEXT NOT NULL,
    weight INTEGER NOT NULL 
        CHECK (weight > 0),
    dimensions JSONB NOT NULL,
    carrier TEXT NOT NULL,
    service_level TEXT NOT NULL,
    rate_amount DECIMAL(10,2) NOT NULL 
        CHECK (rate_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD' 
        CHECK (length(currency) = 3),
    transit_days_min INTEGER 
        CHECK (transit_days_min > 0),
    transit_days_max INTEGER 
        CHECK (transit_days_max >= transit_days_min),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for shipping_labels
CREATE INDEX idx_shipping_labels_order ON public.shipping_labels(order_id);
CREATE INDEX idx_shipping_labels_shipment ON public.shipping_labels(shipment_id);
CREATE INDEX idx_shipping_labels_tracking ON public.shipping_labels(tracking_number);
CREATE INDEX idx_shipping_labels_status ON public.shipping_labels(status);
CREATE INDEX idx_shipping_labels_shippo_id ON public.shipping_labels(shippo_transaction_id);

-- Indexes for shipping_rate_cache
CREATE INDEX idx_shipping_rate_origin ON public.shipping_rate_cache(origin_postal_code);
CREATE INDEX idx_shipping_rate_destination ON public.shipping_rate_cache(destination_postal_code);
CREATE INDEX idx_shipping_rate_carrier ON public.shipping_rate_cache(carrier);
CREATE INDEX idx_shipping_rate_expiry ON public.shipping_rate_cache(expires_at);
CREATE INDEX idx_shipping_rate_service ON public.shipping_rate_cache(service_level);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_shipping_labels_modtime
    BEFORE UPDATE ON public.shipping_labels
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Row Level Security Policy
ALTER TABLE public.shipping_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rate_cache ENABLE ROW LEVEL SECURITY;

-- Buyers can view labels for their orders
CREATE POLICY "Buyers can view their shipping labels" 
    ON public.shipping_labels FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT account_id FROM public.orders WHERE id = order_id
        )
    );

-- Sellers can view labels for their store orders
CREATE POLICY "Sellers can view their store shipping labels" 
    ON public.shipping_labels FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT s.owner_id FROM public.stores s
            JOIN public.orders o ON s.id = o.store_id
            WHERE o.id = order_id
        )
    );

-- System and admin roles can access shipping rate cache
CREATE POLICY "System can access shipping rate cache" 
    ON public.shipping_rate_cache FOR ALL 
    USING (auth.uid() IS NULL OR auth.jwt()->>'role' = 'admin');

-- Comments for documentation
COMMENT ON TABLE public.shipping_labels IS 'Shipping labels generated through Shippo integration';
COMMENT ON TABLE public.shipping_rate_cache IS 'Cached shipping rate quotes to improve performance and reduce API calls';