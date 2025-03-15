-- Seed file for categories in The Magic Resource marketplace
-- This file contains all the categories from the three different categorization approaches
-- Updated to include slugs for each category

-- Clean up existing data if needed (be careful in production!)
-- TRUNCATE public.categories CASCADE;

-- First, insert main/parent categories
-- ====================================

-- Performance Type Categories
INSERT INTO public.categories (id, name, slug, description, parent_id, display_order, is_featured)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Stage Magic', 'stage-magic', 'Illusions and effects designed for stage performances', NULL, 10, true),
  ('00000000-0000-0000-0000-000000000002', 'Close-Up Magic', 'close-up-magic', 'Magic performed up close with small objects and intimate settings', NULL, 20, true),
  ('00000000-0000-0000-0000-000000000003', 'Parlor Magic', 'parlor-magic', 'Effects designed for medium-sized audiences in intimate settings', NULL, 30, true),
  ('00000000-0000-0000-0000-000000000004', 'Mentalism', 'mentalism', 'Effects that demonstrate seeming mind-reading and psychic abilities', NULL, 40, true),
  ('00000000-0000-0000-0000-000000000005', 'Magic Books & Learning', 'magic-books-learning', 'Educational resources for magicians', NULL, 50, true);

-- Prop-Based Categories
INSERT INTO public.categories (id, name, slug, description, parent_id, display_order, is_featured)
VALUES 
  ('00000000-0000-0000-0000-000000000006', 'Cards & Card Magic', 'cards-card-magic', 'Playing cards and gimmicks for card magic effects', NULL, 60, true),
  ('00000000-0000-0000-0000-000000000007', 'Coins & Money Magic', 'coins-money-magic', 'Props and effects using coins and paper money', NULL, 70, true),
  ('00000000-0000-0000-0000-000000000008', 'Illusions & Props', 'illusions-props', 'Physical props and illusions for magical performances', NULL, 80, true),
  ('00000000-0000-0000-0000-000000000009', 'Mentalism & Prediction', 'mentalism-prediction', 'Tools for mentalism and prediction effects', NULL, 90, false),
  ('00000000-0000-0000-0000-000000000010', 'Accessories & Supplies', 'accessories-supplies', 'Supporting tools and materials for magicians', NULL, 100, false),
  ('00000000-0000-0000-0000-000000000011', 'Books & Learning', 'books-learning', 'Educational materials for learning magic', NULL, 110, false);

-- Skill Level Categories
INSERT INTO public.categories (id, name, slug, description, parent_id, display_order, is_featured)
VALUES 
  ('00000000-0000-0000-0000-000000000012', 'Beginner Magic', 'beginner-magic', 'Effects and resources suitable for beginners', NULL, 120, true),
  ('00000000-0000-0000-0000-000000000013', 'Intermediate Effects', 'intermediate-effects', 'Effects requiring some experience and skill', NULL, 130, false),
  ('00000000-0000-0000-0000-000000000014', 'Advanced Performance', 'advanced-performance', 'Material for experienced performers', NULL, 140, false),
  ('00000000-0000-0000-0000-000000000015', 'Professional Equipment', 'professional-equipment', 'High-quality tools for professional magicians', NULL, 150, true),
  ('00000000-0000-0000-0000-000000000016', 'Specialties', 'specialties', 'Specialized areas of magical performance', NULL, 160, false);

-- Now insert subcategories with references to parent categories
-- ===========================================================

-- Stage Magic subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Grand Illusions', 'grand-illusions', 'Large-scale illusions for theatrical performances', '00000000-0000-0000-0000-000000000001', 1),
  ('Mentalism Props', 'mentalism-props', 'Tools for stage mentalism performances', '00000000-0000-0000-0000-000000000001', 2),
  ('Stage Accessories', 'stage-accessories', 'Supporting accessories for stage performances', '00000000-0000-0000-0000-000000000001', 3),
  ('Lighting & Effects', 'lighting-effects', 'Visual and lighting effects for enhancing performances', '00000000-0000-0000-0000-000000000001', 4),
  ('Backdrops & Scenery', 'backdrops-scenery', 'Stage settings and backdrops for magical performances', '00000000-0000-0000-0000-000000000001', 5);

