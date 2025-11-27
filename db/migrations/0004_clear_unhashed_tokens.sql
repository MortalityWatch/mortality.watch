-- Clear existing unhashed tokens after switching to hashed token storage
-- Users with pending password resets or email verifications will need to re-request
UPDATE users SET
  verification_token = NULL,
  verification_token_expires = NULL,
  password_reset_token = NULL,
  password_reset_token_expires = NULL
WHERE verification_token IS NOT NULL
   OR password_reset_token IS NOT NULL;
