-- Create giveaway_views table for tracking unique views
CREATE TABLE public.giveaway_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_view UNIQUE (giveaway_id, user_id),
  CONSTRAINT unique_session_view UNIQUE (giveaway_id, session_id)
);

-- Enable RLS
ALTER TABLE public.giveaway_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views (for tracking)
CREATE POLICY "Anyone can insert views"
ON public.giveaway_views
FOR INSERT
WITH CHECK (true);

-- Allow anyone to read view counts
CREATE POLICY "Anyone can read views"
ON public.giveaway_views
FOR SELECT
USING (true);

-- Create index for faster count queries
CREATE INDEX idx_giveaway_views_giveaway_id ON public.giveaway_views(giveaway_id);

-- Create function to get view count for a giveaway
CREATE OR REPLACE FUNCTION public.get_giveaway_view_count(giveaway_uuid UUID)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::bigint
  FROM public.giveaway_views
  WHERE giveaway_id = giveaway_uuid
$$;

-- Create function to check if user has viewed a giveaway
CREATE OR REPLACE FUNCTION public.user_has_viewed_giveaway(giveaway_uuid UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.giveaway_views
    WHERE giveaway_id = giveaway_uuid
      AND user_id = auth.uid()
  )
$$;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;