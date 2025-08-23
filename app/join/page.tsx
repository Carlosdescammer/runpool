// app/join/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
          .from('user_profiles')
          .select('name')
          .eq('id', inv.created_by)
          .maybeSingle();
        setInviterName((p?.name as string | null) ?? null);
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
    if (error) { setStatus(error.message); return; }
    // If email confirmations are disabled, session will exist and we can proceed.
    // If not, we must ask the user to confirm; Supabase returns no session.
    if (data.session) {
      setUserId(data.user?.id ?? null);
      await supabase.from('user_profiles').upsert({ id: data.user?.id, name: displayName });
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
    if (error) { setStatus(error.message); toast.error(error.message); return; }
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
    <div className="min-h-svh grid place-items-center px-4 py-6 md:px-6">
      <Card className="w-full max-w-[720px] p-6">
        {/* Invite header */}
        <div className="text-center">
          <h1 className="m-0 text-2xl font-extrabold">{loading ? 'Loading…' : headerLine}</h1>
          {!loading && (
            <div className="mt-1 text-zinc-600">{subLine}</div>
          )}
        </div>

        {!loading && group && (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
            <div className="font-extrabold">About {group.name}</div>
            <div className="mt-1 text-zinc-800">
              <div><strong>Weekly rule:</strong> {group.rule || '—'}</div>
              {typeof group.entry_fee === 'number' && (
                <div><strong>Entry fee:</strong> ${group.entry_fee}</div>
              )}
              {invitedEmail && (
                <div className="mt-1 text-zinc-600">
                  This invite is for <strong>{invitedEmail}</strong>.
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ height:18 }} />
        {/* Auth section */}
        {userId ? (
          <div className="text-center">
            <div className="mb-2 text-zinc-600">You’re signed in.</div>
            {!token && (
              <div className="mx-auto mb-3 w-full max-w-[420px]">
                <Label>Invite link or token</Label>
                <Input placeholder="Paste invite link or token" value={tokenIn} onChange={e=>setTokenIn(e.target.value)} />
              </div>
            )}
            <Button onClick={joinNow} disabled={busy} variant="primary" size="lg" className="w-[260px]">
              {busy ? 'Joining…' : 'Join group'}
            </Button>
          </div>
        ) : (
          <div>
            {/* Toggle */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={()=>setMode('signup')} variant={mode==='signup' ? 'primary' : 'secondary'}>
                Create account
              </Button>
              <Button onClick={()=>setMode('signin')} variant={mode==='signin' ? 'primary' : 'secondary'}>
                I already have an account
              </Button>
            </div>

            <div className="h-3" />
            {mode === 'signup' ? (
              <div className="grid gap-2.5">
                <Label>Display name</Label>
                <Input placeholder="e.g. Jamie" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoCapitalize="none" autoCorrect="off" inputMode="email" autoComplete="email" enterKeyHint="next" />
                <Label>Password</Label>
                <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" enterKeyHint="done" />
                <Button onClick={handleSignup} disabled={busy} variant="default" size="lg" className="mt-1">
                  {busy ? 'Creating account…' : 'Create account & Join'}
                </Button>
              </div>
            ) : (
              <div className="grid gap-2.5">
                <Label>Email</Label>
                <Input type="email" value={emailIn} onChange={e=>setEmailIn(e.target.value)} placeholder="you@example.com" autoCapitalize="none" autoCorrect="off" inputMode="email" autoComplete="email" enterKeyHint="next" />
                <Label>Password</Label>
                <Input type="password" value={passwordIn} onChange={e=>setPasswordIn(e.target.value)} placeholder="••••••••" autoComplete="current-password" enterKeyHint="done" />
                <Button onClick={handleSignin} disabled={busy} variant="primary" size="lg" className="mt-1">
                  {busy ? 'Signing in…' : 'Sign in & Join'}
                </Button>
              </div>
            )}
            {/* Invite token input for users without a token in URL */}
            {!token && (
              <div className="mt-4">
                <div className="mb-1 font-semibold">Join a group</div>
                <div className="text-sm text-zinc-600">Paste your invite link or token.</div>
                <div className="mt-2 grid gap-2">
                  <Input placeholder="Paste invite link or token" value={tokenIn} onChange={e=>setTokenIn(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="h-3" />
        <div className="min-h-[18px] text-center text-xs text-zinc-600">{status}</div>
        {/* Rules: Run Pool — Simple Rules */}
        <div className="h-5" />
        <div className="border-t border-zinc-200 pt-3">
          <div className="mb-1 font-extrabold">Runpool — How it works</div>
          <div className="grid gap-2 text-sm text-zinc-800">
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
      </Card>
    </div>
  );
}
