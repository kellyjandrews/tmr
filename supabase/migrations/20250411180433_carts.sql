-- Carts Database Migration
-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Carts Table
CREATE TABLE public.carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID, -- Changed to allow NULL for guest carts
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','checkout','completed','abandoned','merged')),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 
        CHECK (subtotal >= 0),
    total_discounts DECIMAL(10,2) NOT NULL DEFAULT 0 
        CHECK (total_discounts >= 0),
    total_shipping DECIMAL(10,2) NOT NULL DEFAULT 0 
        CHECK (total_shipping >= 0),
    total_tax DECIMAL(10,2) NOT NULL DEFAULT 0 
        CHECK (total_tax >= 0),
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0 
        CHECK (total_price >= 0),
    currency TEXT NOT NULL DEFAULT 'USD' 
        CHECK (length(currency) = 3),
    shipping_address_id UUID,
    billing_address_id UUID,
    selected_payment_id UUID,
    notes TEXT 
        CHECK (length(notes) <= 1000),
    metadata JSONB,
    expires_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    merged_to_cart_id UUID,
    device_id TEXT 
        CHECK (length(device_id) <= 100),
    ip_address TEXT 
        CHECK (ip_address ~* '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'),
    user_agent TEXT 
        CHECK (length(user_agent) <= 500),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (shipping_address_id) REFERENCES public.account_addresses(id) ON DELETE SET NULL,
    FOREIGN KEY (billing_address_id) REFERENCES public.account_addresses(id) ON DELETE SET NULL,
    FOREIGN KEY (selected_payment_id) REFERENCES public.account_payment_info(id) ON DELETE SET NULL,
    FOREIGN KEY (merged_to_cart_id) REFERENCES public.carts(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_carts_account ON public.carts(account_id);
CREATE INDEX idx_carts_status ON public.carts(status);
CREATE INDEX idx_carts_created ON public.carts(created_at);
CREATE INDEX idx_carts_updated ON public.carts(updated_at);
CREATE INDEX idx_carts_expires ON public.carts(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_carts_modtime
    BEFORE UPDATE ON public.carts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Cart Items Table
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL,
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
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE
);

-- Indexes for cart_items
CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX idx_cart_items_listing ON public.cart_items(listing_id);
CREATE INDEX idx_cart_items_added ON public.cart_items(added_at);

-- Trigger for cart_items updated_at
CREATE TRIGGER update_cart_items_modtime
    BEFORE UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Cart Coupons Table
CREATE TABLE public.cart_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL,
    coupon_id UUID NOT NULL,
    coupon_code TEXT NOT NULL 
        CHECK (length(coupon_code) BETWEEN 3 AND 50),
    discount_type TEXT 
        CHECK (discount_type IN ('percentage','fixed_amount','free_shipping')),
    discount_value DECIMAL(10,2) NOT NULL 
        CHECK (discount_value >= 0),
    applied_discount DECIMAL(10,2) NOT NULL 
        CHECK (applied_discount >= 0),
    affects_items UUID[] NOT NULL,
    applies_to_shipping BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    application_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE,
    FOREIGN KEY (coupon_id) REFERENCES public.store_coupons(id) ON DELETE CASCADE
);

-- Indexes for cart_coupons
CREATE INDEX idx_cart_coupons_cart ON public.cart_coupons(cart_id);
CREATE INDEX idx_cart_coupons_coupon ON public.cart_coupons(coupon_id);
CREATE INDEX idx_cart_coupons_created ON public.cart_coupons(created_at);

-- Trigger for cart_coupons updated_at
CREATE TRIGGER update_cart_coupons_modtime
    BEFORE UPDATE ON public.cart_coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Saved Cart Items Table
