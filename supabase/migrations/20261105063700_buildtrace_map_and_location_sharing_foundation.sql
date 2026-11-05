-- BUILDTRACE map and voluntary location-sharing foundation.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS neighborhood text,
  ADD COLUMN IF NOT EXISTS shop_neighborhood text,
  ADD COLUMN IF NOT EXISTS shop_latitude double precision,
  ADD COLUMN IF NOT EXISTS shop_longitude double precision;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS neighborhood text;

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS location_latitude double precision,
  ADD COLUMN IF NOT EXISTS location_longitude double precision,
  ADD COLUMN IF NOT EXISTS location_label text,
  ADD COLUMN IF NOT EXISTS location_kind text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_shop_latitude_range') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_shop_latitude_range
      CHECK (shop_latitude IS NULL OR shop_latitude BETWEEN -90 AND 90);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_shop_longitude_range') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_shop_longitude_range
      CHECK (shop_longitude IS NULL OR shop_longitude BETWEEN -180 AND 180);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_shop_coordinates_pair') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_shop_coordinates_pair
      CHECK ((shop_latitude IS NULL) = (shop_longitude IS NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_coordinates_range') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_coordinates_range
      CHECK (
        (latitude IS NULL OR latitude BETWEEN -90 AND 90)
        AND (longitude IS NULL OR longitude BETWEEN -180 AND 180)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_coordinates_pair') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_coordinates_pair
      CHECK ((latitude IS NULL) = (longitude IS NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_location_coordinates_range') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_location_coordinates_range
      CHECK (
        (location_latitude IS NULL OR location_latitude BETWEEN -90 AND 90)
        AND (location_longitude IS NULL OR location_longitude BETWEEN -180 AND 180)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_location_coordinates_pair') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_location_coordinates_pair
      CHECK ((location_latitude IS NULL) = (location_longitude IS NULL));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_location_type_consistency') THEN
    ALTER TABLE public.messages ADD CONSTRAINT messages_location_type_consistency
      CHECK (
        (message_type = 'text' AND location_latitude IS NULL AND location_longitude IS NULL AND location_kind IS NULL)
        OR
        (message_type = 'location' AND location_latitude IS NOT NULL AND location_longitude IS NOT NULL
          AND location_kind IN ('user', 'shop', 'depot'))
      );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_geo_coordinates_idx
  ON public.products (latitude, longitude)
  WHERE status = 'published' AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS products_city_neighborhood_idx
  ON public.products (lower(city), lower(COALESCE(neighborhood, '')))
  WHERE status = 'published';

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
  p.dimensions, p.condition, p.neighborhood
FROM public.products p
LEFT JOIN public.profiles pr ON pr.id = p.owner_id
WHERE p.status = 'published'
  AND has_active_buildtrace_subscription(p.owner_id);

-- Remove the temporary single-account restriction; participant policies remain the authorization boundary.
DROP POLICY IF EXISTS "BUILDTRACE single-account allowlist" ON public.conversations;
DROP POLICY IF EXISTS "BUILDTRACE single-account allowlist" ON public.messages;

DROP POLICY IF EXISTS "Participants create own product conversations" ON public.conversations;
CREATE POLICY "Participants create own product conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (
    buyer_id = (SELECT auth.uid())
    AND seller_id <> buyer_id
    AND EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = conversations.product_id
        AND p.owner_id = conversations.seller_id
        AND p.status = 'published'
        AND has_active_buildtrace_subscription(p.owner_id)
    )
  );
