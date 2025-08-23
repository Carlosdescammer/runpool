// app/signin/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div style={{ minHeight:'calc(100vh - 80px)', display:'grid', placeItems:'center', padding:'24px 16px',
                  background:'linear-gradient(180deg, rgba(99,102,241,0.12), rgba(236,72,153,0.12))' }}>
      <div style={{ width:'100%', maxWidth:440, background:'#fff', border:'1px solid #eee', borderRadius:12,
                     boxShadow:'0 10px 30px rgba(0,0,0,0.06)', padding:24 }}>
        {userId && (
          <div style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>You&#39;re already signed in.</div>
        )}
        <h1 style={{ margin:0, fontSize:24, fontWeight:800 }}>Sign in to your account</h1>
        <div style={{ height:12 }} />
        <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Email</label>
        <input
          placeholder="you@example.com"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }}
        />
        <div style={{ height:12 }} />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Password</label>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#374151' }}>
              <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
              Remember me
            </label>
            <button onClick={forgotPassword} style={{ background:'none', border:'none', color:'#6366F1', cursor:'pointer', fontSize:12 }}>
              Forgot your password?
            </button>
          </div>
        </div>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }}
        />
        <div style={{ height:16 }} />
        <button onClick={passwordSignIn}
                style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:700 }}>
          Sign in
        </button>
        <div style={{ height:12 }} />
        <div style={{ fontSize:12, color:'#6B7280', textAlign:'center' }}>
          New to Run Pool?{' '}
          <button onClick={passwordSignUp} style={{ background:'none', border:'none', color:'#6366F1', cursor:'pointer', textDecoration:'underline' }}>
            Create account
          </button>
        </div>
        <div style={{ height:12 }} />
        <div style={{ color:'#6B7280', fontSize:12, minHeight:18 }}>{status}</div>
      </div>
    </div>
  );
}
