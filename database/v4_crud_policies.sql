-- ============================================================
-- V4: Add UPDATE and DELETE policies for rojmel_entries
-- Run this in Supabase SQL Editor
-- ============================================================

-- Allow owner / accountant to update entries in their school
CREATE POLICY "Rojmel: update by owner or accountant"
ON public.rojmel_entries FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.school_id = rojmel_entries.school_id
      AND p.role IN ('owner', 'accountant')
  )
);

-- Allow owner / accountant to delete entries in their school
CREATE POLICY "Rojmel: delete by owner or accountant"
ON public.rojmel_entries FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.school_id = rojmel_entries.school_id
      AND p.role IN ('owner', 'accountant')
  )
);
