// app/join/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';

type InviteInfo = {
  token: string;
  group_id: string;
  created_by: string;
  expires_at: string | null;
  invited_email?: string | null;
};

type GroupInfo = {
  id: string;
  name: string;
  rule: string | null;
  entry_fee: number | null;
};

export default function Join() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

  // Forms
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailIn, setEmailIn] = useState('');
  const [passwordIn, setPasswordIn] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      setToken(t);
      if (!t) { setStatus('Missing invite token.'); setLoading(false); return; }

      // Current auth state
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      setUserId(uid);

      // Load invite
      const { data: inv } = await supabase
        .from('invites')
        .select('*')
        .eq('token', t)
        .maybeSingle();
      if (!inv) { setStatus('This invite is invalid or was revoked.'); setLoading(false); return; }

      // Check expiry
      const expired = inv.expires_at ? Date.now() > Date.parse(inv.expires_at) : false;
      if (expired) { setStatus('This invite has expired. Ask the admin to send a new one.'); setLoading(false); return; }
      setInvite(inv as InviteInfo);
      setInvitedEmail((inv as any).invited_email ?? null);

      // Load group
      const { data: g } = await supabase
        .from('groups')
        .select('id, name, rule, entry_fee')
        .eq('id', inv.group_id)
        .single();
      setGroup(g as GroupInfo);

      // Load inviter name (optional)
      const { data: p } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', inv.created_by)
        .maybeSingle();
      setInviterName((p?.name as string | null) ?? null);

      setLoading(false);
    })();
  }, []);

  async function joinNow() {
    if (!token) { setStatus('Missing invite token.'); return; }
    setBusy(true);
    // Prefer email-validated RPC; fallback to legacy if unavailable
    let data: any = null; let error: any = null;
    try {
      const res = await supabase.rpc('join_group_with_token_email', { p_token: token });
      data = res.data; error = res.error;
      if (error && (error.message?.includes('does not exist') || error.code === 'PGRST204')) {
        // Fallback
        const legacy = await supabase.rpc('join_group_with_token', { p_token: token });
        data = legacy.data; error = legacy.error;
      }
    } catch {
      const legacy = await supabase.rpc('join_group_with_token', { p_token: token });
      data = legacy.data; error = legacy.error;
    }
    setBusy(false);
    if (error) { setStatus(error.message); return; }
    window.location.href = `/group/${data}?joined=1`;
  }

  async function afterAuthJoin() {
    // Ensure profile display name exists
    if (displayName && userId) {
      await supabase.from('user_profiles').upsert({ id: userId, name: displayName });
    }
    await joinNow();
  }

  async function handleSignup() {
    if (!email || !password) { setStatus('Enter email and password.'); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) { setStatus(error.message); return; }
    // If email confirmations are disabled, session will exist and we can proceed.
    // If not, we must ask the user to confirm; Supabase returns no session.
    if (data.session) {
      setUserId(data.user?.id ?? null);
      await supabase.from('user_profiles').upsert({ id: data.user?.id, name: displayName });
      await joinNow();
    } else {
      setStatus('Check your email to confirm your account, then reopen this invite link to finish joining.');
    }
  }

  async function handleSignin() {
    if (!emailIn || !passwordIn) { setStatus('Enter your email and password.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailIn, password: passwordIn });
    setBusy(false);
    if (error) { setStatus(error.message); return; }
    await joinNow();
  }

  const headerLine = useMemo(() => {
    if (!group) return 'You\'re invited to join';
    return `You\'re invited to join ${group.name}`;
  }, [group]);

  const subLine = useMemo(() => {
    const by = inviterName ? ` from ${inviterName}` : '';
    return `Open the door to your running challenge${by}.`;
  }, [inviterName]);

  return (
    <div style={{ minHeight:'calc(100vh - 80px)', display:'grid', placeItems:'center', padding:'24px 16px',
                  background:'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(236,72,153,0.10))' }}>
      <div style={{ width:'100%', maxWidth:720, background:'#fff', border:'1px solid #eee', borderRadius:12,
                     boxShadow:'0 10px 30px rgba(0,0,0,0.06)', padding:24 }}>
        {/* Invite header */}
        <div style={{ textAlign:'center' }}>
          <h1 style={{ fontSize:24, fontWeight:800, margin:0 }}>{loading ? 'Loading…' : headerLine}</h1>
          {!loading && (
            <div style={{ color:'#6B7280', marginTop:6 }}>{subLine}</div>
          )}
        </div>

        {!loading && group && (
          <div style={{ marginTop:16, border:'1px solid #eee', borderRadius:10, padding:14, background:'#FAFAFF' }}>
            <div style={{ fontWeight:800 }}>About {group.name}</div>
            <div style={{ height:6 }} />
            <div style={{ color:'#374151' }}>
              <div><strong>Weekly Rule:</strong> {group.rule || '—'}</div>
              {typeof group.entry_fee === 'number' && (
                <div><strong>Entry Fee:</strong> ${group.entry_fee}</div>
              )}
              {invitedEmail && (
                <div style={{ marginTop:6, color:'#6B7280' }}>
                  This invite is for <strong>{invitedEmail}</strong>.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ height:18 }} />
        {/* Auth section */}
        {userId ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ color:'#6B7280', marginBottom:10 }}>You are signed in. Accept the invite to join this group.</div>
            <button onClick={joinNow} disabled={busy}
                    style={{ padding:'12px 16px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:800, width:240 }}>
              {busy ? 'Joining…' : 'Join group'}
            </button>
          </div>
        ) : (
          <div>
            {/* Toggle */}
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button onClick={()=>setMode('signup')}
                      style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #ddd',
                               background: mode==='signup' ? '#7C3AED' : '#fff', color: mode==='signup' ? '#fff' : '#111' }}>
                Create account
              </button>
              <button onClick={()=>setMode('signin')}
                      style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #ddd',
                               background: mode==='signin' ? '#7C3AED' : '#fff', color: mode==='signin' ? '#fff' : '#111' }}>
                I already have an account
              </button>
            </div>

            <div style={{ height:12 }} />
            {mode === 'signup' ? (
              <div style={{ display:'grid', gap:10 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Display name</label>
                <input placeholder="e.g. Jamie" value={displayName} onChange={e=>setDisplayName(e.target.value)}
                       style={{ padding:12, border:'1px solid #ddd', borderRadius:8 }} />
                <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Email</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                       placeholder="you@example.com" style={{ padding:12, border:'1px solid #ddd', borderRadius:8 }} />
                <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Password</label>
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                       placeholder="••••••••" style={{ padding:12, border:'1px solid #ddd', borderRadius:8 }} />
                <button onClick={handleSignup} disabled={busy}
                        style={{ marginTop:4, padding:'12px 16px', borderRadius:10, background:'#111827', color:'#fff', fontWeight:800 }}>
                  {busy ? 'Creating account…' : 'Create account & Join'}
                </button>
              </div>
            ) : (
              <div style={{ display:'grid', gap:10 }}>
                <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Email</label>
                <input type="email" value={emailIn} onChange={e=>setEmailIn(e.target.value)}
                       placeholder="you@example.com" style={{ padding:12, border:'1px solid #ddd', borderRadius:8 }} />
                <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Password</label>
                <input type="password" value={passwordIn} onChange={e=>setPasswordIn(e.target.value)}
                       placeholder="••••••••" style={{ padding:12, border:'1px solid #ddd', borderRadius:8 }} />
                <button onClick={handleSignin} disabled={busy}
                        style={{ marginTop:4, padding:'12px 16px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:800 }}>
                  {busy ? 'Signing in…' : 'Sign in & Join'}
                </button>
              </div>
            )}
          </div>
        )}

        <div style={{ height:12 }} />
        <div style={{ color:'#6B7280', fontSize:12, minHeight:18, textAlign:'center' }}>{status}</div>
        {/* Rules: Run Pool — Simple Rules */}
        <div style={{ height:20 }} />
        <div style={{ borderTop:'1px solid #eee', paddingTop:12 }}>
          <div style={{ fontWeight:800, marginBottom:6 }}>Run Pool — Simple Rules</div>
          <div style={{ color:'#374151', fontSize:14, display:'grid', gap:8 }}>
            <div><strong>1) What this is</strong><br/>A weekly running game with friends. Do the miles, show proof, and share the prize.</div>
            <div><strong>2) Roles</strong><br/>Coach: made the group and sets the weekly rule.<br/>Banker: trusted person who holds the money (Apple Pay/Venmo).<br/>Players: everyone who joins.</div>
            <div><strong>3) This week’s rule (example)</strong><br/>Goal: Run at least 5 miles between Mon–Sun 11:59 PM. The rule stays the same all week. Changes apply next week.</div>
            <div><strong>4) How to join each week</strong><br/>Tap “Enter This Week.” Send the entry fee to the Banker. You’re in for this week’s game.</div>
            <div><strong>5) Do the run + show proof</strong><br/>Run anytime during the week. Upload one clear screenshot from a tracker (Apple Fitness, Strava, Nike Run Club, Garmin, etc.). Your proof must show: distance, date, your name/initials (if the app shows it).</div>
            <div><strong>6) End of week (what happens)</strong><br/>PASS = you met the goal with valid proof. FAIL = you didn’t meet the goal or didn’t upload proof. Prize = money from the FAIL players. Winners split the prize equally. If nobody passes → prize carries to next week. If everyone passes → no prize; fun only.</div>
            <div><strong>7) Leaderboard</strong><br/>Updates as proofs come in. Shows miles and PASS/FAIL. It’s public to the group.</div>
            <div><strong>8) Deadlines (don’t miss them)</strong><br/>Proof upload closes Sun 11:59 PM. Late = FAIL. No exceptions.</div>
            <div><strong>9) Fair play (no drama)</strong><br/>One account per person. Real runs only. No treadmill “keyboard miles.” Blurry or cropped proof = FAIL. Coach can reject suspicious proofs.</div>
            <div><strong>10) Money basics (kept offline)</strong><br/>Banker holds the money. The app only tracks who entered and who won. Payouts are sent by the Banker after results are posted.</div>
            <div><strong>Quick example</strong><br/>Entry: $25. 12 players enter. Results: 7 PASS, 5 FAIL. Prize = 5 × $25 = $125 → split by 7 winners ≈ $17 each (leftover cents roll to next week).</div>
          </div>
        </div>
      </div>
    </div>
  );
}
