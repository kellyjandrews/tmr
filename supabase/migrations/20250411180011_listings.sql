-- Listings Database Migration
-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Listings Table
CREATE TABLE public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID,
    title TEXT NOT NULL 
        CHECK (length(title) BETWEEN 5 AND 200),
    slug TEXT NOT NULL UNIQUE 
        CHECK (slug ~* '^[a-z0-9]+(-[a-z0-9]+)*$'),
    description TEXT 
        CHECK (length(description) <= 5000),
    brand_id UUID,
    year INTEGER 
        CHECK (year BETWEEN 1900 AND EXTRACT(YEAR FROM CURRENT_DATE)),
    condition TEXT 
        CHECK (condition IN ('new','like_new','good','fair','poor')),
    model TEXT 
        CHECK (length(model) <= 200),
    as_is BOOLEAN DEFAULT false,
    is_digital BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'draft'
        CHECK (status IN ('draft','published','sold','archived')),
    location JSONB,
    metadata JSONB,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE,
    FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL
);

-- Indexes for listings
CREATE INDEX idx_listings_store ON public.listings(store_id);
CREATE INDEX idx_listings_brand ON public.listings(brand_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_created_at ON public.listings(created_at);
CREATE INDEX idx_listings_updated_at ON public.listings(updated_at);
CREATE INDEX idx_listings_title_search ON public.listings USING GIN (to_tsvector('english', title));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listings_modtime
    BEFORE UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Listing Images Table
CREATE TABLE public.listing_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    image_url TEXT NOT NULL 
        CHECK (image_url ~* '^https?://'),
    display_order INTEGER NOT NULL DEFAULT 0,
    alt_text TEXT 
        CHECK (length(alt_text) <= 300),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE
);

-- Indexes for listing_images
CREATE INDEX idx_listing_images_listing ON public.listing_images(listing_id);

-- Trigger for listing_images updated_at
CREATE TRIGGER update_listing_images_modtime
    BEFORE UPDATE ON public.listing_images
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Listing Shipping Table
CREATE TABLE public.listing_shipping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    shipping_type TEXT 
        CHECK (shipping_type IN ('flat','free','calculated','pickup')),
    flat_rate DECIMAL(10,2) 
        CHECK (flat_rate >= 0),
    dimensions JSONB,
    weight INTEGER 
        CHECK (weight >= 0),
    carrier TEXT 
        CHECK (length(carrier) <= 100),
    international_shipping BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE
);

-- Indexes for listing_shipping
CREATE INDEX idx_listing_shipping_listing ON public.listing_shipping(listing_id);
CREATE INDEX idx_listing_shipping_type ON public.listing_shipping(shipping_type);

-- Trigger for listing_shipping updated_at
CREATE TRIGGER update_listing_shipping_modtime
    BEFORE UPDATE ON public.listing_shipping
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Listing Prices Table
CREATE TABLE public.listing_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    price DECIMAL(10,2) NOT NULL 
        CHECK (price >= 0),
    previous_price_id UUID,
    is_current BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (previous_price_id) REFERENCES public.listing_prices(id) ON DELETE SET NULL
);

-- Indexes for listing_prices
CREATE INDEX idx_listing_prices_listing ON public.listing_prices(listing_id);
CREATE INDEX idx_listing_prices_current ON public.listing_prices(is_current);

-- Listing Messages Table
CREATE TABLE public.listing_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    content TEXT NOT NULL 
        CHECK (length(content) BETWEEN 1 AND 5000),
    read BOOLEAN DEFAULT false,
    parent_message_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES public.listing_messages(id) ON DELETE SET NULL
);

-- Indexes for listing_messages
CREATE INDEX idx_listing_messages_listing ON public.listing_messages(listing_id);
CREATE INDEX idx_listing_messages_sender ON public.listing_messages(sender_id);
CREATE INDEX idx_listing_messages_recipient ON public.listing_messages(recipient_id);
CREATE INDEX idx_listing_messages_read ON public.listing_messages(read);

-- Listing Offers Table
CREATE TABLE public.listing_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    offer_amount DECIMAL(10,2) NOT NULL 
        CHECK (offer_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 
        CHECK (shipping_amount >= 0),
    min_acceptable_offer DECIMAL(10,2) 
        CHECK (min_acceptable_offer >= 0),
    status TEXT DEFAULT 'active'
        CHECK (status IN ('active','declined','accepted','expired','countered')),
    counter_offer_id UUID,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (counter_offer_id) REFERENCES public.listing_offers(id) ON DELETE SET NULL
);

