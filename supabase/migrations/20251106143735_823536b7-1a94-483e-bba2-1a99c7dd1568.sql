-- Fix search_path for handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Fix search_path for create_first_admin function
CREATE OR REPLACE FUNCTION public.create_first_admin()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    -- Make them an admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;