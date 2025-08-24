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
  const who = inviter ? `${inviter} invited you` : 'You\'re invited';
  return `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#111">
    <h2 style="margin:0 0 8px 0">${who} to join ${groupName}</h2>
    <p style="margin:0 0 12px 0">Tap the button below to join the group in Runpool.</p>
    <p style="margin:16px 0"><a href="${inviteUrl}"
      style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;">
      Join ${groupName}
    </a></p>
    <p style="margin:12px 0;color:#555;font-size:14px">If the button doesn\'t work, copy and paste this link into your browser:<br/>
      <a href="${inviteUrl}" style="color:#0a66c2">${inviteUrl}</a>
    </p>
  </div>`;
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
    console.log('[invites/send] Resend sent', { to: email, groupId, id: data?.id });

    return new Response(JSON.stringify({ ok: true, invite_url: inviteUrl, email_sent: true, resend: data }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
