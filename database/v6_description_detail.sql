-- ============================================================
-- V6: Add description_detail column to rojmel_entries
-- Run this in Supabase SQL Editor
-- ============================================================

ALTER TABLE public.rojmel_entries
  ADD COLUMN IF NOT EXISTS description_detail TEXT NOT NULL DEFAULT '';
