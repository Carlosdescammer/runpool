-- Add a per-group toggle for instant email notifications when proofs are submitted
-- Safe to run multiple times.

BEGIN;

ALTER TABLE public.groups
  ADD COLUMN IF NOT EXISTS notify_on_proof boolean;

-- Default ON for new groups
ALTER TABLE public.groups
  ALTER COLUMN notify_on_proof SET DEFAULT true;

-- Backfill existing rows to true
UPDATE public.groups
  SET notify_on_proof = COALESCE(notify_on_proof, true)
  WHERE notify_on_proof IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE public.groups
  ALTER COLUMN notify_on_proof SET NOT NULL;

COMMIT;
