-- SEO and Analytics System
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SEO Metadata Table
CREATE TABLE public.seo_metadata (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL 
        CHECK (entity_type IN ('listing','store','category','brand','page')),
    title TEXT 
        CHECK (length(title) BETWEEN 10 AND 70),
    description TEXT 
        CHECK (length(description) BETWEEN 50 AND 160),
    keywords TEXT 
        CHECK (length(keywords) <= 200),
    canonical_url TEXT 
        CHECK (canonical_url ~* '^https?://'),
    og_title TEXT 
        CHECK (length(og_title) <= 100),
    og_description TEXT 
        CHECK (length(og_description) <= 200),
    og_image_url TEXT 
        CHECK (og_image_url ~* '^https?://'),
    schema_markup JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Enforce unique constraint per entity
    UNIQUE(entity_id, entity_type)
);

-- Page Analytics Table
CREATE TABLE public.page_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_path TEXT NOT NULL,
    page_type TEXT NOT NULL,
    entity_id UUID,
    entity_type TEXT,
    view_count INTEGER NOT NULL DEFAULT 0,
    unique_visitor_count INTEGER NOT NULL DEFAULT 0,
    average_time_spent DECIMAL(10,2) NOT NULL DEFAULT 0,
    bounce_rate DECIMAL(5,4) 
        CHECK (bounce_rate BETWEEN 0 AND 1),
    exit_rate DECIMAL(5,4) 
        CHECK (exit_rate BETWEEN 0 AND 1),
    conversion_rate DECIMAL(5,4) 
        CHECK (conversion_rate BETWEEN 0 AND 1),
    device_breakdown JSONB,
    referrer_breakdown JSONB,
    date_period TEXT NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Enforce unique constraint per page and time period
    UNIQUE(page_path, date_period, period_start, period_end)
);

-- URL Redirects Table
CREATE TABLE public.url_redirects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_path TEXT NOT NULL UNIQUE,
    destination_path TEXT NOT NULL,
    redirect_type INTEGER NOT NULL 
        CHECK (redirect_type IN (301, 302, 307, 308)),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID,
    hit_count INTEGER NOT NULL DEFAULT 0,
    last_accessed TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Foreign key constraint
    FOREIGN KEY (created_by) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Indexes for seo_metadata
CREATE INDEX idx_seo_entity ON public.seo_metadata(entity_id, entity_type);
CREATE INDEX idx_seo_canonical ON public.seo_metadata(canonical_url);

-- Indexes for page_analytics
CREATE INDEX idx_analytics_path ON public.page_analytics(page_path);
CREATE INDEX idx_analytics_entity ON public.page_analytics(entity_id, entity_type);
CREATE INDEX idx_analytics_period ON public.page_analytics(period_start, period_end);
CREATE INDEX idx_analytics_type ON public.page_analytics(page_type);

-- Indexes for url_redirects
CREATE INDEX idx_redirects_source ON public.url_redirects(source_path);
CREATE INDEX idx_redirects_active ON public.url_redirects(is_active);
CREATE INDEX idx_redirects_hit_count ON public.url_redirects(hit_count);

-- Triggers to update updated_at timestamp
CREATE TRIGGER update_seo_metadata_modtime
    BEFORE UPDATE ON public.seo_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_page_analytics_modtime
    BEFORE UPDATE ON public.page_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_url_redirects_modtime
    BEFORE UPDATE ON public.url_redirects
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Function to increment redirect hit count
CREATE OR REPLACE FUNCTION increment_redirect_hit_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.url_redirects
    SET 
        hit_count = hit_count + 1,
        last_accessed = now()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to track redirect usage
CREATE TRIGGER track_redirect_usage
    AFTER UPDATE OF hit_count ON public.url_redirects
    FOR EACH ROW
    EXECUTE FUNCTION increment_redirect_hit_count();

-- Row Level Security Policies
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.url_redirects ENABLE ROW LEVEL SECURITY;

-- SEO metadata is readable by all, but only editable by owners
CREATE POLICY "Anyone can view SEO metadata" 
    ON public.seo_metadata FOR SELECT 
    USING (true);

CREATE POLICY "Owners can manage SEO metadata for listings" 
    ON public.seo_metadata FOR ALL 
    USING (
        entity_type = 'listing' AND
        auth.uid() IN (
            SELECT s.owner_id FROM public.stores s
            JOIN public.listings l ON s.id = l.store_id
            WHERE l.id = entity_id
        )
    );

CREATE POLICY "Owners can manage SEO metadata for stores" 
    ON public.seo_metadata FOR ALL 
    USING (
        entity_type = 'store' AND
        auth.uid() IN (
            SELECT owner_id FROM public.stores
            WHERE id = entity_id
        )
    );

-- Analytics data visible only to admins and owners
CREATE POLICY "Owners can view analytics for their entities" 
    ON public.page_analytics FOR SELECT 
    USING (
        (entity_type = 'listing' AND
        auth.uid() IN (
            SELECT s.owner_id FROM public.stores s
            JOIN public.listings l ON s.id = l.store_id
            WHERE l.id = entity_id
        ))
        OR
        (entity_type = 'store' AND
        auth.uid() IN (
            SELECT owner_id FROM public.stores
            WHERE id = entity_id
        ))
        OR
        auth.jwt()->>'role' IN ('admin', 'support')
    );

-- URL redirects managed by admins
CREATE POLICY "Admins can manage URL redirects" 
    ON public.url_redirects FOR ALL 
    USING (auth.jwt()->>'role' IN ('admin', 'support'));

CREATE POLICY "Anyone can view active URL redirects" 
    ON public.url_redirects FOR SELECT 
    USING (is_active = true);

-- Comments for documentation
COMMENT ON TABLE public.seo_metadata IS 'SEO optimization data for listings, stores, and other entities';
COMMENT ON TABLE public.page_analytics IS 'Aggregated analytics data for pages and entities';
COMMENT ON TABLE public.url_redirects IS 'URL redirect management for site structure changes';