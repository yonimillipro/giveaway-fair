-- Add company_id and product_image_url columns to promotions table
ALTER TABLE public.promotions 
ADD COLUMN IF NOT EXISTS company_id uuid,
ADD COLUMN IF NOT EXISTS product_image_url text;

-- Add comment for clarity
COMMENT ON COLUMN public.promotions.company_id IS 'The company associated with this promotion';
COMMENT ON COLUMN public.promotions.product_image_url IS 'URL to the product image for this promotion';