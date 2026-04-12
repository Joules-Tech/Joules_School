-- ============================================================
-- V3 FIX: Auto-create profiles + fix assign_school_owner
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Allow users to insert their own profile row
CREATE POLICY "Profiles: insert own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 2. Trigger that auto-creates a profile row whenever a
--    new user is created in auth.users (email OR OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, school_id)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    'viewer',
    NULL
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: create profile rows for any existing auth users
--    who don't have one yet (fixes the current stuck users)
INSERT INTO public.profiles (id, full_name, role, school_id)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  'viewer',
  NULL
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 4. Fix assign_school_owner to UPSERT instead of just UPDATE
--    so it works even if the profile row somehow doesn't exist
CREATE OR REPLACE FUNCTION public.assign_school_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, school_id)
  VALUES (NEW.created_by, 'owner', NEW.id)
  ON CONFLICT (id) DO UPDATE
    SET school_id = NEW.id,
        role      = 'owner';
  RETURN NEW;
END;
$$;
