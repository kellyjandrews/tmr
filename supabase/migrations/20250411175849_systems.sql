-- System Database Migration
-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tags Table
CREATE TABLE public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE 
        CHECK (length(name) BETWEEN 2 AND 50),
    slug TEXT NOT NULL UNIQUE 
        CHECK (slug ~* '^[a-z0-9]+(-[a-z0-9]+)*$'),
    description TEXT 
        CHECK (length(description) <= 500),
    type TEXT 
        CHECK (type IN ('product','store','user','system')),
    parent_tag_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraint
    FOREIGN KEY (parent_tag_id) REFERENCES public.tags(id) ON DELETE SET NULL
);

-- Indexes for tags
CREATE INDEX idx_tags_name ON public.tags(name);
CREATE INDEX idx_tags_slug ON public.tags(slug);
CREATE INDEX idx_tags_type ON public.tags(type);
CREATE INDEX idx_tags_created_at ON public.tags(created_at);
CREATE INDEX idx_tags_updated_at ON public.tags(updated_at);

-- Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL 
        CHECK (length(name) BETWEEN 2 AND 100),
    slug TEXT NOT NULL UNIQUE 
        CHECK (slug ~* '^[a-z0-9]+(-[a-z0-9]+)*$'),
    description TEXT 
        CHECK (length(description) <= 1000),
    parent_category_id UUID,
    taxonomy_type TEXT 
        CHECK (taxonomy_type IN ('product','store','content','system')),
    level INTEGER 
        CHECK (level BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraint
    FOREIGN KEY (parent_category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Indexes for categories
CREATE INDEX idx_categories_name ON public.categories(name);
CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_taxonomy ON public.categories(taxonomy_type);
CREATE INDEX idx_categories_parent ON public.categories(parent_category_id);
CREATE INDEX idx_categories_created_at ON public.categories(created_at);
CREATE INDEX idx_categories_updated_at ON public.categories(updated_at);

-- Brands Table
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE 
        CHECK (length(name) BETWEEN 2 AND 200),
    slug TEXT NOT NULL UNIQUE 
        CHECK (slug ~* '^[a-z0-9]+(-[a-z0-9]+)*$'),
    description TEXT 
        CHECK (length(description) <= 2000),
    primary_category_id UUID,
    verification_status TEXT 
        CHECK (verification_status IN ('unverified','pending','verified')),
    metadata JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraint
    FOREIGN KEY (primary_category_id) REFERENCES public.categories(id) ON DELETE SET NULL
);

-- Indexes for brands
CREATE INDEX idx_brands_name ON public.brands(name);
CREATE INDEX idx_brands_slug ON public.brands(slug);
CREATE INDEX idx_brands_verification ON public.brands(verification_status);
CREATE INDEX idx_brands_created_at ON public.brands(created_at);
CREATE INDEX idx_brands_updated_at ON public.brands(updated_at);

-- Global Events Table
CREATE TABLE public.global_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_namespace TEXT NOT NULL 
        CHECK (event_namespace IN ('accounts','stores','listings','orders','carts','global','system')),
    event_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    related_entity_id UUID,
    account_id UUID,
    ip_address TEXT 
        CHECK (ip_address ~* '^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'),
    user_agent TEXT 
        CHECK (length(user_agent) <= 500),
    severity TEXT 
        CHECK (severity IN ('info','warning','critical','security')),
    data JSONB NOT NULL,
    source TEXT 
        CHECK (source IN ('web','mobile','api','internal','system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraint
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Indexes for global_events
CREATE INDEX idx_global_events_namespace ON public.global_events(event_namespace);
CREATE INDEX idx_global_events_entity ON public.global_events(entity_id);
CREATE INDEX idx_global_events_account ON public.global_events(account_id);
CREATE INDEX idx_global_events_severity ON public.global_events(severity);
CREATE INDEX idx_global_events_created_at ON public.global_events(created_at);

-- Brand Categories (Junction table)
CREATE TABLE public.brand_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL,
    category_id UUID NOT NULL,
    is_primary BOOLEAN DEFAULT false,

    -- Foreign key constraints
    FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE,
    
    -- Enforce unique brand-category pairs
    UNIQUE (brand_id, category_id)
);

-- Indexes for brand_categories
CREATE INDEX idx_brand_categories_brand ON public.brand_categories(brand_id);
CREATE INDEX idx_brand_categories_category ON public.brand_categories(category_id);

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_tags_modtime
    BEFORE UPDATE ON public.tags
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_categories_modtime
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_brands_modtime
    BEFORE UPDATE ON public.brands
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Row Level Security Policies
-- Note: These are basic examples and should be customized based on specific requirements

-- Tags RLS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tags" 
    ON public.tags FOR SELECT 
    USING (true);
CREATE POLICY "Only admins can modify tags" 
    ON public.tags FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.accounts WHERE role IN ('admin', 'moderator')));

-- Categories RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" 
    ON public.categories FOR SELECT 
    USING (true);
CREATE POLICY "Only admins can modify categories" 
    ON public.categories FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.accounts WHERE role IN ('admin', 'moderator')));

-- Brands RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view brands" 
    ON public.brands FOR SELECT 
    USING (true);
CREATE POLICY "Only admins can modify brands" 
    ON public.brands FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.accounts WHERE role IN ('admin', 'moderator')));

-- Global Events RLS
ALTER TABLE public.global_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view all events" 
    ON public.global_events FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM public.accounts WHERE role IN ('admin', 'support')));
CREATE POLICY "Users can view their own events" 
    ON public.global_events FOR SELECT 
    USING (auth.uid() = account_id);
CREATE POLICY "System can create events" 
    ON public.global_events FOR INSERT 
    WITH CHECK (true);

-- Junction Tables RLS
ALTER TABLE public.brand_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view brand categories" 
    ON public.brand_categories FOR SELECT 
    USING (true);
CREATE POLICY "Only admins can modify brand categories" 
    ON public.brand_categories FOR ALL 
    USING (auth.uid() IN (SELECT id FROM public.accounts WHERE role IN ('admin', 'moderator')));



-- Comments for future reference
COMMENT ON TABLE public.tags IS 'Flexible tagging system for products, stores, content, and system features';
COMMENT ON TABLE public.categories IS 'Hierarchical classification system with support for multiple taxonomy types';
COMMENT ON TABLE public.brands IS 'Product brand registry with verification status tracking';
COMMENT ON TABLE public.global_events IS 'System-wide event logging for auditing and monitoring';
COMMENT ON TABLE public.brand_categories IS 'Junction table linking brands to categories with primary relationship flag';