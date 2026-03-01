
-- Create influencers table
CREATE TABLE public.influencers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  profile_image_url text,
  amount_of_followers integer NOT NULL DEFAULT 0,
  primary_platform text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT influencers_followers_check CHECK (amount_of_followers >= 0)
);

-- Enable RLS
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;

-- RLS: Public read
CREATE POLICY "Anyone can view influencers"
  ON public.influencers FOR SELECT
  USING (true);

-- RLS: Admin create
CREATE POLICY "Admins can create influencers"
  ON public.influencers FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: Admin update
CREATE POLICY "Admins can update influencers"
  ON public.influencers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: Admin delete
CREATE POLICY "Admins can delete influencers"
  ON public.influencers FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON public.influencers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Performance indexes
CREATE INDEX idx_influencers_followers_desc ON public.influencers (amount_of_followers DESC);
CREATE INDEX idx_company_follows_company_id ON public.company_follows (company_id);
CREATE INDEX idx_promotions_company_id ON public.promotions (company_id);
CREATE INDEX idx_giveaways_company_id ON public.giveaways (company_id);

-- Storage bucket for influencer images
INSERT INTO storage.buckets (id, name, public) VALUES ('influencer-images', 'influencer-images', true);

-- Storage RLS: anyone can view
CREATE POLICY "Anyone can view influencer images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'influencer-images');

-- Storage RLS: admin only upload
CREATE POLICY "Admins can upload influencer images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'influencer-images' AND public.has_role(auth.uid(), 'admin'));

-- Storage RLS: admin only update
CREATE POLICY "Admins can update influencer images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'influencer-images' AND public.has_role(auth.uid(), 'admin'));

-- Storage RLS: admin only delete
CREATE POLICY "Admins can delete influencer images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'influencer-images' AND public.has_role(auth.uid(), 'admin'));

-- Company analytics functions (DISTINCT user counts)
CREATE OR REPLACE FUNCTION public.get_company_likes_count(company_uuid uuid)
  RETURNS bigint
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT COUNT(DISTINCT gl.user_id)::bigint
  FROM giveaway_likes gl
  INNER JOIN giveaways g ON g.id = gl.giveaway_id
  WHERE g.company_id = company_uuid
$$;

CREATE OR REPLACE FUNCTION public.get_company_followers_count(company_uuid uuid)
  RETURNS bigint
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $$
  SELECT COUNT(DISTINCT user_id)::bigint
  FROM company_follows
  WHERE company_id = company_uuid
$$;
