-- Inventory Management System
-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inventory Table
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL,
    sku TEXT UNIQUE,
    quantity_available INTEGER NOT NULL DEFAULT 0 
        CHECK (quantity_available >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 
        CHECK (quantity_reserved >= 0),
    restock_threshold INTEGER 
        CHECK (restock_threshold >= 0),
    warehouse_location TEXT,
    last_restock_date TIMESTAMPTZ,
    next_restock_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE
);

-- Inventory Transactions Table
CREATE TABLE public.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL,
    quantity_change INTEGER NOT NULL,
    transaction_type TEXT 
        CHECK (transaction_type IN ('purchase','sale','return','adjustment','restock','reservation')),
    order_id UUID,
    cart_id UUID,
    notes TEXT 
        CHECK (length(notes) <= 500),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Foreign key constraints
    FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL,
    FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES public.accounts(id) ON DELETE SET NULL
);

-- Indexes for inventory
CREATE INDEX idx_inventory_listing ON public.inventory(listing_id);
CREATE INDEX idx_inventory_sku ON public.inventory(sku);
CREATE INDEX idx_inventory_low_stock ON public.inventory(quantity_available) 
    WHERE quantity_available <= restock_threshold;
CREATE INDEX idx_inventory_restock ON public.inventory(next_restock_date);

-- Indexes for inventory_transactions
CREATE INDEX idx_inventory_tx_inventory ON public.inventory_transactions(inventory_id);
CREATE INDEX idx_inventory_tx_type ON public.inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_tx_order ON public.inventory_transactions(order_id);
CREATE INDEX idx_inventory_tx_cart ON public.inventory_transactions(cart_id);
CREATE INDEX idx_inventory_tx_created ON public.inventory_transactions(created_at);

-- Triggers to update updated_at timestamp
CREATE TRIGGER update_inventory_modtime
    BEFORE UPDATE ON public.inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Function to update inventory quantity based on transactions
CREATE OR REPLACE FUNCTION update_inventory_quantity()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the inventory quantity based on the transaction type
    IF NEW.transaction_type IN ('purchase', 'return', 'restock') THEN
        -- Add to available quantity
        UPDATE public.inventory
        SET quantity_available = quantity_available + NEW.quantity_change
        WHERE id = NEW.inventory_id;
    ELSIF NEW.transaction_type = 'sale' THEN
        -- Reduce available quantity
        UPDATE public.inventory
        SET quantity_available = quantity_available + NEW.quantity_change
        WHERE id = NEW.inventory_id;
    ELSIF NEW.transaction_type = 'reservation' THEN
        -- Move from available to reserved
        IF NEW.quantity_change > 0 THEN
            UPDATE public.inventory
            SET 
                quantity_available = quantity_available - NEW.quantity_change,
                quantity_reserved = quantity_reserved + NEW.quantity_change
            WHERE id = NEW.inventory_id;
        ELSE
            -- Negative change means releasing reservation
            UPDATE public.inventory
            SET 
                quantity_available = quantity_available - NEW.quantity_change,
                quantity_reserved = quantity_reserved + NEW.quantity_change
            WHERE id = NEW.inventory_id;
        END IF;
    ELSIF NEW.transaction_type = 'adjustment' THEN
        -- Direct adjustment to available quantity
        UPDATE public.inventory
        SET quantity_available = quantity_available + NEW.quantity_change
        WHERE id = NEW.inventory_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update inventory on transaction
CREATE TRIGGER update_inventory_on_transaction
    AFTER INSERT ON public.inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_quantity();

-- Row Level Security Policies
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Sellers can view and manage inventory for their listings
CREATE POLICY "Sellers can manage their inventory" 
    ON public.inventory FOR ALL 
    USING (
        auth.uid() IN (
            SELECT s.owner_id FROM public.stores s
            JOIN public.listings l ON s.id = l.store_id
            WHERE l.id = listing_id
        )
    );

-- Transactions are viewable by the seller who owns the inventory
CREATE POLICY "Sellers can view their inventory transactions" 
    ON public.inventory_transactions FOR SELECT 
    USING (
        auth.uid() IN (
            SELECT s.owner_id FROM public.stores s
            JOIN public.listings l ON s.id = l.store_id
            JOIN public.inventory i ON l.id = i.listing_id
            WHERE i.id = inventory_id
        )
    );

-- System can create transactions
CREATE POLICY "System can create inventory transactions" 
    ON public.inventory_transactions FOR INSERT 
    WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE public.inventory IS 'Tracks inventory levels for listings';
COMMENT ON TABLE public.inventory_transactions IS 'Records all inventory movements and adjustments';
COMMENT ON FUNCTION update_inventory_quantity() IS 'Automatically updates inventory quantities based on transaction types';