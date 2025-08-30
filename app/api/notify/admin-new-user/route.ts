// app/api/notify/admin-new-user/route.ts
// Notifies group admins when new users join their group
// Triggered when membership is created

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

function newUserHtml(
  adminName: string,
  newUserName: string,
  newUserEmail: string,
  groupName: string,
  memberCount: number,
  groupUrl: string,
  adminUrl: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>👋 New Member Alert - Runpool</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <!-- Main Card -->
        <div style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 12px;">👋</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              New Member Joined!
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              ${groupName} &bull; Admin Alert
            </p>
          </div>

          <!-- Content Section -->
          <div style="padding: 32px;">
            
            <!-- Welcome Banner -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 20px; padding: 28px; margin-bottom: 32px; border: 2px solid #10b981; text-align: center;">
              <h2 style="color: #047857; font-size: 22px; font-weight: 800; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.025em;">
                Welcome Our Newest Member! 🎉
              </h2>
              
              <!-- Member Card -->
              <div style="background: rgba(255, 255, 255, 0.95); border-radius: 16px; padding: 24px; margin: 16px 0; border: 1px solid #a7f3d0;">
                <div style="color: #065f46; font-size: 24px; font-weight: 800; margin-bottom: 8px;">
                  ${newUserName}
                </div>
                <div style="color: #059669; font-size: 16px; font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace; background: #f0fdf4; padding: 8px 12px; border-radius: 8px; display: inline-block;">
                  ${newUserEmail}
                </div>
              </div>
            </div>
            
            <!-- Stats Section -->
            <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="color: #475569; font-size: 14px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em;">Group Statistics</div>
                  <div style="color: #1e293b; font-size: 32px; font-weight: 900;">
                    ${memberCount} <span style="font-size: 18px; color: #64748b; font-weight: 500;">Total Members</span>
                  </div>
                </div>
                <div style="font-size: 48px; opacity: 0.7;">👥</div>
              </div>
              
              <!-- Growth Indicator -->
              <div style="margin-top: 16px; padding: 12px; background: rgba(34, 197, 94, 0.1); border-radius: 8px; border-left: 3px solid #22c55e;">
                <div style="color: #15803d; font-size: 14px; font-weight: 600;">
                  🚀 Your group is growing! New member just joined.
                </div>
              </div>
            </div>

            <!-- Admin Message -->
            <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #3b82f6;">
              <h3 style="color: #1e40af; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
                Admin Action Required 🛠️
              </h3>
              <p style="color: #1d4ed8; font-size: 16px; margin: 0; line-height: 1.5;">
                Hi ${adminName}! As an admin, you can help ${newUserName} get started on their running journey and manage group settings.
              </p>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="margin-bottom: 16px;">
                <a href="${groupUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 700; font-size: 16px; margin: 8px; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3); text-transform: uppercase; letter-spacing: 0.025em;">
                  View Group 👀
                </a>
              </div>
              <div>
                <a href="${adminUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3); text-transform: uppercase; letter-spacing: 0.025em;">
                  Admin Panel ⚙️
                </a>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; text-align: center; padding: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Help your new member get started on their running journey! 🏃‍♂️
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

interface NotificationSettings {
  admin_new_user_alerts: boolean;
  // other notification settings
}

interface UserWithSettings {
  user: {
    settings: NotificationSettings;
  };
}

export async function POST(req: Request) {
  try {
    const url = required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      group_id?: string;
      new_user_id?: string;
      new_user_email?: string;
      new_user_name?: string;
    };

    if (!body.group_id || !body.new_user_id) {
      return new Response(JSON.stringify({ error: 'Missing group_id or new_user_id' }), { 
        status: 400, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    // Get group info
    const { data: group } = await supabase
      .from('groups')
      .select('name')
      .eq('id', body.group_id)
      .single();

    if (!group) {
      return new Response(JSON.stringify({ error: 'Group not found' }), { 
        status: 404, 
        headers: { 'content-type': 'application/json' } 
      });
    }

    const groupName = group.name || 'Runpool Group';

    // Get new user info
    let newUserName = body.new_user_name;
    let newUserEmail = body.new_user_email;

    if (!newUserEmail) {
      const { data: userData } = await supabase.auth.admin.getUserById(body.new_user_id);
      newUserEmail = userData.user?.email;
    }

    if (!newUserName) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', body.new_user_id)
        .maybeSingle();
      newUserName = profile?.name || newUserEmail?.split('@')[0] || 'New Member';
    }

    if (!newUserEmail) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, message: 'New user email not found' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Get all admins and owners of the group (exclude the new user)
    const { data: adminMemberships } = await supabase
      .from('memberships')
      .select('user_id, role')
      .eq('group_id', body.group_id)
      .in('role', ['admin', 'owner'])
      .neq('user_id', body.new_user_id);

    if (!adminMemberships?.length) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, message: 'No admins found' }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }

    // Get total member count
    const { count } = await supabase
      .from('memberships')
      .select('user_id', { count: 'exact' })
      .eq('group_id', body.group_id);

    const memberCount = count || 0;

    const origin = siteOriginFrom(req);
    const groupUrl = `${origin}/group/${body.group_id}`;
    const adminUrl = `${origin}/group/${body.group_id}/admin`;

    const emailsSent = [];

    // Send notification to each admin
    for (const adminMembership of adminMemberships) {
      // Check admin's email preferences
      const { data } = await supabase.auth.admin.getUserById(adminMembership.user_id);
      const { user } = data as UserWithSettings;
      
      if (!user.settings?.admin_new_user_alerts) {
        emailsSent.push({
          admin_id: adminMembership.user_id,
          sent: false,
          reason: 'Admin opted out of new user alerts'
        });
        continue;
      }

      // Get admin info
      const [{ data: adminUser }, { data: adminProfile }] = await Promise.all([
        supabase.auth.admin.getUserById(adminMembership.user_id),
        supabase
          .from('user_profiles')
          .select('name')
          .eq('id', adminMembership.user_id)
          .maybeSingle()
      ]);

      const adminEmail = adminUser.user?.email;
      if (!adminEmail) {
        emailsSent.push({
          admin_id: adminMembership.user_id,
          sent: false,
          reason: 'Admin email not found'
        });
        continue;
      }

      const adminName = adminProfile?.name || adminEmail.split('@')[0] || 'Admin';

      const subject = `${groupName} • New member: ${newUserName}`;
      const html = newUserHtml(
        adminName,
        newUserName,
        newUserEmail,
        groupName,
        memberCount,
        groupUrl,
        adminUrl
      );

      const sendRes = await sendResendEmail([adminEmail], subject, html);
      emailsSent.push({
        admin_id: adminMembership.user_id,
        admin_email: adminEmail,
        sent: sendRes.ok,
        error: sendRes.ok ? null : sendRes.error
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      new_user: newUserName,
      group_name: groupName,
      admins_notified: emailsSent.filter(e => e.sent).length,
      total_admins: adminMemberships.length,
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