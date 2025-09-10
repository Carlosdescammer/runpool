-- Complete Email Campaign System Setup
-- Run this entire file in your Supabase SQL Editor

-- Drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.get_user_email_preferences(uuid);
DROP FUNCTION IF EXISTS public.update_user_email_preferences(jsonb);
DROP FUNCTION IF EXISTS public.upsert_user_email_preferences(uuid, boolean, boolean, boolean, boolean, boolean, boolean, boolean);

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy for profiles
DROP POLICY IF EXISTS "Users can view and edit own profile" ON public.profiles;
CREATE POLICY "Users can view and edit own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Email preferences table
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Engagement & Motivation Emails
  streak_reminders BOOLEAN DEFAULT true,
  daily_motivation BOOLEAN DEFAULT true,
  weekly_recap BOOLEAN DEFAULT true,
  achievement_celebrations BOOLEAN DEFAULT true,
  comeback_encouragement BOOLEAN DEFAULT true,
  
  -- Group & Social Emails  
  group_activity_updates BOOLEAN DEFAULT true,
  new_member_welcome BOOLEAN DEFAULT true,
  challenge_updates BOOLEAN DEFAULT true,
  
  -- Tips & Content
  running_tips BOOLEAN DEFAULT true,
  weather_updates BOOLEAN DEFAULT true,
  training_plans BOOLEAN DEFAULT false,
  
  -- Admin & System
  payment_reminders BOOLEAN DEFAULT true,
  admin_new_user_alerts BOOLEAN DEFAULT true,
  system_notifications BOOLEAN DEFAULT true,
  
  -- Marketing (opt-in only)
  product_updates BOOLEAN DEFAULT false,
  newsletter BOOLEAN DEFAULT false,
  
  -- Master controls
  all_emails BOOLEAN DEFAULT true,
  promotional_emails BOOLEAN DEFAULT false,
  
  -- Metadata
  opted_in_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on email_preferences
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy for email_preferences
DROP POLICY IF EXISTS "Users can manage their email preferences" ON public.email_preferences;
CREATE POLICY "Users can manage their email preferences" ON public.email_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Email campaigns tracking
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_type TEXT NOT NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Content info
  subject TEXT NOT NULL,
  template_name TEXT,
  personalization_data JSONB DEFAULT '{}',
  
  -- Delivery tracking
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  -- Engagement tracking
  email_provider TEXT DEFAULT 'resend',
  provider_message_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'opened', 'clicked', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on email_campaigns
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policy for email_campaigns
DROP POLICY IF EXISTS "Users can view their email campaigns" ON public.email_campaigns;
CREATE POLICY "Users can view their email campaigns" ON public.email_campaigns
  FOR SELECT USING (auth.uid() = recipient_id);

