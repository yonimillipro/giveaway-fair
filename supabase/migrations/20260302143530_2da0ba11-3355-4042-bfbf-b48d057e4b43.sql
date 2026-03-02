
-- Add email and social_handle columns to influencers
ALTER TABLE public.influencers
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS social_handle text;

-- Add unique constraint on email (partial - only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_influencers_email_unique
  ON public.influencers (email)
  WHERE email IS NOT NULL;
