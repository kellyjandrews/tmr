-- Create reviews table for listing ratings and feedback
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_item_id UUID REFERENCES public.order_items(id), -- Optional link to verify purchase
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  content TEXT,
  response TEXT, -- Store owner's response to the review
  response_date TIMESTAMPTZ,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a user can only review a listing once
  CONSTRAINT unique_user_listing_review UNIQUE (user_id, listing_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_reviews_listing_id ON public.reviews(listing_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create conversations table to group related messages
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  listing_id UUID REFERENCES public.listings(id), -- Optional reference if conversation is about a specific listing
  order_id UUID REFERENCES public.orders(id), -- Optional reference if conversation is about a specific order
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_conversations_listing_id ON public.conversations(listing_id);
CREATE INDEX idx_conversations_order_id ON public.conversations(order_id);
CREATE INDEX idx_conversations_last_message_at ON public.conversations(last_message_at);

-- Add trigger to automatically update updated_at column
CREATE TRIGGER set_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create conversation participants to track users in a conversation
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  is_admin BOOLEAN NOT NULL DEFAULT false,
  last_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a user is only in a conversation once
  CONSTRAINT unique_conversation_participant UNIQUE (conversation_id, user_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);

-- Create messages table for communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_system_message BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);

-- Create wishlists table for saving favorite items
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a user cannot add the same item twice to their wishlist
  CONSTRAINT unique_wishlist_item UNIQUE (user_id, listing_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlists_listing_id ON public.wishlists(listing_id);

-- Create follows table for store subscriptions
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Ensure a user cannot follow the same store twice
  CONSTRAINT unique_store_follow UNIQUE (user_id, store_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_follows_user_id ON public.follows(user_id);
CREATE INDEX idx_follows_store_id ON public.follows(store_id);

-- Enable Row Level Security for all tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reviews

-- Anyone can view non-hidden reviews
CREATE POLICY "Anyone can view public reviews"
  ON public.reviews
  FOR SELECT
  USING (NOT is_hidden);

-- Store owners can view all reviews for their listings
CREATE POLICY "Store owners can view all reviews for their listings"
  ON public.reviews
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

-- Users can create reviews
CREATE POLICY "Users can create reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON public.reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Store owners can respond to reviews for their listings
CREATE POLICY "Store owners can respond to reviews"
  ON public.reviews
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.stores s ON l.store_id = s.id
      WHERE l.id = listing_id AND s.user_id = auth.uid()
    )
  );

  
-- Create RLS policies for conversations and messages

-- Users can view conversations they're part of
CREATE POLICY "Users can view their conversations"
  ON public.conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in their conversations"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

-- Create RLS policies for wishlists

-- Users can view only their own wishlists
CREATE POLICY "Users can view their own wishlists"
  ON public.wishlists
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own wishlists
CREATE POLICY "Users can manage their own wishlists"
  ON public.wishlists
  FOR ALL
  USING (auth.uid() = user_id);

-- Create RLS policies for follows

-- Users can view their own follows
CREATE POLICY "Users can view their own follows"
  ON public.follows
  FOR SELECT
  USING (auth.uid() = user_id);

-- Store owners can see who follows them
CREATE POLICY "Store owners can see who follows them"
  ON public.follows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = store_id AND user_id = auth.uid()
    )
  );

-- Users can manage their own follows
CREATE POLICY "Users can manage their own follows"
  ON public.follows
  FOR ALL
  USING (auth.uid() = user_id);