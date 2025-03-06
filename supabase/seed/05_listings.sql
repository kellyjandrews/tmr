-- Seed Listings using simple SQL generation
WITH store_categories AS (
    SELECT 
        public.stores.id AS store_id, 
        public.categories.id AS category_id, 
        public.categories.name AS category_name,
        ROW_NUMBER() OVER (PARTITION BY public.stores.id ORDER BY random()) AS rn
    FROM public.stores, public.categories
    WHERE public.categories.parent_id IS NOT NULL
),
magical_adjectives(adj) AS (
    VALUES 
    ('Mystical'), ('Enchanted'), ('Arcane'), ('Ethereal'), 
    ('Celestial'), ('Luminous'), ('Radiant'), ('Ancient'), 
    ('Legendary'), ('Powerful')
),
magical_materials(material) AS (
    VALUES 
    ('Silver'), ('Oak'), ('Crystal'), ('Dragon Scale'), 
    ('Phoenix Feather'), ('Moonstone'), ('Starlight'), 
    ('Elder Wood'), ('Unicorn Hair'), ('Celestial Bronze')
),
generated_listings AS (
    SELECT 
        uuid_generate_v4() AS id,
        store_id,
        category_id,
        -- Generate item name based on category
        CONCAT(
            (SELECT adj FROM magical_adjectives ORDER BY random() LIMIT 1), 
            ' ', 
            CASE 
                WHEN category_name = 'Wands' THEN 
                    (SELECT material FROM magical_materials ORDER BY random() LIMIT 1) || ' Wand'
                WHEN category_name = 'Potions' THEN 
                    (SELECT material FROM magical_materials ORDER BY random() LIMIT 1) || ' Potion'
                WHEN category_name = 'Grimoires' THEN 
                    (SELECT material FROM magical_materials ORDER BY random() LIMIT 1) || ' Tome'
                WHEN category_name = 'Crystals' THEN 
                    (SELECT material FROM magical_materials ORDER BY random() LIMIT 1) || ' Crystal'
                WHEN category_name = 'Artifacts' THEN 
                    (SELECT material FROM magical_materials ORDER BY random() LIMIT 1) || ' Artifact'
                ELSE 'Magical Item'
            END
        ) AS name,
        -- Generate description
        CONCAT(
            'A rare and powerful ', 
            lower(category_name), 
            ' crafted with exceptional magical properties. ', 
            CASE 
                WHEN random() < 0.5 THEN 'Radiates an intense mystical energy.'
                ELSE 'Whispers ancient secrets to those who know how to listen.'
            END
        ) AS description,
        ROUND((random() * 900 + 100)::numeric, 2) AS price,
        FLOOR(random() * 50 + 1)::integer AS quantity,
        NOW() AS created_at,
        NOW() AS updated_at,
        ROW_NUMBER() OVER (PARTITION BY store_id) AS listing_num
    FROM store_categories
    WHERE rn <= 5  -- This ensures we use 5 different categories per store
)

-- Insert 50 listings for each store
INSERT INTO public.listings (
    id, 
    store_id, 
    category_id, 
    name, 
    description, 
    price, 
    quantity, 
    created_at, 
    updated_at
)
SELECT 
    id, 
    store_id, 
    category_id, 
    name, 
    description, 
    price, 
    quantity, 
    created_at, 
    updated_at
FROM generated_listings
WHERE listing_num <= 500
ORDER BY store_id, listing_num;