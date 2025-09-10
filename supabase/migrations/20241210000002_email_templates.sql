-- Insert motivational email templates

-- Streak Reminder Templates
INSERT INTO public.email_templates (template_key, template_type, subject_template, html_template, text_template, trigger_conditions, send_delay_hours, max_sends_per_user, cooldown_hours) VALUES

-- 3-day streak at risk
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
    
    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;">
        💡 <strong>Quick Tip:</strong> Even a 10-minute walk counts! Don''t let perfectionism break your momentum.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      Remember: Champions aren''t made in the gym. They''re made from something deep inside them - a desire, a dream, a vision. 💪
    </p>
  </div>
</body>
</html>',
'Your {{streak_length}}-day running streak is in danger! Don''t let all that hard work go to waste. Log your run now: {{app_url}}/group/{{group_id}}',
'{"min_streak": 3, "hours_since_last_activity": 20}', 4, 1, 24),

-- Daily motivation for new streaks
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

-- Weekly achievement celebration
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
      <div style="margin-top: 15px; font-size: 16px; color: #92400e;">
        🔥 {{streak_length}}-day streak maintained!
      </div>
    </div>
    
    <p>You''re setting an amazing example for your group! Keep up the fantastic work. 💪</p>
    
    <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
      <h3 style="margin: 0 0 10px 0; color: #065f46;">Next Week''s Challenge</h3>
      <p style="margin: 0; color: #065f46;">Can you beat this week''s performance? We believe you can! 🚀</p>
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
'Amazing work this week {{name}}! You logged {{total_miles}} miles and maintained your {{streak_length}}-day streak. Keep it up! {{app_url}}/group/{{group_id}}',
'{"trigger": "weekly_summary"}', 0, 1, 168),

-- Comeback encouragement (3+ days inactive)
('comeback_encouragement', 'comeback_encouragement',
'We miss you! Your group is cheering for your return 👥',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Come Back Strong!</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">👥 Your Team Misses You!</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hey {{name}},</p>
    
    <p>It''s been {{days_inactive}} days since we''ve seen you in <strong>{{group_name}}</strong>, and your teammates are asking about you! 💜</p>
    
    <div style="background: #f3e8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
      <h3 style="margin: 0 0 15px 0; color: #6b21b6;">What You''ve Missed:</h3>
      <ul style="color: #6b21b6; margin: 0; padding-left: 20px;">
        <li>{{recent_activity_1}}</li>
        <li>{{recent_activity_2}}</li>
        <li>The group logged {{group_total_miles}} miles this week!</li>
      </ul>
    </div>
    
    <p>Life gets busy - we totally get it! But remember:</p>
    <blockquote style="border-left: 4px solid #8b5cf6; padding-left: 20px; margin: 20px 0; font-style: italic; color: #6b21b6;">
      "You don''t have to be great to get started, but you have to get started to be great."
    </blockquote>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}/group/{{group_id}}" 
         style="background: #8b5cf6; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
        🏃‍♀️ Make Your Comeback!
      </a>
    </div>
    
    <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        💡 <strong>Restart Tip:</strong> Start small! Even a 5-minute walk counts. The hardest part is just beginning again.
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Your RunPool family is here to support you! 🏁
    </p>
  </div>
</body>
</html>',
'Hey {{name}}, it''s been {{days_inactive}} days since we''ve seen you! Your team in {{group_name}} misses you. Ready for a comeback? {{app_url}}/group/{{group_id}}',
'{"min_days_inactive": 3}', 0, 1, 72),

-- Daily running tips
('running_tip_monday', 'running_tips',
'💡 Monday Motivation: Start Your Week Strong!',
'<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Monday Running Tip</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">💡 Monday''s Running Tip</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Happy Monday, {{name}}! 🌟</p>
    
    <div style="background: #cffafe; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #06b6d4;">
      <h2 style="margin: 0 0 15px 0; color: #0e7490;">This Week''s Focus: Proper Warm-Up</h2>
      <p style="color: #0e7490; margin-bottom: 15px;">A good warm-up can prevent injuries and improve your performance!</p>
      
      <h3 style="color: #0e7490; margin: 15px 0 10px 0;">5-Minute Dynamic Warm-Up:</h3>
      <ol style="color: #0e7490; padding-left: 20px;">
        <li>30 seconds marching in place</li>
        <li>10 leg swings (each leg)</li>
        <li>10 arm circles (forward & backward)</li>
        <li>10 walking lunges</li>
        <li>30 seconds light jogging</li>
      </ol>
    </div>
    
    <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #0369a1;">💪 Why It Works:</h3>
      <p style="margin: 0; color: #0369a1;">
        Dynamic warm-ups gradually increase your heart rate, improve blood flow to muscles, and prepare your joints for movement. This reduces injury risk by up to 50%!
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}/group/{{group_id}}" 
         style="background: #06b6d4; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        Start Your Week Right! 🏃‍♂️
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      Pro tip: Save this email and reference it before your runs this week! 📌
    </p>
  </div>
</body>
</html>',
'Happy Monday {{name}}! This week''s running tip: Always warm up with 5 minutes of dynamic movements before running. It can reduce injury risk by 50%! Start your week strong: {{app_url}}/group/{{group_id}}',
'{"day_of_week": "monday"}', 0, 1, 168);

-- Insert more template variations for different days and scenarios