CREATE TABLE public.saved_cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    listing_id UUID NOT NULL,
    collection_name TEXT 
        CHECK (length(collection_name) <= 100),
    notes TEXT 
        CHECK (length(notes) <= 500),
    price_at_save DECIMAL(10,2) 
        CHECK (price_at_save >= 0),
    selected_options JSONB,
    quantity INTEGER NOT NULL DEFAULT 1 
        CHECK (quantity > 0),
    is_in_stock BOOLEAN,
    moved_to_cart_at TIMESTAMPTZ,
    is_public BOOLEAN DEFAULT false,
    notify_on_price_drop BOOLEAN DEFAULT false,
    notify_on_back_in_stock BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE
);

-- Indexes for saved_cart_items
CREATE INDEX idx_saved_items_account ON public.saved_cart_items(account_id);
CREATE INDEX idx_saved_items_listing ON public.saved_cart_items(listing_id);
CREATE INDEX idx_saved_items_created ON public.saved_cart_items(created_at);
CREATE INDEX idx_saved_items_updated ON public.saved_cart_items(updated_at);

-- Trigger for saved_cart_items updated_at
CREATE TRIGGER update_saved_cart_items_modtime
    BEFORE UPDATE ON public.saved_cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Cart Shipping Options Table
CREATE TABLE public.cart_shipping_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL,
    shipping_method TEXT 
        CHECK (shipping_method IN ('standard','expedited','express','overnight','international','pickup')),
    carrier TEXT 
        CHECK (length(carrier) <= 100),
    estimated_cost DECIMAL(10,2) NOT NULL 
        CHECK (estimated_cost >= 0),
    estimated_delivery_min INTEGER 
        CHECK (estimated_delivery_min > 0),
    estimated_delivery_max INTEGER 
        CHECK (estimated_delivery_max >= estimated_delivery_min),
    is_selected BOOLEAN DEFAULT false,
    tracking_available BOOLEAN DEFAULT true,
    insurance_available BOOLEAN DEFAULT false,
    insurance_cost DECIMAL(10,2) 
        CHECK (insurance_cost >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE
);

-- Indexes for cart_shipping_options
CREATE INDEX idx_shipping_options_cart ON public.cart_shipping_options(cart_id);
CREATE INDEX idx_shipping_options_method ON public.cart_shipping_options(shipping_method);