-- Close-Up Magic subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Card Tricks', 'card-tricks', 'Effects using playing cards', '00000000-0000-0000-0000-000000000002', 1),
  ('Coin Magic', 'coin-magic', 'Effects using coins and small metal objects', '00000000-0000-0000-0000-000000000002', 2),
  ('Small Props', 'small-props', 'Miniature props designed for close-up performance', '00000000-0000-0000-0000-000000000002', 3),
  ('Walkaround Items', 'walkaround-items', 'Portable magic for mingling performances', '00000000-0000-0000-0000-000000000002', 4),
  ('Table Magic', 'table-magic', 'Effects designed to be performed at a table', '00000000-0000-0000-0000-000000000002', 5);

-- Parlor Magic subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Medium-sized Illusions', 'medium-sized-illusions', 'Illusions scaled for parlor performances', '00000000-0000-0000-0000-000000000003', 1),
  ('Audience Participation', 'audience-participation', 'Effects involving audience members', '00000000-0000-0000-0000-000000000003', 2),
  ('Parlor Sets', 'parlor-sets', 'Complete sets of effects for parlor shows', '00000000-0000-0000-0000-000000000003', 3),
  ('Ambient Props', 'ambient-props', 'Props that enhance the parlor performance environment', '00000000-0000-0000-0000-000000000003', 4);

-- Mentalism subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Prediction Tools', 'prediction-tools', 'Props for demonstrating prediction abilities', '00000000-0000-0000-0000-000000000004', 1),
  ('Mind Reading Devices', 'mind-reading-devices', 'Tools for apparent mind reading effects', '00000000-0000-0000-0000-000000000004', 2),
  ('Psychological Forces', 'psychological-forces', 'Methods for subtly influencing spectator choices', '00000000-0000-0000-0000-000000000004', 3),
  ('Mentalism Books', 'mentalism-books', 'Literature on mentalism techniques and effects', '00000000-0000-0000-0000-000000000004', 4);

-- Magic Books & Learning subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Tutorials', 'tutorials', 'Instructional materials for learning specific effects', '00000000-0000-0000-0000-000000000005', 1),
  ('Performance Theory', 'performance-theory', 'Resources on the theory of magical performance', '00000000-0000-0000-0000-000000000005', 2),
  ('Magic History', 'magic-history', 'Books and resources on the history of magic', '00000000-0000-0000-0000-000000000005', 3),
  ('Technique Guides', 'technique-guides', 'Educational materials focused on technical skills', '00000000-0000-0000-0000-000000000005', 4);

-- Cards & Card Magic subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Playing Cards', 'playing-cards', 'Standard and specialty decks of cards', '00000000-0000-0000-0000-000000000006', 1),
  ('Gimmicked Cards', 'gimmicked-cards', 'Special cards with built-in features for magical effects', '00000000-0000-0000-0000-000000000006', 2),
  ('Card Accessories', 'card-accessories', 'Tools and accessories for card magic', '00000000-0000-0000-0000-000000000006', 3),
  ('Card Magic Sets', 'card-magic-sets', 'Complete sets for card magic performances', '00000000-0000-0000-0000-000000000006', 4);

-- Coins & Money Magic subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Trick Coins', 'trick-coins', 'Specialty coins designed for magical effects', '00000000-0000-0000-0000-000000000007', 1),
  ('Coin Sets', 'coin-sets', 'Collections of coins for magical performances', '00000000-0000-0000-0000-000000000007', 2),
  ('Money Gimmicks', 'money-gimmicks', 'Gimmicked currency for magical effects', '00000000-0000-0000-0000-000000000007', 3),
  ('Coin Magic Tools', 'coin-magic-tools', 'Accessories and tools for coin magic', '00000000-0000-0000-0000-000000000007', 4);

-- Illusions & Props subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Small Illusions', 'small-illusions', 'Compact illusions for intimate performances', '00000000-0000-0000-0000-000000000008', 1),
  ('Medium Illusions', 'medium-illusions', 'Mid-sized illusions for parlor settings', '00000000-0000-0000-0000-000000000008', 2),
  ('Grand Illusions', 'grand-illusions-prop', 'Large-scale illusions for stage performances', '00000000-0000-0000-0000-000000000008', 3),
  ('Prop Construction', 'prop-construction', 'Materials and guidance for building custom props', '00000000-0000-0000-0000-000000000008', 4);

-- Mentalism & Prediction subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Prediction Devices', 'prediction-devices', 'Props for prediction effects', '00000000-0000-0000-0000-000000000009', 1),
  ('Books & Manuscripts', 'books-manuscripts', 'Written materials for mentalism performances', '00000000-0000-0000-0000-000000000009', 2),
  ('Mentalism Accessories', 'mentalism-accessories', 'Supporting tools for mentalism effects', '00000000-0000-0000-0000-000000000009', 3),
  ('Electronic Aids', 'electronic-aids', 'Technology-based tools for mentalism', '00000000-0000-0000-0000-000000000009', 4);

