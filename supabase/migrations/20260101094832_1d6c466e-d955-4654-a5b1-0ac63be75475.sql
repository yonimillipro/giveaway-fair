-- Fix giveaway_likes: Remove public SELECT, replace with policy that hides user_id from non-owners
DROP POLICY IF EXISTS "Anyone can view likes" ON public.giveaway_likes;

-- Users can only see their own likes
CREATE POLICY "Users can view own likes"
ON public.giveaway_likes
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all likes
CREATE POLICY "Admins can view all likes"
ON public.giveaway_likes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create a security definer function to get like counts without exposing user_ids
CREATE OR REPLACE FUNCTION public.get_giveaway_like_count(giveaway_uuid uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.giveaway_likes
  WHERE giveaway_id = giveaway_uuid
$$;

-- Create a function to check if current user has liked a giveaway
CREATE OR REPLACE FUNCTION public.user_has_liked_giveaway(giveaway_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.giveaway_likes
    WHERE giveaway_id = giveaway_uuid
      AND user_id = auth.uid()
  )
$$;

-- Fix promotions: Remove public access to created_by
DROP POLICY IF EXISTS "Everyone can view active promotions" ON public.promotions;

-- Create a view for public promotion data without created_by
CREATE OR REPLACE VIEW public.public_promotions AS
SELECT 
  id,
  name,
  description,
  discount_percentage,
  start_date,
  end_date,
  status
FROM public.promotions
WHERE status = 'active';

-- Grant access to the view
GRANT SELECT ON public.public_promotions TO anon, authenticated;

-- Admins can still see full promotions table
CREATE POLICY "Admins can view all promotions"
ON public.promotions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));