-- Categories Seed Data

-- Insert Main Categories with ON CONFLICT DO NOTHING
INSERT INTO public.categories (id, name, description, parent_id) VALUES
('11111111-1111-1111-1111-111111111111', 'Wands', 'Magical implements for focusing and directing magical energy', null),
('22222222-2222-2222-2222-222222222222', 'Potions', 'Brewed magical substances with various effects', null),
('33333333-3333-3333-3333-333333333333', 'Grimoires', 'Magical books and texts', null),
('44444444-4444-4444-4444-444444444444', 'Crystals', 'Powerful magical stones and gems', null),
('55555555-5555-5555-5555-555555555555', 'Artifacts', 'Rare and powerful magical objects', null)
ON CONFLICT (id) DO NOTHING;

-- Insert Subcategories with ON CONFLICT DO NOTHING
-- Subcategories for Wands
INSERT INTO public.categories (id, name, description, parent_id) VALUES
('11111111-1111-1111-1111-111111111112', 'Wooden Wands', 'Traditional wands crafted from various woods', '11111111-1111-1111-1111-111111111111'),
('11111111-1111-1111-1111-111111111113', 'Crystal Wands', 'Wands incorporating crystals and gems', '11111111-1111-1111-1111-111111111111'),
('11111111-1111-1111-1111-111111111114', 'Artifact Wands', 'Ancient or historically significant wands', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Subcategories for Potions
INSERT INTO public.categories (id, name, description, parent_id) VALUES
('22222222-2222-2222-2222-222222222223', 'Healing Potions', 'Restorative and curative brews', '22222222-2222-2222-2222-222222222222'),
('22222222-2222-2222-2222-222222222224', 'Transformation Potions', 'Potions that alter appearance or form', '22222222-2222-2222-2222-222222222222'),
('22222222-2222-2222-2222-222222222225', 'Utility Potions', 'Practical magical solutions', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Subcategories for Grimoires
INSERT INTO public.categories (id, name, description, parent_id) VALUES
('33333333-3333-3333-3333-333333333334', 'Spellbooks', 'Collections of spells and incantations', '33333333-3333-3333-3333-333333333333'),
('33333333-3333-3333-3333-333333333335', 'Ritual Texts', 'Guides for magical ceremonies', '33333333-3333-3333-3333-333333333333'),
('33333333-3333-3333-3333-333333333336', 'Historical Texts', 'Ancient magical knowledge and history', '33333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Subcategories for Crystals
INSERT INTO public.categories (id, name, description, parent_id) VALUES
('44444444-4444-4444-4444-444444444442', 'Quartz Crystals', 'Clear and versatile magical crystals', '44444444-4444-4444-4444-444444444444'),
('44444444-4444-4444-4444-444444444443', 'Magical Geodes', 'Crystals with powerful energy concentrations', '44444444-4444-4444-4444-444444444444'),
('44444444-4444-4444-4444-444444444444', 'Raw Crystals', 'Uncut and unprocessed magical crystals', '44444444-4444-4444-4444-444444444444')
ON CONFLICT (id) DO NOTHING;

-- Subcategories for Artifacts
INSERT INTO public.categories (id, name, description, parent_id) VALUES
('55555555-5555-5555-5555-555555555552', 'Enchanted Objects', 'Everyday items imbued with magical properties', '55555555-5555-5555-5555-555555555555'),
('55555555-5555-5555-5555-555555555553', 'Magical Instruments', 'Tools and devices with arcane capabilities', '55555555-5555-5555-5555-555555555555'),
('55555555-5555-5555-5555-555555555554', 'Historical Relics', 'Ancient artifacts with powerful magical histories', '55555555-5555-5555-5555-555555555555')
ON CONFLICT (id) DO NOTHING;