-- ============================================================
-- V5: Accounts (ખાતાઓ) table for Khatavahi ledger
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  account_name  TEXT NOT NULL,
  account_number TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, account_number)
);

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- All school members can read accounts
CREATE POLICY "Accounts: read own school"
ON public.accounts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.school_id = accounts.school_id
  )
);

-- Owner/accountant can create accounts
CREATE POLICY "Accounts: insert by owner or accountant"
ON public.accounts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.school_id = accounts.school_id
      AND p.role IN ('owner', 'accountant')
  )
);

-- Owner/accountant can update accounts
CREATE POLICY "Accounts: update by owner or accountant"
ON public.accounts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.school_id = accounts.school_id
      AND p.role IN ('owner', 'accountant')
  )
);

-- Owner/accountant can delete accounts
CREATE POLICY "Accounts: delete by owner or accountant"
ON public.accounts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.school_id = accounts.school_id
      AND p.role IN ('owner', 'accountant')
  )
);

REVOKE ALL ON public.accounts FROM anon;
