// components/Header.tsx
'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  const isSignedIn = !!userId;
  const showSignIn = !isSignedIn && pathname !== '/signin';

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/signin');
  }

  return (
    <header style={{
      background: '#fff', color: '#111', padding: '12px 16px', position:'sticky', top:0, zIndex:20,
      borderBottom:'1px solid #eee'
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <Link href="/" style={{ color:'#111', textDecoration:'none', fontWeight:800 }}>Run Pool</Link>
        {isSignedIn ? (
          <button onClick={signOut}
                  style={{ background:'#7C3AED', color:'#fff', padding:'8px 12px', borderRadius:8, fontWeight:700, border:'none', cursor:'pointer' }}>
            Sign Out
          </button>
        ) : (
          showSignIn && (
            <Link href="/signin" style={{ background:'#7C3AED', color:'#fff', padding:'8px 12px', borderRadius:8, textDecoration:'none', fontWeight:700 }}>
              Sign In
            </Link>
          )
        )}
      </div>
    </header>
  );
}
