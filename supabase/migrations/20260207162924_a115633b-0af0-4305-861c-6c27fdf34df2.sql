-- Create a secure function to count giveaway entries (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_giveaway_entry_count(giveaway_uuid uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.giveaway_entries
  WHERE giveaway_id = giveaway_uuid
$$;