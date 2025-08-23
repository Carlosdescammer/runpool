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
    <div style={{ minHeight:'calc(100vh - 80px)', padding:'24px 16px',
                  background:'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(236,72,153,0.10))' }}>
      <div style={{ maxWidth: 1000, margin:'0 auto', display:'grid', gap:16 }}>
        {showWelcome && group && (
          <div style={{ background:'#EEF2FF', border:'1px solid #E5E7EB', borderRadius:12, padding:16,
                        boxShadow:'0 10px 30px rgba(0,0,0,0.06)', position:'relative' }}>
            <button onClick={()=>setShowWelcome(false)}
                    aria-label="Dismiss"
                    style={{ position:'absolute', right:10, top:10, border:'1px solid #ddd', borderRadius:8, background:'#fff', padding:'4px 8px' }}>✕</button>
            <div style={{ fontWeight:800, marginBottom:6 }}>Welcome to {group.name}!</div>
            <div style={{ color:'#374151' }}>
              <div style={{ marginBottom:6 }}>
                <strong>Rules:</strong> {group.rule || 'See admin for details.'}
              </div>
              <div style={{ marginBottom:6 }}>
                <strong>What to do next:</strong>
                <ul style={{ margin:'6px 0 0 18px' }}>
                  <li>Scroll down to "Submit Weekly Data" and add your miles and optional proof.</li>
                  <li>Check the Leaderboard to see how everyone is doing.</li>
                  <li>Come back each week to stay in the challenge.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        {group && (
          <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:12, padding:16,
                        boxShadow:'0 10px 30px rgba(0,0,0,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>{group.name}</h1>
              <div style={{ color:'#6B7280' }}>{group.rule}</div>
              {challenge && <div style={{ color:'#6B7280', fontSize:14 }}>Week: {period}</div>}
            </div>
            {challenge && (
              <div style={{ padding:'10px 14px', border:'1px solid #e5e7eb', borderRadius:10 }}>
                Pot: <strong>${challenge.pot}</strong>
              </div>
            )}
            {isAdmin && (
              <a href={`/group/${groupId}/admin`} style={{ marginLeft:12, textDecoration:'none' }}>
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
                   style={{ padding:10, border:'1px solid #ddd', borderRadius:8 }} />
            <input type="file" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
            <button onClick={submitProof}
                    style={{ padding:'10px 14px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:700 }}>
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
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#f5f5f5', color:'#555' }}>
                <th style={{ textAlign:'left', padding:10 }}>Rank</th>
                <th style={{ textAlign:'left', padding:10 }}>Name</th>
                <th style={{ textAlign:'right', padding:10 }}>Miles</th>
              </tr>
            </thead>
            <tbody>
              {(leaderboard ?? []).map((r, i) => (
                <tr key={r.user_id} style={{ borderTop:'1px solid #eee', background: i===0 ? '#fff7d6' : 'white' }}>
                  <td style={{ padding:10 }}>{i+1}</td>
                  <td style={{ padding:10 }}>{r.name ?? r.user_id}</td>
                  <td style={{ padding:10, textAlign:'right' }}>{Number(r.miles).toFixed(1)}</td>
                </tr>
              ))}
              {(!leaderboard || leaderboard.length===0) && (
                <tr><td colSpan={3} style={{ padding:12, color:'#666' }}>No submissions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
