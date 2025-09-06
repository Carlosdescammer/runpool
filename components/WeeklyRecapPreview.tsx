// components/WeeklyRecapPreview.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

type LeaderboardRow = { user_id: string; name: string | null; miles: number };

type Recap = {
  group: { id: string; name: string } | null;
  challenge: { id: string; week_start: string; week_end: string };
  summary: { participants: number; totalMiles: number; avgMiles: number };
  top3: LeaderboardRow[];
  pot: number | null;
};

export default function WeeklyRecapPreview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recap, setRecap] = useState<Recap | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const user = userRes.user;

        let groupId: string | undefined = undefined;
        if (user) {
          const { data: m } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', user.id)
            .limit(1);
          if (m && m.length > 0) groupId = (m[0] as { group_id: string }).group_id;
        }

        const url = new URL('/api/weekly-recap', window.location.origin);
        url.searchParams.set('limit', '1');
        if (groupId) url.searchParams.set('group_id', groupId);

        const res = await fetch(url.toString(), { method: 'GET' });
        if (!res.ok) throw new Error(`Failed to load recap (${res.status})`);
        const json = await res.json();
        if (json.status !== 'ok') throw new Error(json.error || 'Failed to load recap');
        const r = (json.recaps?.[0] as Recap | undefined) ?? null;
        if (alive) setRecap(r);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Error loading recap';
        if (alive) setError(message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="w-full max-w-[420px] rounded-2xl border border-zinc-200 bg-[var(--rp-surface)] p-4 shadow-md">
      <div className="text-sm font-semibold text-zinc-700">Weekly Recap</div>
      <div className="h-2" />

      {loading && (
        <div className="grid gap-2.5">
          <div className="h-5 w-40 rounded bg-zinc-100" />
          <div className="h-4 w-60 rounded bg-zinc-100" />
          <div className="h-3" />
          <div className="h-7 w-full rounded bg-zinc-100" />
          <div className="h-7 w-full rounded bg-zinc-100" />
          <div className="h-7 w-full rounded bg-zinc-100" />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
          {error}
        </div>
      )}

      {!loading && !error && !recap && (
        <div className="grid place-items-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
          No recent recaps yet.
          <div className="h-2" />
          <Link href="/group/new" className="inline-flex h-9 items-center justify-center rounded-lg bg-[var(--rp-primary)] px-3 text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rp-accent)] focus-visible:ring-offset-2">
            Create a Group
          </Link>
        </div>
      )}

      {!loading && !error && recap && (
        <div>
          <div className="text-[15px] font-bold">{recap.group?.name ?? 'Runpool Group'}</div>
          <div className="text-sm text-zinc-600">{recap.challenge.week_start} — {recap.challenge.week_end}</div>

          <div className="h-3" />
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg border border-zinc-200 bg-white p-2">
              <div className="text-[11px] text-zinc-500">Pot</div>
              <div className="text-[15px] font-bold">{recap.pot != null ? `$${recap.pot}` : '—'}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-2">
              <div className="text-[11px] text-zinc-500">Participants</div>
              <div className="text-[15px] font-bold">{recap.summary.participants}</div>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-white p-2">
              <div className="text-[11px] text-zinc-500">Avg miles</div>
              <div className="text-[15px] font-bold">{recap.summary.avgMiles}</div>
            </div>
          </div>

          <div className="h-3" />
          <div className="text-sm font-semibold">Top 3</div>
          <ol className="mt-1 space-y-1 text-sm">
            {(recap.top3 || []).map((r, i) => (
              <li key={r.user_id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[12px] font-bold">{i + 1}</span>
                  <span className="font-medium">{r.name ?? r.user_id}</span>
                </div>
                <div className="text-zinc-700">{r.miles} mi</div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
