// app/api/weekly-recap/route.ts
// Weekly recap computation endpoint (scheduler-friendly). Returns a JSON preview of recaps.
// Email delivery is not wired yet; configure a provider and call from here.

import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge' as const;

type LeaderboardRow = { user_id: string; name: string | null; miles: number };
type Challenge = { id: string; group_id: string; week_start: string; week_end: string; status: 'OPEN'|'CLOSED' };
type Group = { id: string; name: string };

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function computeRecap(limitChallenges = 10) {
  const admin = getAdminClient();
  if (!admin) {
    return { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL', recaps: [] };
  }

  const { data: challenges, error: chErr } = await admin
    .from('challenges')
    .select('id, group_id, week_start, week_end, status')
    .eq('status', 'CLOSED')
    .order('week_end', { ascending: false })
    .limit(limitChallenges);
  if (chErr) return { error: chErr.message, recaps: [] };

  const recaps: any[] = [];
  for (const ch of (challenges ?? []) as Challenge[]) {
    const [{ data: group }, { data: rows }] = await Promise.all([
      admin.from('groups').select('id, name').eq('id', ch.group_id).single(),
      admin.from('leaderboard_week').select('user_id, name, miles').eq('challenge_id', ch.id).order('miles', { ascending: false }),
    ]);

    const lb = (rows ?? []) as LeaderboardRow[];
    const participants = lb.length;
    const totalMiles = lb.reduce((s, r) => s + Number(r.miles || 0), 0);
    const avgMiles = participants ? totalMiles / participants : 0;
    const top3 = lb.slice(0, 3);

    const recap = {
      group: group as Group | null,
      challenge: { id: ch.id, week_start: ch.week_start, week_end: ch.week_end },
      summary: {
        participants,
        totalMiles: Number(totalMiles.toFixed(1)),
        avgMiles: Number(avgMiles.toFixed(1)),
      },
      top3,
    };
    recaps.push(recap);
  }
  return { error: null, recaps };
}

async function sendResendEmail(to: string[], subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    return { ok: false, error: 'Missing RESEND_API_KEY or RESEND_FROM env' };
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) return { ok: false, error: await res.text() };
  const data = await res.json();
  return { ok: true, data };
}

function recapHtml(groupName: string, period: string, recap: any) {
  const top = (recap.top3 as any[]).map((r: any, i: number) => `<li>#${i + 1} ${r.name ?? r.user_id} — ${r.miles} miles</li>`).join('');
  return `
  <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5; color:#111">
    <h2 style="margin:0 0 8px 0">${groupName} — Weekly Recap</h2>
    <div style="color:#555; margin-bottom:12px">${period}</div>
    <div style="margin:12px 0">
      <strong>Participants:</strong> ${recap.summary.participants}<br/>
      <strong>Total miles:</strong> ${recap.summary.totalMiles}<br/>
      <strong>Average miles:</strong> ${recap.summary.avgMiles}
    </div>
    <div>
      <strong>Top 3</strong>
      <ol>${top}</ol>
    </div>
  </div>`;
}

export async function POST(req: Request) {
  // Optional protection: if CRON_SECRET is set, require matching header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const provided = req.headers.get('x-cron-secret');
    if (provided !== cronSecret) {
      return new Response(JSON.stringify({ status: 'forbidden' }), { status: 403, headers: { 'content-type': 'application/json' } });
    }
  }
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') || '10');
  const sendFlag = url.searchParams.get('send') === '1';
  const testToParam = url.searchParams.get('to');
  const result = await computeRecap(Number.isFinite(limit) && limit > 0 ? limit : 10);
  const status = result.error ? 500 : 200;
  const payload: any = { status: result.error ? 'error' : 'ok', ...result };

  // Optional: send recap emails via Resend when explicitly requested (send=1)
  if (!result.error && sendFlag && (process.env.RESEND_API_KEY && process.env.RESEND_FROM)) {
    const testList = (testToParam ?? process.env.WEEKLY_RECAP_TEST_TO ?? '').split(',').map(s => s.trim()).filter(Boolean);
    payload.sent = [];
    for (const r of result.recaps) {
      const groupName = r.group?.name ?? 'Runpool';
      const period = `${r.challenge.week_start} — ${r.challenge.week_end}`;
      const subject = `${groupName} — Weekly Recap (${period})`;
      const html = recapHtml(groupName, period, r);
      if (testList.length > 0) {
        const sendRes = await sendResendEmail(testList, subject, html);
        payload.sent.push({ group: groupName, ok: sendRes.ok, error: sendRes.error ?? null });
      } else {
        payload.sent.push({ group: groupName, ok: false, error: 'No recipients (set WEEKLY_RECAP_TEST_TO or use ?to=)' });
      }
    }
  }

  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function GET(req: Request) {
  return POST(req);
}
