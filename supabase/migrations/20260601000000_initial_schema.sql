-- Initial Schema Migration
-- Defines the full 26-table DDL, set_tenant_context function, and ledger append-only triggers.

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenancy Context Function
CREATE OR REPLACE FUNCTION set_tenant_context(p_franchise_id UUID, p_restaurant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_franchise_id', p_franchise_id::text, true);
  PERFORM set_config('app.current_restaurant_id', p_restaurant_id::text, true);
END;
$$ LANGUAGE plpgsql;

-- 1. roles
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. permissions
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 3. role_permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. franchise_groups
CREATE TABLE IF NOT EXISTS franchise_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. restaurants
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_group_id UUID NOT NULL REFERENCES franchise_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone_number TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. user_restaurant_roles
CREATE TABLE IF NOT EXISTS user_restaurant_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, restaurant_id)
);

-- 8. categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_group_id UUID REFERENCES franchise_groups(id),
  restaurant_id UUID REFERENCES restaurants(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. items
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_group_id UUID REFERENCES franchise_groups(id),
  restaurant_id UUID REFERENCES restaurants(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  purchasing_uom TEXT NOT NULL,
  inventory_uom TEXT NOT NULL,
  recipe_uom TEXT,
  inv_to_recipe_ratio NUMERIC NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. item_restaurant_overrides
CREATE TABLE IF NOT EXISTS item_restaurant_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  par_level NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, restaurant_id)
);

-- 11. uom_conversions
CREATE TABLE IF NOT EXISTS uom_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  from_uom TEXT NOT NULL,
  to_uom TEXT NOT NULL,
  multiplier_factor NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, from_uom, to_uom)
);

-- 12. vendors
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_group_id UUID REFERENCES franchise_groups(id),
  restaurant_id UUID REFERENCES restaurants(id),
  name TEXT NOT NULL,
  contact_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  status TEXT NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  freight_charge NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. po_line_items
CREATE TABLE IF NOT EXISTS po_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  quantity_ordered NUMERIC NOT NULL,
  quantity_received NUMERIC NOT NULL DEFAULT 0,
  raw_unit_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. inventory_batches
CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  item_id UUID NOT NULL REFERENCES items(id),
  po_id UUID REFERENCES purchase_orders(id),
  received_date TIMESTAMPTZ NOT NULL,
  initial_qty NUMERIC NOT NULL,
  remaining_qty NUMERIC NOT NULL,
  landed_unit_cost NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. recipes
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_group_id UUID REFERENCES franchise_groups(id),
  restaurant_id UUID REFERENCES restaurants(id),
  produces_item_id UUID REFERENCES items(id),
  recipe_name TEXT,
  yield_quantity NUMERIC NOT NULL,
  yield_percent NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. recipe_ingredients
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_item_id UUID REFERENCES items(id),
  sub_recipe_id UUID REFERENCES recipes(id),
  quantity_required NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. menu_item_mappings
CREATE TABLE IF NOT EXISTS menu_item_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  raw_excel_string TEXT NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(restaurant_id, raw_excel_string)
);

-- 19. inventory_ledger
CREATE TABLE IF NOT EXISTS inventory_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  item_id UUID NOT NULL REFERENCES items(id),
  change_amount NUMERIC NOT NULL,
  reason_code TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to make inventory_ledger append-only
CREATE OR REPLACE FUNCTION prevent_ledger_modifications()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'inventory_ledger is append-only. UPDATE and DELETE are not allowed.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_ledger_modifications
BEFORE UPDATE OR DELETE ON inventory_ledger
FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modifications();

-- 20. inventory_transfers
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_group_id UUID NOT NULL REFERENCES franchise_groups(id),
  origin_restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  destination_restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  item_id UUID NOT NULL REFERENCES items(id),
  qty NUMERIC NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. inventory_count_batches
CREATE TABLE IF NOT EXISTS inventory_count_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  status TEXT NOT NULL,
  snapshot_timestamp TIMESTAMPTZ NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. inventory_count_rows
CREATE TABLE IF NOT EXISTS inventory_count_rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES inventory_count_batches(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id),
  expected_qty NUMERIC NOT NULL,
  actual_qty NUMERIC,
  variance_qty NUMERIC,
  UNIQUE(batch_id, item_id)
);

-- 23. waste_logs
CREATE TABLE IF NOT EXISTS waste_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  item_id UUID NOT NULL REFERENCES items(id),
  quantity NUMERIC NOT NULL,
  reason TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. prep_production_logs
CREATE TABLE IF NOT EXISTS prep_production_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  prep_item_id UUID NOT NULL REFERENCES items(id),
  yield_qty_produced NUMERIC NOT NULL,
  produced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. sales_import_batches
CREATE TABLE IF NOT EXISTS sales_import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  business_date DATE NOT NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. sales_import_rows
CREATE TABLE IF NOT EXISTS sales_import_rows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL REFERENCES sales_import_batches(id) ON DELETE CASCADE,
  raw_item_name TEXT NOT NULL,
  quantity_sold NUMERIC NOT NULL,
  is_mapped BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. daily_inventory_snapshots
CREATE TABLE IF NOT EXISTS daily_inventory_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id),
  item_id UUID NOT NULL REFERENCES items(id),
  business_date DATE NOT NULL,
  eod_qty NUMERIC NOT NULL,
  fifo_total_value NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 28. audit_log
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  source_ip TEXT,
  user_agent TEXT,
  restaurant_id UUID,
  franchise_group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Materialized View for Variance Analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS mat_view_variance_analytics AS
SELECT 
  restaurant_id,
  item_id,
  TO_CHAR(created_at, 'YYYY-MM') AS reporting_month,
  SUM(CASE WHEN reason_code = 'COUNT_ADJUSTMENT' THEN change_amount ELSE 0 END) AS unexplained_variance_qty
FROM inventory_ledger
GROUP BY restaurant_id, item_id, TO_CHAR(created_at, 'YYYY-MM');

CREATE UNIQUE INDEX idx_mat_view_variance_analytics_uniq ON mat_view_variance_analytics(restaurant_id, item_id, reporting_month);
