-- Fix email preferences to work with existing table structure
-- Copy and paste this into the Supabase SQL editor at:
-- https://supabase.com/dashboard/project/ffudsetxraiqzoynkbrb/sql/

-- First, add missing columns to the existing email_preferences table
ALTER TABLE public.email_preferences
ADD COLUMN IF NOT EXISTS all_emails BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS streak_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS daily_motivation BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS achievement_celebrations BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS comeback_encouragement BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS group_activity_updates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS new_member_welcome BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS challenge_updates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS running_tips BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS weather_updates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS training_plans BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_reminders BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS admin_new_user_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS system_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS product_updates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS newsletter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promotional_emails BOOLEAN DEFAULT false;

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
    INSERT INTO public.email_preferences (
      user_id,
      all_emails,
      streak_reminders,
      daily_motivation,
      weekly_recap,
      achievement_celebrations,
      comeback_encouragement,
      group_activity_updates,
      new_member_welcome,
      challenge_updates,
      running_tips,
      weather_updates,
      training_plans,
      payment_reminders,
      system_notifications,
      product_updates,
      newsletter,
      promotional_emails
    ) VALUES (
      user_id_val,
      true, true, true, true, true, true, true, true, true, true, false, false, true, true, false, false, false
    )
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

  -- Upsert preferences using all possible columns
  INSERT INTO public.email_preferences (
    user_id,
    all_emails,
    streak_reminders,
    daily_motivation,
    weekly_recap,
    achievement_celebrations,
    comeback_encouragement,
    group_activity_updates,
    new_member_welcome,
    challenge_updates,
    running_tips,
    weather_updates,
    training_plans,
    payment_reminders,
    system_notifications,
    product_updates,
    newsletter,
    promotional_emails,
    updated_at
  ) VALUES (
    user_id_val,
    COALESCE((preferences->>'all_emails')::boolean, true),
    COALESCE((preferences->>'streak_reminders')::boolean, true),
    COALESCE((preferences->>'daily_motivation')::boolean, true),
    COALESCE((preferences->>'weekly_recap')::boolean, true),
    COALESCE((preferences->>'achievement_celebrations')::boolean, true),
    COALESCE((preferences->>'comeback_encouragement')::boolean, true),
    COALESCE((preferences->>'group_activity_updates')::boolean, true),
    COALESCE((preferences->>'new_member_welcome')::boolean, true),
    COALESCE((preferences->>'challenge_updates')::boolean, true),
    COALESCE((preferences->>'running_tips')::boolean, true),
    COALESCE((preferences->>'weather_updates')::boolean, false),
    COALESCE((preferences->>'training_plans')::boolean, false),
    COALESCE((preferences->>'payment_reminders')::boolean, true),
    COALESCE((preferences->>'system_notifications')::boolean, true),
    COALESCE((preferences->>'product_updates')::boolean, false),
    COALESCE((preferences->>'newsletter')::boolean, false),
    COALESCE((preferences->>'promotional_emails')::boolean, false),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    all_emails = EXCLUDED.all_emails,
    streak_reminders = EXCLUDED.streak_reminders,
    daily_motivation = EXCLUDED.daily_motivation,
    weekly_recap = EXCLUDED.weekly_recap,
    achievement_celebrations = EXCLUDED.achievement_celebrations,
    comeback_encouragement = EXCLUDED.comeback_encouragement,
    group_activity_updates = EXCLUDED.group_activity_updates,
    new_member_welcome = EXCLUDED.new_member_welcome,
    challenge_updates = EXCLUDED.challenge_updates,
    running_tips = EXCLUDED.running_tips,
    weather_updates = EXCLUDED.weather_updates,
    training_plans = EXCLUDED.training_plans,
    payment_reminders = EXCLUDED.payment_reminders,
    system_notifications = EXCLUDED.system_notifications,
    product_updates = EXCLUDED.product_updates,
    newsletter = EXCLUDED.newsletter,
    promotional_emails = EXCLUDED.promotional_emails,
    updated_at = NOW();

  -- Return updated preferences
  SELECT row_to_json(ep)::jsonb INTO result
  FROM public.email_preferences ep
  WHERE user_id = user_id_val;

  RETURN result;
END;
$$;