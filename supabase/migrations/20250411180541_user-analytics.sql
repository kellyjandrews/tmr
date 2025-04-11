-- User Analytics and Engagement
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Analytics Table
CREATE TABLE public.user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    visit_count INTEGER DEFAULT 0 
        CHECK (visit_count >= 0),
    last_visit TIMESTAMPTZ,
    favorite_categories JSONB,
    time_spent JSONB,
    device_preferences JSONB,
    referral_source TEXT 
        CHECK (length(referral_source) <= 200),
    abandoned_cart_count INTEGER DEFAULT 0 
        CHECK (abandoned_cart_count >= 0),
    conversion_rate DECIMAL(5,4) 
        CHECK (conversion_rate >= 0 AND conversion_rate <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraint
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_user_analytics_account ON public.user_analytics(account_id);
CREATE INDEX idx_user_analytics_conversion ON public.user_analytics(conversion_rate);
CREATE INDEX idx_user_analytics_created ON public.user_analytics(created_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_analytics_modtime
    BEFORE UPDATE ON public.user_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Row Level Security Policy
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view only their own analytics
CREATE POLICY "Users can view their own analytics" 
    ON public.user_analytics FOR SELECT 
    USING (auth.uid() = account_id);
    
-- Only system can modify analytics
CREATE POLICY "Only system can modify analytics" 
    ON public.user_analytics FOR ALL 
    USING (auth.uid() IS NULL);

-- Comments for documentation
COMMENT ON TABLE public.user_analytics IS 'Tracks user behavior and interaction patterns for personalization';