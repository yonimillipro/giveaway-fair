CREATE POLICY "Public profiles are viewable by all users" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);