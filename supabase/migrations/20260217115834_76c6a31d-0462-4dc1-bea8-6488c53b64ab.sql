
-- Add display_name column to winners table to store masked winner name at selection time
ALTER TABLE public.winners ADD COLUMN IF NOT EXISTS display_name text;

-- Ensure unique constraint on giveaway_entries to prevent duplicate entries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_giveaway_entry'
  ) THEN
    ALTER TABLE public.giveaway_entries ADD CONSTRAINT unique_user_giveaway_entry UNIQUE (user_id, giveaway_id);
  END IF;
END $$;
