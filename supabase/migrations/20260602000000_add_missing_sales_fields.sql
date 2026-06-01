-- 20260602000000_add_missing_sales_fields.sql
ALTER TABLE sales_import_batches ADD COLUMN file_url TEXT;
ALTER TABLE sales_import_batches ADD COLUMN uploaded_by UUID REFERENCES users(id);

ALTER TABLE sales_import_rows ADD COLUMN recipe_id UUID REFERENCES recipes(id);
