-- Stores Database Migration

-- Stores Table
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 200),
    slug TEXT NOT NULL UNIQUE CHECK (slug ~* '^[a-z0-9]+(-[a-z0-9]+)*'),
    description TEXT CHECK (length(description) BETWEEN 10 AND 5000),
    email email_type NOT NULL,
    phone phone_type,
    website url_type,
    logo_url url_type,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active','inactive','suspended','pending')),
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified','pending','verified','rejected')),
    total_listings INTEGER DEFAULT 0 CHECK (total_listings >= 0),
    total_sales DECIMAL(12,2) DEFAULT 0 CHECK (total_sales >= 0),
    rating DECIMAL(3,2) CHECK (rating BETWEEN 0 AND 5),
    metadata JSONB,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraint
    FOREIGN KEY (owner_id) REFERENCES public.accounts(id) ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_stores_owner ON public.stores(owner_id);
CREATE INDEX idx_stores_name ON public.stores(name);
CREATE INDEX idx_stores_slug ON public.stores(slug);
CREATE INDEX idx_stores_status ON public.stores(status);
CREATE INDEX idx_stores_verification_status ON public.stores(verification_status);
CREATE INDEX idx_stores_created_at ON public.stores(created_at);
CREATE INDEX idx_stores_updated_at ON public.stores(updated_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_stores_modtime
    BEFORE UPDATE ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Store Address Table
CREATE TABLE public.store_address (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    address_type TEXT NOT NULL CHECK (address_type IN ('primary','billing','shipping','warehouse','legal')),
    street_address TEXT NOT NULL CHECK (length(street_address) BETWEEN 5 AND 500),
    address_line_2 TEXT CHECK (length(address_line_2) <= 500),
    city TEXT NOT NULL CHECK (length(city) BETWEEN 2 AND 100),
    state_province TEXT CHECK (length(state_province) <= 100),
    postal_code TEXT NOT NULL CHECK (length(postal_code) BETWEEN 3 AND 20),
    country TEXT NOT NULL CHECK (length(country) = 2),
    latitude DECIMAL(10,8) CHECK (latitude BETWEEN -90 AND 90),
    longitude DECIMAL(11,8) CHECK (longitude BETWEEN -180 AND 180),
    is_default BOOLEAN DEFAULT false,
    geohash TEXT CHECK (length(geohash) BETWEEN 1 AND 12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

-- Indexes for store_address
CREATE INDEX idx_store_address_store ON public.store_address(store_id);
CREATE INDEX idx_store_address_type ON public.store_address(address_type);
CREATE INDEX idx_store_address_country ON public.store_address(country);

-- Trigger for store_address updated_at
CREATE TRIGGER update_store_address_modtime
    BEFORE UPDATE ON public.store_address
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Store Categories (Junction table)
CREATE TABLE public.store_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    category_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT false,

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
    
    -- Enforce unique store-category pairs
    UNIQUE (store_id, category_id)
);

-- Indexes for store_categories
CREATE INDEX idx_store_categories_store ON public.store_categories(store_id);
CREATE INDEX idx_store_categories_category ON public.store_categories(category_id);

-- Store Images Table
CREATE TABLE public.store_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    image_url url_type NOT NULL,
    image_type TEXT NOT NULL CHECK (image_type IN ('banner','gallery','product_showcase','logo','background','other')),
    display_order INTEGER NOT NULL DEFAULT 0,
    alt_text TEXT CHECK (length(alt_text) <= 300),
    is_primary BOOLEAN DEFAULT false,
    image_size INTEGER CHECK (image_size >= 0),
    image_dimensions JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);


-- Indexes for store_images
CREATE INDEX idx_store_images_store ON public.store_images(store_id);
CREATE INDEX idx_store_images_type ON public.store_images(image_type);
CREATE INDEX idx_store_images_primary ON public.store_images(is_primary);

-- Trigger for store_images updated_at
CREATE TRIGGER update_store_images_modtime
    BEFORE UPDATE ON public.store_images
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
 

-- Create connections to Stripe payment integration
CREATE TABLE public.store_payment_integration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL UNIQUE,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('stripe', 'direct')),
    stripe_account_id TEXT UNIQUE,
    payment_methods JSONB NOT NULL,
    onboarding_complete BOOLEAN DEFAULT false,
    is_test_mode BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_integration_store ON public.store_payment_integration(store_id);
CREATE INDEX idx_payment_integration_type ON public.store_payment_integration(integration_type);
CREATE INDEX idx_payment_integration_stripe ON public.store_payment_integration(stripe_account_id);

-- Trigger for store_payment_integration updated_at
CREATE TRIGGER update_store_payment_integration_modtime
    BEFORE UPDATE ON public.store_payment_integration
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Shippo integration for shipping
CREATE TABLE public.store_shipping_integration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL UNIQUE,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('shippo', 'custom')),
    shippo_account_id TEXT UNIQUE,
    default_carrier_accounts TEXT[],
    is_test_mode BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

