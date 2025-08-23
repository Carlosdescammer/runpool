// app/group/[id]/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

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
  const [rankDelta, setRankDelta] = useState<Record<string, number>>({});
  const [movement, setMovement] = useState<Record<string, 'up' | 'down' | 'same'>>({});
  const [joinTop3, setJoinTop3] = useState<Record<string, boolean>>({});
  const [dropTop3, setDropTop3] = useState<Record<string, boolean>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
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
    setShowWelcome(searchParams.get('joined') === '1');
  }, [searchParams]);

  async function loadLeaderboard(challengeId: string) {
    const { data: rows } = await supabase
      .from('leaderboard_week')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('miles', { ascending: false });
    setLeaderboard(rows ?? []);
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
    if (error) { setStatus(error.message); return; }
    setStatus('Submitted!');
    setMiles('');
    setFile(null);
    await loadLeaderboard(challenge.id);
  }

  return (
    <div style={{
      minHeight: '100svh',
      padding: 'calc(24px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) calc(24px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left))',
      background: 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(236,72,153,0.10))'
    }}>
      <div style={{ maxWidth: 1000, margin:'0 auto', display:'grid', gap:16 }}>
        {showWelcome && group && (
          <div style={{ background:'#EEF2FF', border:'1px solid #E5E7EB', borderRadius:12, padding:16,
                        boxShadow:'0 10px 30px rgba(0,0,0,0.06)', position:'relative' }}>
            <button onClick={()=>setShowWelcome(false)}
                    aria-label="Dismiss"
                    style={{ position:'absolute', right:10, top:10, border:'1px solid #ddd', borderRadius:8, background:'#fff', padding:'4px 8px' }}>✕</button>
            <div style={{ fontWeight:900, marginBottom:8, fontSize:18 }}>Run Pool — Simple Rules</div>
            <div style={{ color:'#111827', lineHeight:1.4 }}>
              <ol style={{ margin:'0 0 0 18px', padding:0, display:'grid', gap:8 }}>
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
                  <div>Goal: <em>Run at least 5 miles between Mon–Sun 11:59 PM.</em> The rule stays the same all week. Changes apply next week.</div>
                </li>
                <li>
                  <strong>How to join each week</strong>
                  <div>Tap “Enter This Week.” Send the entry fee to the Banker. You’re in for this week’s game.</div>
                </li>
                <li>
                  <strong>Do the run + show proof</strong>
                  <div>Run anytime during the week. Upload one clear screenshot from a tracker (Apple Fitness, Strava, Nike Run Club, Garmin, etc.).</div>
                  <div>Your proof must show: <em>distance</em>, <em>date</em>, <em>your name/initials</em> (if the app shows it).</div>
                </li>
                <li>
                  <strong>End of week (what happens)</strong>
                  <div><strong>PASS</strong> = you met the goal with valid proof. <strong>FAIL</strong> = you didn’t meet the goal or didn’t upload proof.</div>
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
                  <div>Banker holds the money. The app only tracks who entered and who won. Payouts are sent by the Banker after results are posted.</div>
                </li>
              </ol>
              <div style={{ marginTop:10, paddingTop:10, borderTop:'1px dashed #D1D5DB', color:'#374151' }}>
                <div style={{ fontWeight:800, marginBottom:4 }}>Quick example</div>
                <div>Entry: $25. 12 players enter.</div>
                <div>Results: 7 PASS, 5 FAIL.</div>
                <div>Prize = 5 × $25 = $125 → split by 7 winners ≈ $17 each (leftover cents roll to next week).</div>
              </div>
            </div>
          </div>
        )}
        {group && (
          <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:12, padding:16,
                        boxShadow:'0 10px 30px rgba(0,0,0,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>{group.name}</h1>
              <div style={{ color:'#6B7280' }}>{group.rule}</div>
              {challenge && <div style={{ color:'#6B7280', fontSize:14 }}>Week: {period}</div>}
            </div>
            {challenge && (
              <div style={{ padding:'10px 14px', border:'1px solid #e5e7eb', borderRadius:10 }}>
                Pot: <strong>{`$${challenge.pot}`}</strong>
              </div>
            )}
            <button
              onClick={()=>setShowWelcome(true)}
              aria-label="View Rules"
              style={{ padding:'10px 14px', minHeight:44, fontSize:16, border:'1px solid #e5e7eb', borderRadius:10, background:'#FFFFFF', fontWeight:700 }}>
              View Rules
            </button>
            {isAdmin && (
              <a href={`/group/${groupId}/admin`} style={{ textDecoration:'none' }}>
                <div style={{ padding:'10px 14px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:700 }}>
                  Admin
                </div>
              </a>
            )}
          </div>
        )}

        {/* Submit proof */}
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:12, padding:16,
                      boxShadow:'0 10px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight:800, marginBottom:8 }}>Submit Weekly Data</div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <input placeholder="Miles e.g. 5.2" value={miles} onChange={e=>setMiles(e.target.value)}
                   type="text" inputMode="decimal"
                   style={{ padding:12, minHeight:48, fontSize:16, border:'1px solid #ddd', borderRadius:8 }} />
            <input type="file" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
            <button onClick={submitProof}
                    style={{ padding:'12px 16px', minHeight:44, fontSize:16, borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:700 }}>
              Submit
            </button>
          </div>
          <div style={{ color:'#6B7280', marginTop:8, fontSize:12 }}>{status}</div>
        </div>

        {/* Leaderboard */}
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:12,
                      boxShadow:'0 10px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ padding:12, borderBottom:'1px solid #eee', fontWeight:800 }}>
            Leaderboard {challenge ? `— ${period}` : ''}
          </div>
          <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth: 560 }}>
            <thead>
              <tr style={{ background:'#f5f5f5', color:'#555' }}>
                <th style={{ textAlign:'left', padding:10 }}>Rank</th>
                <th style={{ textAlign:'left', padding:10 }}>Name</th>
                <th style={{ textAlign:'left', padding:10 }}>Streak</th>
                <th style={{ textAlign:'right', padding:10 }}>Miles</th>
                <th style={{ textAlign:'right', padding:10 }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {(leaderboard ?? []).map((r, i) => {
                const rank = i + 1;
                const uid = r.user_id;
                const d = rankDelta[uid] ?? 0;
                const mv = movement[uid] ?? 'same';
                const st = streaks[uid] ?? 0;
                const topBg = rank === 1 ? '#FFF4D6' : rank === 2 ? '#F3F4F6' : rank === 3 ? '#FDEAD7' : '#FFFFFF';
                const highlightBg = joinTop3[uid] ? '#ECFDF5' : (dropTop3[uid] ? '#FEF2F2' : topBg);
                const rowStyle: React.CSSProperties = {
                  borderTop: '1px solid #eee',
                  background: highlightBg,
                  transition: 'transform 300ms ease, box-shadow 300ms ease, background-color 300ms ease',
                  transform: joinTop3[uid] ? 'scale(1.01)' : 'none',
                  boxShadow: joinTop3[uid] ? '0 6px 20px rgba(16,185,129,0.25)' : dropTop3[uid] ? '0 6px 20px rgba(239,68,68,0.15)' : 'none'
                };
                const medal: { text: string; bg: string; fg: string } | null = rank === 1
                  ? { text: '1st', bg: '#F59E0B', fg: '#FFF' }
                  : rank === 2
                  ? { text: '2nd', bg: '#9CA3AF', fg: '#111' }
                  : rank === 3
                  ? { text: '3rd', bg: '#B45309', fg: '#FFF' }
                  : null;
                const deltaChip = (
                  <span style={{
                    display:'inline-block', minWidth:34, textAlign:'right',
                    padding:'2px 8px', borderRadius:12,
                    background: mv==='up' ? '#D1FAE5' : mv==='down' ? '#FEE2E2' : '#F3F4F6',
                    color: mv==='up' ? '#065F46' : mv==='down' ? '#991B1B' : '#6B7280',
                    fontWeight:700, fontSize:12
                  }}>
                    {mv==='up' ? '▲' : mv==='down' ? '▼' : '•'}{d !== 0 ? Math.abs(d) : ''}
                  </span>
                );
                const streakBadge = st >= 2 ? (
                  <span title={`Current streak: ${st} week${st>1?'s':''}`}
                        style={{ marginLeft:8, padding:'2px 8px', borderRadius:10,
                                 background: st>=8 ? '#065F46' : st>=4 ? '#10B981' : '#A7F3D0',
                                 color: st>=4 ? '#FFF' : '#065F46', fontWeight:700, fontSize:12 }}>
                    🔥 {st}
                  </span>
                ) : null;
                return (
                  <tr key={uid} style={rowStyle}>
                    <td style={{ padding:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        {medal && (
                          <span style={{ background: medal.bg, color: medal.fg, padding:'2px 8px', borderRadius:999, fontWeight:800, fontSize:12 }}>{medal.text}</span>
                        )}
                        <span style={{ fontWeight:800 }}>{rank}</span>
                      </div>
                    </td>
                    <td style={{ padding:10 }}>
                      <span>{r.name ?? r.user_id}</span>
                      {streakBadge}
                    </td>
                    <td style={{ padding:10 }}>
                      {st >= 2 ? <span style={{ color:'#065F46', fontWeight:700 }}>{st}w</span> : <span style={{ color:'#6B7280' }}>—</span>}
                    </td>
                    <td style={{ padding:10, textAlign:'right' }}>{Number(r.miles).toFixed(1)}</td>
                    <td style={{ padding:10, textAlign:'right' }}>{deltaChip}</td>
                  </tr>
                );
              })}
              {(!leaderboard || leaderboard.length===0) && (
                <tr><td colSpan={5} style={{ padding:12, color:'#666' }}>No submissions yet.</td></tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
