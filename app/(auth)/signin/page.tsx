'use client';
import { supabase } from '@/lib/supabase/client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const router = useRouter();
  const [isSmartAuth, setIsSmartAuth] = useState(false);

  useEffect(() => {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase client initialized:', !!supabase);
    
    supabase.auth.getUser().then(({ data }) => {
      console.log('Initial getUser result:', data);
      setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      console.log('Auth state change:', { event: _e, session });
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
    console.log('postAuthRedirect called');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    setStatus(`Signed in as ${user?.email}. Checking your groups...`);
    if (!user) return;
    
    // Try both possible table names to see which exists
    console.log('Trying group_members table...');
    const { data: groupMembers, error: gmErr } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', user.id);
    console.log('group_members query result:', { data: groupMembers, error: gmErr });
    
    console.log('Trying memberships table...');  
    const { data: memberships, error: mErr } = await supabase
      .from('memberships')
      .select('group_id, role')
      .eq('user_id', user.id);
    console.log('memberships query result:', { data: memberships, error: mErr });
    
    // Use whichever table worked
    const userGroups = (!gmErr && groupMembers) ? groupMembers : (!mErr && memberships) ? memberships : null;
    console.log('Final user groups:', userGroups);
    
    if (userGroups && userGroups.length > 0) {
      console.log('User has groups, redirecting to:', userGroups[0].group_id);
      setStatus(`Found your group! Redirecting...`);
      router.replace(`/group/${userGroups[0].group_id}`);
      return;
    }
    
    // Otherwise go to onboarding to complete profile and create/join a group
    console.log('No groups found, redirecting to onboarding');
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
    
    console.log('Attempting sign-in with email:', email);
    
    if (remember && typeof window !== 'undefined') localStorage.setItem('rememberEmail', email);
    if (!remember && typeof window !== 'undefined') localStorage.removeItem('rememberEmail');
    
    // Try sign-in first
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    console.log('Sign-in result:', { error: signInError });
    
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
    <div className="min-h-[calc(100dvh-0px)] grid place-items-center px-4 py-10">
      <div className="card w-full max-w-xl">
        <div className="inner space-y-6">
          {userId && (
            <div className="text-sm">You're already signed in.</div>
          )}
          
          <div>
            <h1 className="text-2xl font-bold">Sign in to your account</h1>
            <p className="text-sm text-[var(--muted)] mt-1">
              Welcome back — let's get you on the board.
            </p>
          </div>

          <form onSubmit={smartAuth} method="post" className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
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
                className="input"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                inputMode="email"
                enterKeyHint="next"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <button 
                  type="button"
                  onClick={forgotPassword}
                  className="text-sm text-[var(--accent)] hover:underline"
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
                className="input"
                autoComplete="current-password"
                enterKeyHint="done"
              />
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={remember} 
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--stroke)] bg-[var(--card)]" 
              />
              Remember me
            </label>

            {/* Submit */}
            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={isSmartAuth}
            >
              {isSmartAuth ? 'Checking...' : 'Sign in / Create account'}
            </button>
          </form>

          <p className="text-sm text-[var(--muted)]">
            We'll automatically sign you in or create an account as needed.
          </p>
          
          {status && (
            <div className="text-sm">{status}</div>
          )}
        </div>
      </div>
    </div>
  );
}
