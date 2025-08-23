// app/group/[id]/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

type Challenge = {
  id: string; group_id: string; week_start: string; week_end: string;
  pot: number; status: 'OPEN'|'CLOSED';
};

type Group = {
  id: string;
  name: string;
  rule: string;
  owner_id: string;
  entry_fee?: number;
};

type LeaderboardRow = {
  user_id: string;
  name: string | null;
  miles: number;
};

export default function GroupPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [miles, setMiles] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);
  const [, setRankDelta] = useState<Record<string, number>>({});
  const [, setMovement] = useState<Record<string, 'up' | 'down' | 'same'>>({});
  const [, setJoinTop3] = useState<Record<string, boolean>>({});
  const [, setDropTop3] = useState<Record<string, boolean>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [joinLink, setJoinLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // Build a shareable link (placeholder: join page). Admin page likely generates tokens
  useEffect(() => {
    try { setJoinLink(`${window.location.origin}/join`); } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      // Group basics
      const { data: g } = await supabase.from('groups').select('*').eq('id', groupId).single();
      setGroup(g);

      // Active (open) challenge for this group (assume one)
      const { data: ch } = await supabase.from('challenges')
        .select('*').eq('group_id', groupId).order('week_start', { ascending: false }).limit(1).maybeSingle();
      if (ch) setChallenge(ch);

      // Fetch leaderboard for this challenge
      if (ch) loadLeaderboard(ch.id);
    })();
  }, [groupId]);

  // Determine if current user is admin of this group
  useEffect(() => {
    (async () => {
      if (!userId) { setIsAdmin(false); return; }
      const { data: m } = await supabase
        .from('memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();
      const role = m?.role as ('owner' | 'admin' | 'member' | undefined);
      setIsAdmin(role === 'admin' || role === 'owner');
    })();
  }, [groupId, userId]);

  // Show a welcome banner if user just joined via invite
  useEffect(() => {
    const justJoined = searchParams.get('joined') === '1';
    setShowWelcome(justJoined);
    if (justJoined) {
      // Celebrate join
      setTimeout(() => {
        try {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.25 } });
        } catch {}
        toast.success('Welcome to the group!');
      }, 200);
    }
  }, [searchParams]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error('Copy failed');
    }
  }

  async function loadLeaderboard(challengeId: string) {
    setLoadingBoard(true);
    const { data: rows } = await supabase
      .from('leaderboard_week')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('miles', { ascending: false });
    setLeaderboard(rows ?? []);
    setLoadingBoard(false);
  }

  // Realtime: subscribe to proofs changes for current challenge to refresh leaderboard
  useEffect(() => {
    if (!challenge?.id) return;
    const channel = supabase
      .channel(`leaderboard_${challenge.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proofs', filter: `challenge_id=eq.${challenge.id}` },
        () => {
          loadLeaderboard(challenge.id);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [challenge?.id]);

  // Compute rank deltas (vs previous render snapshot) and top-3 threshold animations
  useEffect(() => {
    if (!leaderboard || leaderboard.length === 0 || !groupId) return;
    const ranks: Record<string, number> = {};
    leaderboard.forEach((r, i) => { ranks[r.user_id] = i + 1; });

    const key = `leader_prev_ranks_${groupId}_${challenge?.id ?? 'none'}`;
    let prev: Record<string, number> = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw) prev = JSON.parse(raw);
    } catch {}

    const delta: Record<string, number> = {};
    const move: Record<string, 'up' | 'down' | 'same'> = {};
    const joinFlags: Record<string, boolean> = {};
    const dropFlags: Record<string, boolean> = {};

    leaderboard.forEach((r, i) => {
      const currRank = i + 1;
      const prevRank = prev[r.user_id];
      if (typeof prevRank === 'number') {
        const d = prevRank - currRank; // positive => moved up
        delta[r.user_id] = d;
        move[r.user_id] = d > 0 ? 'up' : d < 0 ? 'down' : 'same';
        if (prevRank > 3 && currRank <= 3) joinFlags[r.user_id] = true;
        if (prevRank <= 3 && currRank > 3) dropFlags[r.user_id] = true;
      } else {
        delta[r.user_id] = 0;
        move[r.user_id] = 'same';
      }
    });

    setRankDelta(delta);
    setMovement(move);
    if (Object.keys(joinFlags).length > 0) {
      setJoinTop3(joinFlags);
      setTimeout(() => setJoinTop3({}), 1500);
    }
    if (Object.keys(dropFlags).length > 0) {
      setDropTop3(dropFlags);
      setTimeout(() => setDropTop3({}), 1500);
    }

    try { localStorage.setItem(key, JSON.stringify(ranks)); } catch {}
  }, [leaderboard, groupId, challenge?.id]);

  // Compute current streaks from recent closed challenges (client-side)
  useEffect(() => {
    (async () => {
      if (!groupId || !leaderboard || leaderboard.length === 0) { setStreaks({}); return; }
      const { data: closed } = await supabase
        .from('challenges')
        .select('id, week_start')
        .eq('group_id', groupId)
        .eq('status', 'CLOSED')
        .order('week_start', { ascending: false })
        .limit(8);
      const weeks = closed ?? [];
      if (weeks.length === 0) { setStreaks({}); return; }
      const ids = weeks.map(w => w.id);
      const { data: proofs } = await supabase
        .from('proofs')
        .select('user_id, challenge_id')
        .in('challenge_id', ids);
      const hadProof = new Map<string, Set<string>>();
      (proofs ?? []).forEach(p => {
        const s = hadProof.get(p.user_id) ?? new Set<string>();
        s.add(p.challenge_id);
        hadProof.set(p.user_id, s);
      });
      const streakMap: Record<string, number> = {};
      for (const r of leaderboard) {
        let count = 0;
        const set = hadProof.get(r.user_id) ?? new Set<string>();
        for (const w of ids) {
          if (set.has(w)) count += 1; else break;
        }
        streakMap[r.user_id] = count;
      }
      setStreaks(streakMap);
    })();
  }, [groupId, leaderboard]);

  const period = useMemo(() => {
    if (!challenge) return '';
    const s = new Date(challenge.week_start).toLocaleDateString(undefined, { month:'short', day:'numeric' });
    const e = new Date(challenge.week_end).toLocaleDateString(undefined, { month:'short', day:'numeric' });
    return `${s} – ${e}`;
  }, [challenge]);

  const deadlineLabel = useMemo(() => {
    if (!challenge) return '';
    try {
      const d = new Date(challenge.week_end);
      return d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).replace(',', '');
    } catch {
      return '';
    }
  }, [challenge]);

  async function submitProof() {
    if (!userId) { setStatus('Sign in first.'); return; }
    if (!challenge) { setStatus('No open challenge.'); return; }
    if (!miles) { setStatus('Enter miles.'); return; }
    let image_url: string | null = null;

    if (file) {
      const path = `proofs/${userId}/${Date.now()}_${file.name}`;
      const up = await supabase.storage.from('proofs').upload(path, file);
      if (up.error) { setStatus(up.error.message); return; }
      const signed = await supabase.storage.from('proofs').createSignedUrl(path, 3600);
      if (signed.error) { setStatus(signed.error.message); return; }
      image_url = signed.data.signedUrl;
    }

    const { error } = await supabase.from('proofs').insert({
      challenge_id: challenge.id,
      user_id: userId,
      miles: Number(miles),
      image_url
    });
    if (error) { setStatus(error.message); toast.error(error.message); return; }
    setStatus('Submitted!');
    toast.success('Proof submitted');
    try { confetti({ particleCount: 45, spread: 60, origin: { y: 0.3 } }); } catch {}
    setMiles('');
    setFile(null);
    await loadLeaderboard(challenge.id);
  }

  return (
    <div className="min-h-svh px-4 pb-6 pt-6 md:px-6">
      <div className="mx-auto grid max-w-[1000px] gap-4">
        {showWelcome && group && (
          <Card className="relative p-4">
            <Button
              onClick={() => setShowWelcome(false)}
              aria-label="Dismiss"
              variant="secondary"
              size="sm"
              className="absolute right-2 top-2"
            >
              ✕
            </Button>
            <div className="mb-2 text-[18px] font-black">Run Pool — Simple Rules</div>
            <div className="text-zinc-900">
              <ol className="ml-4 grid list-decimal gap-2">
                <li>
                  <strong>What this is</strong>
                  <div>A weekly running game with friends. Do the miles, show proof, and share the prize.</div>
                </li>
                <li>
                  <strong>Roles</strong>
                  <div>Coach: made the group and sets the weekly rule.</div>
                  <div>Banker: trusted person who holds the money (Apple Pay/Venmo).</div>
                  <div>Players: everyone who joins.</div>
                </li>
                <li>
                  <strong>This week’s rule (example)</strong>
                  <div>
                    Goal: <em>Run at least 5 miles between Mon–Sun 11:59 PM.</em> The rule stays the
                    same all week. Changes apply next week.
                  </div>
                </li>
                <li>
                  <strong>How to join each week</strong>
                  <div>Tap “Enter This Week.” Send the entry fee to the Banker. You’re in for this week’s game.</div>
                </li>
                <li>
                  <strong>Do the run + show proof</strong>
                  <div>
                    Run anytime during the week. Upload one clear screenshot from a tracker (Apple
                    Fitness, Strava, Nike Run Club, Garmin, etc.).
                  </div>
                  <div>
                    Your proof must show: <em>distance</em>, <em>date</em>, <em>your name/initials</em> (if the app shows it).
                  </div>
                </li>
                <li>
                  <strong>End of week (what happens)</strong>
                  <div>
                    <strong>PASS</strong> = you met the goal with valid proof. <strong>FAIL</strong> = you didn’t meet the goal or
                    didn’t upload proof.
                  </div>
                  <div>Prize = money from the FAIL players. Winners split the prize equally.</div>
                  <div>If nobody passes → prize carries to next week. If everyone passes → no prize; fun only.</div>
                </li>
                <li>
                  <strong>Leaderboard</strong>
                  <div>Updates as proofs come in. Shows miles and PASS/FAIL. It’s public to the group.</div>
                </li>
                <li>
                  <strong>Deadlines (don’t miss them)</strong>
                  <div>Proof upload closes Sun 11:59 PM. Late = FAIL. No exceptions.</div>
                </li>
                <li>
                  <strong>Fair play (no drama)</strong>
                  <div>One account per person. Real runs only. No treadmill “keyboard miles.”</div>
                  <div>Blurry or cropped proof = FAIL. Coach can reject suspicious proofs.</div>
                </li>
                <li>
                  <strong>Money basics (kept offline)</strong>
                  <div>
                    Banker holds the money. The app only tracks who entered and who won. Payouts are sent by the Banker
                    after results are posted.
                  </div>
                </li>
              </ol>
              <div className="mt-2 border-t border-dashed border-zinc-300 pt-2 text-zinc-700">
                <div className="mb-1 font-extrabold">Quick example</div>
                <div>Entry: $25. 12 players enter.</div>
                <div>Results: 7 PASS, 5 FAIL.</div>
                <div>Prize = 5 × $25 = $125 → split by 7 winners ≈ $17 each (leftover cents roll to next week).</div>
              </div>
            </div>
          </Card>
        )}

        {group && (
          <Card className="flex flex-wrap items-center justify-start gap-3 p-4 md:justify-between">
            <div>
              <h1 className="m-0 text-[22px] font-extrabold">{group.name}</h1>
              <div className="text-zinc-700">{group.rule}</div>
              {challenge && <div className="text-sm text-zinc-700">Week: {period}</div>}
            </div>
            {challenge && (
              <Badge variant="outline" className="rounded-xl px-3 py-2 order-3 w-full sm:order-none sm:w-auto">
                Pot: <span className="font-bold">${challenge.pot}</span>
              </Badge>
            )}
            <Button onClick={() => setShowWelcome(true)} aria-label="View Rules" variant="secondary" className="w-full sm:w-auto">
              View Rules
            </Button>
            {isAdmin && (
              <a href={`/group/${groupId}/admin`} className="no-underline">
                <Button variant="primary" className="w-full sm:w-auto">Admin</Button>
              </a>
            )}
          </Card>
        )}

        <Card className="p-4">
          <div className="mb-2 text-lg font-extrabold">This week at a glance</div>
          <div className="text-sm text-zinc-700">Week: {period}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {group?.rule && (
              <Badge variant="secondary" className="rounded-full">Rule: {group.rule}</Badge>
            )}
            {typeof group?.entry_fee === 'number' && (
              <Badge variant="secondary" className="rounded-full">Entry: ${group.entry_fee}</Badge>
            )}
            {deadlineLabel && (
              <Badge variant="secondary" className="rounded-full">Deadline: {deadlineLabel}</Badge>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input readOnly value={joinLink} className="min-w-0 w-full sm:flex-1" />
            <Button onClick={copyInvite} variant="secondary" size="sm" className="w-full sm:w-auto">{copied ? 'Copied' : 'Copy link'}</Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-2 text-lg font-extrabold">Submit Weekly Data</div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Miles e.g. 5.2"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              type="text"
              inputMode="decimal"
              className="max-w-[200px]"
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm w-full sm:w-auto"
            />
            <Button onClick={submitProof} variant="primary" className="w-full sm:w-auto">Submit</Button>
          </div>
          <div className="mt-2 text-xs text-zinc-600">{status}</div>
        </Card>

        <Card className="overflow-hidden p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-lg font-extrabold">Leaderboard {challenge ? `— ${period}` : ''}</div>
            {challenge && (
              <div className="text-sm text-zinc-700">Pot: ${challenge.pot}</div>
            )}
          </div>

          {loadingBoard ? (
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700">
                    <th className="p-2 text-left">Rank</th>
                    <th className="p-2 text-left">Runner</th>
                    <th className="p-2 text-right">Miles</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Award</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-t border-zinc-200">
                      <td className="p-2"><Skeleton className="h-6 w-6 rounded-full" /></td>
                      <td className="p-2"><Skeleton className="h-5 w-40" /></td>
                      <td className="p-2 text-right"><Skeleton className="ml-auto h-5 w-10" /></td>
                      <td className="p-2"><Skeleton className="h-5 w-16" /></td>
                      <td className="p-2"><Skeleton className="h-5 w-16" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full border-collapse">
                <thead>
                  <tr className="bg-zinc-100 text-zinc-700">
                    <th className="p-2 text-left">Rank</th>
                    <th className="p-2 text-left">Runner</th>
                    <th className="p-2 text-right">Miles</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Award</th>
                  </tr>
                </thead>
                <tbody>
                  {(leaderboard ?? []).map((r, i) => {
                    const rank = i + 1;
                    const uid = r.user_id;
                    const st = streaks[uid] ?? 0;
                    return (
                      <tr key={uid} className="border-t border-zinc-200">
                        <td className="p-2">
                          <div className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm font-bold">
                            {rank}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <Avatar name={r.name ?? r.user_id} size="sm" />
                            <div className="font-semibold">{r.name ?? r.user_id}</div>
                            {st >= 2 && (
                              <Badge className="ml-1" variant="secondary">🔥 {st}w</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-right">{Number(r.miles).toFixed(1)}</td>
                        <td className="p-2">—</td>
                        <td className="p-2">—</td>
                      </tr>
                    );
                  })}

                  {(!leaderboard || leaderboard.length === 0) && (
                    <tr>
                      <td colSpan={5} className="p-3 text-zinc-600">No submissions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
