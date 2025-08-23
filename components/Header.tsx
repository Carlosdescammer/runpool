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
  const adminMatch = pathname?.match(/^\/group\/([^/]+)\/admin(?:$|\/)$/);
  const adminGroupId = adminMatch?.[1] ?? null;

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/signin');
  }

  return (
    <header style={{
      background: '#fff', color: '#111',
      padding: 'calc(12px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) 12px calc(16px + env(safe-area-inset-left))',
      position:'sticky', top:0, zIndex:20,
      borderBottom:'1px solid #eee',
      minHeight: 56,
    }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Link href="/" style={{ color:'#111', textDecoration:'none', fontWeight:800 }}>Run Pool</Link>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {adminGroupId && (
            <Link href={`/group/${adminGroupId}`} style={{ textDecoration:'none' }}>
              <span style={{ background:'#7C3AED', color:'#fff', padding:'10px 14px', minHeight:44, lineHeight:'24px', fontSize:16, borderRadius:10, fontWeight:700, display:'inline-flex', alignItems:'center' }}>← Back</span>
            </Link>
          )}
          {isSignedIn ? (
            pathname !== '/' && (
              <button onClick={signOut}
                      style={{ background:'#7C3AED', color:'#fff', padding:'10px 14px', minHeight:44, fontSize:16, borderRadius:10, fontWeight:700, border:'none', cursor:'pointer' }}>
                Sign Out
              </button>
            )
          ) : (
            showSignIn && (
              <Link href="/signin" style={{ background:'#7C3AED', color:'#fff', padding:'10px 14px', minHeight:44, fontSize:16, borderRadius:10, textDecoration:'none', fontWeight:700 }}>
                Sign In
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
