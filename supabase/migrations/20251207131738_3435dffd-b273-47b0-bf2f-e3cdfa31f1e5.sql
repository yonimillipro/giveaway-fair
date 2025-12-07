-- Add company logo_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create giveaway_images table for multiple images per giveaway
CREATE TABLE IF NOT EXISTS public.giveaway_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on giveaway_images
ALTER TABLE public.giveaway_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view giveaway images
CREATE POLICY "Anyone can view giveaway images" 
ON public.giveaway_images FOR SELECT 
USING (true);

-- Companies can manage images for their giveaways
CREATE POLICY "Companies can manage their giveaway images" 
ON public.giveaway_images FOR ALL 
USING (
  EXISTS (SELECT 1 FROM giveaways WHERE giveaways.id = giveaway_images.giveaway_id AND giveaways.company_id = auth.uid())
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create giveaway_likes table for like/love functionality
CREATE TABLE IF NOT EXISTS public.giveaway_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  giveaway_id UUID NOT NULL REFERENCES public.giveaways(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(giveaway_id, user_id)
);

-- Enable RLS on giveaway_likes
ALTER TABLE public.giveaway_likes ENABLE ROW LEVEL SECURITY;

-- Anyone can view likes (for count)
CREATE POLICY "Anyone can view likes" 
ON public.giveaway_likes FOR SELECT 
USING (true);

-- Authenticated users can like/unlike giveaways
CREATE POLICY "Users can manage their own likes" 
ON public.giveaway_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.giveaway_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster likes count queries
CREATE INDEX IF NOT EXISTS idx_giveaway_likes_giveaway_id ON public.giveaway_likes(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_images_giveaway_id ON public.giveaway_images(giveaway_id);