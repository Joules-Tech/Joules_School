-- ============================================================
-- V2 MIGRATION: Rojmel columns + Year opening balances + RPC
-- Run this in Supabase SQL Editor AFTER the base database.sql
-- ============================================================

-- 1. Add page_no and account_no to rojmel_entries
ALTER TABLE public.rojmel_entries
  ADD COLUMN IF NOT EXISTS page_no   TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS account_no TEXT DEFAULT '';

-- ============================================================
-- 2. Financial Year Opening Balances
-- Each school sets their opening balances once per financial year
-- (financial year = April 1 → March 31)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.year_opening_balances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  financial_year TEXT NOT NULL,          -- e.g. "2024-25", "2025-26"
  opening_cash   NUMERIC NOT NULL DEFAULT 0,
  opening_bank   NUMERIC NOT NULL DEFAULT 0,
  opening_loan   NUMERIC NOT NULL DEFAULT 0,
  notes          TEXT DEFAULT '',
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, financial_year)
);

ALTER TABLE public.year_opening_balances ENABLE ROW LEVEL SECURITY;

-- RLS: All school members can read
CREATE POLICY "Year balances: read own school"
ON public.year_opening_balances FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.school_id = year_opening_balances.school_id
  )
);

-- RLS: Only owner can insert
CREATE POLICY "Year balances: insert by owner"
ON public.year_opening_balances FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.school_id = year_opening_balances.school_id
      AND p.role = 'owner'
  )
);

-- RLS: Only owner can update
CREATE POLICY "Year balances: update by owner"
ON public.year_opening_balances FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.school_id = year_opening_balances.school_id
      AND p.role = 'owner'
  )
);

REVOKE ALL ON public.year_opening_balances FROM anon;

-- ============================================================
-- 3. Helper: current financial year string (e.g. "2025-26")
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_financial_year()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT
    CASE
      WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 4
        THEN EXTRACT(YEAR FROM CURRENT_DATE)::TEXT
             || '-' || RIGHT((EXTRACT(YEAR FROM CURRENT_DATE) + 1)::TEXT, 2)
      ELSE (EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT
             || '-' || RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2)
    END;
$$;

-- ============================================================
-- 4. RPC: get_school_balances  (called from dashboard)
-- Returns cash_balance, bank_balance, loan_balance for current FY
-- Falls back to schools.opening_cash / opening_bank for first year
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_school_balances(p_school_id UUID)
RETURNS TABLE(cash_balance NUMERIC, bank_balance NUMERIC, loan_balance NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fy_label   TEXT;
  v_fy_start   DATE;
  v_open_cash  NUMERIC := 0;
  v_open_bank  NUMERIC := 0;
  v_open_loan  NUMERIC := 0;
BEGIN
  v_fy_label := public.current_financial_year();

  -- Financial year starts on April 1
  IF EXTRACT(MONTH FROM CURRENT_DATE) >= 4 THEN
    v_fy_start := (EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-04-01')::DATE;
  ELSE
    v_fy_start := ((EXTRACT(YEAR FROM CURRENT_DATE) - 1)::TEXT || '-04-01')::DATE;
  END IF;

  -- Opening balances: prefer year_opening_balances, fallback to schools row
  SELECT
    COALESCE(yob.opening_cash, s.opening_cash, 0),
    COALESCE(yob.opening_bank, s.opening_bank, 0),
    COALESCE(yob.opening_loan, 0)
  INTO v_open_cash, v_open_bank, v_open_loan
  FROM public.schools s
  LEFT JOIN public.year_opening_balances yob
    ON yob.school_id = s.id AND yob.financial_year = v_fy_label
  WHERE s.id = p_school_id;

  RETURN QUERY
  SELECT
    (v_open_cash
      + COALESCE(SUM(CASE WHEN r.entry_type = 'IN'  AND r.payment_mode = 'CASH' THEN r.amount ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN r.entry_type = 'OUT' AND r.payment_mode = 'CASH' THEN r.amount ELSE 0 END), 0)
    ) AS cash_balance,
    (v_open_bank
      + COALESCE(SUM(CASE WHEN r.entry_type = 'IN'  AND r.payment_mode IN ('BANK','UPI') THEN r.amount ELSE 0 END), 0)
      - COALESCE(SUM(CASE WHEN r.entry_type = 'OUT' AND r.payment_mode IN ('BANK','UPI') THEN r.amount ELSE 0 END), 0)
    ) AS bank_balance,
    v_open_loan AS loan_balance
  FROM public.rojmel_entries r
  WHERE r.school_id = p_school_id
    AND r.entry_date >= v_fy_start;
END;
$$;
