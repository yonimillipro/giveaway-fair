-- 1. Add social media links to profiles table for companies
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS youtube_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

-- 2. Create company_follows table for internal follow system
CREATE TABLE public.company_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

-- Enable RLS
ALTER TABLE public.company_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_follows
CREATE POLICY "Users can view their own follows"
ON public.company_follows FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can follow companies"
ON public.company_follows FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow companies"
ON public.company_follows FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Companies can view their followers"
ON public.company_follows FOR SELECT
USING (company_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Function to get follower count securely
CREATE OR REPLACE FUNCTION public.get_company_follower_count(company_uuid uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.company_follows
  WHERE company_id = company_uuid
$$;

-- Function to check if user follows a company
CREATE OR REPLACE FUNCTION public.user_follows_company(company_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.company_follows
    WHERE company_id = company_uuid
      AND user_id = auth.uid()
  )
$$;

-- 3. Create giveaway_requirements table to configure requirements per giveaway
CREATE TABLE public.giveaway_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  require_email_verified BOOLEAN NOT NULL DEFAULT true,
  require_company_follow BOOLEAN NOT NULL DEFAULT true,
  require_youtube BOOLEAN NOT NULL DEFAULT false,
  require_instagram BOOLEAN NOT NULL DEFAULT false,
  require_twitter BOOLEAN NOT NULL DEFAULT false,
  require_tiktok BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id)
);

ALTER TABLE public.giveaway_requirements ENABLE ROW LEVEL SECURITY;

-- Anyone can view giveaway requirements
CREATE POLICY "Anyone can view giveaway requirements"
ON public.giveaway_requirements FOR SELECT
USING (true);

-- Companies can create requirements for their giveaways
CREATE POLICY "Companies can create giveaway requirements"
ON public.giveaway_requirements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.giveaways
    WHERE id = giveaway_id AND company_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Companies can update requirements for their giveaways
CREATE POLICY "Companies can update giveaway requirements"
ON public.giveaway_requirements FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways
    WHERE id = giveaway_id AND company_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- Companies can delete requirements for their giveaways
CREATE POLICY "Companies can delete giveaway requirements"
ON public.giveaway_requirements FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways
    WHERE id = giveaway_id AND company_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- 4. Create user_task_completions table to track task completion
CREATE TABLE public.user_task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('youtube', 'instagram', 'twitter', 'tiktok')),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, giveaway_id, task_type)
);

ALTER TABLE public.user_task_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own task completions
CREATE POLICY "Users can view own task completions"
ON public.user_task_completions FOR SELECT
USING (auth.uid() = user_id);

-- Users can mark tasks complete
CREATE POLICY "Users can mark tasks complete"
ON public.user_task_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins and companies can view task completions for their giveaways
CREATE POLICY "Companies can view task completions for their giveaways"
ON public.user_task_completions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.giveaways
    WHERE id = giveaway_id AND company_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
);

-- 5. Create a validation function for giveaway entry
CREATE OR REPLACE FUNCTION public.validate_giveaway_entry(
  p_user_id uuid,
  p_giveaway_id uuid,
  p_user_email_verified boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requirements giveaway_requirements%ROWTYPE;
  v_company_id uuid;
  v_errors text[] := '{}';
  v_is_following boolean;
  v_youtube_done boolean;
  v_instagram_done boolean;
  v_twitter_done boolean;
  v_tiktok_done boolean;
BEGIN
  -- Get giveaway company_id
  SELECT company_id INTO v_company_id
  FROM giveaways WHERE id = p_giveaway_id;
  
  IF v_company_id IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'errors', ARRAY['Giveaway not found']);
  END IF;

  -- Get requirements (if none exist, use defaults)
  SELECT * INTO v_requirements
  FROM giveaway_requirements WHERE giveaway_id = p_giveaway_id;
  
  -- If no requirements exist, create default ones
  IF v_requirements IS NULL THEN
    v_requirements.require_email_verified := true;
    v_requirements.require_company_follow := true;
    v_requirements.require_youtube := false;
    v_requirements.require_instagram := false;
    v_requirements.require_twitter := false;
    v_requirements.require_tiktok := false;
  END IF;

  -- Check email verification
  IF v_requirements.require_email_verified AND NOT p_user_email_verified THEN
    v_errors := array_append(v_errors, 'Email verification required');
  END IF;

  -- Check company follow
  IF v_requirements.require_company_follow THEN
    SELECT EXISTS (
      SELECT 1 FROM company_follows
      WHERE user_id = p_user_id AND company_id = v_company_id
    ) INTO v_is_following;
    
    IF NOT v_is_following THEN
      v_errors := array_append(v_errors, 'Must follow company');
    END IF;
  END IF;

  -- Check social task completions
  IF v_requirements.require_youtube THEN
    SELECT EXISTS (
      SELECT 1 FROM user_task_completions
      WHERE user_id = p_user_id AND giveaway_id = p_giveaway_id AND task_type = 'youtube'
    ) INTO v_youtube_done;
    
    IF NOT v_youtube_done THEN
      v_errors := array_append(v_errors, 'YouTube task required');
    END IF;
  END IF;

  IF v_requirements.require_instagram THEN
    SELECT EXISTS (
      SELECT 1 FROM user_task_completions
      WHERE user_id = p_user_id AND giveaway_id = p_giveaway_id AND task_type = 'instagram'
    ) INTO v_instagram_done;
    
    IF NOT v_instagram_done THEN
      v_errors := array_append(v_errors, 'Instagram task required');
    END IF;
  END IF;

  IF v_requirements.require_twitter THEN
    SELECT EXISTS (
      SELECT 1 FROM user_task_completions
      WHERE user_id = p_user_id AND giveaway_id = p_giveaway_id AND task_type = 'twitter'
    ) INTO v_twitter_done;
    
    IF NOT v_twitter_done THEN
      v_errors := array_append(v_errors, 'Twitter task required');
    END IF;
  END IF;

  IF v_requirements.require_tiktok THEN
    SELECT EXISTS (
      SELECT 1 FROM user_task_completions
      WHERE user_id = p_user_id AND giveaway_id = p_giveaway_id AND task_type = 'tiktok'
    ) INTO v_tiktok_done;
    
    IF NOT v_tiktok_done THEN
      v_errors := array_append(v_errors, 'TikTok task required');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'valid', array_length(v_errors, 1) IS NULL,
    'errors', v_errors
  );
END;
$$;