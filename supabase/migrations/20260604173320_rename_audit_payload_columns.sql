ALTER TABLE audit_log RENAME COLUMN old_value TO request_payload;
ALTER TABLE audit_log RENAME COLUMN new_value TO response_payload;
