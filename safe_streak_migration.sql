-- Safe migration script to add streak tracking functions and tables
-- This script only includes safe operations that won't break existing data

-- Daily activities table to track daily interactions (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'proof_submission', 'mileage_log', 'goal_check')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, activity_date, activity_type)
);

-- User streaks table to track current and best streaks (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  streak_start_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add streak-related columns to profiles if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;

-- Create indexes for performance (using IF NOT EXISTS equivalent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_activities_user_date') THEN
    CREATE INDEX idx_daily_activities_user_date ON public.daily_activities(user_id, activity_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_daily_activities_date') THEN
    CREATE INDEX idx_daily_activities_date ON public.daily_activities(activity_date);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_streaks_user_id') THEN
    CREATE INDEX idx_user_streaks_user_id ON public.user_streaks(user_id);
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  -- Check and enable RLS for daily_activities
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'daily_activities'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;
  END IF;

  -- Check and enable RLS for user_streaks
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'user_streaks'
    AND rowsecurity = true
  ) THEN
    ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies (using CREATE OR REPLACE equivalent)
DROP POLICY IF EXISTS "Users can view their own activities" ON public.daily_activities;
CREATE POLICY "Users can view their own activities"
  ON public.daily_activities FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own activities" ON public.daily_activities;
CREATE POLICY "Users can insert their own activities"
  ON public.daily_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own streaks" ON public.user_streaks;
CREATE POLICY "Users can view their own streaks"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own streaks" ON public.user_streaks;
CREATE POLICY "Users can update their own streaks"
  ON public.user_streaks FOR ALL
  USING (auth.uid() = user_id);

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

-- Function for trigger to automatically update streaks when activities are inserted
CREATE OR REPLACE FUNCTION public.trigger_update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update streak whenever a new daily activity is recorded
  PERFORM public.record_daily_activity(NEW.activity_type, NEW.metadata);
  RETURN NEW;
END;
$$;

-- Create triggers if they don't exist
DO $$
BEGIN
  -- Drop and recreate trigger to ensure it's properly set up
  DROP TRIGGER IF EXISTS update_user_streak_on_activity ON public.daily_activities;
  CREATE TRIGGER update_user_streak_on_activity
    BEFORE INSERT ON public.daily_activities
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_user_streak();

  -- Create update triggers if they don't exist (requires update_updated_at_column function to exist)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_user_streaks_updated_at ON public.user_streaks;
    CREATE TRIGGER update_user_streaks_updated_at
      BEFORE UPDATE ON public.user_streaks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS update_daily_activities_updated_at ON public.daily_activities;
    CREATE TRIGGER update_daily_activities_updated_at
      BEFORE UPDATE ON public.daily_activities
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;