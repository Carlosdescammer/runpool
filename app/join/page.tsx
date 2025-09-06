// app/join/page.tsx
'use client';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

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
  const [tokenIn, setTokenIn] = useState<string>("");
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
      // If there's no token in the URL, we render a general join page (no error)

      // Current auth state
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      setUserId(uid);

      if (t) {
        // Load invite via security-definer RPC (limited fields)
        const { data: invRows, error: invErr } = await supabase.rpc('get_invite_public', { p_token: t });
        if (invErr) { setStatus('This invite is invalid or was revoked.'); toast.error('This invite is invalid or was revoked.'); setLoading(false); return; }
        const inv = Array.isArray(invRows) ? invRows[0] : null;
        if (!inv) { setStatus('This invite is invalid or was revoked.'); toast.error('This invite is invalid or was revoked.'); setLoading(false); return; }

        // Check expiry
        const expired = inv.expires_at ? Date.now() > Date.parse(inv.expires_at) : false;
        if (expired) { setStatus('This invite has expired. Ask the admin to send a new one.'); toast.error('This invite has expired. Ask the admin to send a new one.'); setLoading(false); return; }
        setInvitedEmail((inv as InviteInfo).invited_email ?? null);

        // Load group
        const { data: g } = await supabase
          .from('groups')
          .select('id, name, rule, entry_fee')
          .eq('id', inv.group_id)
          .single();
        setGroup(g as GroupInfo);

        // Load inviter name (optional)
        const { data: p } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', inv.created_by)
          .maybeSingle();
        setInviterName((p?.full_name as string | null) ?? null);
      }

      setLoading(false);
    })();
  }, []);

  function extractToken(raw: string | null): string | null {
    if (!raw) return null;
    const val = raw.trim();
    if (!val) return null;
    // Accept either bare token or full URL containing ?token=
    if (val.includes('token=')) {
      try {
        const url = new URL(val);
        return url.searchParams.get('token');
      } catch {
        const m = val.match(/token=([^&\s]+)/);
        return m ? m[1] : val;
      }
    }
    return val;
  }

  async function joinNow() {
    const tok = token ?? extractToken(tokenIn);
    if (!tok) { setStatus('Paste an invite token or link.'); toast.error('Paste an invite token or link.'); return; }
    // Enforce email-locked join when invite has an invited_email
    try {
      const { data: auth } = await supabase.auth.getUser();
      const emailNow = auth.user?.email?.toLowerCase() ?? null;
      const invited = invitedEmail?.toLowerCase() ?? null;
      if (invited && emailNow && invited !== emailNow) {
        const msg = `This invite is for ${invitedEmail}. You are signed in as ${auth.user?.email}. Please sign out and sign in with the invited email, or ask the admin to resend the invite to your address.`;
        setStatus(msg);
        toast.error(msg);
        return;
      }
    } catch {}
    setBusy(true);
    // Use email-locked RPC only (DB has been updated)
    const { data, error } = await supabase.rpc('join_group_with_token_email', { p_token: tok });
    setBusy(false);
    if (error) { setStatus(error.message); toast.error(error.message); return; }
    window.location.href = `/group/${data}?joined=1`;
  }

  async function handleSignup() {
    if (!email || !password) { setStatus('Enter email and password.'); toast.error('Enter email and password.'); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      // Handle common signup errors with better messaging
      if (error.message.includes('User already registered') || error.message.includes('already been registered')) {
        setStatus('This email already has an account! Try signing in instead using the "Sign in to existing account" button.');
        toast.error('Email already registered - try signing in instead!');
        // Auto-switch to sign in mode and prefill email
        setMode('signin');
        setEmailIn(email);
      } else if (error.message.includes('Password')) {
        setStatus('Password must be at least 6 characters long.');
        toast.error('Password must be at least 6 characters long.');
      } else if (error.message.includes('email')) {
        setStatus('Please enter a valid email address.');
        toast.error('Please enter a valid email address.');
      } else {
        setStatus(error.message);
        toast.error(error.message);
      }
      return;
    }
    // If email confirmations are disabled, session will exist and we can proceed.
    // If not, we must ask the user to confirm; Supabase returns no session.
    if (data.session) {
      setUserId(data.user?.id ?? null);
      await supabase.from('profiles').upsert({ 
        id: data.user?.id, 
        full_name: displayName,
        email: data.user?.email || ''
      });
      await joinNow();
    } else {
      setStatus('Check your email to confirm your account, then reopen this invite link to finish joining.');
      toast.message('Check your email to confirm your account, then reopen this invite link to finish joining.');
    }
  }

  async function handleSignin() {
    if (!emailIn || !passwordIn) { setStatus('Enter your email and password.'); toast.error('Enter your email and password.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: emailIn, password: passwordIn });
    setBusy(false);
    if (error) {
      // Handle common sign-in errors with better messaging
      if (error.message.includes('Invalid login credentials')) {
        setStatus('Email or password is incorrect. Double-check your credentials or create an account if you don&apos;t have one yet.');
        toast.error('Incorrect email or password. Try again or create an account.');
      } else if (error.message.includes('Email not confirmed')) {
        setStatus('Please check your email and click the confirmation link before signing in.');
        toast.error('Please confirm your email address first.');
      } else if (error.message.includes('not found') || error.message.includes('User not found')) {
        setStatus('No account found with this email. Try creating an account instead!');
        toast.error('No account found - try creating an account!');
        // Auto-switch to signup mode and prefill email
        setMode('signup');
        setEmail(emailIn);
      } else {
        setStatus(error.message);
        toast.error(error.message);
      }
      return;
    }
    await joinNow();
  }

  const headerLine = useMemo(() => {
    if (!token && !group) return "Join a group";
    if (!group) return "You’re invited to join";
    return `Join ${group.name}`;
  }, [group, token]);

  const subLine = useMemo(() => {
    if (!token && !group) return 'Paste your invite link or token. Or create a group.';
    const by = inviterName ? ` from ${inviterName}` : '';
    return `You’ve been invited${by}. Sign in and join.`;
  }, [inviterName, token, group]);

  return (
    <div className="min-h-svh wrap">
      <div className="card" style={{maxWidth: '720px', margin: '0 auto'}}>
        <div className="inner">
          {/* Invite header */}
          <div style={{textAlign: 'center', marginBottom: '24px'}}>
            <h1 style={{fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0'}}>
              {loading ? 'Loading…' : headerLine}
            </h1>
            {!loading && (
              <p style={{color: 'var(--muted)', margin: 0}}>{subLine}</p>
            )}
          </div>

          {!loading && group && (
            <div className="card" style={{marginBottom: '24px'}}>
              <div className="inner">
                <h3 style={{fontWeight: '800', marginBottom: '12px'}}>About {group.name}</h3>
                <div style={{lineHeight: '1.6'}}>
                  <div><strong>Weekly rule:</strong> {group.rule || '—'}</div>
                  {typeof group.entry_fee === 'number' && (
                    <div><strong>Entry fee:</strong> ${(group.entry_fee / 100).toFixed(2)}</div>
                  )}
                  {invitedEmail && (
                    <div style={{marginTop: '8px', color: 'var(--muted)'}}>
                      This invite is for <strong>{invitedEmail}</strong>.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Auth section */}
          {userId ? (
            <div style={{textAlign: 'center'}}>
              <p style={{marginBottom: '16px', color: 'var(--muted)'}}>You're signed in.</p>
              {!token && (
                <div style={{marginBottom: '16px', maxWidth: '420px', margin: '0 auto 16px'}}>
                  <label className="label">Invite link or token</label>
                  <input 
                    className="input" 
                    placeholder="Paste invite link or token" 
                    value={tokenIn} 
                    onChange={e=>setTokenIn(e.target.value)} 
                  />
                </div>
              )}
              <button 
                onClick={joinNow} 
                disabled={busy} 
                className="btn btn-primary"
                style={{minWidth: '200px'}}
              >
                {busy ? 'Joining…' : 'Join group'}
              </button>
            </div>
          ) : (
            <div>
              {/* Toggle */}
              <div style={{marginBottom: '16px', textAlign: 'center', fontSize: '14px', color: 'var(--muted)'}}>
                💡 <strong>Not sure?</strong> Try either option - we'll help you if you pick the wrong one!
              </div>
              <div style={{display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap'}}>
                <button 
                  onClick={()=>setMode('signup')} 
                  className={`btn ${mode==='signup' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Create account
                </button>
                <button 
                  onClick={()=>setMode('signin')} 
                  className={`btn ${mode==='signin' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Sign in to existing account
                </button>
              </div>

              {mode === 'signup' ? (
                <div style={{display: 'grid', gap: '12px'}}>
                  <label className="label">Display name</label>
                  <input 
                    className="input" 
                    placeholder="e.g. Jamie" 
                    value={displayName} 
                    onChange={e=>setDisplayName(e.target.value)} 
                  />
                  <label className="label">Email</label>
                  <input 
                    className="input" 
                    type="email" 
                    value={email} 
                    onChange={e=>setEmail(e.target.value)} 
                    placeholder="you@example.com" 
                    autoCapitalize="none" 
                    autoCorrect="off" 
                    inputMode="email" 
                    autoComplete="email" 
                    enterKeyHint="next" 
                  />
                  <label className="label">Password</label>
                  <input 
                    className="input" 
                    type="password" 
                    value={password} 
                    onChange={e=>setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    autoComplete="new-password" 
                    enterKeyHint="done" 
                  />
                  <button 
                    onClick={handleSignup} 
                    disabled={busy} 
                    className="btn btn-primary"
                    style={{marginTop: '8px'}}
                  >
                    {busy ? 'Creating account…' : 'Create account & Join'}
                  </button>
                </div>
              ) : (
                <div style={{display: 'grid', gap: '12px'}}>
                  <label className="label">Email</label>
                  <input 
                    className="input" 
                    type="email" 
                    value={emailIn} 
                    onChange={e=>setEmailIn(e.target.value)} 
                    placeholder="you@example.com" 
                    autoCapitalize="none" 
                    autoCorrect="off" 
                    inputMode="email" 
                    autoComplete="email" 
                    enterKeyHint="next" 
                  />
                  <label className="label">Password</label>
                  <input 
                    className="input" 
                    type="password" 
                    value={passwordIn} 
                    onChange={e=>setPasswordIn(e.target.value)} 
                    placeholder="••••••••" 
                    autoComplete="current-password" 
                    enterKeyHint="done" 
                  />
                  <button 
                    onClick={handleSignin} 
                    disabled={busy} 
                    className="btn btn-primary"
                    style={{marginTop: '8px'}}
                  >
                    {busy ? 'Signing in…' : 'Sign in & Join'}
                  </button>
                </div>
              )}
              {/* Invite token input for users without a token in URL */}
              {!token && (
                <div style={{marginTop: '24px'}}>
                  <h3 style={{fontWeight: '600', marginBottom: '8px'}}>Join a group</h3>
                  <p style={{fontSize: '14px', color: 'var(--muted)', marginBottom: '12px'}}>
                    Paste your invite link or token.
                  </p>
                  <input 
                    className="input" 
                    placeholder="Paste invite link or token" 
                    value={tokenIn} 
                    onChange={e=>setTokenIn(e.target.value)} 
                  />
                </div>
              )}
          </div>
          )}

          {status && (
            <div style={{
              textAlign: 'center', 
              fontSize: '14px', 
              color: 'var(--muted)', 
              marginTop: '16px',
              padding: '12px',
              backgroundColor: 'var(--muted-bg)',
              borderRadius: '8px'
            }}>
              {status}
            </div>
          )}

          {/* Rules: Run Pool — Simple Rules */}
          <div style={{borderTop: '1px solid var(--stroke)', marginTop: '32px', paddingTop: '24px'}}>
            <h3 style={{fontWeight: '800', marginBottom: '16px'}}>Runpool — How it works</h3>
            <div style={{display: 'grid', gap: '12px', fontSize: '14px', lineHeight: '1.6'}}>
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
    </div>
  );
}
