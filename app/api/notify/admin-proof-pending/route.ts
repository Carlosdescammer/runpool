// app/api/notify/admin-proof-pending/route.ts
// Sends email notifications to group admins when new run proofs are submitted for verification
// Triggered when a user submits a proof that needs admin approval

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

    // Admin client (RLS bypass) for looking up admin emails
    const supaAdmin = serviceKey ? createClient(url, serviceKey, { auth: { persistSession: false } }) : null;

    if (!supaAdmin) {
      return new Response(
        JSON.stringify({ ok: true, email_sent: false, warning: 'Missing SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Load challenge and group info
    const { data: challenge, error: chErr } = await supaUser
      .from('challenges')
      .select('id, group_id, week_start, week_end')
      .eq('id', body.challenge_id)
      .single();
    
    if (chErr || !challenge) {
      return new Response(JSON.stringify({ error: 'Challenge not found' }), { 
        status: 404, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    // Get group name and submitter info
    const [{ data: group }, { data: submitterProfile }, { data: submitterAuth }] = await Promise.all([
      supaUser.from('groups').select('id, name').eq('id', challenge.group_id).single(),
      supaUser.from('user_profiles').select('name').eq('id', body.user_id).maybeSingle(),
      supaAdmin.auth.admin.getUserById(body.user_id)
    ]);

    const groupName = (group?.name as string) || 'Runpool Group';
    const submitterName = (submitterProfile?.name as string) || submitterAuth.user?.email?.split('@')[0] || 'A runner';
    const _submitterEmail = submitterAuth.user?.email || 'unknown@example.com';
    const milesText = typeof body.miles === 'number' ? `${body.miles.toFixed(1)} miles` : 'miles';

    // Get all group admins and owners
    const { data: adminMemberships } = await supaAdmin
      .from('memberships')
      .select('user_id')
      .eq('group_id', challenge.group_id)
      .in('role', ['owner', 'admin']);

    if (!adminMemberships || adminMemberships.length === 0) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, message: 'No admins found' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    // Get admin emails
    const adminEmails: string[] = [];
    for (const membership of adminMemberships) {
      try {
        const { data: userData } = await supaAdmin.auth.admin.getUserById(membership.user_id);
        const email = userData.user?.email;
        if (email && email !== submitterAuth.user?.email) { // Don't notify the submitter
          adminEmails.push(email);
        }
      } catch {
        // ignore
      }
    }

    if (adminEmails.length === 0) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, message: 'No admin emails found' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const origin = siteOriginFrom(req);
    const adminUrl = `${origin}/group/${challenge.group_id}/admin`;
    const period = `${challenge.week_start} — ${challenge.week_end}`;

    const subject = `${groupName} — New run proof needs verification`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔍 Proof Verification Needed - Runpool</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <!-- Main Card -->
        <div style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              Proof Verification Needed
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              ${groupName} • ${period}
            </p>
          </div>

          <!-- Content Section -->
          <div style="padding: 32px;">
            
            <!-- Submission Alert -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 28px; margin-bottom: 32px; border: 2px solid #f59e0b; text-align: center;">
              <div style="color: #92400e; font-size: 24px; font-weight: 800; margin-bottom: 8px;">
                ${submitterName}
              </div>
              <div style="color: #a16207; font-size: 18px; margin-bottom: 16px;">
                submitted a run proof for ${milesText} 📸
              </div>
              
              <!-- Status Badge -->
              <div style="display: inline-block; background: rgba(245, 158, 11, 0.2); border: 2px solid #f59e0b; border-radius: 50px; padding: 12px 24px;">
                <div style="color: #92400e; font-size: 16px; font-weight: 700;">
                  ⏳ Awaiting Verification
                </div>
              </div>
            </div>

            <!-- Admin Action Required -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #ef4444;">
              <h3 style="color: #991b1b; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                Admin Action Required 🚨
              </h3>
              <p style="color: #dc2626; font-size: 16px; margin: 0; line-height: 1.5;">
                A new run proof has been submitted and needs your verification. Please review the submission and approve or reject it.
              </p>
            </div>

            <!-- Submission Details -->
            <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
              <h4 style="color: #475569; font-size: 16px; font-weight: 600; margin: 0 0 16px 0;">Submission Details:</h4>
              <div style="display: grid; gap: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #64748b; font-weight: 500;">Runner:</span>
                  <span style="color: #1e293b; font-weight: 600;">${submitterName}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                  <span style="color: #64748b; font-weight: 500;">Distance:</span>
                  <span style="color: #1e293b; font-weight: 600;">${milesText}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0;">
                  <span style="color: #64748b; font-weight: 500;">Status:</span>
                  <span style="color: #f59e0b; font-weight: 600;">Pending Verification</span>
                </div>
              </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${adminUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: #ffffff; text-decoration: none; padding: 18px 36px; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4); text-transform: uppercase; letter-spacing: 0.025em;">
                Review & Verify 🔍
              </a>
            </div>

            <!-- Instructions -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 24px;">
              <h4 style="color: #0c4a6e; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">How to Verify:</h4>
              <ol style="color: #0369a1; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.6;">
                <li>Click "Review & Verify" to access the admin panel</li>
                <li>View the submitted proof image</li>
                <li>Check if the run meets the weekly goal</li>
                <li>Click "Approve" or "Reject" with optional notes</li>
              </ol>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; text-align: center; padding: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Keep your group motivated with timely verifications! 💪
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              <a href="${origin}/settings" style="color: #7c3aed; text-decoration: none; font-weight: 500;">Update preferences</a> &bull; 
              <a href="${adminUrl}" style="color: #7c3aed; text-decoration: none; font-weight: 500;">Admin panel</a>
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

    const sendRes = await sendResendEmail(adminEmails, subject, html);

    return new Response(JSON.stringify({ 
      ok: true, 
      email_sent: sendRes.ok, 
      admin_recipients: adminEmails.length,
      submitter: submitterName,
      miles: body.miles,
      error: sendRes.ok ? null : sendRes.error
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { 'content-type': 'application/json' } 
    });
  }
}
