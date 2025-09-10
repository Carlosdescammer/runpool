// app/api/invites/send/route.ts
// Creates an invite and sends an email via Resend. Caller must be owner/admin of the group.

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

function emailHtml(inviter: string | null, groupName: string, inviteUrl: string): string {
  const who = inviter ? `${inviter} invited you` : 'You are invited';
  const welcomeMessage = inviter 
    ? `${inviter} has invited you to join their running group!` 
    : 'You have been invited to join a running group!';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🎉 You're Invited - Runpool</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <!-- Main Card -->
        <div style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              ${who} to join ${groupName}
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              Your running journey starts here
            </p>
          </div>

          <!-- Content Section -->
          <div style="padding: 32px;">
            
            <!-- Welcome Banner -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 20px; padding: 28px; margin-bottom: 32px; border: 2px solid #10b981; text-align: center;">
              <h2 style="color: #047857; font-size: 22px; font-weight: 800; margin: 0 0 12px 0;">
                Welcome to the Team! 🏃‍♂️
              </h2>
              <p style="color: #059669; font-size: 16px; margin: 0; line-height: 1.5;">
                ${welcomeMessage} Get ready to track your miles, compete with friends, and achieve your running goals together.
              </p>
            </div>

            <!-- Group Info -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
                About ${groupName} 📊
              </h3>
              <ul style="color: #0369a1; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Track your daily and weekly running miles</li>
                <li>Compete with friends on the leaderboard</li>
                <li>Get motivated by group challenges</li>
                <li>Share your progress and celebrate wins</li>
              </ul>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${inviteUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 18px 36px; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4); text-transform: uppercase; letter-spacing: 0.025em; margin-bottom: 16px;">
                Join ${groupName} 🚀
              </a>
              
              <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-top: 16px;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
                  Having trouble with the button? Copy and paste this link:
                </p>
                <p style="margin: 0;">
                  <a href="${inviteUrl}" style="color: #3b82f6; text-decoration: none; font-weight: 500; word-break: break-all; font-family: 'SF Mono', Monaco, monospace; background: rgba(59, 130, 246, 0.1); padding: 4px 8px; border-radius: 6px; font-size: 12px;">
                    ${inviteUrl}
                  </a>
                </p>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; text-align: center; padding: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Ready to start your running journey? Let's go! 🏃‍♀️💨
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              Questions? Contact your group admin for help.
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

    // Expect Authorization: Bearer <access_token>
    const authHeader = req.headers.get('authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    // User-scoped client so RLS enforces owner/admin requirement on invites table
    const supa = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });

    type Body = { group_id: string; email: string; expires_in_days?: number } & { inviter_name?: string };
    const body = (await req.json()) as Body;
    const groupId = body.group_id;
    const email = (body.email || '').trim();
    const expiresInDays = Number.isFinite(body.expires_in_days as number) ? Math.max(1, Math.min(60, Number(body.expires_in_days))) : 14;
    if (!groupId || !email) {
      return new Response(JSON.stringify({ error: 'Missing group_id or email' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    // Verify caller identity
    const { data: userRes, error: userErr } = await supa.auth.getUser();
    if (userErr || !userRes?.user) {
      return new Response('Unauthorized', { status: 401 });
    }
    const userId = userRes.user.id;

    // Check caller is owner/admin of the group via memberships
    const { data: membership } = await supa
      .from('memberships')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();
    const role = (membership?.role as string | undefined) || '';
    if (!['owner', 'admin'].includes(role)) {
      return new Response('Forbidden', { status: 403 });
    }

    // Fetch group and inviter name (optional)
    const [{ data: group }, { data: profile }] = await Promise.all([
      supa.from('groups').select('id, name').eq('id', groupId).single(),
      supa.from('user_profiles').select('name').eq('id', userId).maybeSingle(),
    ]);
    const groupName = (group?.name as string) || 'Runpool Group';
    const inviterName = (body.inviter_name as string | undefined) ?? ((profile?.name as string | null) || null);

    // Create invite token and row
    const token = crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    const { error: invErr } = await supa.from('invites').insert({
      token,
      group_id: groupId,
      created_by: userId,
      expires_at: expiresAt,
      invited_email: email,
    });
    if (invErr) {
      return new Response(JSON.stringify({ error: invErr.message }), { status: 400, headers: { 'content-type': 'application/json' } });
    }

    const origin = siteOriginFrom(req);
    const inviteUrl = `${origin}/join?token=${encodeURIComponent(token)}`;

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM;
    const subject = `${groupName} — You\'re invited`;
    const html = emailHtml(inviterName, groupName, inviteUrl);

    // If Resend configuration is missing, don't fail the request. Return the invite URL so it can be shared manually.
    if (!apiKey || !from) {
      console.warn('[invites/send] Resend env missing, skipping email', { to: email, groupId });
      return new Response(
        JSON.stringify({ ok: true, invite_url: inviteUrl, email_sent: false, warning: 'Missing RESEND_API_KEY or RESEND_FROM' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [email], subject, html }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('[invites/send] Resend send failed', { to: email, groupId, errText });
      return new Response(
        JSON.stringify({ ok: true, invite_url: inviteUrl, email_sent: false, error: errText }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }
    const data = await res.json();

    return new Response(JSON.stringify({ ok: true, invite_url: inviteUrl, email_sent: true, resend: data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
