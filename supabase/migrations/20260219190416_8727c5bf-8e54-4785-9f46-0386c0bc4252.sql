-- Make email nullable in builder_followers to support anonymous follows
ALTER TABLE public.builder_followers ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.builder_followers ADD COLUMN IF NOT EXISTS visitor_key text;

-- Add unique constraint to prevent duplicate follows per visitor+builder
ALTER TABLE public.builder_followers DROP CONSTRAINT IF EXISTS builder_followers_visitor_key_discord_handle_key;
ALTER TABLE public.builder_followers ADD CONSTRAINT builder_followers_visitor_key_discord_handle_key UNIQUE (visitor_key, discord_handle);
