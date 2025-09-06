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
  const [isSmartAuth, setIsSmartAuth] = useState(false);

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


  async function forgotPassword() {
    if (!email) { setStatus('Enter your email first.'); return; }
    setStatus('Sending reset email…');
    const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/auth/update-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) setStatus(error.message); else setStatus('Check your email for the password reset link.');
  }

  // Smart auth function that tries sign-in first, then sign-up if needed
  async function smartAuth() {
    if (!email || !password) { setStatus('Enter email and password.'); return; }
    setIsSmartAuth(true);
    setStatus('Checking your account...');
    
    if (remember && typeof window !== 'undefined') localStorage.setItem('rememberEmail', email);
    if (!remember && typeof window !== 'undefined') localStorage.removeItem('rememberEmail');
    
    // Try sign-in first
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    
    if (!signInError) {
      // Sign-in successful
      setStatus('Signed in successfully!');
      await postAuthRedirect();
      setIsSmartAuth(false);
      return;
    }
    
    // If sign-in failed, check if it's because user doesn't exist
    if (signInError.message.includes('Invalid login credentials') || 
        signInError.message.includes('not found') || 
        signInError.message.includes('User not found')) {
      
      setStatus('No account found. Creating new account...');
      // Try sign-up
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      
      if (!signUpError) {
        if (!data.session) {
          setStatus('Account created! Check your email to confirm your address.');
        } else {
          setStatus('Account created and signed in!');
          await postAuthRedirect();
        }
      } else {
        if (signUpError.message.includes('User already registered')) {
          setStatus('Account exists but password is incorrect. Try \"Forgot your password?\" to reset it.');
        } else {
          setStatus(signUpError.message);
        }
      }
    } else {
      // Other sign-in error
      if (signInError.message.includes('Email not confirmed')) {
        setStatus('Please check your email and click the confirmation link before signing in.');
      } else {
        setStatus(signInError.message);
      }
    }
    
    setIsSmartAuth(false);
  }

  return (
    <main className="auth-shell">
      <section className="card auth-card">
        <div className="inner">
          {userId && (
            <div className="mb-2 text-sm">You're already signed in.</div>
          )}
          
          <header className="auth-head">
            <h1 className="auth-title">Sign in to your account</h1>
            <p className="auth-sub">Welcome back — let's get you on the board.</p>
          </header>

          <div className="auth-form">
            <div className="field">
              <label htmlFor="email" className="label">Email</label>
              <input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                autoComplete="email"
                enterKeyHint="next"
                required 
              />
            </div>

            <div className="field">
              <div className="row-between">
                <label htmlFor="password" className="label">Password</label>
                <button onClick={forgotPassword} className="link-muted">Forgot your password?</button>
              </div>
              <input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                enterKeyHint="done"
                required 
              />
            </div>

            <div className="field-row between">
              <label className="checkbox">
                <input 
                  type="checkbox" 
                  checked={remember} 
                  onChange={(e) => setRemember(e.target.checked)} 
                /> 
                <span>Remember me</span>
              </label>
            </div>

            <button 
              onClick={smartAuth} 
              className="btn btn-primary auth-submit" 
              disabled={isSmartAuth}
            >
              {isSmartAuth ? 'Checking...' : 'Sign in / Create account'}
            </button>
          </div>

          <p className="auth-note">
            We'll automatically sign you in or create an account as needed.
          </p>
          
          {status && (
            <div className="mt-3 text-sm">{status}</div>
          )}
        </div>
      </section>
    </main>
  );
}
