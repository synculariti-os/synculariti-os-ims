-- Migration to add indexes for audit_log query performance

-- 1. Index for filtering by restaurant_id (ordered by created_at DESC for pagination)
CREATE INDEX IF NOT EXISTS idx_audit_log_restaurant_created
ON public.audit_log (restaurant_id, created_at DESC);

-- 2. Index for filtering by entity_type and entity_id (often queried together to see history of an item)
CREATE INDEX IF NOT EXISTS idx_audit_log_entity
ON public.audit_log (entity_type, entity_id);

-- 3. Index for filtering by user_id to see what a user did
CREATE INDEX IF NOT EXISTS idx_audit_log_user
ON public.audit_log (user_id);
