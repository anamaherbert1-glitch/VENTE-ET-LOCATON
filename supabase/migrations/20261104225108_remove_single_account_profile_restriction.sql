-- Allow each authenticated BUILDTRACE user to access only their own profile.
-- Existing INSERT/SELECT/UPDATE policies enforce auth.uid() = profiles.id.
DROP POLICY IF EXISTS "BUILDTRACE single-account allowlist" ON public.profiles;
