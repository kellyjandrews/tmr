-- Seed file for tags in The Magic Resource marketplace
-- This file contains all the tags from the three different tag approaches
-- Updated to include slugs for each tag

-- Clean up existing data if needed (be careful in production!)
-- TRUNCATE public.tags CASCADE;

-- Performance Characteristics Tags
INSERT INTO public.tags (name, slug, description, color, is_system)
VALUES 
  ('Visual', 'visual', 'Effects with strong visual impact', '#FF5733', true),
  ('Auditory', 'auditory', 'Effects involving sound', '#337DFF', true),
  ('Interactive', 'interactive', 'Requires audience participation', '#33FF57', true),
  ('Silent', 'silent', 'Can be performed without speaking', '#A233FF', true),
  ('Quick', 'quick', 'Fast performance time', '#FF33A2', true),
  ('Impromptu', 'impromptu', 'Can be performed with little setup', '#33FFF9', true),
  ('Self-working', 'self-working', 'Requires minimal technical skill', '#FFFC33', true),
  ('Technical', 'technical', 'Requires advanced handling techniques', '#FF8333', true),
  ('Reputation-maker', 'reputation-maker', 'Signature effects known to build a performer''s brand', '#3356FF', true),
  ('Classic', 'classic', 'Time-tested, traditional effects', '#7D33FF', true),
  ('Modern', 'modern', 'Contemporary approaches and methods', '#33FFB8', true),
  ('Customizable', 'customizable', 'Can be personalized to the performer''s style', '#FF33E0', true);

-- Practical Consideration Tags
INSERT INTO public.tags (name, slug, description, color, is_system)
VALUES 
  ('Resets Quickly', 'resets-quickly', 'Easy to reset between performances', '#56C1FF', true),
  ('Angle-proof', 'angle-proof', 'Can be performed surrounded', '#A1FF56', true),
  ('Low Maintenance', 'low-maintenance', 'Requires minimal upkeep', '#FF56A1', true),
  ('Durable', 'durable', 'Built to last through many performances', '#56FFC1', true),
  ('Packs Small', 'packs-small', 'Minimal storage/transport space needed', '#FFA156', true),
  ('Plays Big', 'plays-big', 'Creates large impact despite small size', '#5661FF', true),
  ('Examinable', 'examinable', 'Props can be examined by audience', '#C156FF', true),
  ('Non-Examinable', 'non-examinable', 'Props cannot be examined', '#FFD656', true),
  ('Indoor', 'indoor', 'Best for indoor venues', '#56FFFF', true),
  ('Outdoor', 'outdoor', 'Suitable for outdoor performances', '#FF5656', true),
  ('Low Light', 'low-light', 'Works well in dim environments', '#56FF6A', true),
  ('Bright Lighting', 'bright-lighting', 'Best with good visibility', '#D1FF56', true);

-- Audience & Venue Tags
INSERT INTO public.tags (name, slug, description, color, is_system)
VALUES 
  ('Family-friendly', 'family-friendly', 'Appropriate for all ages', '#4CAF50', true),
  ('Adult Audiences', 'adult-audiences', 'Contains mature themes', '#F44336', true),
  ('Corporate', 'corporate', 'Suitable for business events', '#2196F3', true),
  ('Trade Show', 'trade-show', 'Designed for exhibition use', '#9C27B0', true),
  ('Restaurant', 'restaurant', 'Works well in dining environments', '#FF9800', true),
  ('Street', 'street', 'Effective for street performances', '#795548', true),
  ('Stage', 'stage', 'Designed for theatrical settings', '#3F51B5', true),
  ('Close-up', 'close-up', 'For intimate performances', '#009688', true),
  ('Virtual', 'virtual', 'Works for online performances', '#00BCD4', true),
  ('Large Group', 'large-group', 'Effective for large audiences', '#E91E63', true),
  ('Small Group', 'small-group', 'Best for intimate gatherings', '#CDDC39', true),
  ('One-on-one', 'one-on-one', 'Designed for single spectator', '#607D8B', true);