-- Email templates storage
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL,
  
  -- Content
  subject_template TEXT NOT NULL,
  html_template TEXT NOT NULL,
  text_template TEXT,
  
  -- Targeting
  trigger_conditions JSONB DEFAULT '{}',
  target_audience TEXT,
  
  -- Scheduling
  send_delay_hours INTEGER DEFAULT 0,
  max_sends_per_user INTEGER DEFAULT 1,
  cooldown_hours INTEGER DEFAULT 24,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email queue for scheduled sending
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE CASCADE NOT NULL,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  priority INTEGER DEFAULT 1,
  
  -- Personalization
  template_variables JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON public.email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_recipient ON public.email_campaigns(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_type ON public.email_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_sent_at ON public.email_campaigns(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON public.email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_user_id ON public.email_queue(user_id);

-- Enable RLS on remaining tables
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

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

-- Function to update user email preferences
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
  
  -- Update preferences
  UPDATE public.email_preferences
  SET 
    streak_reminders = COALESCE((preferences->>'streak_reminders')::boolean, streak_reminders),
    daily_motivation = COALESCE((preferences->>'daily_motivation')::boolean, daily_motivation),
    weekly_recap = COALESCE((preferences->>'weekly_recap')::boolean, weekly_recap),
    achievement_celebrations = COALESCE((preferences->>'achievement_celebrations')::boolean, achievement_celebrations),
    comeback_encouragement = COALESCE((preferences->>'comeback_encouragement')::boolean, comeback_encouragement),
    group_activity_updates = COALESCE((preferences->>'group_activity_updates')::boolean, group_activity_updates),
    new_member_welcome = COALESCE((preferences->>'new_member_welcome')::boolean, new_member_welcome),
    challenge_updates = COALESCE((preferences->>'challenge_updates')::boolean, challenge_updates),
    running_tips = COALESCE((preferences->>'running_tips')::boolean, running_tips),
    weather_updates = COALESCE((preferences->>'weather_updates')::boolean, weather_updates),
    training_plans = COALESCE((preferences->>'training_plans')::boolean, training_plans),
    payment_reminders = COALESCE((preferences->>'payment_reminders')::boolean, payment_reminders),
    admin_new_user_alerts = COALESCE((preferences->>'admin_new_user_alerts')::boolean, admin_new_user_alerts),
    system_notifications = COALESCE((preferences->>'system_notifications')::boolean, system_notifications),
    product_updates = COALESCE((preferences->>'product_updates')::boolean, product_updates),
    newsletter = COALESCE((preferences->>'newsletter')::boolean, newsletter),
    all_emails = COALESCE((preferences->>'all_emails')::boolean, all_emails),
    promotional_emails = COALESCE((preferences->>'promotional_emails')::boolean, promotional_emails),
    last_updated = NOW()
  WHERE user_id = user_id_val;
  
  -- If no row was updated, insert new preferences
  IF NOT FOUND THEN
    INSERT INTO public.email_preferences (
      user_id,
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
      admin_new_user_alerts,
      system_notifications,
      product_updates,
      newsletter,
      all_emails,
      promotional_emails
    ) VALUES (
      user_id_val,
      COALESCE((preferences->>'streak_reminders')::boolean, true),
      COALESCE((preferences->>'daily_motivation')::boolean, true),
      COALESCE((preferences->>'weekly_recap')::boolean, true),
      COALESCE((preferences->>'achievement_celebrations')::boolean, true),
      COALESCE((preferences->>'comeback_encouragement')::boolean, true),
      COALESCE((preferences->>'group_activity_updates')::boolean, true),
      COALESCE((preferences->>'new_member_welcome')::boolean, true),
      COALESCE((preferences->>'challenge_updates')::boolean, true),
      COALESCE((preferences->>'running_tips')::boolean, true),
      COALESCE((preferences->>'weather_updates')::boolean, true),
      COALESCE((preferences->>'training_plans')::boolean, false),
      COALESCE((preferences->>'payment_reminders')::boolean, true),
      COALESCE((preferences->>'admin_new_user_alerts')::boolean, true),
      COALESCE((preferences->>'system_notifications')::boolean, true),
      COALESCE((preferences->>'product_updates')::boolean, false),
      COALESCE((preferences->>'newsletter')::boolean, false),
      COALESCE((preferences->>'all_emails')::boolean, true),
      COALESCE((preferences->>'promotional_emails')::boolean, false)
    );
  END IF;
  
  -- Return updated preferences
  SELECT row_to_json(ep)::jsonb INTO result
  FROM public.email_preferences ep
  WHERE user_id = user_id_val;
  
  RETURN result;
END;
$$;

-- Function to create default email preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_email_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.email_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to create email preferences when user profile is created
DROP TRIGGER IF EXISTS create_email_preferences_on_profile_creation ON public.profiles;
CREATE TRIGGER create_email_preferences_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_email_preferences();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_email_preferences(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_email_preferences(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_default_email_preferences() TO authenticated;

-- Grant table permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.email_preferences TO authenticated;
GRANT ALL ON public.email_templates TO authenticated;
GRANT ALL ON public.email_campaigns TO authenticated;
GRANT ALL ON public.email_queue TO authenticated;

-- Insert email templates
INSERT INTO public.email_templates (template_key, template_type, subject_template, html_template, text_template, trigger_conditions, send_delay_hours, max_sends_per_user, cooldown_hours) VALUES

-- Streak Reminder Template
('streak_reminder_3_days', 'streak_reminder', 
'🔥 Don''t let your {{streak_length}}-day streak die!', 
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Keep Your Streak Alive!</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔥 STREAK ALERT! 🔥</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hey {{name}},</p>
    
    <p>Your <strong>{{streak_length}}-day running streak</strong> is in danger! 😱</p>
    
    <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin: 0 0 10px 0; color: #dc2626;">⏰ Time is Running Out!</h3>
      <p style="margin: 0; font-size: 16px;">You haven''t logged any activity today. Don''t let all that hard work go to waste!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}/group/{{group_id}}" 
         style="background: #dc2626; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
        🏃‍♀️ Log Your Run Now!
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      Remember: Champions aren''t made in the gym. They''re made from something deep inside them - a desire, a dream, a vision. 💪
    </p>
  </div>
</body>
</html>',
'Your {{streak_length}}-day running streak is in danger! Don''t let all that hard work go to waste. Log your run now: {{app_url}}/group/{{group_id}}',
'{"min_streak": 3, "hours_since_last_activity": 20}', 4, 1, 24),

-- Daily motivation template
('daily_motivation_new', 'daily_motivation',
'🌟 Ready to start day {{streak_length}} of your journey?',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Daily Motivation</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🌟 Daily Motivation</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Good morning {{name}}! 🌅</p>
    
    <div style="background: #ddd6fe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0 0 10px 0; color: #5b21b6;">Today''s Inspiration</h2>
      <p style="font-size: 18px; font-style: italic; margin: 0; color: #6d28d9;">"The miracle isn''t that I finished. The miracle is that I had the courage to start." - John Bingham</p>
    </div>
    
    <p>Every step counts, every mile matters. Today is another chance to:</p>
    <ul style="padding-left: 20px;">
      <li>💪 Build your strength</li>
      <li>🧠 Clear your mind</li>
      <li>❤️ Boost your mood</li>
      <li>🏆 Inch closer to your goals</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}/group/{{group_id}}" 
         style="background: #5b21b6; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        Let''s Do This! 🏃‍♂️
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Your RunPool team believes in you! 🌟
    </p>
  </div>
</body>
</html>',
'Good morning {{name}}! Ready for another great day of running? Today''s inspiration: "The miracle isn''t that I finished. The miracle is that I had the courage to start." Log your run: {{app_url}}/group/{{group_id}}',
'{"max_streak": 7}', 12, 1, 24),

-- Weekly achievement template
('weekly_achievement', 'achievement_celebration',
'🏆 You crushed this week! {{total_miles}} miles logged!',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Weekly Achievement!</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🏆 ACHIEVEMENT UNLOCKED! 🏆</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Incredible work, {{name}}! 🎉</p>
    
    <div style="background: #fef3c7; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #f59e0b;">
      <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 24px;">This Week''s Stats</h2>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0;">
        <div>
          <div style="font-size: 32px; font-weight: bold; color: #92400e;">{{total_miles}}</div>
          <div style="color: #92400e;">Miles Logged</div>
        </div>
        <div>
          <div style="font-size: 32px; font-weight: bold; color: #92400e;">{{days_active}}</div>
          <div style="color: #92400e;">Days Active</div>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}/group/{{group_id}}" 
         style="background: #10b981; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        View Your Progress 📈
      </a>
    </div>
  </div>
</body>
</html>',
'Amazing work this week {{name}}! You logged {{total_miles}} miles this week. Keep it up! {{app_url}}/group/{{group_id}}',
'{"trigger": "weekly_summary"}', 0, 1, 168)

ON CONFLICT (template_key) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Email campaign system setup complete!';
  RAISE NOTICE '📧 Created email templates, preferences, and tracking tables';
  RAISE NOTICE '🚀 Next: Go to /setup-database to create templates or /test-email-campaigns to test';
END $$;