-- Indexes for listing_offers
CREATE INDEX idx_listing_offers_listing ON public.listing_offers(listing_id);
CREATE INDEX idx_listing_offers_sender ON public.listing_offers(sender_id);
CREATE INDEX idx_listing_offers_status ON public.listing_offers(status);
CREATE INDEX idx_listing_offers_expires ON public.listing_offers(expires_at);

-- Trigger for listing_offers updated_at
CREATE TRIGGER update_listing_offers_modtime
    BEFORE UPDATE ON public.listing_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Listing Favorites Table
CREATE TABLE public.listing_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    user_id UUID NOT NULL,
    notification_preference JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Indexes for listing_favorites
CREATE INDEX idx_listing_favorites_listing ON public.listing_favorites(listing_id);
CREATE INDEX idx_listing_favorites_user ON public.listing_favorites(user_id);

-- Listing Events Table
CREATE TABLE public.listing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    user_id UUID,
    event_type TEXT 
        CHECK (event_type IN ('create','update','status_change','price_change','view','share','favorite')),
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Indexes for listing_events
CREATE INDEX idx_listing_events_listing ON public.listing_events(listing_id);
CREATE INDEX idx_listing_events_user ON public.listing_events(user_id);
CREATE INDEX idx_listing_events_type ON public.listing_events(event_type);
CREATE INDEX idx_listing_events_created ON public.listing_events(created_at);

-- Listing Status History Table
CREATE TABLE public.listing_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    status TEXT 
        CHECK (status IN ('draft','published','sold','archived')),
    changed_by UUID,
    reason TEXT 
        CHECK (length(reason) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Indexes for listing_status_history
CREATE INDEX idx_listing_status_history_listing ON public.listing_status_history(listing_id);
CREATE INDEX idx_listing_status_history_created ON public.listing_status_history(created_at);


-- Listing Categories (Junction table)
CREATE TABLE public.listing_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    category_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT false,

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
    
    -- Enforce unique listing-category pairs
    UNIQUE (listing_id, category_id)
);

-- Indexes for listing_categories
CREATE INDEX idx_listing_categories_listing ON public.listing_categories(listing_id);
CREATE INDEX idx_listing_categories_category ON public.listing_categories(category_id);

-- Listing Tags (Junction table)
CREATE TABLE public.listing_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    tag_id UUID NOT NULL,

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES public.tags(id) ON DELETE CASCADE,
    
    -- Enforce unique listing-tag pairs
    UNIQUE (listing_id, tag_id)
);

-- Indexes for listing_tags
CREATE INDEX idx_listing_tags_listing ON public.listing_tags(listing_id);
CREATE INDEX idx_listing_tags_tag ON public.listing_tags(tag_id);
-- Row Level Security Policies
-- Note: These are basic examples and should be customized based on specific requirements

-- Listings RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all published listings" 
    ON public.listings FOR SELECT 
    USING (status = 'published' OR store_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
    ));

CREATE POLICY "Store owners can manage their own listings" 
    ON public.listings FOR ALL 
    USING (store_id IN (
        SELECT id FROM public.stores WHERE owner_id = auth.uid()
    ));

-- Listing Images RLS
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view images of published listings" 
    ON public.listing_images FOR SELECT 
    USING (listing_id IN (
        SELECT id FROM public.listings WHERE status = 'published' OR store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
        )
    ));

CREATE POLICY "Store owners can manage images of their listings" 
    ON public.listing_images FOR ALL 
    USING (listing_id IN (
        SELECT id FROM public.listings WHERE store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid()
        )
    ));


ALTER TABLE public.listing_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view listing categories" 
    ON public.listing_categories FOR SELECT 
    USING (true);
CREATE POLICY "Sellers can modify their listing categories" 
    ON public.listing_categories FOR ALL 
    USING (auth.uid() IN (
        SELECT owner_id FROM public.stores s
        JOIN public.listings l ON l.store_id = s.id
        WHERE l.id = listing_id
    ));
CREATE POLICY "Admins can modify any listing categories" 
    ON public.listing_categories FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.accounts WHERE role IN ('admin', 'moderator')));

ALTER TABLE public.listing_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view listing tags" 
    ON public.listing_tags FOR SELECT 
    USING (true);
