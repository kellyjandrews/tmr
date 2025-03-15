-- Create orders table for tracking purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Shipping Information
  shipping_address JSON NOT NULL, -- Stores structured address data
  shipping_method TEXT,
  shipping_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tracking_number TEXT,
  
  -- Payment Information
  payment_method TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  
  -- Notes
  customer_notes TEXT,
  private_notes TEXT, -- For seller only
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Create indexes for faster lookups
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create order items table to track individual items in an order
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  
  -- Item details at time of purchase (in case listing changes)
  item_name TEXT NOT NULL,
  item_description TEXT,
  item_image_url TEXT,
  
  -- Pricing
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')) DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_listing_id ON public.order_items(listing_id);
CREATE INDEX idx_order_items_store_id ON public.order_items(store_id);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_order_items_updated_at
BEFORE UPDATE ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create table for order status history
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  comment TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);

-- Create shopping cart table
CREATE TABLE public.shopping_cart (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  added_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a user cannot add the same item twice (update quantity instead)
  CONSTRAINT unique_cart_item UNIQUE (user_id, listing_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_shopping_cart_user_id ON public.shopping_cart(user_id);
CREATE INDEX idx_shopping_cart_listing_id ON public.shopping_cart(listing_id);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_shopping_cart_updated_at
BEFORE UPDATE ON public.shopping_cart
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security for all tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_cart ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for orders

-- Customers can view their own orders
CREATE POLICY "Users can view their own orders"
  ON public.orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Sellers can view orders containing their items
CREATE POLICY "Sellers can view orders with their items"
  ON public.orders
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT s.user_id FROM public.stores s
      JOIN public.order_items oi ON s.id = oi.store_id
      WHERE oi.order_id = public.orders.id
    )
  );

-- Only customers can create their own orders
CREATE POLICY "Users can create their own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Customers can update only certain fields of their own orders
CREATE POLICY "Users can update their own orders"
  ON public.orders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for order_items

-- Customers can view their own order items
CREATE POLICY "Users can view their own order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE id = order_id AND user_id = auth.uid()
    )
  );

-- Sellers can view order items for their listings
CREATE POLICY "Sellers can view their order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.user_id = auth.uid()
    )
  );

-- Create RLS policies for shopping_cart

-- Users can only see their own cart
CREATE POLICY "Users can view their own cart"
  ON public.shopping_cart
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only add items to their own cart
CREATE POLICY "Users can manage their own cart"
  ON public.shopping_cart
  FOR ALL
  USING (auth.uid() = user_id);