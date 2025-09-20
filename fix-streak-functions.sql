-- Essential functions to fix "Error recording activity" issue
-- Copy and paste this into the Supabase SQL editor at:
-- https://supabase.com/dashboard/project/ffudsetxraiqzoynkbrb/sql/

-- Function to record daily activity and update streak
CREATE OR REPLACE FUNCTION public.record_daily_activity(
  activity_type_param TEXT,
  metadata_param JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_val UUID;
  today_date DATE;
  yesterday_date DATE;
  activity_exists BOOLEAN;
  current_streak_val INTEGER := 0;
  best_streak_val INTEGER := 0;
  streak_start_val DATE;
  result JSONB;
BEGIN
  -- Get current user
  user_id_val := auth.uid();
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  today_date := CURRENT_DATE;
  yesterday_date := today_date - INTERVAL '1 day';

  -- Check if activity already exists for today
  SELECT EXISTS(
    SELECT 1 FROM public.daily_activities
    WHERE user_id = user_id_val
    AND activity_date = today_date
    AND activity_type = activity_type_param
  ) INTO activity_exists;

  -- Insert activity if it doesn't exist
  IF NOT activity_exists THEN
    INSERT INTO public.daily_activities (user_id, activity_date, activity_type, metadata)
    VALUES (user_id_val, today_date, activity_type_param, metadata_param);
  END IF;

  -- Calculate streak
  -- Check if user had activity yesterday
  IF EXISTS(
    SELECT 1 FROM public.daily_activities
    WHERE user_id = user_id_val
    AND activity_date = yesterday_date
  ) THEN
    -- Continue streak
    SELECT
      COALESCE(current_streak, 0) + 1,
      GREATEST(COALESCE(best_streak, 0), COALESCE(current_streak, 0) + 1),
      COALESCE(streak_start_date, today_date)
    INTO current_streak_val, best_streak_val, streak_start_val
    FROM public.user_streaks
    WHERE user_id = user_id_val;

    -- If no existing streak record, this is day 1
    IF current_streak_val = 1 THEN
      current_streak_val := 1;
      streak_start_val := today_date;
    END IF;
  ELSE
    -- Start new streak
    current_streak_val := 1;
    best_streak_val := GREATEST(1, (SELECT COALESCE(best_streak, 0) FROM public.user_streaks WHERE user_id = user_id_val));
    streak_start_val := today_date;
  END IF;

  -- Upsert user streak record
  INSERT INTO public.user_streaks (
    user_id,
    current_streak,
    best_streak,
    last_activity_date,
    streak_start_date,
    updated_at
  ) VALUES (
    user_id_val,
    current_streak_val,
    best_streak_val,
    today_date,
    streak_start_val,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = current_streak_val,
    best_streak = GREATEST(user_streaks.best_streak, best_streak_val),
    last_activity_date = today_date,
    streak_start_date = CASE
      WHEN current_streak_val = 1 THEN today_date
      ELSE user_streaks.streak_start_date
    END,
    updated_at = NOW();

  -- Update profiles table for quick access
  UPDATE public.profiles
  SET
    current_streak = current_streak_val,
    best_streak = GREATEST(COALESCE(profiles.best_streak, 0), best_streak_val),
    updated_at = NOW()
  WHERE id = user_id_val;

  -- Return result
  result := jsonb_build_object(
    'current_streak', current_streak_val,
    'best_streak', best_streak_val,
    'activity_recorded', NOT activity_exists,
    'streak_start_date', streak_start_val
  );

  RETURN result;
END;
$$;

-- Function to get user streak info
CREATE OR REPLACE FUNCTION public.get_user_streak(user_id_param UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  streak_record RECORD;
  days_since_last_activity INTEGER;
  result JSONB;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(user_id_param, auth.uid());

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not specified or authenticated';
  END IF;

  -- Get streak information
  SELECT
    current_streak,
    best_streak,
    last_activity_date,
    streak_start_date
  INTO streak_record
  FROM public.user_streaks
  WHERE user_id = target_user_id;

  -- If no record exists, return defaults
  IF streak_record IS NULL THEN
    result := jsonb_build_object(
      'current_streak', 0,
      'best_streak', 0,
      'last_activity_date', NULL,
      'streak_start_date', NULL,
      'days_since_last_activity', NULL,
      'streak_active', false
    );
  ELSE
    -- Calculate days since last activity
    days_since_last_activity := CURRENT_DATE - streak_record.last_activity_date;

    result := jsonb_build_object(
      'current_streak', CASE
        WHEN days_since_last_activity > 1 THEN 0
        ELSE streak_record.current_streak
      END,
      'best_streak', streak_record.best_streak,
      'last_activity_date', streak_record.last_activity_date,
      'streak_start_date', streak_record.streak_start_date,
      'days_since_last_activity', days_since_last_activity,
      'streak_active', days_since_last_activity <= 1
    );
  END IF;

  RETURN result;
END;
$$;

-- Function to automatically record login activity
CREATE OR REPLACE FUNCTION public.record_login_activity()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.record_daily_activity('login', '{"source": "automatic"}');
END;
$$;