CREATE POLICY "Sellers can modify their listing tags" 
    ON public.listing_tags FOR ALL 
    USING (auth.uid() IN (
        SELECT owner_id FROM public.stores s
        JOIN public.listings l ON l.store_id = s.id
        WHERE l.id = listing_id
    ));
CREATE POLICY "Admins can modify any listing tags" 
    ON public.listing_tags FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.accounts WHERE role IN ('admin', 'moderator')));


-- Additional RLS policies for other listing tables follow the same pattern
-- This ensures store owners can manage their listings while others can only view published content

-- Comments for future reference
COMMENT ON TABLE public.listings IS 'Main listing information including product details and status';
COMMENT ON TABLE public.listing_images IS 'Product images with ordering and accessibility information';
COMMENT ON TABLE public.listing_shipping IS 'Shipping options and information for physical products';
COMMENT ON TABLE public.listing_prices IS 'Price history with current and previous prices';
COMMENT ON TABLE public.listing_messages IS 'Message threads between buyers and sellers about listings';
COMMENT ON TABLE public.listing_offers IS 'Offer negotiations between buyers and sellers';
COMMENT ON TABLE public.listing_favorites IS 'User bookmarks and saved listings';
COMMENT ON TABLE public.listing_events IS 'Tracking of all listing-related events';
COMMENT ON TABLE public.listing_status_history IS 'History of listing status changes with reasons';
COMMENT ON TABLE public.listing_categories IS 'Junction table linking listings to categories with primary relationship flag';
COMMENT ON TABLE public.listing_tags IS 'Junction table linking listings to tags';

-- Support functions

-- Function to automatically generate a unique slug from title
CREATE OR REPLACE FUNCTION generate_listing_slug(title_input TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    unique_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert title to URL-friendly format
    base_slug := lower(trim(title_input));
    base_slug := regexp_replace(base_slug, '[^a-z0-9\s-]', '', 'g');
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := substring(base_slug from 1 for 47);
    
    unique_slug := base_slug;
    
    -- Check if slug exists and generate a unique one
    WHILE EXISTS(SELECT 1 FROM public.listings WHERE slug = unique_slug) LOOP
        counter := counter + 1;
        unique_slug := base_slug || '-' || counter;
        
        -- Prevent infinite loop
        IF counter > 100 THEN
            RAISE EXCEPTION 'Could not generate unique slug after 100 attempts';
        END IF;
    END LOOP;
    
    RETURN unique_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically generate a slug from title if not provided
CREATE OR REPLACE FUNCTION set_listing_slug()
RETURNS TRIGGER AS $$
BEGIN
    -- If no slug is provided, generate one from the title
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_listing_slug(NEW.title);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_listing_slug
    BEFORE INSERT ON public.listings
    FOR EACH ROW EXECUTE FUNCTION set_listing_slug();

-- Function to enforce only one primary image per listing
CREATE OR REPLACE FUNCTION enforce_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary THEN
        UPDATE public.listing_images
        SET is_primary = false
        WHERE listing_id = NEW.listing_id
          AND id != NEW.id
          AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_single_primary_image
    BEFORE INSERT OR UPDATE ON public.listing_images
    FOR EACH ROW EXECUTE FUNCTION enforce_single_primary_image();

-- Function to create an initial listing event on creation
CREATE OR REPLACE FUNCTION create_listing_creation_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.listing_events (
        listing_id, 
        user_id, 
        event_type, 
        data
    ) VALUES (
        NEW.id, 
        current_setting('request.jwt.claims', true)::jsonb->>'sub', 
        'create', 
        jsonb_build_object(
            'title', NEW.title,
            'status', NEW.status
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_listing_creation
    AFTER INSERT ON public.listings
    FOR EACH ROW EXECUTE FUNCTION create_listing_creation_event();

-- Function to log listing status changes
CREATE OR REPLACE FUNCTION log_listing_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.listing_status_history (
            listing_id,
            status,
            changed_by
        ) VALUES (
            NEW.id,
            NEW.status,
            current_setting('request.jwt.claims', true)::jsonb->>'sub'
        );
        
        INSERT INTO public.listing_events (
            listing_id,
            user_id,
            event_type,
            data
        ) VALUES (
            NEW.id,
            current_setting('request.jwt.claims', true)::jsonb->>'sub',
            'status_change',
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_listing_status_change
    AFTER UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION log_listing_status_change();