-- Create storage bucket for giveaway images
INSERT INTO storage.buckets (id, name, public)
VALUES ('giveaway-images', 'giveaway-images', true);

-- Create storage policies for giveaway images
CREATE POLICY "Anyone can view giveaway images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'giveaway-images');

CREATE POLICY "Companies and admins can upload giveaway images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'giveaway-images' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('company', 'admin')
    )
  )
);

CREATE POLICY "Companies and admins can update their giveaway images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'giveaway-images' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('company', 'admin')
    )
  )
);

CREATE POLICY "Companies and admins can delete giveaway images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'giveaway-images' AND
  (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('company', 'admin')
    )
  )
);

-- Function to automatically make the first user an admin
CREATE OR REPLACE FUNCTION public.create_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    -- Make them an admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function after user creation
CREATE TRIGGER on_first_user_make_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_first_admin();