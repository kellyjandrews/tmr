-- Search History and Recommendations System

-- Search History Table
CREATE TABLE public.search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID,
    session_id TEXT,
    query TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER NOT NULL DEFAULT 0 
        CHECK (results_count >= 0),
    clicked_results UUID[],
    device_type TEXT 
        CHECK (device_type IN ('mobile','desktop','tablet')),
    location JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Product Recommendations Table
CREATE TABLE public.product_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    listing_id UUID NOT NULL,
    confidence_score DECIMAL(5,4) 
        CHECK (confidence_score BETWEEN 0 AND 1),
    recommendation_type TEXT 
        CHECK (recommendation_type IN ('similar_item','frequently_bought_together','viewed_also_viewed','personalized')),
    source_listing_id UUID,
    viewed BOOLEAN DEFAULT false,
    clicked BOOLEAN DEFAULT false,
    converted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (source_listing_id) REFERENCES public.listings(id) ON DELETE SET NULL
);

-- Popular Search Terms Table
CREATE TABLE public.popular_search_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term TEXT NOT NULL UNIQUE,
    search_count INTEGER NOT NULL DEFAULT 0,
    result_count_avg INTEGER NOT NULL DEFAULT 0,
    conversion_rate DECIMAL(5,4) 
        CHECK (conversion_rate BETWEEN 0 AND 1),
    time_period TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    trending_score DECIMAL(10,2) DEFAULT 0,
    related_terms TEXT[],
    categories JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Search Suggestions Table
CREATE TABLE public.search_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prefix TEXT NOT NULL,
    suggestion TEXT NOT NULL,
    category TEXT,
    display_priority INTEGER DEFAULT 0,
    is_promoted BOOLEAN DEFAULT false,
    is_curated BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) 
        CHECK (conversion_rate BETWEEN 0 AND 1),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Each suggestion should be unique for a given prefix
    UNIQUE(prefix, suggestion)
);

-- Indexes for search_history
CREATE INDEX idx_search_history_account ON public.search_history(account_id);
CREATE INDEX idx_search_history_query ON public.search_history(query);
CREATE INDEX idx_search_history_session ON public.search_history(session_id);
CREATE INDEX idx_search_history_created ON public.search_history(created_at);
CREATE INDEX idx_search_history_device ON public.search_history(device_type);

-- Indexes for product_recommendations
CREATE INDEX idx_recommendations_account ON public.product_recommendations(account_id);
CREATE INDEX idx_recommendations_listing ON public.product_recommendations(listing_id);
CREATE INDEX idx_recommendations_score ON public.product_recommendations(confidence_score DESC);
CREATE INDEX idx_recommendations_type ON public.product_recommendations(recommendation_type);
CREATE INDEX idx_recommendations_source ON public.product_recommendations(source_listing_id);
CREATE INDEX idx_recommendations_expiry ON public.product_recommendations(expires_at);
CREATE INDEX idx_popular_terms_time_trend ON public.popular_search_terms(time_period, trending_score DESC);


-- Indexes for popular_search_terms
CREATE INDEX idx_popular_terms_count ON public.popular_search_terms(search_count DESC);
CREATE INDEX idx_popular_terms_period ON public.popular_search_terms(term, time_period);
CREATE INDEX idx_popular_terms_trending ON public.popular_search_terms(trending_score DESC);
CREATE INDEX idx_popular_terms_conversion ON public.popular_search_terms(conversion_rate DESC);

-- Indexes for search_suggestions
CREATE INDEX idx_search_suggestions_prefix ON public.search_suggestions(prefix);
CREATE INDEX idx_search_suggestions_priority ON public.search_suggestions(display_priority);
CREATE INDEX idx_search_suggestions_usage ON public.search_suggestions(usage_count DESC);
CREATE INDEX idx_search_suggestions_promoted ON public.search_suggestions(is_promoted) WHERE is_promoted = true;

-- Triggers to update updated_at timestamp
CREATE TRIGGER update_popular_search_terms_modtime
    BEFORE UPDATE ON public.popular_search_terms
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_search_suggestions_modtime
    BEFORE UPDATE ON public.search_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Function to cleanup expired recommendations
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.product_recommendations 
    WHERE expires_at IS NOT NULL AND expires_at < now();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;