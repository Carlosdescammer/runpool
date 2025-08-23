// app/signin/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Page() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Prefill email if user chose Remember me previously
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rememberEmail');
      if (saved) {
        setEmail(saved);
        setRemember(true);
      }
    }
  }, []);

  const postAuthRedirect = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Check memberships
    const { data: memberships, error: mErr } = await supabase
      .from('memberships')
      .select('group_id')
      .eq('user_id', user.id)
      .limit(1);
    if (!mErr && memberships && memberships.length > 0) {
      router.replace(`/group/${memberships[0].group_id}`);
      return;
    }
    // Otherwise go to onboarding to complete profile and create/join a group
    router.replace('/onboarding');
  }, [router]);

  useEffect(() => {
    if (userId) {
      // If already signed in when landing on /signin, route appropriately
      postAuthRedirect();
    }
  }, [userId, postAuthRedirect]);

  async function passwordSignIn() {
    if (!email || !password) { setStatus('Enter email and password.'); return; }
    setStatus('Signing in…');
    if (remember && typeof window !== 'undefined') localStorage.setItem('rememberEmail', email);
    if (!remember && typeof window !== 'undefined') localStorage.removeItem('rememberEmail');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setStatus(error.message);
    else {
      setStatus('Signed in.');
      await postAuthRedirect();
    }
  }

  async function passwordSignUp() {
    if (!email || !password) { setStatus('Enter email and password.'); return; }
    setStatus('Creating account…');
    if (remember && typeof window !== 'undefined') localStorage.setItem('rememberEmail', email);
    if (!remember && typeof window !== 'undefined') localStorage.removeItem('rememberEmail');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setStatus(error.message); return; }
    if (!data.session) {
      setStatus('Account created. Check your email to confirm your address.');
    } else {
      setStatus('Account created and signed in.');
      await postAuthRedirect();
    }
  }

  async function forgotPassword() {
    if (!email) { setStatus('Enter your email first.'); return; }
    setStatus('Sending reset email…');
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) setStatus(error.message); else setStatus('Check your email for the password reset link.');
  }

  return (
    <div className="min-h-[100svh] grid place-items-center px-4 py-6 md:px-6">
      <Card className="w-full max-w-[480px] p-6">
        {userId && (
          <div className="mb-2 text-sm text-zinc-700">You’re already signed in.</div>
        )}
        <h1 className="m-0 text-2xl font-extrabold">Sign in to your account</h1>
        <div className="h-3" />

        <Label>Email</Label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          inputMode="email"
          autoComplete="email"
          enterKeyHint="next"
          className="mt-2"
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Label>Password</Label>
          <div className="flex items-center gap-3 text-sm text-[color:var(--rp-text)]">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
              Remember me
            </label>
            <button onClick={forgotPassword} className="text-[color:var(--rp-text)] underline">
              Forgot your password?
            </button>
          </div>
        </div>
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          enterKeyHint="done"
          className="mt-2"
        />

        <div className="h-4" />
        <Button onClick={passwordSignIn} variant="primary" size="lg" className="w-full">
          Sign in
        </Button>

        <div className="h-3" />
        <div className="text-center text-sm text-zinc-700">
          New to Runpool?{' '}
          <button onClick={passwordSignUp} className="text-[color:var(--rp-text)] underline">
            Create account
          </button>
        </div>
        <div className="h-3" />
        <div className="min-h-[18px] text-sm text-zinc-700">{status}</div>
      </Card>
    </div>
  );
}