-- Trigger for cart_shipping_options updated_at
CREATE TRIGGER update_cart_shipping_options_modtime
    BEFORE UPDATE ON public.cart_shipping_options
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Cart Events Table
CREATE TABLE public.cart_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cart_id UUID NOT NULL,
    account_id UUID,
    event_type TEXT 
        CHECK (event_type IN ('create','update','add_item','remove_item','update_quantity','apply_coupon','remove_coupon','checkout_start','checkout_complete','merge_carts','abandon')),
    data JSONB NOT NULL,
    ip_address TEXT 
        CHECK (ip_address ~* '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Indexes for cart_events
CREATE INDEX idx_cart_events_cart ON public.cart_events(cart_id);
CREATE INDEX idx_cart_events_account ON public.cart_events(account_id) WHERE account_id IS NOT NULL;
CREATE INDEX idx_cart_events_type ON public.cart_events(event_type);
CREATE INDEX idx_cart_events_created ON public.cart_events(created_at);

-- Row Level Security Policies
-- Note: These are basic examples and should be customized based on specific requirements

-- Carts RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their own carts" 
    ON public.carts FOR ALL 
    USING (auth.uid() = account_id);

-- Allow access to guest carts using device_id
CREATE POLICY "Users can access guest carts by device_id" 
    ON public.carts FOR ALL 
    USING (
        account_id IS NULL AND 
        device_id = current_setting('request.headers', true)::json->>'device-id'
    );

-- Cart Items RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access items in their carts" 
    ON public.cart_items FOR ALL 
    USING (cart_id IN (
        SELECT id FROM public.carts 
        WHERE account_id = auth.uid() OR 
              (account_id IS NULL AND device_id = current_setting('request.headers', true)::json->>'device-id')
    ));

-- Cart Coupons RLS
ALTER TABLE public.cart_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access coupons in their carts" 
    ON public.cart_coupons FOR ALL 
    USING (cart_id IN (
        SELECT id FROM public.carts 
        WHERE account_id = auth.uid() OR 
              (account_id IS NULL AND device_id = current_setting('request.headers', true)::json->>'device-id')
    ));

-- Saved Cart Items RLS
ALTER TABLE public.saved_cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit their saved items" 
    ON public.saved_cart_items FOR ALL 
    USING (account_id = auth.uid());

CREATE POLICY "Users can view public saved items from any user" 
    ON public.saved_cart_items FOR SELECT 
    USING (is_public = true);

-- Cart Shipping Options RLS
ALTER TABLE public.cart_shipping_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access shipping options for their carts" 
    ON public.cart_shipping_options FOR ALL 
    USING (cart_id IN (
        SELECT id FROM public.carts 
        WHERE account_id = auth.uid() OR 
              (account_id IS NULL AND device_id = current_setting('request.headers', true)::json->>'device-id')
    ));

-- Cart Events RLS
ALTER TABLE public.cart_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view events for their carts" 
    ON public.cart_events FOR SELECT 
    USING (cart_id IN (
        SELECT id FROM public.carts 
        WHERE account_id = auth.uid() OR 
              (account_id IS NULL AND device_id = current_setting('request.headers', true)::json->>'device-id')
    ));

-- Comments for future reference
COMMENT ON TABLE public.carts IS 'Stores user shopping cart data with comprehensive tracking';
COMMENT ON TABLE public.cart_items IS 'Individual items within user shopping carts';
COMMENT ON TABLE public.cart_coupons IS 'Applied discount coupons with detailed tracking';
COMMENT ON TABLE public.saved_cart_items IS 'Wishlisted or saved items for later purchase';
COMMENT ON TABLE public.cart_shipping_options IS 'Available shipping methods with price estimates';
COMMENT ON TABLE public.cart_events IS 'Tracking of all cart-related user actions';

-- Function to calculate cart totals automatically
CREATE OR REPLACE FUNCTION update_cart_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(10,2) := 0;
    v_total_discounts DECIMAL(10,2) := 0;
    v_total_shipping DECIMAL(10,2) := 0;
    v_total_tax DECIMAL(10,2) := 0;
    v_total_price DECIMAL(10,2) := 0;
BEGIN
    -- Calculate subtotal
    SELECT COALESCE(SUM(item_subtotal), 0) INTO v_subtotal
    FROM public.cart_items
    WHERE cart_id = NEW.id;
    
    -- Get total discounts
    SELECT COALESCE(SUM(applied_discount), 0) INTO v_total_discounts
    FROM public.cart_coupons
    WHERE cart_id = NEW.id AND is_active = true;
    
    -- Get selected shipping cost
    SELECT COALESCE(estimated_cost, 0) INTO v_total_shipping
    FROM public.cart_shipping_options
    WHERE cart_id = NEW.id AND is_selected = true
    LIMIT 1;
    
    -- Simple tax calculation (would typically involve more complex logic)
    -- This could be replaced with a call to a tax calculation service
    v_total_tax := (v_subtotal - v_total_discounts) * 0.0825; -- Example 8.25% tax rate
    
    -- Calculate total price
    v_total_price := v_subtotal - v_total_discounts + v_total_shipping + v_total_tax;
    
    -- Update the cart totals
    NEW.subtotal := v_subtotal;
    NEW.total_discounts := v_total_discounts;
    NEW.total_shipping := v_total_shipping;
    NEW.total_tax := v_total_tax;
    NEW.total_price := v_total_price;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic cart total updates
CREATE TRIGGER update_cart_totals_trigger
    BEFORE INSERT OR UPDATE ON public.carts
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_totals();

-- Function to handle cart abandonment checks
CREATE OR REPLACE FUNCTION mark_abandoned_carts()
RETURNS VOID AS $$
BEGIN
    -- Mark carts as abandoned if they haven't been active for more than 24 hours
    -- and aren't already completed or merged
    UPDATE public.carts
    SET status = 'abandoned'
    WHERE status = 'active'
    AND last_activity_at < now() - INTERVAL '24 hours'
    AND deleted_at IS NULL;
    
    -- Log abandonment events
    INSERT INTO public.cart_events (cart_id, event_type, data)
    SELECT id, 'abandon', jsonb_build_object('reason', 'timeout', 'time_inactive', '24 hours')
    FROM public.carts
    WHERE status = 'abandoned'
    AND id NOT IN (
        SELECT cart_id FROM public.cart_events WHERE event_type = 'abandon'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired guest carts
CREATE OR REPLACE FUNCTION cleanup_expired_guest_carts()
RETURNS VOID AS $$
BEGIN
    -- Soft delete expired guest carts
    UPDATE public.carts
    SET deleted_at = now()
    WHERE account_id IS NULL
    AND expires_at < now()
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update cart item subtotal
CREATE OR REPLACE FUNCTION update_cart_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate item subtotal (price × quantity)
    NEW.item_subtotal := COALESCE(NEW.discounted_price, NEW.price_snapshot) * NEW.quantity;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic cart item subtotal updates
CREATE TRIGGER update_cart_item_subtotal_trigger
    BEFORE INSERT OR UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_item_subtotal();

-- Function to trigger cart total recalculation when items change
CREATE OR REPLACE FUNCTION trigger_cart_update_on_item_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the cart ID (handle both inserts and deletes)
    DECLARE
        v_cart_id UUID;
    BEGIN
        IF TG_OP = 'DELETE' THEN
            v_cart_id := OLD.cart_id;
        ELSE
            v_cart_id := NEW.cart_id;
        END IF;
        
        -- Update the cart's last_activity_at timestamp
        UPDATE public.carts
        SET last_activity_at = now(),
            updated_at = now()
        WHERE id = v_cart_id;
        
        -- Log event for analytics
        INSERT INTO public.cart_events (
            cart_id, 
            account_id,
            event_type, 
            data,
            ip_address
        )
        SELECT 
            v_cart_id,
            c.account_id,
            CASE
                WHEN TG_OP = 'INSERT' THEN 'add_item'
                WHEN TG_OP = 'DELETE' THEN 'remove_item'
                WHEN NEW.quantity != OLD.quantity THEN 'update_quantity'
                ELSE 'update'
            END,
            CASE
                WHEN TG_OP = 'INSERT' THEN 
                    jsonb_build_object('listing_id', NEW.listing_id, 'quantity', NEW.quantity)
                WHEN TG_OP = 'DELETE' THEN 
                    jsonb_build_object('listing_id', OLD.listing_id)
                WHEN NEW.quantity != OLD.quantity THEN 
                    jsonb_build_object('listing_id', NEW.listing_id, 'old_quantity', OLD.quantity, 'new_quantity', NEW.quantity)
                ELSE 
                    jsonb_build_object('listing_id', NEW.listing_id, 'changes', 'other')
            END,
            c.ip_address
        FROM public.carts c
        WHERE c.id = v_cart_id;
    END;
    
    RETURN NULL; -- for AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- Triggers for cart_items to update cart totals
CREATE TRIGGER cart_items_insert_trigger
    AFTER INSERT ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cart_update_on_item_change();

CREATE TRIGGER cart_items_update_trigger
    AFTER UPDATE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cart_update_on_item_change();

CREATE TRIGGER cart_items_delete_trigger
    AFTER DELETE ON public.cart_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cart_update_on_item_change();

-- Function to merge carts (guest to user, or multiple user carts)
CREATE OR REPLACE FUNCTION merge_carts(source_cart_id UUID, target_cart_id UUID)
RETURNS UUID AS $$
DECLARE
    v_item record;
    v_coupon record;
    v_exists boolean;
BEGIN
    -- Check if both carts exist
    IF NOT EXISTS (SELECT 1 FROM public.carts WHERE id = source_cart_id) OR
       NOT EXISTS (SELECT 1 FROM public.carts WHERE id = target_cart_id) THEN
        RAISE EXCEPTION 'One or both carts do not exist';
    END IF;
    
    -- Transfer items from source to target cart
    FOR v_item IN SELECT * FROM public.cart_items WHERE cart_id = source_cart_id
    LOOP
        -- Check if the same item exists in the target cart
        SELECT EXISTS (
            SELECT 1 FROM public.cart_items 
            WHERE cart_id = target_cart_id 
            AND listing_id = v_item.listing_id
            AND selected_options IS NOT DISTINCT FROM v_item.selected_options
        ) INTO v_exists;
        
        IF v_exists THEN
            -- Update quantity if item exists
            UPDATE public.cart_items
            SET quantity = quantity + v_item.quantity,
                updated_at = now()
            WHERE cart_id = target_cart_id 
            AND listing_id = v_item.listing_id
            AND selected_options IS NOT DISTINCT FROM v_item.selected_options;
        ELSE
            -- Insert new item if it doesn't exist
            INSERT INTO public.cart_items (
                cart_id, listing_id, price_snapshot, quantity, 
                selected_options, custom_instructions, 
                discounted_price, is_gift, gift_message
            )
            VALUES (
                target_cart_id, v_item.listing_id, v_item.price_snapshot, v_item.quantity,
                v_item.selected_options, v_item.custom_instructions,
                v_item.discounted_price, v_item.is_gift, v_item.gift_message
            );
        END IF;
    END LOOP;
    
    -- Transfer coupons that don't exist in target
    FOR v_coupon IN SELECT * FROM public.cart_coupons WHERE cart_id = source_cart_id
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM public.cart_coupons 
            WHERE cart_id = target_cart_id AND coupon_id = v_coupon.coupon_id
        ) THEN
            INSERT INTO public.cart_coupons (
                cart_id, coupon_id, coupon_code, discount_type,
                discount_value, applied_discount, affects_items,
                applies_to_shipping, is_active, application_order
            )
            VALUES (
                target_cart_id, v_coupon.coupon_id, v_coupon.coupon_code, v_coupon.discount_type,
                v_coupon.discount_value, v_coupon.applied_discount, v_coupon.affects_items,
                v_coupon.applies_to_shipping, v_coupon.is_active, v_coupon.application_order
            );
        END IF;
    END LOOP;
    
    -- Mark source cart as merged and link to target
    UPDATE public.carts
    SET status = 'merged',
        merged_to_cart_id = target_cart_id,
        updated_at = now()
    WHERE id = source_cart_id;
    
    -- Log merge event
    INSERT INTO public.cart_events (cart_id, event_type, data)
    VALUES (
        source_cart_id, 
        'merge_carts', 
        jsonb_build_object('target_cart_id', target_cart_id)
    );
    
    INSERT INTO public.cart_events (cart_id, event_type, data)
    VALUES (
        target_cart_id, 
        'merge_carts', 
        jsonb_build_object('source_cart_id', source_cart_id)
    );
    
    RETURN target_cart_id;
END;

$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Metrics view for cart analytics
CREATE OR REPLACE VIEW public.cart_metrics AS
SELECT 
    DATE_TRUNC('day', c.created_at) AS date,
    COUNT(*) AS total_carts_created,
    SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) AS completed_carts,
    SUM(CASE WHEN c.status = 'abandoned' THEN 1 ELSE 0 END) AS abandoned_carts,
    SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) AS active_carts,
    AVG(i.quantity) AS avg_items_per_cart,
    AVG(c.total_price) AS avg_cart_value,
    SUM(c.total_price) / NULLIF(SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END), 0) AS avg_completed_cart_value,
    SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(*), 0) AS conversion_rate
FROM 
    public.carts c
LEFT JOIN 
    public.cart_items i ON c.id = i.cart_id
GROUP BY 
    DATE_TRUNC('day', c.created_at)
ORDER BY 
    date DESC;