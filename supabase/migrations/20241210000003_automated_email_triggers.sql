-- Automated email triggers and scheduling functions

-- Function to check and send streak reminder emails
CREATE OR REPLACE FUNCTION public.check_and_send_streak_reminders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_count INTEGER := 0;
  user_record RECORD;
  campaign_result JSONB;
BEGIN
  -- Find users who have an active streak (3+ days) but haven't logged activity today
  FOR user_record IN
    SELECT 
      p.id,
      p.email,
      p.full_name,
      us.current_streak,
      us.last_activity_date
    FROM public.profiles p
    JOIN public.user_streaks us ON p.id = us.user_id
    JOIN public.email_preferences ep ON p.id = ep.user_id
    WHERE 
      us.current_streak >= 3
      AND us.last_activity_date < CURRENT_DATE
      AND ep.all_emails = true
      AND ep.streak_reminders = true
      -- Don't send if we've already sent a streak reminder today
      AND NOT EXISTS (
        SELECT 1 FROM public.email_campaigns ec
        WHERE ec.recipient_id = p.id
        AND ec.campaign_type = 'streak_reminder'
        AND ec.sent_at >= CURRENT_DATE
      )
  LOOP
    -- Queue streak reminder email
    PERFORM public.queue_email(
      user_record.id,
      'streak_reminder_3_days',
      jsonb_build_object(
        'name', COALESCE(user_record.full_name, split_part(user_record.email, '@', 1)),
        'streak_length', user_record.current_streak
      )
    );
    
    reminder_count := reminder_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'streak_reminders_queued', reminder_count,
    'timestamp', NOW()
  );
END;
$$;

-- Function to check and send daily motivation emails
CREATE OR REPLACE FUNCTION public.check_and_send_daily_motivation()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  motivation_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Find users who are active but have a short streak (good for motivation)
  FOR user_record IN
    SELECT 
      p.id,
      p.email,
      p.full_name,
      us.current_streak
    FROM public.profiles p
    JOIN public.user_streaks us ON p.id = us.user_id
    JOIN public.email_preferences ep ON p.id = ep.user_id
    WHERE 
      us.current_streak BETWEEN 1 AND 7
      AND ep.all_emails = true
      AND ep.daily_motivation = true
      -- Only send motivation emails in the morning (adjust timezone as needed)
      AND EXTRACT(HOUR FROM NOW()) BETWEEN 7 AND 10
      -- Don't send if we've already sent a motivation email today
      AND NOT EXISTS (
        SELECT 1 FROM public.email_campaigns ec
        WHERE ec.recipient_id = p.id
        AND ec.campaign_type = 'daily_motivation'
        AND ec.sent_at >= CURRENT_DATE
      )
  LOOP
    -- Queue daily motivation email
    PERFORM public.queue_email(
      user_record.id,
      'daily_motivation_new',
      jsonb_build_object(
        'name', COALESCE(user_record.full_name, split_part(user_record.email, '@', 1)),
        'streak_length', user_record.current_streak
      )
    );
    
    motivation_count := motivation_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'motivation_emails_queued', motivation_count,
    'timestamp', NOW()
  );
END;
$$;

-- Function to check and send comeback encouragement emails
CREATE OR REPLACE FUNCTION public.check_and_send_comeback_emails()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  comeback_count INTEGER := 0;
  user_record RECORD;
  days_inactive INTEGER;
BEGIN
  -- Find users who have been inactive for 3+ days
  FOR user_record IN
    SELECT 
      p.id,
      p.email,
      p.full_name,
      us.last_activity_date,
      EXTRACT(DAYS FROM (CURRENT_DATE - us.last_activity_date))::INTEGER AS days_since_activity
    FROM public.profiles p
    JOIN public.user_streaks us ON p.id = us.user_id
    JOIN public.email_preferences ep ON p.id = ep.user_id
    WHERE 
      us.last_activity_date < CURRENT_DATE - INTERVAL '3 days'
      AND ep.all_emails = true
      AND ep.comeback_encouragement = true
      -- Don't send comeback emails too frequently (max once per week)
      AND NOT EXISTS (
        SELECT 1 FROM public.email_campaigns ec
        WHERE ec.recipient_id = p.id
        AND ec.campaign_type = 'comeback_encouragement'
        AND ec.sent_at >= CURRENT_DATE - INTERVAL '7 days'
      )
  LOOP
    days_inactive := EXTRACT(DAYS FROM (CURRENT_DATE - user_record.last_activity_date))::INTEGER;
    
    -- Queue comeback encouragement email
    PERFORM public.queue_email(
      user_record.id,
      'comeback_encouragement',
      jsonb_build_object(
        'name', COALESCE(user_record.full_name, split_part(user_record.email, '@', 1)),
        'days_inactive', days_inactive,
        'group_name', 'Your Running Group' -- Could be enhanced to get actual group name
      )
    );
    
    comeback_count := comeback_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'comeback_emails_queued', comeback_count,
    'timestamp', NOW()
  );
