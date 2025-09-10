-- Migration to add email campaign system with preferences and tracking

-- Email preferences for different types of campaigns
CREATE TABLE public.email_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Engagement & Motivation Emails
  streak_reminders BOOLEAN DEFAULT true, -- "Don't break your streak!"
  daily_motivation BOOLEAN DEFAULT true, -- Daily motivational messages
  weekly_recap BOOLEAN DEFAULT true, -- Weekly group performance recap
  achievement_celebrations BOOLEAN DEFAULT true, -- Celebrate milestones
  comeback_encouragement BOOLEAN DEFAULT true, -- "We miss you" emails
  
  -- Group & Social Emails  
  group_activity_updates BOOLEAN DEFAULT true, -- When others in group are active
  new_member_welcome BOOLEAN DEFAULT true, -- New group member notifications
  challenge_updates BOOLEAN DEFAULT true, -- Weekly challenge updates
  
  -- Tips & Content
  running_tips BOOLEAN DEFAULT true, -- Weekly running tips
  weather_updates BOOLEAN DEFAULT true, -- "Perfect day to run" emails
  training_plans BOOLEAN DEFAULT false, -- Structured training recommendations
  
  -- Admin & System
  payment_reminders BOOLEAN DEFAULT true, -- Already exists
  admin_new_user_alerts BOOLEAN DEFAULT true, -- Already exists
  system_notifications BOOLEAN DEFAULT true, -- Important system updates
  
  -- Marketing (opt-in only)
  product_updates BOOLEAN DEFAULT false, -- New features, etc.
  newsletter BOOLEAN DEFAULT false, -- Monthly newsletter
  
  -- Master controls
  all_emails BOOLEAN DEFAULT true, -- Master on/off switch
  promotional_emails BOOLEAN DEFAULT false, -- All promotional content
  
  -- Metadata
  opted_in_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email campaign tracking
CREATE TABLE public.email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_type TEXT NOT NULL, -- 'streak_reminder', 'daily_motivation', etc.
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  
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
  email_provider TEXT, -- 'resend', 'sendgrid', etc.
  provider_message_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'bounced', 'opened', 'clicked', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates storage
CREATE TABLE public.email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  template_key TEXT NOT NULL UNIQUE, -- 'streak_reminder_3_days', etc.
  template_type TEXT NOT NULL, -- 'streak_reminder', 'motivation', etc.
  
  -- Content
  subject_template TEXT NOT NULL, -- Can include {{variables}}
  html_template TEXT NOT NULL,
  text_template TEXT,
  
  -- Targeting
  trigger_conditions JSONB DEFAULT '{}', -- When to send this template
  target_audience TEXT, -- 'all', 'new_users', 'inactive', etc.
  
  -- Scheduling
  send_delay_hours INTEGER DEFAULT 0, -- Hours after trigger event
  max_sends_per_user INTEGER DEFAULT 1, -- Per time period
  cooldown_hours INTEGER DEFAULT 24, -- Minimum time between same type
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1, -- Higher priority templates sent first
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email queue for scheduled sending
CREATE TABLE public.email_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
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
CREATE INDEX idx_email_preferences_user_id ON public.email_preferences(user_id);
CREATE INDEX idx_email_campaigns_recipient ON public.email_campaigns(recipient_id);
CREATE INDEX idx_email_campaigns_type ON public.email_campaigns(campaign_type);
CREATE INDEX idx_email_campaigns_sent_at ON public.email_campaigns(sent_at);
CREATE INDEX idx_email_templates_key ON public.email_templates(template_key);
CREATE INDEX idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX idx_email_queue_scheduled ON public.email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_email_queue_user_id ON public.email_queue(user_id);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their email preferences"
  ON public.email_preferences FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their email campaigns"
  ON public.email_campaigns FOR SELECT
  USING (auth.uid() = recipient_id);

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

-- Trigger to create email preferences when user profile is created
CREATE TRIGGER create_email_preferences_on_profile_creation
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_email_preferences();

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
CREATE OR REPLACE FUNCTION public.update_user_email_preferences(
  preferences JSONB
)
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
  
  -- Return updated preferences
  SELECT row_to_json(ep)::jsonb INTO result
  FROM public.email_preferences ep
  WHERE user_id = user_id_val;
  
  RETURN result;
END;
$$;

-- Function to queue an email
CREATE OR REPLACE FUNCTION public.queue_email(
  target_user_id UUID,
  template_key_param TEXT,
  template_vars JSONB DEFAULT '{}',
  send_delay_hours INTEGER DEFAULT 0,
  priority_override INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record RECORD;
  queue_id UUID;
  send_time TIMESTAMPTZ;
BEGIN
  -- Get template
  SELECT * INTO template_record
  FROM public.email_templates
  WHERE template_key = template_key_param AND is_active = true;
  
  IF template_record IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', template_key_param;
  END IF;
  
  -- Calculate send time
  send_time := NOW() + (COALESCE(send_delay_hours, template_record.send_delay_hours) * INTERVAL '1 hour');
  
  -- Insert into queue
  INSERT INTO public.email_queue (
    user_id,
    template_id,
    scheduled_for,
    priority,
    template_variables
  ) VALUES (
    target_user_id,
    template_record.id,
    send_time,
    COALESCE(priority_override, template_record.priority),
    template_vars
  ) RETURNING id INTO queue_id;
  
  RETURN queue_id;
END;
$$;

-- Add triggers
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();