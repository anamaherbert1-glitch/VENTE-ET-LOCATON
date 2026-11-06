-- Harden the public marketplace view: it is read-only for client roles.
REVOKE ALL PRIVILEGES ON TABLE public.public_products FROM anon, authenticated;
GRANT SELECT ON TABLE public.public_products TO anon, authenticated;

-- Remove duplicate self-only profile policies; keep the BUILDTRACE-named policies.
DROP POLICY IF EXISTS "Members can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Members can update their own profile" ON public.profiles;
