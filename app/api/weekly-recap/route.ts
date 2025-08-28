// app/api/weekly-recap/route.ts
// Weekly recap computation endpoint (scheduler-friendly). Returns a JSON preview of recaps.
// Optional Resend email sending with send=1; can be protected via CRON_SECRET.

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

type LeaderboardRow = { user_id: string; name: string | null; miles: number };
type Challenge = { id: string; group_id: string; week_start: string; week_end: string; status: 'OPEN'|'CLOSED'; pot?: number };
type Group = { id: string; name: string };
type Recap = {
  group: Group | null;
  challenge: { id: string; week_start: string; week_end: string };
  summary: { participants: number; totalMiles: number; avgMiles: number };
  top3: LeaderboardRow[];
  pot: number | null;
};

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function computeRecap(limitChallenges = 10, groupId?: string): Promise<{ error: string | null; recaps: Recap[] }> {
  const admin = getAdminClient();
  if (!admin) {
    return { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL', recaps: [] };
  }

  let query = admin
    .from('challenges')
    .select('id, group_id, week_start, week_end, status, pot')
    .eq('status', 'CLOSED')
    .order('week_end', { ascending: false });

  if (groupId) {
    query = query.eq('group_id', groupId).limit(1);
  } else {
    query = query.limit(limitChallenges);
  }

  const { data: challenges, error: chErr } = await query;
  if (chErr) return { error: chErr.message, recaps: [] };

  const recaps: Recap[] = [];
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

    const recap: Recap = {
      group: (group as Group | null) ?? null,
      challenge: { id: ch.id, week_start: ch.week_start, week_end: ch.week_end },
      summary: {
        participants,
        totalMiles: Number(totalMiles.toFixed(1)),
        avgMiles: Number(avgMiles.toFixed(1)),
      },
      top3,
      pot: typeof ch.pot === 'number' ? ch.pot : (ch.pot ? Number(ch.pot) : null),
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

function recapHtml(groupName: string, period: string, recap: Recap): string {
  const podiumEmojis = ['🥇', '🥈', '🥉'];
  const podiumColors = ['#fbbf24', '#9ca3af', '#cd7c2f'];
  const top3Cards = recap.top3.map((r: LeaderboardRow, i: number) => 
    `<div style="background: rgba(255, 255, 255, 0.9); border-radius: 12px; padding: 16px; margin: 8px 0; border-left: 4px solid ${podiumColors[i]}; display: flex; align-items: center; justify-content: space-between;">
      <div style="display: flex; align-items: center;">
        <span style="font-size: 24px; margin-right: 12px;">${podiumEmojis[i]}</span>
        <div>
          <div style="font-weight: 700; color: #1f2937; font-size: 16px;">${r.name ?? 'Runner'}</div>
          <div style="color: #6b7280; font-size: 14px;">Position #${i + 1}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: 800; color: #1f2937; font-size: 18px;">${r.miles}</div>
        <div style="color: #6b7280; font-size: 12px;">miles</div>
      </div>
    </div>`
  ).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📊 Weekly Recap - Runpool</title>
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
            <div style="font-size: 48px; margin-bottom: 12px;">📊</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              ${groupName} — Weekly Recap
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              ${period}
            </p>
          </div>

          <!-- Content Section -->
          <div style="padding: 32px;">
            
            <!-- Summary Stats -->
            <div style="background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%); border-radius: 20px; padding: 28px; margin-bottom: 32px; border: 2px solid #a855f7;">
              <h2 style="color: #7c2d12; font-size: 22px; font-weight: 800; margin: 0 0 20px 0; text-align: center; text-transform: uppercase; letter-spacing: 0.025em;">
                Week Summary 📈
              </h2>
              
              <!-- Stats Grid -->
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; text-align: center;">
                <div style="background: rgba(168, 85, 247, 0.1); padding: 20px; border-radius: 12px;">
                  <div style="color: #7c3aed; font-size: 14px; font-weight: 600; margin-bottom: 4px; text-transform: uppercase;">Participants</div>
                  <div style="color: #5b21b6; font-size: 28px; font-weight: 900;">${recap.summary.participants}</div>
                </div>
                <div style="background: rgba(34, 197, 94, 0.1); padding: 20px; border-radius: 12px;">
                  <div style="color: #16a34a; font-size: 14px; font-weight: 600; margin-bottom: 4px; text-transform: uppercase;">Total Miles</div>
                  <div style="color: #15803d; font-size: 28px; font-weight: 900;">${recap.summary.totalMiles}</div>
                </div>
                <div style="background: rgba(59, 130, 246, 0.1); padding: 20px; border-radius: 12px;">
                  <div style="color: #3b82f6; font-size: 14px; font-weight: 600; margin-bottom: 4px; text-transform: uppercase;">Average</div>
                  <div style="color: #1d4ed8; font-size: 28px; font-weight: 900;">${recap.summary.avgMiles}</div>
                </div>
              </div>
            </div>

            <!-- Podium Section -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 28px; margin-bottom: 32px; border: 2px solid #f59e0b;">
              <h3 style="color: #92400e; font-size: 20px; font-weight: 800; margin: 0 0 20px 0; text-align: center; text-transform: uppercase; letter-spacing: 0.025em;">
                🏆 Top 3 Performers
              </h3>
              
              <div style="margin: 16px 0;">
                ${top3Cards}
              </div>
            </div>

            <!-- Motivation Section -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #0ea5e9; text-align: center;">
              <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                Great Week Everyone! 🎉
              </h3>
              <p style="color: #0369a1; font-size: 16px; margin: 0; line-height: 1.5;">
                Another week of amazing progress! Keep up the momentum and let's make next week even better.
              </p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; text-align: center; padding: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Every mile counts! Keep running strong! 💪
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              <a href="/settings" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Update preferences</a>
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
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get('limit') || '10');
  const groupId = url.searchParams.get('group_id') || undefined;
  const sendFlag = url.searchParams.get('send') === '1';
  const testToParam = url.searchParams.get('to');
  const result = await computeRecap(Number.isFinite(limit) && limit > 0 ? limit : 10, groupId ?? undefined);
  const status = result.error ? 500 : 200;
  const payload: { status: 'ok'|'error'; error: string | null; recaps: Recap[]; sent?: { group: string; ok: boolean; error: string | null }[] } =
    { status: result.error ? 'error' : 'ok', error: result.error, recaps: result.recaps };

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
