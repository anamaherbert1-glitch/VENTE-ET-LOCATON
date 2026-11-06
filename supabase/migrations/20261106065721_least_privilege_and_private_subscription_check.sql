-- Keep the public marketplace view usable without exposing subscription rows.
CREATE OR REPLACE FUNCTION private.has_active_buildtrace_subscription(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.seller_subscriptions s
    WHERE s.user_id = check_user_id
      AND s.status = 'active'
      AND (s.current_period_end IS NULL OR s.current_period_end > now())
  );
$function$;

ALTER FUNCTION private.has_active_buildtrace_subscription(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION private.has_active_buildtrace_subscription(uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_active_buildtrace_subscription(uuid) TO anon, authenticated, service_role;

-- The old public RPC could reveal whether an arbitrary user had an active subscription.
REVOKE ALL ON FUNCTION public.has_active_buildtrace_subscription(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_buildtrace_subscription(uuid) TO service_role;

-- Remove unnecessary table-level privileges while preserving the app's required operations.
REVOKE ALL PRIVILEGES ON TABLE public.products FROM anon, authenticated;
GRANT SELECT ON TABLE public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, account_type, country_code, country_name)
  ON TABLE public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.seller_subscriptions FROM anon, authenticated;
GRANT SELECT ON TABLE public.seller_subscriptions TO authenticated;

-- One SELECT policy covers own products and public subscribed listings.
DROP POLICY IF EXISTS "Owners read own BUILDTRACE products" ON public.products;
DROP POLICY IF EXISTS "Public can read published subscribed BUILDTRACE products" ON public.products;
CREATE POLICY "Users read own or public subscribed BUILDTRACE products"
  ON public.products FOR SELECT TO anon, authenticated
  USING (
    owner_id = (SELECT auth.uid())
    OR (
      status = 'published'
      AND (SELECT private.has_active_buildtrace_subscription(owner_id))
    )
  );

DROP POLICY IF EXISTS "Active subscribers create BUILDTRACE products" ON public.products;
CREATE POLICY "Active subscribers create BUILDTRACE products"
  ON public.products FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND (SELECT private.has_active_buildtrace_subscription((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Active subscribers update own BUILDTRACE products" ON public.products;
CREATE POLICY "Active subscribers update own BUILDTRACE products"
  ON public.products FOR UPDATE TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    AND (SELECT private.has_active_buildtrace_subscription((SELECT auth.uid())))
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND (SELECT private.has_active_buildtrace_subscription((SELECT auth.uid())))
  );

-- Only the user's own profile and display fields for active public sellers are readable.
DROP POLICY IF EXISTS "Users read own BUILDTRACE profile" ON public.profiles;
CREATE POLICY "Users read own or subscribed seller display profiles"
  ON public.profiles FOR SELECT TO anon, authenticated
  USING (
    id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.products p
      WHERE p.owner_id = profiles.id
        AND p.status = 'published'
        AND (SELECT private.has_active_buildtrace_subscription(p.owner_id))
    )
  );

-- Preserve the view's existing output shape but do not publish private profile coordinates.
CREATE OR REPLACE VIEW public.public_products
WITH (security_invoker = true)
AS
SELECT
  p.id, p.public_id, p.offer_type, p.title, p.category, p.description,
  p.price_xof, p.unit, p.quantity, p.city, p.photo_paths, p.created_at,
  pr.full_name AS seller_name, p.latitude, p.longitude,
  pr.account_type AS seller_account_type,
  NULL::double precision AS seller_latitude,
  NULL::double precision AS seller_longitude,
  COALESCE(p.country_code, pr.country_code) AS country_code,
  COALESCE(p.country_name, pr.country_name) AS country_name,
  p.owner_id, p.sale_price_xof, p.rental_price_xof, p.rental_period,
  p.dimensions, p.condition, p.neighborhood
FROM public.products p
LEFT JOIN public.profiles pr ON pr.id = p.owner_id
WHERE p.status = 'published'
  AND (SELECT private.has_active_buildtrace_subscription(p.owner_id));
