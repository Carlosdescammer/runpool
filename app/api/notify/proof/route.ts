// app/api/notify/proof/route.ts
// Sends instant emails to group members when someone logs miles (submits a proof).
// Uses Resend and Supabase service role to look up member emails. Caller must be authenticated and a member of the group.

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
  // NOTE: For privacy, we send one email per recipient (avoid exposing addresses). Optimize later if needed.
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

export async function POST(req: Request) {
  try {
    const url = required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    const anon = required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

    // Auth header required
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      challenge_id?: string;
      miles?: number;
      proof_id?: string;
    };

    if (!body.challenge_id) {
      return new Response(JSON.stringify({ error: 'Missing challenge_id' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    // User-scoped client (RLS enforced)
    const supaUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });

    // Admin client (RLS bypass) for looking up emails
    const supaAdmin = serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

    // Current user
    const { data: userRes, error: userErr } = await supaUser.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response('Unauthorized', { status: 401 });
    }
    const actorId = userRes.user.id;
    const actorEmail = userRes.user.email ?? null;

    // Load challenge to get group_id and period
    const { data: challenge, error: chErr } = await supaUser
      .from('challenges')
      .select('id, group_id, week_start, week_end')
      .eq('id', body.challenge_id)
      .single();
    if (chErr || !challenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
    }

    // Verify actor is a member of the group
    const { data: membership } = await supaUser
      .from('memberships')
      .select('user_id')
      .eq('group_id', challenge.group_id)
      .eq('user_id', actorId)
      .maybeSingle();
    if (!membership) {
      return new Response('Forbidden', { status: 403 });
    }

    // Optional: verify a recent proof belongs to actor for this challenge
    // (best-effort; not critical if called immediately after insert)
    let milesNum: number | null = typeof body.miles === 'number' ? body.miles : null;
    if (!milesNum) {
      const { data: recent } = await supaUser
        .from('proofs')
        .select('miles, created_at')
        .eq('challenge_id', body.challenge_id)
        .eq('user_id', actorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      milesNum = (recent?.miles as number | undefined) ?? null;
    }

    // Load group name, notify flag, and actor display name
    const [{ data: group }, { data: profile }] = await Promise.all([
      supaUser.from('groups').select('id, name, notify_on_proof').eq('id', challenge.group_id).single(),
      supaUser.from('user_profiles').select('name').eq('id', actorId).maybeSingle(),
    ]);
    const groupName = (group?.name as string) || 'Runpool Group';
    const actorName = ((profile?.name as string | null) ?? null) || (actorEmail ? actorEmail.split('@')[0] : 'Someone');

    // Respect per-group toggle: if disabled, exit successfully without sending
    const notifyFlag = (group as { notify_on_proof?: boolean } | null)?.notify_on_proof;
    if (notifyFlag === false) {
      return new Response(
        JSON.stringify({ ok: true, email_sent: false, disabled: true }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Check if actor is in top 3 for special notification
    const { data: leaderboard } = await supaUser
      .from('leaderboard_week')
      .select('user_id, miles')
      .eq('challenge_id', body.challenge_id)
      .order('miles', { ascending: false })
      .limit(3);
    
    const actorInTop3 = leaderboard?.some(entry => entry.user_id === actorId) || false;

    // Collect recipients (all members of the group except the actor)
    const recipientData: { user_id: string; email: string; prefs: { proof_notifications?: boolean; top_three_milestone?: boolean } }[] = [];
    if (supaAdmin) {
      const { data: members } = await supaAdmin
        .from('memberships')
        .select('user_id')
        .eq('group_id', challenge.group_id);
      
      const recipientIds = (members ?? [])
        .map((m: { user_id: string }) => m.user_id)
        .filter((id) => id && id !== actorId);

      // Fetch emails and preferences for each recipient
      for (const uid of recipientIds) {
        try {
          const [{ data: userData }, { data: prefs }] = await Promise.all([
            supaAdmin.auth.admin.getUserById(uid),
            supaAdmin.rpc('get_user_email_preferences', { target_user_id: uid }).single()
          ]);
          
          const email = userData.user?.email;
          if (email) {
            recipientData.push({ user_id: uid, email, prefs });
          }
        } catch {
          // ignore
        }
      }
    } else {
      // Without service role we cannot look up other users' emails — degrade gracefully.
      return new Response(
        JSON.stringify({ ok: true, email_sent: false, warning: 'Missing SUPABASE_SERVICE_ROLE_KEY to fetch member emails' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Filter recipients based on email preferences
    const regularNotificationRecipients = recipientData.filter(r => 
      r.prefs?.proof_notifications !== false
    );
    
    const top3NotificationRecipients = actorInTop3 ? recipientData.filter(r => 
      r.prefs?.top_three_milestone !== false
    ) : [];

    const emails = regularNotificationRecipients.map(r => r.email);
    const top3Emails = top3NotificationRecipients.map(r => r.email);

    // If no recipients/emails, exit successfully
    if (emails.length === 0 && top3Emails.length === 0) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, recipients: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const origin = siteOriginFrom(req);
    const leaderboardUrl = `${origin}/group/${challenge.group_id}`;
    const period = `${challenge.week_start} — ${challenge.week_end}`;

    const milesText = typeof milesNum === 'number' ? `${milesNum.toFixed(1)} miles` : 'new miles';
    let regularSendRes = { ok: true };
    let top3SendRes = { ok: true };

    // Send regular proof notifications
    if (emails.length > 0) {
      const subject = `${groupName} — ${actorName} logged ${milesText}`;
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏃‍♂️ New Activity - Runpool</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <!-- Main Card -->
        <div style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🏃‍♂️</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              New Miles in ${groupName}
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              ${period}
            </p>
          </div>

          <!-- Content Section -->
          <div style="padding: 32px;">
            
            <!-- Activity Banner -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 20px; padding: 28px; margin-bottom: 32px; border: 2px solid #3b82f6; text-align: center;">
              <div style="color: #1e40af; font-size: 24px; font-weight: 800; margin-bottom: 8px;">
                ${actorName}
              </div>
              <div style="color: #2563eb; font-size: 18px; margin-bottom: 16px;">
                just logged ${milesText} 🎯
              </div>
              
              <!-- Achievement Badge -->
              <div style="display: inline-block; background: rgba(59, 130, 246, 0.1); border: 2px solid #3b82f6; border-radius: 50px; padding: 12px 24px;">
                <div style="color: #1d4ed8; font-size: 16px; font-weight: 700;">
                  Way to go! 💪
                </div>
              </div>
            </div>

            <!-- Motivation Section -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #f59e0b; text-align: center;">
              <h3 style="color: #92400e; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                Your Turn! 🚀
              </h3>
              <p style="color: #a16207; font-size: 16px; margin: 0; line-height: 1.5;">
                Have not added your miles yet? Log today before the end-of-day deadline!
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${leaderboardUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3); text-transform: uppercase; letter-spacing: 0.025em;">
                View Leaderboard 📊
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; text-align: center; padding: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Keep the momentum going! Every mile counts. 🌟
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              <a href="${origin}/settings" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Update preferences</a> &bull; 
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

      regularSendRes = await sendResendEmail(emails, subject, html);
    }

    // Send special top-3 milestone notifications
    if (top3Emails.length > 0 && actorInTop3) {
      const actorRank = leaderboard?.findIndex(entry => entry.user_id === actorId) + 1 || 0;
      const rankEmoji = actorRank === 1 ? '🥇' : actorRank === 2 ? '🥈' : '🥉';
      
      const top3Subject = `${groupName} — Top performer ${actorName} logged ${milesText} ${rankEmoji}`;
      const top3Html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏆 Top 3 Update - Runpool</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <!-- Main Card -->
        <div style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 12px;">${rankEmoji}</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              Top 3 Update in ${groupName}
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              ${period}
            </p>
          </div>

          <!-- Content Section -->
          <div style="padding: 32px;">
            
            <!-- Top Performer Banner -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%); border-radius: 20px; padding: 32px; margin-bottom: 32px; border: 3px solid #f59e0b; text-align: center; box-shadow: 0 8px 32px rgba(245, 158, 11, 0.3);">
              
              <!-- Achievement -->
              <h2 style="color: #92400e; font-size: 26px; font-weight: 900; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.025em;">
                ${actorName} Just Logged ${milesText}! 🔥
              </h2>
              
              <!-- Position Badge -->
              <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); border-radius: 50px; padding: 16px 28px; margin: 16px 0; border: 2px solid #d97706;">
                <div style="color: #451a03; font-size: 20px; font-weight: 800;">
                  Currently in Position #${actorRank}
                </div>
              </div>
              
              <!-- Rank Badge -->
              <div style="margin-top: 16px;">
                <span style="display: inline-block; background: rgba(185, 28, 28, 0.1); color: #991b1b; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                  Top Performer Alert
                </span>
              </div>
            </div>

            <!-- Leadership Message -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                Leadership in Action! 🌟
              </h3>
              <p style="color: #0369a1; font-size: 16px; margin: 0; line-height: 1.5;">
                One of your top performers is staying active and leading by example! Check the leaderboard to see the current standings.
              </p>
            </div>

            <!-- Stats Section -->
            <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center;">
                <div style="background: rgba(245, 158, 11, 0.1); padding: 20px; border-radius: 12px;">
                  <div style="color: #92400e; font-size: 14px; font-weight: 600; margin-bottom: 4px; text-transform: uppercase;">Rank</div>
                  <div style="color: #451a03; font-size: 28px; font-weight: 900;">#${actorRank}</div>
                </div>
                <div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 12px;">
                  <div style="color: #1e40af; font-size: 14px; font-weight: 600; margin-bottom: 4px; text-transform: uppercase;">Miles</div>
                  <div style="color: #1e3a8a; font-size: 28px; font-weight: 900;">${milesText.split(' ')[0]}</div>
                </div>
              </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${leaderboardUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 18px 36px; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4); text-transform: uppercase; letter-spacing: 0.025em;">
                View Leaderboard 📊
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; text-align: center; padding: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Top performers leading by example! Keep it up! 🚀
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              <a href="${origin}/settings" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Update preferences</a> &bull; 
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

      top3SendRes = await sendResendEmail(top3Emails, top3Subject, top3Html);
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      email_sent: regularSendRes.ok && top3SendRes.ok, 
      regular_recipients: emails.length,
      top3_recipients: top3Emails.length,
      actor_in_top3: actorInTop3
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    // Do not surface internal env details
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