END;
$$;

-- Function to send weekly achievement emails
CREATE OR REPLACE FUNCTION public.check_and_send_weekly_achievements()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  achievement_count INTEGER := 0;
  user_record RECORD;
  weekly_miles DECIMAL;
  weekly_days INTEGER;
BEGIN
  -- Only run on Monday mornings for the previous week
  IF EXTRACT(DOW FROM NOW()) = 1 AND EXTRACT(HOUR FROM NOW()) BETWEEN 8 AND 11 THEN
    FOR user_record IN
      SELECT 
        p.id,
        p.email,
        p.full_name,
        us.current_streak
      FROM public.profiles p
      JOIN public.user_streaks us ON p.id = us.user_id
      JOIN public.email_preferences ep ON p.id = ep.user_id
      WHERE 
        ep.all_emails = true
        AND ep.achievement_celebrations = true
        -- Don't send if we've already sent this week
        AND NOT EXISTS (
          SELECT 1 FROM public.email_campaigns ec
          WHERE ec.recipient_id = p.id
          AND ec.campaign_type = 'achievement_celebration'
          AND ec.sent_at >= DATE_TRUNC('week', CURRENT_DATE)
        )
    LOOP
      -- Calculate weekly stats (this is simplified - you'd want to join with actual activity data)
      SELECT 
        COALESCE(SUM(miles), 0),
        COUNT(DISTINCT activity_date)
      INTO weekly_miles, weekly_days
      FROM public.daily_activities da
      WHERE da.user_id = user_record.id
        AND da.activity_date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week')
        AND da.activity_date < DATE_TRUNC('week', CURRENT_DATE);
      
      -- Only send if they had some activity
      IF weekly_miles > 0 THEN
        PERFORM public.queue_email(
          user_record.id,
          'weekly_achievement',
          jsonb_build_object(
            'name', COALESCE(user_record.full_name, split_part(user_record.email, '@', 1)),
            'total_miles', weekly_miles,
            'days_active', weekly_days,
            'streak_length', user_record.current_streak
          )
        );
        
        achievement_count := achievement_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'achievement_emails_queued', achievement_count,
    'timestamp', NOW()
  );
END;
$$;

-- Function to send Monday running tips
CREATE OR REPLACE FUNCTION public.check_and_send_running_tips()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tips_count INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Only run on Monday mornings
  IF EXTRACT(DOW FROM NOW()) = 1 AND EXTRACT(HOUR FROM NOW()) BETWEEN 9 AND 11 THEN
    FOR user_record IN
      SELECT 
        p.id,
        p.email,
        p.full_name
      FROM public.profiles p
      JOIN public.email_preferences ep ON p.id = ep.user_id
      WHERE 
        ep.all_emails = true
        AND ep.running_tips = true
        -- Don't send if we've already sent this week
        AND NOT EXISTS (
          SELECT 1 FROM public.email_campaigns ec
          WHERE ec.recipient_id = p.id
          AND ec.campaign_type = 'running_tips'
          AND ec.sent_at >= DATE_TRUNC('week', CURRENT_DATE)
        )
    LOOP
      PERFORM public.queue_email(
        user_record.id,
        'running_tip_monday',
        jsonb_build_object(
          'name', COALESCE(user_record.full_name, split_part(user_record.email, '@', 1))
        )
      );
      
      tips_count := tips_count + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'running_tips_queued', tips_count,
    'timestamp', NOW()
  );
END;
$$;

-- Master function to run all email checks
CREATE OR REPLACE FUNCTION public.run_automated_email_campaigns()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak_result JSONB;
  motivation_result JSONB;
  comeback_result JSONB;
  achievement_result JSONB;
  tips_result JSONB;
BEGIN
  -- Run all email campaign checks
  SELECT public.check_and_send_streak_reminders() INTO streak_result;
  SELECT public.check_and_send_daily_motivation() INTO motivation_result;
  SELECT public.check_and_send_comeback_emails() INTO comeback_result;
  SELECT public.check_and_send_weekly_achievements() INTO achievement_result;
  SELECT public.check_and_send_running_tips() INTO tips_result;

  RETURN jsonb_build_object(
    'streak_reminders', streak_result,
    'daily_motivation', motivation_result,
    'comeback_encouragement', comeback_result,
    'weekly_achievements', achievement_result,
    'running_tips', tips_result,
    'executed_at', NOW()
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_and_send_streak_reminders() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_send_daily_motivation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_send_comeback_emails() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_send_weekly_achievements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_send_running_tips() TO authenticated;
GRANT EXECUTE ON FUNCTION public.run_automated_email_campaigns() TO authenticated;