-- Accessories & Supplies subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Carrying Cases', 'carrying-cases', 'Cases for transporting magical equipment', '00000000-0000-0000-0000-000000000010', 1),
  ('Performance Attire', 'performance-attire', 'Clothing and accessories for performances', '00000000-0000-0000-0000-000000000010', 2),
  ('Maintenance Supplies', 'maintenance-supplies', 'Materials for maintaining magical props', '00000000-0000-0000-0000-000000000010', 3),
  ('Custom Equipment', 'custom-equipment', 'Bespoke and specialized magical equipment', '00000000-0000-0000-0000-000000000010', 4);

-- Books & Learning (Prop-Based) subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Instructional Books', 'instructional-books', 'Books teaching magical techniques and effects', '00000000-0000-0000-0000-000000000011', 1),
  ('Video Courses', 'video-courses', 'Video-based instruction for magicians', '00000000-0000-0000-0000-000000000011', 2),
  ('Scripts & Routines', 'scripts-routines', 'Written performance materials for magical shows', '00000000-0000-0000-0000-000000000011', 3),
  ('Performance Theory', 'performance-theory-books', 'Materials on the theory and psychology of magic', '00000000-0000-0000-0000-000000000011', 4);

-- Beginner Magic subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Starter Sets', 'starter-sets', 'Complete sets for beginning magicians', '00000000-0000-0000-0000-000000000012', 1),
  ('Self-Working Tricks', 'self-working-tricks', 'Effects that require minimal technical skill', '00000000-0000-0000-0000-000000000012', 2),
  ('Basic Techniques', 'basic-techniques', 'Learning resources for fundamental skills', '00000000-0000-0000-0000-000000000012', 3),
  ('Introductory Materials', 'introductory-materials', 'Beginner-friendly educational resources', '00000000-0000-0000-0000-000000000012', 4);

-- Intermediate Effects subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Sleight of Hand', 'sleight-of-hand', 'Effects requiring manual dexterity', '00000000-0000-0000-0000-000000000013', 1),
  ('Semi-Automatic Effects', 'semi-automatic-effects', 'Gimmicked props requiring some skill', '00000000-0000-0000-0000-000000000013', 2),
  ('Technical Development', 'technical-development', 'Resources for improving technical abilities', '00000000-0000-0000-0000-000000000013', 3),
  ('Performance Routines', 'performance-routines', 'Complete routines for intermediate performers', '00000000-0000-0000-0000-000000000013', 4);

-- Advanced Performance subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Complex Methods', 'complex-methods', 'Sophisticated techniques for advanced performers', '00000000-0000-0000-0000-000000000014', 1),
  ('Professional-Grade Props', 'professional-grade-props', 'High-quality props for skilled performers', '00000000-0000-0000-0000-000000000014', 2),
  ('Advanced Technique Materials', 'advanced-technique-materials', 'Educational resources for advanced skills', '00000000-0000-0000-0000-000000000014', 3),
  ('Custom Equipment', 'custom-equipment-advanced', 'Specialized tools for advanced performances', '00000000-0000-0000-0000-000000000014', 4);

-- Professional Equipment subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Full Show Sets', 'full-show-sets', 'Complete performance sets for professional shows', '00000000-0000-0000-0000-000000000015', 1),
  ('Stage Illusions', 'stage-illusions', 'Large-scale illusions for professional performances', '00000000-0000-0000-0000-000000000015', 2),
  ('Professional Cases', 'professional-cases', 'High-quality cases for transporting equipment', '00000000-0000-0000-0000-000000000015', 3),
  ('Custom-Built Props', 'custom-built-props', 'Bespoke props for professional magicians', '00000000-0000-0000-0000-000000000015', 4);

-- Specialties subcategories
INSERT INTO public.categories (name, slug, description, parent_id, display_order)
VALUES 
  ('Mentalism', 'mentalism-specialty', 'Effects demonstrating apparent psychic abilities', '00000000-0000-0000-0000-000000000016', 1),
  ('Children''s Magic', 'childrens-magic', 'Effects designed for young audiences', '00000000-0000-0000-0000-000000000016', 2),
  ('Comedy Magic', 'comedy-magic', 'Effects with humorous presentations', '00000000-0000-0000-0000-000000000016', 3),
  ('Bizarre Magic', 'bizarre-magic', 'Effects with darker, mysterious themes', '00000000-0000-0000-0000-000000000016', 4);