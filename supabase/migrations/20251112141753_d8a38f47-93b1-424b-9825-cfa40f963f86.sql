-- Increase column sizes to support SHA-256 hashes (64 characters)
ALTER TABLE employees ALTER COLUMN pin TYPE VARCHAR(64);
ALTER TABLE organizations ALTER COLUMN login_password_hash TYPE VARCHAR(64);