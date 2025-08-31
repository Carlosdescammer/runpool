-- Function to create a new weekly challenge
CREATE OR REPLACE FUNCTION public.create_weekly_challenge(
  group_id_param UUID,
  week_number_param INTEGER,
  start_date_param DATE,
  end_date_param DATE,
  distance_goal_km_param DECIMAL(10,2),
  entry_fee_cents_param INTEGER
) 
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  new_week_id UUID;
  coach_id_val UUID;
BEGIN
  -- Verify the group exists and get the coach
  SELECT coach_id INTO coach_id_val
  FROM public.groups
  WHERE id = group_id_param;
  
  IF coach_id_val IS NULL THEN
    RAISE EXCEPTION 'Group not found';
  END IF;
  
  -- Create the new week
  INSERT INTO public.weeks (
    group_id, 
    week_number, 
    start_date, 
    end_date, 
    distance_goal_km, 
    entry_fee_cents,
    status
  ) VALUES (
    group_id_param,
    week_number_param,
    start_date_param,
    end_date_param,
    distance_goal_km_param,
    entry_fee_cents_param,
    'upcoming'
  )
  RETURNING id INTO new_week_id;
  
  -- Update any previous weeks to 'completed' status
  UPDATE public.weeks
  SET status = 'completed',
      updated_at = NOW()
  WHERE group_id = group_id_param
    AND id != new_week_id
    AND status != 'completed';
    
  RETURN new_week_id;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'A week with this number already exists for this group';
END;
$$;

-- Function to submit run proof
CREATE OR REPLACE FUNCTION public.submit_run_proof(
  week_id_param UUID,
  user_id_param UUID,
  proof_url_param TEXT,
  distance_km_param DECIMAL(10,2)
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  week_record RECORD;
  participant_record RECORD;
BEGIN
  -- Get week details
  SELECT * INTO week_record
  FROM public.weeks
  WHERE id = week_id_param;
  
  IF week_record IS NULL THEN
    RAISE EXCEPTION 'Week not found';
  END IF;
  
  -- Check if the week is still active
  IF week_record.status != 'in_progress' THEN
    RAISE EXCEPTION 'This week''s challenge is not currently active';
  END IF;
  
  -- Check if user is a participant
  SELECT * INTO participant_record
  FROM public.participants
  WHERE week_id = week_id_param
  AND user_id = user_id_param;
  
  IF participant_record IS NULL THEN
    RAISE EXCEPTION 'You are not registered for this week''s challenge';
  END IF;
  
  -- Update or insert proof
  IF participant_record.proof_url IS NULL THEN
    -- First proof submission
    UPDATE public.participants
    SET 
      proof_url = proof_url_param,
      proof_submitted_at = NOW(),
      verification_status = 'pending',
      updated_at = NOW()
    WHERE id = participant_record.id;
  ELSE
    -- Update existing proof
    UPDATE public.participants
    SET 
      proof_url = proof_url_param,
      proof_submitted_at = NOW(),
      verification_status = 'pending',
      updated_at = NOW()
    WHERE id = participant_record.id;
  END IF;
  
  -- If distance is provided, update it
  IF distance_km_param IS NOT NULL THEN
    -- This assumes you have a column to store the actual distance run
    -- You might need to add this to your participants table
    -- ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2);
    UPDATE public.participants
    SET distance_km = distance_km_param
    WHERE id = participant_record.id;
  END IF;
END;
$$;

-- Function to verify a participant's proof
CREATE OR REPLACE FUNCTION public.verify_participant(
  week_id_param UUID,
  user_id_param UUID,
  is_approved BOOLEAN,
  notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  week_record RECORD;
  coach_id_val UUID;
BEGIN
  -- Get week and verify coach
  SELECT w.*, g.coach_id INTO week_record
  FROM public.weeks w
  JOIN public.groups g ON w.group_id = g.id
  WHERE w.id = week_id_param;
  
  IF week_record IS NULL THEN
    RAISE EXCEPTION 'Week not found';
  END IF;
  
  -- Only the group coach can verify participants
  IF week_record.coach_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the group coach can verify participants';
  END IF;
  
  -- Update participant status
  UPDATE public.participants
  SET 
    verification_status = CASE WHEN is_approved THEN 'approved'::TEXT ELSE 'rejected'::TEXT END,
    verification_notes = notes,
    updated_at = NOW()
  WHERE week_id = week_id_param
  AND user_id = user_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Participant not found for this week';
  END IF;
END;
$$;

-- Function to finalize a week and process payouts
CREATE OR REPLACE FUNCTION public.finalize_week(
  week_id_param UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  week_record RECORD;
  coach_id_val UUID;
  total_participants INTEGER;
  passing_participants INTEGER;
  prize_pool_cents BIGINT;
  prize_per_winner_cents INTEGER;
  result JSONB;
BEGIN
  -- Get week and verify coach
  SELECT w.*, g.coach_id INTO week_record
  FROM public.weeks w
  JOIN public.groups g ON w.group_id = g.id
  WHERE w.id = week_id_param;
  
  IF week_record IS NULL THEN
    RAISE EXCEPTION 'Week not found';
  END IF;
  
  -- Only the group coach can finalize a week
  IF week_record.coach_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the group coach can finalize a week';
  END IF;
  
  -- Check if week is already finalized
  IF week_record.status = 'completed' THEN
    RAISE EXCEPTION 'This week has already been finalized';
  END IF;
  
  -- Count participants
  SELECT 
    COUNT(*) INTO total_participants
  FROM public.participants
  WHERE week_id = week_id_param
  AND payment_status = 'paid';
  
  IF total_participants = 0 THEN
    RAISE EXCEPTION 'No paid participants found for this week';
  END IF;
  
  -- Count passing participants
  SELECT 
    COUNT(*) INTO passing_participants
  FROM public.participants
  WHERE week_id = week_id_param
  AND payment_status = 'paid'
  AND verification_status = 'approved';
  
  -- Calculate prize pool (sum of entry fees from non-passing participants)
  SELECT 
    COALESCE(SUM(entry_fee_cents), 0) INTO prize_pool_cents
  FROM public.weeks w
  JOIN public.participants p ON w.id = p.week_id
  WHERE w.id = week_id_param
  AND p.payment_status = 'paid'
  AND (p.verification_status != 'approved' OR p.verification_status IS NULL);
  
  -- Calculate prize per winner (integer division to avoid fractions of cents)
  IF passing_participants > 0 THEN
    prize_per_winner_cents := (prize_pool_cents / passing_participants)::INTEGER;
  ELSE
    prize_per_winner_cents := 0;
  END IF;
  
  -- Update week status
  UPDATE public.weeks
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = week_id_param;
  
  -- Create payout records for winners
  -- Note: Actual payouts would be processed by a background job that calls Stripe's API
  INSERT INTO public.payouts (
    week_id,
    recipient_id,
    amount_cents,
    status
  )
  SELECT 
    week_id_param,
    p.user_id,
    prize_per_winner_cents,
    'pending'
  FROM public.participants p
  WHERE p.week_id = week_id_param
  AND p.payment_status = 'paid'
  AND p.verification_status = 'approved'
  AND passing_participants > 0
  AND prize_per_winner_cents > 0;
  
  -- Prepare result
  result := jsonb_build_object(
    'week_id', week_id_param,
    'total_participants', total_participants,
    'passing_participants', passing_participants,
    'prize_pool_cents', prize_pool_cents,
    'prize_per_winner_cents', prize_per_winner_cents,
    'payouts_created', (SELECT COUNT(*) FROM public.payouts WHERE week_id = week_id_param)
  );
  
  RETURN result;
END;
$$;
