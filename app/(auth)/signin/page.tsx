'use client';
import { supabase } from '@/lib/supabase/client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const router = useRouter();
  const [isSmartAuth, setIsSmartAuth] = useState(false);

  useEffect(() => {
    
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
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
    setStatus(`Signed in as ${user?.email}. Checking your groups...`);
    if (!user) return;
    
    // Try both possible table names to see which exists
    const { data: groupMembers, error: gmErr } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id);
    
  
    const { data: memberships, error: mErr } = await supabase
      .from('memberships')
      .select('group_id, role')
      .eq('user_id', user.id);
    
    // Use whichever table worked
    const userGroups = (!gmErr && groupMembers) ? groupMembers : (!mErr && memberships) ? memberships : null;
    
    if (userGroups && userGroups.length > 0) {
      setStatus(`Found your group! Redirecting...`);
      router.replace(`/group/${userGroups[0].group_id}`);
      return;
    }
    
    // Otherwise go to onboarding to complete profile and create/join a group
    setStatus('No groups found. Redirecting to setup...');
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
  async function smartAuth(e?: React.FormEvent) {
    e?.preventDefault();
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
          setStatus('Account exists but password is incorrect. Try "Forgot your password?" to reset it.');
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="inner">
          {userId && (
            <div style={{ fontSize: '14px', marginBottom: '16px' }}>
              You're already signed in.
            </div>
          )}

          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 8px 0' }}>
              Sign in to your account
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>
              Welcome back — let's get you on the board.
            </p>
          </div>

          <form onSubmit={smartAuth} method="post">
            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="field"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                enterKeyHint="next"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <label htmlFor="password" style={{
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={forgotPassword}
                  style={{
                    fontSize: '14px',
                    color: 'var(--accent)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Forgot your password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="field"
                autoComplete="current-password"
                enterKeyHint="done"
              />
            </div>

            {/* Remember me */}
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              marginBottom: '24px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  margin: 0
                }}
              />
              Remember me
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="btn primary"
              style={{ width: '100%', marginBottom: '20px' }}
              disabled={isSmartAuth}
            >
              {isSmartAuth ? 'Checking...' : 'Sign in / Create account'}
            </button>
          </form>

          <p style={{
            fontSize: '14px',
            color: 'var(--muted)',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            We'll automatically sign you in or create an account as needed.
          </p>

          {status && (
            <div style={{
              fontSize: '14px',
              padding: '12px',
              background: 'var(--chip)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
