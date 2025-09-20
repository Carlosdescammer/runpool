-- Fix email notification functions
-- Copy and paste this into the Supabase SQL editor at:
-- https://supabase.com/dashboard/project/ffudsetxraiqzoynkbrb/sql/

-- Function to get user email preferences
CREATE OR REPLACE FUNCTION public.get_user_email_preferences(target_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_val UUID;
  prefs_record RECORD;
  result JSONB;
BEGIN
  user_id_val := COALESCE(target_user_id, auth.uid());

  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'User not specified or authenticated';
  END IF;

  SELECT * INTO prefs_record
  FROM public.email_preferences
  WHERE user_id = user_id_val;

  IF prefs_record IS NULL THEN
    -- Create default preferences if none exist
    INSERT INTO public.email_preferences (user_id)
    VALUES (user_id_val)
    RETURNING * INTO prefs_record;
  END IF;

  result := row_to_json(prefs_record)::jsonb;
  RETURN result;
END;
$$;

-- Function to update email preferences
CREATE OR REPLACE FUNCTION public.update_user_email_preferences(preferences JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_val UUID;
  result JSONB;
BEGIN
  user_id_val := auth.uid();

  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Upsert preferences
  INSERT INTO public.email_preferences (
    user_id,
    all_emails,
    streak_reminders,
    daily_motivation,
    weekly_recap,
    achievement_celebrations,
    comeback_encouragement,
    running_tips,
    updated_at
  ) VALUES (
    user_id_val,
    COALESCE((preferences->>'all_emails')::boolean, true),
    COALESCE((preferences->>'streak_reminders')::boolean, true),
    COALESCE((preferences->>'daily_motivation')::boolean, true),
    COALESCE((preferences->>'weekly_recap')::boolean, true),
    COALESCE((preferences->>'achievement_celebrations')::boolean, true),
    COALESCE((preferences->>'comeback_encouragement')::boolean, true),
    COALESCE((preferences->>'running_tips')::boolean, true),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    all_emails = EXCLUDED.all_emails,
    streak_reminders = EXCLUDED.streak_reminders,
    daily_motivation = EXCLUDED.daily_motivation,
    weekly_recap = EXCLUDED.weekly_recap,
    achievement_celebrations = EXCLUDED.achievement_celebrations,
    comeback_encouragement = EXCLUDED.comeback_encouragement,
    running_tips = EXCLUDED.running_tips,
    updated_at = NOW();

  -- Return updated preferences
  SELECT row_to_json(ep)::jsonb INTO result
  FROM public.email_preferences ep
  WHERE user_id = user_id_val;

  RETURN result;
END;
$$;