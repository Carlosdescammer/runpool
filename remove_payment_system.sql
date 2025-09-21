-- Migration to remove payment system
-- This removes Stripe-related columns from the database

-- Remove payment-related columns from participants table
ALTER TABLE public.participants
DROP COLUMN IF EXISTS payment_intent_id,
DROP COLUMN IF EXISTS payment_status;

-- Remove entry fee from groups table
ALTER TABLE public.groups
DROP COLUMN IF EXISTS entry_fee;

-- Remove entry fee from weeks table
ALTER TABLE public.weeks
DROP COLUMN IF EXISTS entry_fee_cents;

-- Remove the entire payouts table since it's payment-specific
DROP TABLE IF EXISTS public.payouts CASCADE;

-- Update any existing participants to have no payment status
-- (This is safe since we're removing the payment system entirely)

-- Note: After running this migration:
-- 1. The PaymentStatusCard component should be removed from your code
-- 2. All Stripe-related API routes should be removed
-- 3. Stripe dependencies should be removed from package.json
-- 4. Environment variables for Stripe should be cleaned up