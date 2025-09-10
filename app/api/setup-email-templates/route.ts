import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Check if templates already exist and get detailed error info
    const { data: existingTemplates, error: checkError } = await supabase
      .from('email_templates')
      .select('template_key')
      .limit(1);

    if (checkError) {
      return NextResponse.json({ 
        error: 'Database table error',
        detailed_error: checkError.message,
        code: checkError.code,
        instructions: 'This likely means the email_templates table does not exist yet. You need to run the database migrations first.',
        migrations_needed: [
          'supabase/migrations/20241210000001_email_campaigns.sql',
          'supabase/migrations/20241210000002_email_templates.sql',
          'supabase/migrations/20241210000003_automated_email_triggers.sql'
        ],
        next_steps: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and run each migration file contents',
          '4. Then try this setup again'
        ]
      }, { status: 400 });
    }

    if (existingTemplates && existingTemplates.length > 0) {
      return NextResponse.json({ 
        message: 'Email templates already exist',
        count: existingTemplates.length
      });
    }

    // Insert the email templates
    const templates = [
      {
        template_key: 'streak_reminder_3_days',
        template_type: 'streak_reminder',
        subject_template: '🔥 Don\'t let your {{streak_length}}-day streak die!',
        html_template: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Keep Your Streak Alive!</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🔥 STREAK ALERT! 🔥</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Hey {{name}},</p>
    
    <p>Your <strong>{{streak_length}}-day running streak</strong> is in danger! 😱</p>
    
    <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <h3 style="margin: 0 0 10px 0; color: #dc2626;">⏰ Time is Running Out!</h3>
      <p style="margin: 0; font-size: 16px;">You haven't logged any activity today. Don't let all that hard work go to waste!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}/group/{{group_id}}" 
         style="background: #dc2626; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block; font-size: 16px;">
        🏃‍♀️ Log Your Run Now!
      </a>
    </div>
    
    <p style="font-size: 14px; color: #6b7280;">
      Remember: Champions aren't made in the gym. They're made from something deep inside them - a desire, a dream, a vision. 💪
    </p>
  </div>
</body>
</html>`,
        text_template: 'Your {{streak_length}}-day running streak is in danger! Don\'t let all that hard work go to waste. Log your run now: {{app_url}}/group/{{group_id}}',
        trigger_conditions: JSON.stringify({ min_streak: 3, hours_since_last_activity: 20 }),
        send_delay_hours: 4,
        max_sends_per_user: 1,
        cooldown_hours: 24,
        is_active: true
      },
      {
        template_key: 'daily_motivation_new',
        template_type: 'daily_motivation',
        subject_template: '🌟 Ready to start day {{streak_length}} of your journey?',
        html_template: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Daily Motivation</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🌟 Daily Motivation</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Good morning {{name}}! 🌅</p>
    
    <div style="background: #ddd6fe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <h2 style="margin: 0 0 10px 0; color: #5b21b6;">Today's Inspiration</h2>
      <p style="font-size: 18px; font-style: italic; margin: 0; color: #6d28d9;">"The miracle isn't that I finished. The miracle is that I had the courage to start." - John Bingham</p>
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
        Let's Do This! 🏃‍♂️
      </a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      Your RunPool team believes in you! 🌟
    </p>
  </div>
</body>
</html>`,
        text_template: 'Good morning {{name}}! Ready for another great day of running? Today\'s inspiration: "The miracle isn\'t that I finished. The miracle is that I had the courage to start." Log your run: {{app_url}}/group/{{group_id}}',
        trigger_conditions: JSON.stringify({ max_streak: 7 }),
        send_delay_hours: 12,
        max_sends_per_user: 1,
        cooldown_hours: 24,
        is_active: true
      },
      {
        template_key: 'weekly_achievement',
        template_type: 'achievement_celebration',
        subject_template: '🏆 You crushed this week! {{total_miles}} miles logged!',
        html_template: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Weekly Achievement!</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: #8B4513; margin: 0; font-size: 28px;">🏆 ACHIEVEMENT UNLOCKED! 🏆</h1>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <p style="font-size: 18px; margin-bottom: 20px;">Incredible work, {{name}}! 🎉</p>
    
    <div style="background: #fef3c7; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #f59e0b;">
      <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 24px;">This Week's Stats</h2>
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
    
    <p>You're setting an amazing example for your group! Keep up the fantastic work. 💪</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{app_url}}/group/{{group_id}}" 
         style="background: #10b981; color: white; padding: 15px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
        View Your Progress 📈
      </a>
    </div>
  </div>
</body>
</html>`,
        text_template: 'Amazing work this week {{name}}! You logged {{total_miles}} miles and maintained your {{streak_length}}-day streak. Keep it up! {{app_url}}/group/{{group_id}}',
        trigger_conditions: JSON.stringify({ trigger: 'weekly_summary' }),
        send_delay_hours: 0,
        max_sends_per_user: 1,
        cooldown_hours: 168,
        is_active: true
      }
    ];

    const { data, error } = await supabase
      .from('email_templates')
      .insert(templates);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email templates inserted successfully!',
      templates_created: templates.length
    });

  } catch (error) {
    console.error('Setup email templates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}