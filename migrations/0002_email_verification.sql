-- Existing customers are treated as verified; new registrations explicitly insert 0.
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN verification_token_hash TEXT;
ALTER TABLE users ADD COLUMN verification_expires_at TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_verification_token_hash_idx
ON users(verification_token_hash)
WHERE verification_token_hash IS NOT NULL;
