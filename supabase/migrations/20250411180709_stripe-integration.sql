-- Stripe Integration Tables
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Payment Transactions Table
CREATE TABLE public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID,
    account_id UUID NOT NULL,
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    amount DECIMAL(10,2) NOT NULL 
        CHECK (amount >= 0),
    currency TEXT NOT NULL 
        CHECK (length(currency) = 3),
    status TEXT 
        CHECK (status IN ('pending','processing','succeeded','failed','refunded','disputed')),
    payment_method_type TEXT 
        CHECK (payment_method_type IN ('credit_card','debit_card','bank_transfer','wallet')),
    fee_amount DECIMAL(10,2) 
        CHECK (fee_amount >= 0),
    net_amount DECIMAL(10,2) 
        CHECK (net_amount >= 0),
    description TEXT 
        CHECK (length(description) <= 500),
    metadata JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL,
    FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE
);

-- Payment Payouts Table
CREATE TABLE public.payment_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL,
    stripe_payout_id TEXT UNIQUE,
    amount DECIMAL(10,2) NOT NULL 
        CHECK (amount >= 0),
    currency TEXT NOT NULL 
        CHECK (length(currency) = 3),
    status TEXT 
        CHECK (status IN ('pending','in_transit','paid','failed','canceled')),
    arrival_date TIMESTAMPTZ,
    destination TEXT NOT NULL,
    transactions UUID[],
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE
);

-- Indexes for payment_transactions
CREATE INDEX idx_payment_txn_order ON public.payment_transactions(order_id);
CREATE INDEX idx_payment_txn_account ON public.payment_transactions(account_id);
CREATE INDEX idx_payment_txn_status ON public.payment_transactions(status);
CREATE INDEX idx_payment_txn_stripe_id ON public.payment_transactions(stripe_payment_intent_id);
CREATE INDEX idx_payment_txn_created ON public.payment_transactions(created_at);

-- Indexes for payment_payouts
CREATE INDEX idx_payment_payout_store ON public.payment_payouts(store_id);
CREATE INDEX idx_payment_payout_stripe_id ON public.payment_payouts(stripe_payout_id);
CREATE INDEX idx_payment_payout_status ON public.payment_payouts(status);
CREATE INDEX idx_payment_payout_created ON public.payment_payouts(created_at);

-- Triggers to update updated_at timestamp
CREATE TRIGGER update_payment_transactions_modtime
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_payment_payouts_modtime
    BEFORE UPDATE ON public.payment_payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Row Level Security Policies
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_payouts ENABLE ROW LEVEL SECURITY;

-- Users can view only their own transactions
CREATE POLICY "Users can view their own transactions" 
    ON public.payment_transactions FOR SELECT 
    USING (auth.uid() = account_id);

-- Sellers can view only their own payouts
CREATE POLICY "Sellers can view their own payouts" 
    ON public.payment_payouts FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT owner_id FROM public.stores WHERE id = store_id
        )
    );

-- Comments for documentation
COMMENT ON TABLE public.payment_transactions IS 'Records of payment transactions processed through Stripe';
COMMENT ON TABLE public.payment_payouts IS 'Records of payouts to sellers processed through Stripe';