CREATE INDEX idx_shipping_integration_store ON public.store_shipping_integration(store_id);
CREATE INDEX idx_shipping_integration_type ON public.store_shipping_integration(integration_type);

-- Trigger for store_shipping_integration updated_at
CREATE TRIGGER update_store_shipping_integration_modtime
    BEFORE UPDATE ON public.store_shipping_integration
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Resend email integration
CREATE TABLE public.store_email_integration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL UNIQUE,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('resend', 'custom')),
    resend_api_key_id TEXT UNIQUE,
    default_from_email email_type,
    custom_email_domain TEXT,
    domain_verified BOOLEAN DEFAULT false,
    is_test_mode BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

CREATE INDEX idx_email_integration_store ON public.store_email_integration(store_id);
CREATE INDEX idx_email_integration_type ON public.store_email_integration(integration_type);
CREATE INDEX idx_email_integration_domain ON public.store_email_integration(custom_email_domain);

-- Trigger for store_email_integration updated_at
CREATE TRIGGER update_store_email_integration_modtime
    BEFORE UPDATE ON public.store_email_integration
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();


-- Store Events Table
CREATE TABLE public.store_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    user_id UUID,
    event_type TEXT NOT NULL CHECK (event_type IN ('create','update','status_change','listing_added','review','message','coupon_created','sales_milestone','performance_change','compliance_update')),
    data JSONB NOT NULL,
    severity TEXT CHECK (severity IN ('info','warning','critical')),
    ip_address ip_address_type,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON UPDATE CASCADE
);

-- Indexes for store_events
CREATE INDEX idx_store_events_store ON public.store_events(store_id);
CREATE INDEX idx_store_events_user ON public.store_events(user_id);
CREATE INDEX idx_store_events_type ON public.store_events(event_type);
CREATE INDEX idx_store_events_severity ON public.store_events(severity);
CREATE INDEX idx_store_events_created ON public.store_events(created_at);


-- Store Messages Table
CREATE TABLE public.store_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 5000),
    read BOOLEAN DEFAULT false,
    message_type TEXT NOT NULL CHECK (message_type IN ('inquiry','support','order_related','general','dispute','feedback')),
    parent_message_id UUID,
    priority TEXT CHECK (priority IN ('low','medium','high','urgent')),
    attachment_urls TEXT[] CHECK (array_length(attachment_urls, 1) <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES public.accounts(id) ON UPDATE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES public.accounts(id) ON UPDATE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES public.store_messages(id)
);

-- Indexes for store_messages
CREATE INDEX idx_store_messages_store ON public.store_messages(store_id);
CREATE INDEX idx_store_messages_sender ON public.store_messages(sender_id);
CREATE INDEX idx_store_messages_recipient ON public.store_messages(recipient_id);
CREATE INDEX idx_store_messages_read ON public.store_messages(read);
CREATE INDEX idx_store_messages_type ON public.store_messages(message_type);

-- Trigger for store_messages updated_at
CREATE TRIGGER update_store_messages_modtime
    BEFORE UPDATE ON public.store_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Store Favorites Table
CREATE TABLE public.store_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    user_id UUID NOT NULL,
    notification_preference JSONB,
    favorite_category TEXT CHECK (favorite_category IN ('shopping','wishlist','recommended')),
    notes TEXT CHECK (length(notes) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON UPDATE CASCADE
);

-- Indexes for store_favorites
CREATE INDEX idx_store_favorites_store ON public.store_favorites(store_id);
CREATE INDEX idx_store_favorites_user ON public.store_favorites(user_id);
CREATE INDEX idx_store_favorites_category ON public.store_favorites(favorite_category);

-- Store Coupons Table
CREATE TABLE public.store_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    code TEXT NOT NULL UNIQUE CHECK (length(code) BETWEEN 3 AND 50),
    description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 500),
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage','fixed_amount','free_shipping','bundle','tiered')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value >= 0),
    minimum_purchase DECIMAL(10,2) CHECK (minimum_purchase >= 0),
    max_uses INTEGER CHECK (max_uses >= 0),
    max_uses_per_user INTEGER CHECK (max_uses_per_user >= 0),
    start_date TIMESTAMPTZ NOT NULL,
    expiration_date TIMESTAMPTZ NOT NULL,
    is_stackable BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);


-- Indexes for store_coupons
CREATE INDEX idx_store_coupons_store ON public.store_coupons(store_id);
CREATE INDEX idx_store_coupons_code ON public.store_coupons(code);
CREATE INDEX idx_store_coupons_active ON public.store_coupons(is_active);
CREATE INDEX idx_store_coupons_dates ON public.store_coupons(start_date, expiration_date);
CREATE INDEX idx_store_coupons_discount_type ON public.store_coupons(discount_type);

