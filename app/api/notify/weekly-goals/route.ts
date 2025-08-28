// app/api/notify/weekly-goals/route.ts
// End-of-week reminder emails for users who haven't met their weekly goals
// Can be triggered by cron job or manually

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function required(name: string, v: string | undefined | null): string {
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function siteOriginFrom(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) return envUrl.replace(/\/$/, '');
  try {
    return new URL(req.url).origin;
  } catch {
    return 'http://localhost:3000';
  }
}

async function sendResendEmail(to: string[], subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    return { ok: false, error: 'Missing RESEND_API_KEY or RESEND_FROM env' };
  }

  const results = await Promise.allSettled(
    to.map(async (rcpt) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to: [rcpt], subject, html }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    })
  );
  
  const failed = results.filter(r => r.status === 'rejected');
  return { ok: failed.length === 0, data: results, failed: failed.length };
}

function weeklyGoalReminderHtml(
  userName: string,
  groupName: string,
  currentMiles: number,
  goalMiles: number,
  timeLeft: string,
  groupUrl: string
): string {
  const milesNeeded = Math.max(0, goalMiles - currentMiles);
  const progressPercent = Math.min(100, (currentMiles / goalMiles) * 100);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⏰ Weekly Goal Reminder - Runpool</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <!-- Main Card -->
        <div style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #0f766e 0%, #065f46 100%); color: white; text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 12px;">⏰</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              Almost there, ${userName}!
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              ${groupName} &bull; ${timeLeft} left this week
            </p>
          </div>

          <!-- Progress Section -->
          <div style="padding: 32px;">
            
            <!-- Progress Card -->
            <div style="background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); border-radius: 20px; padding: 28px; margin-bottom: 32px; border: 2px solid #14b8a6;">
              <h3 style="color: #134e4a; font-size: 20px; font-weight: 700; margin: 0 0 20px 0; text-align: center;">
                Your Weekly Progress 📈
              </h3>
              
              <!-- Miles Display -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="text-align: left;">
                  <div style="color: #0f766e; font-size: 14px; font-weight: 500;">Current</div>
                  <div style="color: #134e4a; font-size: 24px; font-weight: 800;">${currentMiles.toFixed(1)} miles</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: #0f766e; font-size: 14px; font-weight: 500;">Goal</div>
                  <div style="color: #134e4a; font-size: 24px; font-weight: 800;">${goalMiles.toFixed(1)} miles</div>
                </div>
              </div>
              
              <!-- Progress Bar -->
              <div style="width: 100%; height: 16px; background-color: #e6fffa; border-radius: 8px; overflow: hidden; margin-bottom: 20px; border: 1px solid #a7f3d0;">
                <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #14b8a6 0%, #0d9488 100%); border-radius: 8px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);"></div>
              </div>
              
              <!-- Status Message -->
              <div style="text-align: center; padding: 16px; border-radius: 12px; ${milesNeeded > 0 ? 'background: #fef3c7; border: 1px solid #f59e0b;' : 'background: #dcfce7; border: 1px solid #22c55e;'}">
                ${milesNeeded > 0 ? 
                  `<div style="color: #92400e; font-weight: 700; font-size: 20px;">Only ${milesNeeded.toFixed(1)} miles to go! 🏃‍♂️</div>
                   <div style="color: #a16207; font-size: 14px; margin-top: 4px;">You are ${progressPercent.toFixed(0)}% of the way there!</div>` : 
                  `<div style="color: #15803d; font-weight: 700; font-size: 20px;">Goal achieved! Keep it up! 🎉</div>
                   <div style="color: #166534; font-size: 14px; margin-top: 4px;">You have exceeded your target!</div>`
                }
              </div>
            </div>

            <!-- Motivation Section -->
            <div style="background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #a855f7;">
              <h3 style="color: #7c3aed; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                Every Mile Counts! 💪
              </h3>
              <p style="color: #6b21a8; font-size: 16px; margin: 0; line-height: 1.5;">
                ${milesNeeded > 0 
                  ? `You are so close to reaching your goal! Just ${milesNeeded.toFixed(1)} more miles to go.`
                  : 'Congratulations on achieving your weekly goal! Consider setting a stretch target.'
                }
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${groupUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 18px 36px; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4); text-transform: uppercase; letter-spacing: 0.025em;">
                Log Your Miles 🏃
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; text-align: center; padding: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Keep up the great work! Every mile counts. 🌟
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              <a href="/settings" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Update preferences</a> &bull; 
              <a href="${groupUrl}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">View group</a>
            </p>
          </div>

        </div>
        
        <!-- Email Footer -->
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">© Runpool • Making every mile count</p>
        </div>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(req: Request) {
  try {
    // Optional protection: if CRON_SECRET is set, require either Authorization: Bearer <secret> or x-cron-secret header
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const auth = req.headers.get('authorization');
      const bearerOk = auth === `Bearer ${cronSecret}`;
      const headerOk = req.headers.get('x-cron-secret') === cronSecret;
      if (!bearerOk && !headerOk) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const url = required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
    const origin = siteOriginFrom(req);

    // Find active challenges that are ending soon (within 24 hours)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const { data: challenges } = await supabase
      .from('challenges')
      .select('id, group_id, week_end, pot')
      .eq('status', 'OPEN')
      .gte('week_end', now.toISOString())
      .lte('week_end', tomorrow.toISOString());

    if (!challenges?.length) {
      return new Response(
        JSON.stringify({ ok: true, message: 'No challenges ending soon', sent: 0 }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    const emailsSent = [];

    for (const challenge of challenges) {
      // Get group name
      const { data: group } = await supabase
        .from('groups')
        .select('name')
        .eq('id', challenge.group_id)
        .single();
      
      const groupName = group?.name || 'Runpool Group';

      // Get all members with their current miles and weekly goals
      const { data: leaderboard } = await supabase
        .from('leaderboard_week')
        .select('user_id, name, miles')
        .eq('challenge_id', challenge.id);

      if (!leaderboard?.length) continue;

      for (const member of leaderboard) {
        // Get user's weekly goal (default to average of group if not set)
        const { data: weeklyGoal } = await supabase
          .from('weekly_goals')
          .select('target_miles')
          .eq('user_id', member.user_id)
          .eq('challenge_id', challenge.id)
          .maybeSingle();

        let goalMiles = weeklyGoal?.target_miles || 0;
        
        // If no personal goal, use group average or default to 10 miles
        if (goalMiles === 0) {
          const avgMiles = leaderboard.reduce((sum, m) => sum + (Number(m.miles) || 0), 0) / leaderboard.length;
          goalMiles = Math.max(avgMiles || 10, 5); // Minimum 5 miles goal
        }

        const currentMiles = Number(member.miles) || 0;
        
        // Only send reminders to users who haven't reached their goal
        if (currentMiles >= goalMiles) continue;

        // Check email preferences
        const { data: prefs } = await supabase
          .rpc('get_user_email_preferences', { target_user_id: member.user_id })
          .single();
        
        if (!prefs?.weekly_goal_reminders) continue;

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);
        const email = userData.user?.email;
        if (!email) continue;

        const timeLeft = new Date(challenge.week_end).getTime() > Date.now() + 12 * 60 * 60 * 1000 
          ? 'Less than 24 hours' 
          : 'Just a few hours';

        const userName = member.name || email.split('@')[0] || 'Runner';
        const groupUrl = `${origin}/group/${challenge.group_id}`;
        
        const subject = `${groupName} • Time's running out! Complete your weekly goal`;
        const html = weeklyGoalReminderHtml(userName, groupName, currentMiles, goalMiles, timeLeft, groupUrl);
        
        const sendRes = await sendResendEmail([email], subject, html);
        emailsSent.push({
          user_id: member.user_id,
          email,
          sent: sendRes.ok,
          error: sendRes.ok ? null : sendRes.error
        });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      challenges_checked: challenges.length,
      emails_sent: emailsSent.filter(e => e.sent).length,
      emails_failed: emailsSent.filter(e => !e.sent).length,
      details: emailsSent
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    });
  }
}

export async function GET(req: Request) {
  return POST(req);
}