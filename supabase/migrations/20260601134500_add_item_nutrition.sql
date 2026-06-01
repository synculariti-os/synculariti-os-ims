ALTER TABLE items
ADD COLUMN allergens text[] DEFAULT '{}',
ADD COLUMN calories_per_uom numeric(10, 2) DEFAULT 0,
ADD COLUMN protein_grams numeric(10, 2) DEFAULT 0,
ADD COLUMN fat_grams numeric(10, 2) DEFAULT 0,
ADD COLUMN carbs_grams numeric(10, 2) DEFAULT 0;
