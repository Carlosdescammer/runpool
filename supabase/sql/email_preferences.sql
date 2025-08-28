-- Email preferences system for user notification opt-in/opt-out
-- Users can control which types of emails they receive

-- Create email preferences table
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  -- Email notification types
  weekly_goal_reminders boolean DEFAULT true, -- End-of-week reminders when behind on goals
  top_performer_alerts boolean DEFAULT true,  -- When user enters top ranks
  admin_new_user_alerts boolean DEFAULT true, -- For admins when new users join (only sent to admins)
  top_three_milestone boolean DEFAULT true,   -- When top 3 users add miles
  proof_notifications boolean DEFAULT true,   -- Existing proof notifications (when others log miles)
  weekly_recap boolean DEFAULT true,          -- Weekly recap emails
  invite_notifications boolean DEFAULT true,  -- Invite-related emails
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own email preferences" 
ON public.email_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences" 
ON public.email_preferences FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences" 
ON public.email_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Function to get user email preferences with defaults
CREATE OR REPLACE FUNCTION get_user_email_preferences(target_user_id uuid)
RETURNS TABLE (
  weekly_goal_reminders boolean,
  top_performer_alerts boolean,
  admin_new_user_alerts boolean,
  top_three_milestone boolean,
  proof_notifications boolean,
  weekly_recap boolean,
  invite_notifications boolean
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ep.weekly_goal_reminders, true),
    COALESCE(ep.top_performer_alerts, true),
    COALESCE(ep.admin_new_user_alerts, true),
    COALESCE(ep.top_three_milestone, true),
    COALESCE(ep.proof_notifications, true),
    COALESCE(ep.weekly_recap, true),
    COALESCE(ep.invite_notifications, true)
  FROM (SELECT target_user_id as user_id) u
  LEFT JOIN public.email_preferences ep ON ep.user_id = u.user_id;
END;
$$;

-- Function to upsert email preferences
CREATE OR REPLACE FUNCTION upsert_user_email_preferences(
  target_user_id uuid,
  weekly_goal_reminders boolean DEFAULT true,
  top_performer_alerts boolean DEFAULT true,
  admin_new_user_alerts boolean DEFAULT true,
  top_three_milestone boolean DEFAULT true,
  proof_notifications boolean DEFAULT true,
  weekly_recap boolean DEFAULT true,
  invite_notifications boolean DEFAULT true
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.email_preferences (
    user_id,
    weekly_goal_reminders,
    top_performer_alerts,
    admin_new_user_alerts,
    top_three_milestone,
    proof_notifications,
    weekly_recap,
    invite_notifications
  ) VALUES (
    target_user_id,
    weekly_goal_reminders,
    top_performer_alerts,
    admin_new_user_alerts,
    top_three_milestone,
    proof_notifications,
    weekly_recap,
    invite_notifications
  )
  ON CONFLICT (user_id) DO UPDATE SET
    weekly_goal_reminders = EXCLUDED.weekly_goal_reminders,
    top_performer_alerts = EXCLUDED.top_performer_alerts,
    admin_new_user_alerts = EXCLUDED.admin_new_user_alerts,
    top_three_milestone = EXCLUDED.top_three_milestone,
    proof_notifications = EXCLUDED.proof_notifications,
    weekly_recap = EXCLUDED.weekly_recap,
    invite_notifications = EXCLUDED.invite_notifications,
    updated_at = now();
END;
$$;

-- Create weekly goal tracking table for reminders
CREATE TABLE IF NOT EXISTS public.weekly_goals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
  target_miles decimal DEFAULT 0, -- User's personal weekly goal
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS for weekly goals
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly goals
CREATE POLICY "Users can view own weekly goals" 
ON public.weekly_goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own weekly goals" 
ON public.weekly_goals FOR ALL 
USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON public.email_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_challenge ON public.weekly_goals(user_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_challenge ON public.weekly_goals(challenge_id);