-- Trigger for store_coupons updated_at
CREATE TRIGGER update_store_coupons_modtime
    BEFORE UPDATE ON public.store_coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();



-- Store Tax Policy Table
CREATE TABLE public.store_tax_policy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    tax_id_number TEXT UNIQUE CHECK (length(tax_id_number) <= 50),
    tax_exemption_status BOOLEAN DEFAULT false,
    default_tax_rate DECIMAL(5,4) CHECK (default_tax_rate >= 0 AND default_tax_rate <= 1),
    tax_collection_method TEXT NOT NULL CHECK (tax_collection_method IN ('destination','origin','mixed','marketplace')),
    nexus_states JSONB,
    vat_registration TEXT UNIQUE CHECK (length(vat_registration) <= 50),
    tax_compliance_status TEXT CHECK (tax_compliance_status IN ('compliant','non-compliant','pending_review')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

-- Indexes for store_tax_policy
CREATE INDEX idx_tax_policy_store ON public.store_tax_policy(store_id);
CREATE INDEX idx_tax_compliance ON public.store_tax_policy(tax_compliance_status);
CREATE INDEX idx_tax_collection_method ON public.store_tax_policy(tax_collection_method);

-- Trigger for store_tax_policy updated_at
CREATE TRIGGER update_store_tax_policy_modtime
    BEFORE UPDATE ON public.store_tax_policy
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Store Return Policy Table
CREATE TABLE public.store_return_policy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    return_window INTEGER NOT NULL CHECK (return_window BETWEEN 7 AND 365),
    refund_method TEXT NOT NULL CHECK (refund_method IN ('full','store_credit','partial','exchange')),
    restocking_fee DECIMAL(5,2) CHECK (restocking_fee >= 0 AND restocking_fee <= 100),
    condition_requirements TEXT NOT NULL CHECK (length(condition_requirements) BETWEEN 50 AND 1000),
    return_shipping_paid_by TEXT NOT NULL CHECK (return_shipping_paid_by IN ('buyer','seller','conditional','free_over_threshold')),
    exceptions TEXT CHECK (length(exceptions) <= 2000),
    digital_return_policy BOOLEAN DEFAULT false,
    refund_processing_time INTEGER CHECK (refund_processing_time BETWEEN 3 AND 30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);


-- Indexes for store_return_policy
CREATE INDEX idx_return_policy_store ON public.store_return_policy(store_id);
CREATE INDEX idx_return_policy_window ON public.store_return_policy(return_window);
CREATE INDEX idx_refund_method ON public.store_return_policy(refund_method);

-- Trigger for store_return_policy updated_at
CREATE TRIGGER update_store_return_policy_modtime
    BEFORE UPDATE ON public.store_return_policy
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();



-- Store Shipping Policy Table
CREATE TABLE public.store_shipping_policy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    shipping_type TEXT NOT NULL CHECK (shipping_type IN ('free','flat','calculated','custom','mixed')),
    domestic_processing_time INTEGER CHECK (domestic_processing_time BETWEEN 0 AND 30),
    international_processing_time INTEGER CHECK (international_processing_time BETWEEN 0 AND 45),
    free_shipping_threshold DECIMAL(10,2) CHECK (free_shipping_threshold >= 0),
    handling_fee DECIMAL(10,2) CHECK (handling_fee >= 0),
    shipping_carriers JSONB NOT NULL,
    international_shipping BOOLEAN DEFAULT false,
    return_shipping_policy TEXT CHECK (length(return_shipping_policy) BETWEEN 50 AND 5000),
    insurance_options JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

   -- Indexes for store_shipping_policy
CREATE INDEX idx_shipping_policy_store ON public.store_shipping_policy(store_id);
CREATE INDEX idx_shipping_policy_type ON public.store_shipping_policy(shipping_type);

-- Trigger for store_shipping_policy updated_at
CREATE TRIGGER update_store_shipping_policy_modtime
    BEFORE UPDATE ON public.store_shipping_policy
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
    
-- Row Level Security Policies
-- Note: These are basic examples and should be customized based on specific requirements

-- public.stores RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view their own stores" 
    ON public.stores FOR SELECT 
    USING (auth.uid() = owner_id);
    
CREATE POLICY "Store owners can update their own stores" 
    ON public.stores FOR UPDATE 
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id AND status != 'suspended');
    
CREATE POLICY "Store owners can insert their own stores" 
    ON public.stores FOR INSERT 
    WITH CHECK (auth.uid() = owner_id);
    
CREATE POLICY "Store owners can delete their own stores" 
    ON public.stores FOR DELETE 
    USING (auth.uid() = owner_id AND status != 'suspended');
    
