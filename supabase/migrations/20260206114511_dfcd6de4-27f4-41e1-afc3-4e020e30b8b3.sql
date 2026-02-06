-- Drop the overly permissive public profiles policy
DROP POLICY IF EXISTS "Public profiles are viewable by all users" ON public.profiles;

-- Create a more restrictive policy that only allows viewing specific fields for non-authenticated users
-- Profiles should only be fully visible to:
-- 1. The profile owner
-- 2. Admins
-- 3. Company profiles (for giveaway cards display)
-- Non-authenticated users can only see company profiles (via the "Anyone can view company profiles" policy)

-- The existing policies cover the necessary cases:
-- "Users can view own profile" - for profile owners
-- "Admins can view all profiles" - for admins
-- "Anyone can view company profiles" - for public company info display

-- Note: The get-company-info edge function already uses service role to fetch public company info
-- which bypasses RLS, so company info display will continue working