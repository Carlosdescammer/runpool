-- Fix email system by dropping and recreating functions with correct signatures

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_user_email_preferences(uuid);
DROP FUNCTION IF EXISTS public.update_user_email_preferences(jsonb);
DROP FUNCTION IF EXISTS public.upsert_user_email_preferences(uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean);

-- Create tables if they don't exist (safe with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy
DROP POLICY IF EXISTS "Users can view and edit own profile" ON public.profiles;
CREATE POLICY "Users can view and edit own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Email preferences table (simplified)
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Core email preferences
  all_emails BOOLEAN DEFAULT true,
  streak_reminders BOOLEAN DEFAULT true,
  daily_motivation BOOLEAN DEFAULT true,
  weekly_recap BOOLEAN DEFAULT true,
  achievement_celebrations BOOLEAN DEFAULT true,
  comeback_encouragement BOOLEAN DEFAULT true,
  running_tips BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy
DROP POLICY IF EXISTS "Users can manage their email preferences" ON public.email_preferences;
CREATE POLICY "Users can manage their email preferences" ON public.email_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL,
  
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email campaigns tracking
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_type TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  subject TEXT NOT NULL,
  template_name TEXT,
  
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  provider_message_id TEXT,
  email_provider TEXT DEFAULT 'resend',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy
DROP POLICY IF EXISTS "Users can view their email campaigns" ON public.email_campaigns;
CREATE POLICY "Users can view their email campaigns" ON public.email_campaigns
  FOR SELECT USING (auth.uid() = recipient_id);

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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.email_preferences TO authenticated;
GRANT ALL ON public.email_templates TO authenticated;
GRANT ALL ON public.email_campaigns TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_email_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_email_preferences TO authenticated;