CREATE POLICY "Users can view published stores"
    ON public.stores FOR SELECT
    USING (status = 'active');

-- Store Address RLS
ALTER TABLE public.store_address ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view and edit their store addresses" 
    ON public.store_address FOR ALL 
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));
CREATE POLICY "Users can view addresses of active stores"
    ON public.store_address FOR SELECT
    USING ((SELECT status FROM public.stores WHERE id = store_id) = 'active');

-- Store Shipping Policy RLS
ALTER TABLE public.store_shipping_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view and edit their shipping policies" 
    ON public.store_shipping_policy FOR ALL 
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));
CREATE POLICY "Users can view shipping policies of active stores"
    ON public.store_shipping_policy FOR SELECT
    USING ((SELECT status FROM public.stores WHERE id = store_id) = 'active');

-- Store Return Policy RLS
ALTER TABLE public.store_return_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view and edit their return policies" 
    ON public.store_return_policy FOR ALL 
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));
CREATE POLICY "Users can view return policies of active stores"
    ON public.store_return_policy FOR SELECT
    USING ((SELECT status FROM public.stores WHERE id = store_id) = 'active');

-- Store Tax Policy RLS
ALTER TABLE public.store_tax_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view and edit their tax policies" 
    ON public.store_tax_policy FOR ALL 
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));
CREATE POLICY "Admin users can view all tax policies"
    ON public.store_tax_policy FOR SELECT
    USING ((SELECT role FROM public.accounts WHERE id = auth.uid()) = 'admin');

-- Store Messages RLS
ALTER TABLE public.store_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and send messages they're involved with" 
    ON public.store_messages FOR ALL 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Store owners can view all messages for their stores"
    ON public.store_messages FOR SELECT
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

-- Store Favorites RLS
ALTER TABLE public.store_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their favorite stores" 
    ON public.store_favorites FOR ALL 
    USING (auth.uid() = user_id);
CREATE POLICY "Store owners can view who favorited their store"
    ON public.store_favorites FOR SELECT
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));

-- Store Coupons RLS
ALTER TABLE public.store_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can manage their coupons" 
    ON public.store_coupons FOR ALL 
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));
CREATE POLICY "Users can view active coupons"
    ON public.store_coupons FOR SELECT
    USING (is_active = true AND current_timestamp BETWEEN start_date AND expiration_date);

-- Store Events RLS
ALTER TABLE public.store_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can view events for their stores" 
    ON public.store_events FOR SELECT 
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));
CREATE POLICY "Admin users can view all store events"
    ON public.store_events FOR SELECT
    USING ((SELECT role FROM public.accounts WHERE id = auth.uid()) = 'admin');

-- Store Images RLS
ALTER TABLE public.store_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Store owners can manage their store images" 
    ON public.store_images FOR ALL 
    USING (auth.uid() = (SELECT owner_id FROM public.stores WHERE id = store_id));
CREATE POLICY "Users can view images of active stores"
    ON public.store_images FOR SELECT
    USING ((SELECT status FROM public.stores WHERE id = store_id) = 'active');

ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view store categories" 
    ON public.store_categories FOR SELECT 
    USING (true);
CREATE POLICY "Store owners can modify their store categories" 
    ON public.store_categories FOR ALL 
    USING (auth.uid() IN (
        SELECT owner_id FROM public.stores
        WHERE id = store_id
    ));
CREATE POLICY "Admins can modify any store categories" 
    ON public.store_categories FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.accounts WHERE role IN ('admin', 'moderator')));

-- Comments for future reference
COMMENT ON TABLE public.stores IS 'Stores user shop information with comprehensive details and metadata';
COMMENT ON TABLE public.store_address IS 'Store physical and shipping address information';
COMMENT ON TABLE public.store_shipping_policy IS 'Store shipping rules, rates, and processing times';
COMMENT ON TABLE public.store_return_policy IS 'Store return and refund policies and conditions';
COMMENT ON TABLE public.store_tax_policy IS 'Store tax collection and compliance information';
COMMENT ON TABLE public.store_messages IS 'Communication between stores and customers';
COMMENT ON TABLE public.store_favorites IS 'User store favorites and bookmarks';
COMMENT ON TABLE public.store_coupons IS 'Store promotional codes and discounts';
COMMENT ON TABLE public.store_events IS 'Audit trail for store activity and changes';
COMMENT ON TABLE public.store_images IS 'Store images including banners, logos, and galleries';
COMMENT ON TABLE public.store_categories IS 'Junction table linking stores to categories with primary relationship flag';
COMMENT ON TABLE public.store_payment_integration IS 'Store Stripe payment processing configuration';
COMMENT ON TABLE public.store_shipping_integration IS 'Store Shippo shipping label and tracking integration';
COMMENT ON TABLE public.store_email_integration IS 'Store Resend email service integration';