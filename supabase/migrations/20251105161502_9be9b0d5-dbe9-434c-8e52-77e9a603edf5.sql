-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'company', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create giveaways table
CREATE TABLE public.giveaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  prize_value DECIMAL(10,2),
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ NOT NULL,
  max_entries INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create giveaway_entries table
CREATE TABLE public.giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id, user_id)
);

-- Create winners table
CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(giveaway_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giveaway_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for giveaways
CREATE POLICY "Anyone can view active giveaways"
  ON public.giveaways FOR SELECT
  USING (status = 'active' OR auth.uid() = company_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can create giveaways"
  ON public.giveaways FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'company') AND auth.uid() = company_id);

CREATE POLICY "Companies can update own giveaways"
  ON public.giveaways FOR UPDATE
  USING (auth.uid() = company_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can delete own giveaways"
  ON public.giveaways FOR DELETE
  USING (auth.uid() = company_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for giveaway_entries
CREATE POLICY "Users can view own entries"
  ON public.giveaway_entries FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Companies can view entries for their giveaways"
  ON public.giveaway_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.giveaways
      WHERE giveaways.id = giveaway_entries.giveaway_id
      AND giveaways.company_id = auth.uid()
    )
  );

CREATE POLICY "Users can create entries"
  ON public.giveaway_entries FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'user') AND auth.uid() = user_id);

CREATE POLICY "Users can delete own entries"
  ON public.giveaway_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for winners
CREATE POLICY "Anyone can view winners"
  ON public.winners FOR SELECT
  USING (true);

CREATE POLICY "Companies can create winners for their giveaways"
  ON public.winners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.giveaways
      WHERE giveaways.id = winners.giveaway_id
      AND giveaways.company_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_giveaways_updated_at
  BEFORE UPDATE ON public.giveaways
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();