-- Migration to expand token storage columns
-- Ensuring VARCHAR(520) to accommodate GitHub stateless JWT tokens
ALTER TABLE IF EXISTS auth.identities ALTER COLUMN credentials TYPE VARCHAR(520);
ALTER TABLE IF EXISTS public.github_tokens ALTER COLUMN token_value TYPE VARCHAR(520);
