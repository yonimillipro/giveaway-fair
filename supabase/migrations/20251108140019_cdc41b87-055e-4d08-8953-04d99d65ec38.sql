-- Update the giveaway creation policy to allow admins
DROP POLICY IF EXISTS "Companies can create giveaways" ON public.giveaways;

CREATE POLICY "Companies and admins can create giveaways"
ON public.giveaways
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'company'::app_role) AND auth.uid() = company_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
);