-- Migration: 20260531223240_add_yield_percent_to_recipes
-- Phase 6A-2: Add yield_percent to recipes table for cooking loss tracking.

ALTER TABLE recipes
  ADD COLUMN yield_percent NUMERIC(5, 4) NOT NULL DEFAULT 1.0
  CONSTRAINT chk_yield_percent_range CHECK (yield_percent > 0 AND yield_percent <= 1);

COMMENT ON COLUMN recipes.yield_percent IS
  'Cooking yield as a decimal fraction (0 < yield_percent <= 1). '
  'E.g. 0.80 means 80% of input weight survives cooking (simmering, baking, reduction). '
  'Default 1.0 = no loss. Used for COGS variance reporting and production planning.';
