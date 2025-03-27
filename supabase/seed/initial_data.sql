-- supabase/seed/initial_data.sql
-- Seed file for The Magic Resource marketplace

-- ==========================================
-- CLEAR EXISTING DATA (BE CAREFUL IN PRODUCTION)
-- ==========================================

-- Only use in development - this will delete all data!
-- TRUNCATE public.listings, public.listing_categories, public.listing_images, public.listing_shipping CASCADE;
-- TRUNCATE public.stores CASCADE;
-- TRUNCATE auth.users CASCADE; -- This will cascade to profiles

-- ==========================================
-- CREATE TEST USERS
-- ==========================================

-- Create test users in auth.users
-- Note: In a real environment, these would be created through Auth signup
-- For local development, we can insert directly
-- Seed script for users
-- Note: This is just for development/testing

INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) 
VALUES 
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000111', 'authenticated', 'authenticated', 'merlin@test.com', crypt('Password123!', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000222', 'authenticated', 'authenticated', 'mim@test.com', crypt('Password123!', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', '');


-- test user email identity
INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000111', '{"sub":"00000000-0000-0000-0000-000000000111","email":"merlin@test.com"}', 'email', '00000000-0000-0000-0000-000000000111', current_timestamp, current_timestamp, current_timestamp),
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000222', '{"sub":"00000000-0000-0000-0000-000000000222","email":"mim@test.com"}', 'email', '00000000-0000-0000-0000-000000000222', current_timestamp, current_timestamp, current_timestamp);

-- Create user profiles
INSERT INTO public.profiles (id, email, full_name, bio, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000111', 'merlin@test.com', 'Merlin Wizard', 
   'Master wizard with over 500 years of experience crafting magical items.', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000222', 'mim@test.com', 'Madam Mim', 
   'Specializing in rare artifacts and enchanted items.', NOW(), NOW());

-- ==========================================
-- CREATE STORES
-- ==========================================

-- Create stores for each user
INSERT INTO public.stores (id, user_id, name, slug, description, welcome_message, shipping_policy, return_policy, location, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000333', '00000000-0000-0000-0000-000000000111', 
   'Enchanted Emporium', 'enchanted-emporium', 
   'The finest magical artifacts collected from across the realms.', 
   'Welcome to the Enchanted Emporium! Browse our collection of rare and powerful magical items.', 
   'All items are delivered via magical courier within 3-5 business days. Express phoenix delivery available for an additional fee.', 
   'Returns accepted within 14 days unless otherwise specified. Some enchanted items cannot be returned once activated.', 
   'Diagon Alley', NOW(), NOW()),
  
  ('00000000-0000-0000-0000-000000000444', '00000000-0000-0000-0000-000000000222', 
   'Mystic Wonders', 'mystic-wonders', 
   'Rare magical artifacts and potions for the discerning practitioner.', 
   'Mystic Wonders welcomes you. Each item in our collection has been personally verified for magical potency.', 
   'Standard shipping by owl takes 2-3 days. International shipping available to most realms.', 
   'All sales are final on custom enchanted items. Other items may be returned within 7 days in original condition.', 
   'Hidden Vale', NOW(), NOW());

-- ==========================================
-- CREATE LISTINGS
-- ==========================================

-- Insert listings
INSERT INTO public.listings (id, store_id, name, slug, description, price, quantity, status, image_url, views_count, featured, is_digital, created_at, updated_at)
VALUES
  -- Enchanted Emporium Listings
  ('00000000-0000-0000-0000-000000000555', '00000000-0000-0000-0000-000000000333', 
   'Crystal Ball of Clarity', 'crystal-ball-of-clarity',
   'A finely crafted crystal ball with exceptional clarity. Perfect for divination and scrying.',
   119.99, 3, 'active', 'https://placehold.co/600x400?text=Crystal+Ball', 42, true, false, NOW(), NOW()),
  
  ('00000000-0000-0000-0000-000000000556', '00000000-0000-0000-0000-000000000333', 
   'Mystical Phoenix Feather Wand', 'mystical-phoenix-feather-wand',
   'Handcrafted wand with a genuine phoenix feather core. Excellent for transformation spells.',
   149.99, 5, 'active', 'https://placehold.co/600x400?text=Phoenix+Wand', 28, true, false, NOW(), NOW()),
  
  ('00000000-0000-0000-0000-000000000557', '00000000-0000-0000-0000-000000000333', 
   'Ancient Spell Grimoire', 'ancient-spell-grimoire',
   'Rare 15th century grimoire containing forgotten spells and incantations.',
   249.99, 1, 'active', 'https://placehold.co/600x400?text=Grimoire', 65, true, false, NOW(), NOW()),
  
  ('00000000-0000-0000-0000-000000000558', '00000000-0000-0000-0000-000000000333', 
   'Enchanted Oak Crystal', 'enchanted-oak-crystal',
   'Crystal grown within an ancient oak tree. Amplifies nature magic.',
   89.99, 7, 'active', 'https://placehold.co/600x400?text=Oak+Crystal', 17, false, false, NOW(), NOW()),
  
  -- Mystic Wonders Listings
  ('00000000-0000-0000-0000-000000000559', '00000000-0000-0000-0000-000000000444', 
   'Moonlight Incense Collection', 'moonlight-incense-collection',
   'Set of 12 handcrafted incense varieties, each harvested under the full moon for enhanced potency.',
   49.95, 10, 'active', 'https://placehold.co/600x400?text=Incense', 31, true, false, NOW(), NOW()),
  
  ('00000000-0000-0000-0000-000000000560', '00000000-0000-0000-0000-000000000444', 
   'Divination Card Deck', 'divination-card-deck',
   'Hand-illustrated divination cards with silver leaf detailing. More accurate than traditional tarot.',
   75.50, 15, 'active', 'https://placehold.co/600x400?text=Divination+Deck', 53, true, false, NOW(), NOW()),
  
  ('00000000-0000-0000-0000-000000000561', '00000000-0000-0000-0000-000000000444', 
   'Levitation Amulet', 'levitation-amulet',
   'Bronze amulet that grants the wearer limited levitation abilities. Perfect for reaching high shelves.',
   199.99, 2, 'active', 'https://placehold.co/600x400?text=Amulet', 27, true, false, NOW(), NOW()),
  
  ('00000000-0000-0000-0000-000000000562', '00000000-0000-0000-0000-000000000444', 
   'Mystery Box of Wonder', 'mystery-box-of-wonder',
   'A curated collection of magical curios and trinkets. Contents vary with each box.',
   39.99, 20, 'active', 'https://placehold.co/600x400?text=Mystery+Box', 45, false, false, NOW(), NOW());

-- ==========================================
-- CREATE LISTING CATEGORIES
-- ==========================================

-- Associate listings with categories
INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000555', id FROM public.categories WHERE name = 'Mentalism' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000555', id FROM public.categories WHERE name = 'Professional Equipment' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000556', id FROM public.categories WHERE name = 'Stage Magic' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000556', id FROM public.categories WHERE name = 'Professional Equipment' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000557', id FROM public.categories WHERE name = 'Magic Books & Learning' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000557', id FROM public.categories WHERE name = 'Advanced Performance' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000558', id FROM public.categories WHERE name = 'Parlor Magic' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000558', id FROM public.categories WHERE name = 'Professional Equipment' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000559', id FROM public.categories WHERE name = 'Parlor Magic' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000559', id FROM public.categories WHERE name = 'Accessories & Supplies' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000560', id FROM public.categories WHERE name = 'Mentalism' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000560', id FROM public.categories WHERE name = 'Cards & Card Magic' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000561', id FROM public.categories WHERE name = 'Stage Magic' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000561', id FROM public.categories WHERE name = 'Professional Equipment' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000562', id FROM public.categories WHERE name = 'Beginner Magic' LIMIT 1;

INSERT INTO public.listing_categories (listing_id, category_id)
SELECT '00000000-0000-0000-0000-000000000562', id FROM public.categories WHERE name = 'Close-Up Magic' LIMIT 1;

-- ==========================================
-- CREATE LISTING IMAGES
-- ==========================================

-- Add multiple images for each listing
INSERT INTO public.listing_images (listing_id, image_url, display_order, is_primary)
VALUES
  -- Crystal Ball of Clarity images
  ('00000000-0000-0000-0000-000000000555', 'https://placehold.co/600x400?text=Crystal+Ball', 0, true),
  ('00000000-0000-0000-0000-000000000555', 'https://placehold.co/600x400?text=Crystal+Ball+Side', 1, false),
  ('00000000-0000-0000-0000-000000000555', 'https://placehold.co/600x400?text=Crystal+Ball+Box', 2, false),
  
  -- Mystical Phoenix Feather Wand images
  ('00000000-0000-0000-0000-000000000556', 'https://placehold.co/600x400?text=Phoenix+Wand', 0, true),
  ('00000000-0000-0000-0000-000000000556', 'https://placehold.co/600x400?text=Phoenix+Wand+Detail', 1, false),
  
  -- Ancient Spell Grimoire images
  ('00000000-0000-0000-0000-000000000557', 'https://placehold.co/600x400?text=Grimoire', 0, true),
  ('00000000-0000-0000-0000-000000000557', 'https://placehold.co/600x400?text=Grimoire+Open', 1, false),
  ('00000000-0000-0000-0000-000000000557', 'https://placehold.co/600x400?text=Grimoire+Pages', 2, false),
  
  -- Enchanted Oak Crystal images
  ('00000000-0000-0000-0000-000000000558', 'https://placehold.co/600x400?text=Oak+Crystal', 0, true),
  ('00000000-0000-0000-0000-000000000558', 'https://placehold.co/600x400?text=Oak+Crystal+Glow', 1, false),
  
  -- Moonlight Incense Collection images
  ('00000000-0000-0000-0000-000000000559', 'https://placehold.co/600x400?text=Incense', 0, true),
  ('00000000-0000-0000-0000-000000000559', 'https://placehold.co/600x400?text=Incense+Set', 1, false),
  
  -- Divination Card Deck images
  ('00000000-0000-0000-0000-000000000560', 'https://placehold.co/600x400?text=Divination+Deck', 0, true),
  ('00000000-0000-0000-0000-000000000560', 'https://placehold.co/600x400?text=Divination+Cards', 1, false),
  ('00000000-0000-0000-0000-000000000560', 'https://placehold.co/600x400?text=Divination+Box', 2, false),
  
  -- Levitation Amulet images
  ('00000000-0000-0000-0000-000000000561', 'https://placehold.co/600x400?text=Amulet', 0, true),
  ('00000000-0000-0000-0000-000000000561', 'https://placehold.co/600x400?text=Amulet+Back', 1, false),
  
  -- Mystery Box of Wonder images
  ('00000000-0000-0000-0000-000000000562', 'https://placehold.co/600x400?text=Mystery+Box', 0, true),
  ('00000000-0000-0000-0000-000000000562', 'https://placehold.co/600x400?text=Mystery+Contents', 1, false);

  -- ==========================================
-- CREATE LISTING SHIPPING
-- ==========================================

-- Add shipping information for each listing
INSERT INTO public.listing_shipping (listing_id, flat_rate, free_shipping, ships_from, ships_to, estimated_days_min, estimated_days_max)
VALUES
  -- Crystal Ball of Clarity shipping
  ('00000000-0000-0000-0000-000000000555', 10.00, false, 'Diagon Alley', ARRAY['worldwide'], 3, 5),
  
  -- Mystical Phoenix Feather Wand shipping
  ('00000000-0000-0000-0000-000000000556', 15.00, false, 'Diagon Alley', ARRAY['worldwide'], 2, 4),
  
  -- Ancient Spell Grimoire shipping (expensive item = free shipping)
  ('00000000-0000-0000-0000-000000000557', 0.00, true, 'Diagon Alley', ARRAY['worldwide'], 1, 3),
  
  -- Enchanted Oak Crystal shipping
  ('00000000-0000-0000-0000-000000000558', 7.50, false, 'Diagon Alley', ARRAY['worldwide'], 3, 5),
  
  -- Moonlight Incense Collection shipping
  ('00000000-0000-0000-0000-000000000559', 5.00, false, 'Hidden Vale', ARRAY['worldwide'], 2, 5),
  
  -- Divination Card Deck shipping
  ('00000000-0000-0000-0000-000000000560', 3.99, false, 'Hidden Vale', ARRAY['worldwide'], 3, 7),
  
  -- Levitation Amulet shipping (expensive item = free shipping)
  ('00000000-0000-0000-0000-000000000561', 0.00, true, 'Hidden Vale', ARRAY['worldwide'], 1, 3),
  
  -- Mystery Box of Wonder shipping
  ('00000000-0000-0000-0000-000000000562', 8.50, false, 'Hidden Vale', ARRAY['worldwide'], 3, 6);


  -- ==========================================
-- CREATE SAMPLE REVIEWS
-- ==========================================

-- Add some reviews for various listings
INSERT INTO public.reviews (listing_id, user_id, rating, title, content, is_verified_purchase, created_at, updated_at)
VALUES
  -- Reviews for Crystal Ball of Clarity
  ('00000000-0000-0000-0000-000000000555', '00000000-0000-0000-0000-000000000222', 5, 
   'Exceptional Quality', 'The clarity on this crystal ball is outstanding. I can see far beyond the veil with ease.', 
   true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
   
  -- Reviews for Phoenix Feather Wand  
  ('00000000-0000-0000-0000-000000000556', '00000000-0000-0000-0000-000000000222', 5, 
   'Powerful Wand', 'The phoenix feather core responds beautifully to my magical style. Highly recommended!', 
   true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),
   
  -- Reviews for Divination Card Deck
  ('00000000-0000-0000-0000-000000000560', '00000000-0000-0000-0000-000000000111', 4, 
   'Beautiful Artwork', 'The silver leaf detailing is exquisite. Cards shuffle well and provide accurate readings.', 
   true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days');

-- ==========================================
-- CREATE SAMPLE WISHLISTS
-- ==========================================

-- Add wishlist items for each user
INSERT INTO public.wishlists (user_id, listing_id, notes)
VALUES
  -- Merlin's wishlist
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000560', 
   'Would complement my existing divination collection'),
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000561', 
   'Could be useful for reaching high shelves in the library'),
  
  -- Morgana's wishlist
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000555', 
   'Would enhance my scrying abilities'),
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000557', 
   'Those ancient spells look fascinating');