-- Additional Specialty Tags
INSERT INTO public.tags (name, slug, description, color, is_system)
VALUES 
  ('No Sleight of Hand', 'no-sleight-of-hand', 'Does not require sleight of hand techniques', '#8BC34A', true),
  ('Easy to Learn', 'easy-to-learn', 'Can be mastered with minimal practice', '#03A9F4', true),
  ('Reputation Maker', 'reputation-maker-2', 'Effects known to establish reputations', '#E040FB', true),
  ('Utility Move', 'utility-move', 'Techniques useful across multiple effects', '#FFC107', true),
  ('Gimmicked', 'gimmicked', 'Requires special props or gimmicks', '#FF5722', true),
  ('Improvisational', 'improvisational', 'Can be adapted on the fly', '#4DB6AC', true),
  ('Fire', 'fire', 'Involves fire elements', '#FF5252', true),
  ('Water', 'water', 'Involves water elements', '#40C4FF', true),
  ('Animals', 'animals', 'Involves animals or animal themes', '#FFAB40', true),
  ('Branded', 'branded', 'Effects using branded/recognizable products', '#EC407A', true),
  ('Limited Edition', 'limited-edition', 'Produced in limited quantities', '#7E57C2', true),
  ('Handmade', 'handmade', 'Crafted by hand rather than mass-produced', '#66BB6A', true);

-- Skill Level Tags
INSERT INTO public.tags (name, slug, description, color, is_system)
VALUES 
  ('Beginner', 'beginner', 'Suitable for beginning magicians', '#4FC3F7', true),
  ('Intermediate', 'intermediate', 'Requires some magical experience', '#FFD54F', true),
  ('Advanced', 'advanced', 'For experienced performers', '#FF8A65', true),
  ('Professional', 'professional', 'Professional-grade materials', '#7986CB', true),
  ('Master', 'master', 'For master magicians', '#E57373', true);

-- Performance Style Tags
INSERT INTO public.tags (name, slug, description, color, is_system)
VALUES 
  ('Comedy', 'comedy', 'Humorous presentation', '#FFEE58', true),
  ('Drama', 'drama', 'Serious or dramatic presentation', '#5C6BC0', true),
  ('Bizarre', 'bizarre', 'Unusual or strange presentation', '#AB47BC', true),
  ('Storytelling', 'storytelling', 'Effect integrated into a narrative', '#26A69A', true),
  ('Shock', 'shock', 'Designed to surprise or shock audiences', '#EF5350', true),
  ('Elegant', 'elegant', 'Refined and sophisticated presentation', '#9FA8DA', true),
  ('Theatrical', 'theatrical', 'Highly staged presentation style', '#FF7043', true),
  ('Minimalist', 'minimalist', 'Simple, stripped-down presentation', '#78909C', true);

-- Material Tags
INSERT INTO public.tags (name, slug, description, color, is_system)
VALUES 
  ('Wooden', 'wooden', 'Made primarily of wood', '#8D6E63', true),
  ('Metal', 'metal', 'Made primarily of metal', '#90A4AE', true),
  ('Plastic', 'plastic', 'Made primarily of plastic', '#4DD0E1', true),
  ('Fabric', 'fabric', 'Made primarily of fabric materials', '#AED581', true),
  ('Paper', 'paper', 'Made primarily of paper', '#FFF176', true),
  ('Electronic', 'electronic', 'Contains electronic components', '#7E57C2', true),
  ('3D Printed', '3d-printed', 'Created using 3D printing technology', '#4FC3F7', true),
  ('Vintage', 'vintage', 'Antique or vintage items', '#A1887F', true);

-- Prop Type Tags (Additional Specific Types)
INSERT INTO public.tags (name, slug, description, color, is_system)
VALUES 
  ('Rope', 'rope', 'Effects using rope', '#FFD54F', true),
  ('Silks', 'silks', 'Effects using silk handkerchiefs', '#81C784', true),
  ('Rings', 'rings', 'Effects using linking rings', '#9575CD', true),
  ('Sponge', 'sponge', 'Effects using sponge balls or animals', '#FFB74D', true),
  ('Cups & Balls', 'cups-balls', 'Variations on the cups and balls effect', '#4DB6AC', true),
  ('Thimbles', 'thimbles', 'Effects using thimbles', '#F06292', true),
  ('Wands', 'wands', 'Magic wands and related props', '#BA68C8', true),
  ('Levitation', 'levitation', 'Effects creating floating or levitation', '#4FC3F7', true),
  ('Prediction', 'prediction', 'Effects involving predictions', '#AED581', true),
  ('Appearance', 'appearance', 'Effects where objects appear', '#FFB74D', true),
  ('Vanish', 'vanish', 'Effects where objects disappear', '#7986CB', true),
  ('Transformation', 'transformation', 'Effects where objects change form', '#F06292', true),
  ('Penetration', 'penetration', 'Effects where objects pass through each other', '#4DD0E1', true),
  ('Restoration', 'restoration', 'Effects where damaged objects are restored', '#FFF176', true);