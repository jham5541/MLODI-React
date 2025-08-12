-- Fix the products and categories relationship and permissions
BEGIN;

-- Create product categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add category_id to products table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'category_id'
  ) THEN
    ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.product_categories(id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.product_categories(slug);

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow authenticated users to manage their carts" ON public.carts;
DROP POLICY IF EXISTS "Allow authenticated users to manage their cart items" ON public.cart_items;

-- Fix cart permissions
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Allow authenticated users to manage their carts"
  ON public.carts
  FOR ALL
  TO authenticated
  USING (
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() = user_id
  );

CREATE POLICY "Allow authenticated users to manage their cart items"
  ON public.cart_items
  FOR ALL
  TO authenticated
  USING (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    cart_id IN (
      SELECT id FROM public.carts 
      WHERE user_id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT ALL ON public.carts TO authenticated;
GRANT ALL ON public.cart_items TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Insert some sample categories if the table is empty
INSERT INTO public.product_categories (name, slug, description, sort_order)
SELECT * FROM (
  VALUES 
    ('Songs', 'songs', 'Digital music tracks', 1),
    ('Albums', 'albums', 'Full music albums', 2),
    ('Videos', 'videos', 'Music videos and concerts', 3),
    ('Merchandise', 'merch', 'Artist merchandise and physical items', 4)
) AS v(name, slug, description, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_categories LIMIT 1
);

COMMIT;