-- ==========================================
-- CREATE SAMPLE FOLLOWS
-- ==========================================

-- Users following each other's stores
INSERT INTO public.follows (user_id, store_id)
VALUES
  -- Merlin follows Morgana's store
  ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000444'),
  
  -- Morgana follows Merlin's store
  ('00000000-0000-0000-0000-000000000222', '00000000-0000-0000-0000-000000000333');


  -- ==========================================
-- CREATE SAMPLE CONVERSATIONS
-- ==========================================

-- Create some sample conversations between users
INSERT INTO public.conversations (id, title, listing_id, created_at, updated_at, last_message_at)
VALUES
  ('00000000-0000-0000-0000-000000000777', NULL, '00000000-0000-0000-0000-000000000555', 
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '6 hours'),
   
  ('00000000-0000-0000-0000-000000000778', NULL, '00000000-0000-0000-0000-000000000560', 
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day');

-- Add participants to conversations
INSERT INTO public.conversation_participants (conversation_id, user_id, is_admin)
VALUES
  -- Conversation about Crystal Ball
  ('00000000-0000-0000-0000-000000000777', '00000000-0000-0000-0000-000000000222', false), -- Morgana asking
  ('00000000-0000-0000-0000-000000000777', '00000000-0000-0000-0000-000000000111', true),  -- Merlin answering (owner)
  
  -- Conversation about Divination Deck
  ('00000000-0000-0000-0000-000000000778', '00000000-0000-0000-0000-000000000111', false), -- Merlin asking
  ('00000000-0000-0000-0000-000000000778', '00000000-0000-0000-0000-000000000222', true);  -- Morgana answering (owner)

-- Add messages to conversations
INSERT INTO public.messages (conversation_id, sender_id, content, created_at)
VALUES
  -- Conversation about Crystal Ball
  ('00000000-0000-0000-0000-000000000777', '00000000-0000-0000-0000-000000000222', 
   'Hi, I''m interested in the Crystal Ball of Clarity. Does it come with a stand?', 
   NOW() - INTERVAL '2 days'),
   
  ('00000000-0000-0000-0000-000000000777', '00000000-0000-0000-0000-000000000111', 
   'Yes, it includes a beautiful carved oak stand. It will be packed securely with the crystal ball.', 
   NOW() - INTERVAL '1 day 12 hours'),
   
  ('00000000-0000-0000-0000-000000000777', '00000000-0000-0000-0000-000000000222', 
   'Perfect! And how long do the enchantments typically last?', 
   NOW() - INTERVAL '1 day'),
   
  ('00000000-0000-0000-0000-000000000777', '00000000-0000-0000-0000-000000000111', 
   'The clarity enchantments are permanent. They''re bound to the crystal itself, not applied as a surface treatment.', 
   NOW() - INTERVAL '6 hours'),
   
  -- Conversation about Divination Deck
  ('00000000-0000-0000-0000-000000000778', '00000000-0000-0000-0000-000000000111', 
   'Hello! I''m curious about the Divination Card Deck. What makes it more accurate than traditional tarot?', 
   NOW() - INTERVAL '5 days'),
   
  ('00000000-0000-0000-0000-000000000778', '00000000-0000-0000-0000-000000000222', 
   'The cards are infused with moonstone dust which enhances psychic connections. Also, the illustrations use special sigils that amplify divination power.', 
   NOW() - INTERVAL '4 days 12 hours'),
   
  ('00000000-0000-0000-0000-000000000778', '00000000-0000-0000-0000-000000000111', 
   'That sounds excellent. Is there a guidebook included for interpreting the symbols?', 
   NOW() - INTERVAL '4 days'),
   
  ('00000000-0000-0000-0000-000000000778', '00000000-0000-0000-0000-000000000222', 
   'Yes, it comes with a comprehensive 78-page guidebook with interpretations for each card and various spreads.', 
   NOW() - INTERVAL '3 days'),
   
  ('00000000-0000-0000-0000-000000000778', '00000000-0000-0000-0000-000000000111', 
   'Perfect! I think I''ll place an order soon. Thank you for the information.', 
   NOW() - INTERVAL '2 days'),
   
  ('00000000-0000-0000-0000-000000000778', '00000000-0000-0000-0000-000000000222', 
   'You''re welcome! I''m sure you''ll enjoy working with them. Let me know if you have any other questions.', 
   NOW() - INTERVAL '1 day');