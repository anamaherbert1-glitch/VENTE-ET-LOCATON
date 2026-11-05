-- Align the Marketplace UI with the canonical products table.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sale_price_xof numeric,
  ADD COLUMN IF NOT EXISTS rental_price_xof numeric,
  ADD COLUMN IF NOT EXISTS rental_period text,
  ADD COLUMN IF NOT EXISTS dimensions text,
  ADD COLUMN IF NOT EXISTS condition text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_sale_price_xof_nonnegative') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_sale_price_xof_nonnegative
      CHECK (sale_price_xof IS NULL OR sale_price_xof >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_rental_price_xof_nonnegative') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_rental_price_xof_nonnegative
      CHECK (rental_price_xof IS NULL OR rental_price_xof >= 0);
  END IF;
END $$;

DROP POLICY IF EXISTS "BUILDTRACE single-account allowlist" ON public.products;
DROP POLICY IF EXISTS "Public can read published subscribed BUILDTRACE products" ON public.products;
CREATE POLICY "Public can read published subscribed BUILDTRACE products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (status = 'published' AND has_active_buildtrace_subscription(owner_id));

CREATE OR REPLACE VIEW public.public_products
WITH (security_invoker = true)
AS
SELECT
  p.id, p.public_id, p.offer_type, p.title, p.category, p.description,
  p.price_xof, p.unit, p.quantity, p.city, p.photo_paths, p.created_at,
  pr.full_name AS seller_name, p.latitude, p.longitude,
  pr.account_type AS seller_account_type,
  pr.latitude AS seller_latitude, pr.longitude AS seller_longitude,
  COALESCE(p.country_code, pr.country_code) AS country_code,
  COALESCE(p.country_name, pr.country_name) AS country_name,
  p.owner_id, p.sale_price_xof, p.rental_price_xof, p.rental_period,
  p.dimensions, p.condition
FROM public.products p
LEFT JOIN public.profiles pr ON pr.id = p.owner_id
WHERE p.status = 'published'
  AND has_active_buildtrace_subscription(p.owner_id);
