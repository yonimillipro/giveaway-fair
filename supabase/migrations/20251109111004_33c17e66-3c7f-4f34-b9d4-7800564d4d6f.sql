-- Drop the old trigger and function in correct order
DROP TRIGGER IF EXISTS on_first_user_make_admin ON auth.users;
DROP FUNCTION IF EXISTS public.create_first_admin();

-- Create new function that assigns appropriate role to new users
CREATE OR REPLACE FUNCTION public.assign_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if this is the first user
  IF (SELECT COUNT(*) FROM auth.users) = 1 THEN
    -- Make them an admin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    -- Make them a regular user (only if they don't have a role yet)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new user signups
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_user_role();

-- Fix existing users who don't have a role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'user'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT (user_id, role) DO NOTHING;