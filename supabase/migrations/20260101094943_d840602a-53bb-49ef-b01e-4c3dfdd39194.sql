-- Drop the security definer view and replace with proper RLS
DROP VIEW IF EXISTS public.public_promotions;

-- Create a policy that allows viewing active promotions but only specific columns
-- We'll handle column restriction in the application layer instead
CREATE POLICY "Anyone can view active promotions"
ON public.promotions
FOR SELECT
USING (status = 'active');