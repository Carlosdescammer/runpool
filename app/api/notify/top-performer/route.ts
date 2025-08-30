// app/api/notify/top-performer/route.ts
// Notifies users when they enter top ranks (top 3)
// Triggered when proof is submitted and user enters top ranks

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
  return { ok: failed.length === 0, data: results };
}

function topPerformerHtml(
  userName: string,
  groupName: string,
  currentRank: number,
  miles: number,
  period: string,
  leaderboardUrl: string
): string {
  const rankEmoji = currentRank === 1 ? '🥇' : currentRank === 2 ? '🥈' : '🥉';
  const rankText = currentRank === 1 ? '1st place' : currentRank === 2 ? '2nd place' : '3rd place';
  const rankColor = currentRank === 1 ? '#f59e0b' : currentRank === 2 ? '#6b7280' : '#d97706';
  const bgGradient = currentRank === 1 
    ? 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)' 
    : currentRank === 2 
    ? 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)' 
    : 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏆 Top Performer Alert - Runpool</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <!-- Main Card -->
        <div style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🏆</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              Congratulations, ${userName}!
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              ${groupName} &bull; ${period}
            </p>
          </div>

          <!-- Achievement Banner -->
          <div style="background: ${bgGradient}; padding: 40px 32px; text-align: center;">
            
            <!-- Medal Icon -->
            <div style="font-size: 80px; margin-bottom: 20px; line-height: 1; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">
              ${rankEmoji}
            </div>
            
            <!-- Achievement Text -->
            <h2 style="color: #7c2d12; font-size: 26px; font-weight: 900; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">
              You are in ${rankText}!
            </h2>
            
            <!-- Miles Badge -->
            <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); border-radius: 50px; padding: 12px 24px; margin-top: 8px; border: 2px solid ${rankColor};">
              <div style="color: #451a03; font-size: 20px; font-weight: 700;">
                ${miles.toFixed(1)} miles logged
              </div>
            </div>
          </div>

          <!-- Content Section -->
          <div style="padding: 32px;">
            
            <!-- Motivational Message -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                Amazing Achievement! 🎉
              </h3>
              <p style="color: #0369a1; font-size: 16px; margin: 0; line-height: 1.5;">
                You have climbed into the top 3! Keep up the incredible work and maintain your position on the leaderboard.
              </p>
            </div>

            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Your Rank</div>
                <div style="color: #1e293b; font-size: 24px; font-weight: 800;">#${currentRank}</div>
              </div>
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Miles Logged</div>
                <div style="color: #1e293b; font-size: 24px; font-weight: 800;">${miles.toFixed(1)}</div>
              </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${leaderboardUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3); transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.025em;">
                View Leaderboard 📊
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; text-align: center; padding: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Keep pushing forward and stay at the top! 💪
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              <a href="/settings" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Update preferences</a> &bull; 
              <a href="${leaderboardUrl}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">View group</a>
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
    const url = required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    const anon = required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Auth header required
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      challenge_id?: string;
      user_id?: string;
      miles?: number;
    };

    if (!body.challenge_id || !body.user_id) {
      return new Response(JSON.stringify({ error: 'Missing challenge_id or user_id' }), { 
        status: 400, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    // User-scoped client (RLS enforced)
    const supaUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    
    // Admin client for email lookups
    const supaAdmin = serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;
    
    if (!supaAdmin) {
      return new Response(
        JSON.stringify({ ok: true, email_sent: false, warning: 'Missing SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Get challenge and group info
    const { data: challenge } = await supaUser
      .from('challenges')
      .select('id, group_id, week_start, week_end')
      .eq('id', body.challenge_id)
      .single();

    if (!challenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found' }), { 
        status: 404, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    const { data: group } = await supaUser
      .from('groups')
      .select('name')
      .eq('id', challenge.group_id)
      .single();

    const groupName = group?.name || 'Runpool Group';

    // Get current leaderboard to check if user is in top 3
    const { data: leaderboard } = await supaUser
      .from('leaderboard_week')
      .select('user_id, name, miles')
      .eq('challenge_id', body.challenge_id)
      .order('miles', { ascending: false })
      .limit(5); // Get top 5 to be safe

    if (!leaderboard?.length) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, message: 'No leaderboard data' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Find user's current rank
    const userIndex = leaderboard.findIndex(entry => entry.user_id === body.user_id);
    const currentRank = userIndex + 1;

    // Only notify if user is in top 3
    if (currentRank > 3 || userIndex === -1) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, message: 'User not in top 3' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Check email preferences
    const { data: prefs } = await supaAdmin
      .rpc('get_user_email_preferences', { target_user_id: body.user_id })
      .single();
    
    if (!(prefs as { top_performer_alerts?: boolean })?.top_performer_alerts) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, message: 'User opted out of top performer alerts' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Get user email and name
    const { data: userData } = await supaAdmin.auth.admin.getUserById(body.user_id);
    const email = userData.user?.email;
    if (!email) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, message: 'User email not found' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    const userEntry = leaderboard[userIndex];
    const userName = userEntry.name || email.split('@')[0] || 'Runner';
    const miles = Number(userEntry.miles) || 0;

    const origin = siteOriginFrom(req);
    const leaderboardUrl = `${origin}/group/${challenge.group_id}`;
    const period = `${challenge.week_start} — ${challenge.week_end}`;

    const subject = `${groupName} • You're in the top 3! 🏆`;
    const html = topPerformerHtml(userName, groupName, currentRank, miles, period, leaderboardUrl);

    const sendRes = await sendResendEmail([email], subject, html);

    return new Response(JSON.stringify({
      ok: true,
      email_sent: sendRes.ok,
      user_rank: currentRank,
      user_miles: miles,
      error: sendRes.ok ? null : sendRes.error
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