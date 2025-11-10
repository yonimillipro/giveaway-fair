-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promotions table
CREATE TABLE public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_percentage NUMERIC(5, 2) NOT NULL CHECK (discount_percentage > 0 AND discount_percentage <= 100),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create promotion_products junction table
CREATE TABLE public.promotion_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(promotion_id, product_id)
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Companies can create own products"
  ON public.products FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'company'::app_role) AND auth.uid() = company_id);

CREATE POLICY "Companies can view own products"
  ON public.products FOR SELECT
  USING (auth.uid() = company_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active products"
  ON public.products FOR SELECT
  USING (status = 'active');

CREATE POLICY "Companies can update own products"
  ON public.products FOR UPDATE
  USING (auth.uid() = company_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Companies can delete own products"
  ON public.products FOR DELETE
  USING (auth.uid() = company_id OR has_role(auth.uid(), 'admin'::app_role));

-- Promotions policies
CREATE POLICY "Admins can create promotions"
  ON public.promotions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view active promotions"
  ON public.promotions FOR SELECT
  USING (status = 'active' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update promotions"
  ON public.promotions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete promotions"
  ON public.promotions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Promotion products policies
CREATE POLICY "Admins can manage promotion products"
  ON public.promotion_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view promotion products"
  ON public.promotion_products FOR SELECT
  USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();