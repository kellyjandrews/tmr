-- Reviews and Ratings System
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Reviews Table
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL,
    listing_id UUID NOT NULL,
    order_id UUID,
    store_id UUID NOT NULL,
    rating INTEGER NOT NULL 
        CHECK (rating BETWEEN 1 AND 5),
    title TEXT 
        CHECK (length(title) BETWEEN 2 AND 200),
    content TEXT 
        CHECK (length(content) BETWEEN 10 AND 2000),
    verified_purchase BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected','flagged')),
    helpful_votes INTEGER DEFAULT 0 
        CHECK (helpful_votes >= 0),
    approved_at TIMESTAMPTZ,
    photos JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL,
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

-- Review Responses Table
CREATE TABLE public.review_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL,
    account_id UUID NOT NULL,
    content TEXT NOT NULL 
        CHECK (length(content) BETWEEN 10 AND 1000),
    is_seller BOOLEAN NOT NULL,
    status TEXT DEFAULT 'active'
        CHECK (status IN ('active','removed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Review Votes Table (for tracking helpful/unhelpful votes)
CREATE TABLE public.review_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL,
    account_id UUID NOT NULL,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE,
    
    -- Each user can only vote once per review
    UNIQUE(review_id, account_id)
);

-- Indexes for reviews
CREATE INDEX idx_reviews_account ON public.reviews(account_id);
CREATE INDEX idx_reviews_listing ON public.reviews(listing_id);
CREATE INDEX idx_reviews_order ON public.reviews(order_id);
CREATE INDEX idx_reviews_store ON public.reviews(store_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_verified ON public.reviews(verified_purchase);
CREATE INDEX idx_reviews_created ON public.reviews(created_at);

-- Indexes for review_responses
CREATE INDEX idx_review_responses_review ON public.review_responses(review_id);
CREATE INDEX idx_review_responses_account ON public.review_responses(account_id);
CREATE INDEX idx_review_responses_status ON public.review_responses(status);
CREATE INDEX idx_review_responses_seller ON public.review_responses(is_seller);

-- Indexes for review_votes
CREATE INDEX idx_review_votes_review ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_account ON public.review_votes(account_id);
CREATE INDEX idx_review_votes_helpful ON public.review_votes(is_helpful);

-- Triggers to update updated_at timestamp
CREATE TRIGGER update_reviews_modtime
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_review_responses_modtime
    BEFORE UPDATE ON public.review_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Function to update helpful votes count
CREATE OR REPLACE FUNCTION update_review_helpful_votes()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the helpful_votes count on the reviews table
    UPDATE public.reviews
    SET helpful_votes = (
        SELECT COUNT(*) FROM public.review_votes
        WHERE review_id = NEW.review_id AND is_helpful = true
    )
    WHERE id = NEW.review_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update helpful votes on vote changes
CREATE TRIGGER update_helpful_votes_count
    AFTER INSERT OR UPDATE OR DELETE ON public.review_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_votes();

-- Row Level Security Policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Reviews visibility policies
CREATE POLICY "Anyone can view approved reviews" 
    ON public.reviews FOR SELECT 
    USING (status = 'approved' OR auth.uid() = account_id);

CREATE POLICY "Users can create their own reviews" 
    ON public.reviews FOR INSERT 
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own reviews" 
    ON public.reviews FOR UPDATE 
    USING (auth.uid() = account_id)
    WITH CHECK (auth.uid() = account_id AND status IN ('pending', 'approved'));

-- Review responses visibility policies
CREATE POLICY "Anyone can view active review responses" 
    ON public.review_responses FOR SELECT 
    USING (status = 'active' OR auth.uid() = account_id);

CREATE POLICY "Users can create their own responses" 
    ON public.review_responses FOR INSERT 
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own responses" 
    ON public.review_responses FOR UPDATE 
    USING (auth.uid() = account_id)
    WITH CHECK (auth.uid() = account_id);

-- Sellers can respond to reviews for their listings
CREATE POLICY "Sellers can respond to their listings' reviews" 
    ON public.review_responses FOR INSERT 
    WITH CHECK (
        is_seller = true AND
        auth.uid() IN (
            SELECT s.owner_id FROM public.stores s
            JOIN public.reviews r ON s.id = r.store_id
            WHERE r.id = review_id
        )
    );

-- Review votes policies
CREATE POLICY "Anyone can view review votes" 
    ON public.review_votes FOR SELECT 
    USING (true);

CREATE POLICY "Users can create their own votes" 
    ON public.review_votes FOR INSERT 
    WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Users can update their own votes" 
    ON public.review_votes FOR UPDATE 
    USING (auth.uid() = account_id)
    WITH CHECK (auth.uid() = account_id);

-- Comments for documentation
COMMENT ON TABLE public.reviews IS 'Product and seller reviews from verified buyers';
COMMENT ON TABLE public.review_responses IS 'Responses to reviews from sellers or other users';
COMMENT ON TABLE public.review_votes IS 'Tracks helpful/unhelpful votes on reviews';