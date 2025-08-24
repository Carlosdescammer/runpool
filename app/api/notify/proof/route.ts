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

    // Collect recipients (all members of the group except the actor)
    let recipientIds: string[] = [];
    if (supaAdmin) {
      const { data: members } = await supaAdmin
        .from('memberships')
        .select('user_id')
        .eq('group_id', challenge.group_id);
      recipientIds = (members ?? [])
        .map((m: { user_id: string }) => m.user_id)
        .filter((id) => id && id !== actorId);
    } else {
      // Without service role we cannot look up other users' emails — degrade gracefully.
      return new Response(
        JSON.stringify({ ok: true, email_sent: false, warning: 'Missing SUPABASE_SERVICE_ROLE_KEY to fetch member emails' }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    // Fetch emails for each recipient ID via Auth Admin API
    const emails: string[] = [];
    for (const uid of recipientIds) {
      try {
        const res = await supaAdmin!.auth.admin.getUserById(uid);
        const em = res.data.user?.email ?? null;
        if (em) emails.push(em);
      } catch {
        // ignore
      }
    }

    // If no recipients/emails, exit successfully
    if (emails.length === 0) {
      return new Response(JSON.stringify({ ok: true, email_sent: false, recipients: 0 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const origin = siteOriginFrom(req);
    const leaderboardUrl = `${origin}/group/${challenge.group_id}`;
    const period = `${challenge.week_start} — ${challenge.week_end}`;

    const milesText = typeof milesNum === 'number' ? `${milesNum.toFixed(1)} miles` : 'new miles';
    const subject = `${groupName} — ${actorName} logged ${milesText}`;
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.6; color:#111">
        <h2 style="margin:0 0 8px 0">New miles in ${groupName}</h2>
        <div style="color:#555; margin-bottom:12px">${period}</div>
        <p style="margin:0 0 12px 0"><strong>${actorName}</strong> just logged ${milesText}.</p>
        <p style="margin:12px 0">
          <a href="${leaderboardUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;">View leaderboard</a>
        </p>
        <p style="margin:12px 0;color:#555;font-size:14px">Haven't added yours yet? Log today before the end-of-day deadline.</p>
      </div>`;

    const sendRes = await sendResendEmail(emails, subject, html);

    return new Response(JSON.stringify({ ok: true, email_sent: sendRes.ok, recipients: emails.length }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    // Do not surface internal env details
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
