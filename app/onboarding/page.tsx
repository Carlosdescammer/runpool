// app/onboarding/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Require auth, and fetch current user id
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        router.replace('/signin');
        return;
      }
      // If already in a group, send to that dashboard
      const { data: memberships } = await supabase
        .from('memberships')
        .select('group_id')
        .eq('user_id', uid)
        .limit(1);
      if (memberships && memberships.length > 0) {
        router.replace(`/group/${memberships[0].group_id}`);
      }
    });
  }, [router]);

  async function saveProfile() {
    if (!userId) { setStatus('Please sign in first.'); return; }
    setStatus('Saving profile…');
    const { error } = await supabase.from('user_profiles').upsert({ id: userId, name });
    if (error) setStatus(error.message); else setStatus('Profile saved.');
  }

  function joinByToken() {
    if (!token) { setStatus('Enter an invite token.'); return; }
    let t = token.trim();
    try {
      if (t.includes('http')) {
        const u = new URL(t);
        t = u.searchParams.get('token') ?? t;
      }
    } catch { /* ignore parse errors */ }
    router.push(`/join?token=${encodeURIComponent(t)}`);
  }

  return (
    <div style={{ minHeight:'calc(100vh - 80px)', display:'grid', placeItems:'center', padding:'24px 16px',
                  background:'linear-gradient(180deg, rgba(99,102,241,0.12), rgba(236,72,153,0.12))' }}>
      <div style={{ width:'100%', maxWidth:560, background:'#fff', border:'1px solid #eee', borderRadius:12,
                     boxShadow:'0 10px 30px rgba(0,0,0,0.06)', padding:24 }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:800 }}>Welcome — let’s get you set up</h1>
        <div style={{ height:8 }} />
        <div style={{ color:'#6B7280', fontSize:14 }}>Choose a display name, then join an existing group or create a new one.</div>

        <div style={{ height:20 }} />
        <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Display name</label>
        <input
          placeholder="e.g. Jamie"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }}
        />
        <div style={{ height:12 }} />
        <button onClick={saveProfile}
                style={{ padding:'10px 14px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:700 }}>
          Save profile
        </button>

        <div style={{ height:24 }} />
        <div style={{ fontWeight:800 }}>Join a group</div>
        <div style={{ height:8 }} />
        <div style={{ fontSize:12, color:'#6B7280' }}>
          If someone sent you an invite link, paste the token here. You can also paste the full URL; we’ll extract the token.
        </div>
        <div style={{ height:8 }} />
        <input
          placeholder="Invite token or link"
          value={token}
          onChange={(e)=>setToken(e.target.value)}
          style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }}
        />
        <div style={{ height:8 }} />
        <button onClick={joinByToken}
                style={{ padding:'10px 14px', borderRadius:10, background:'#111827', color:'#fff', fontWeight:700 }}>
          Join group
        </button>

        <div style={{ height:24 }} />
        <div style={{ fontWeight:800 }}>Or create a new group</div>
        <div style={{ height:8 }} />
        <div style={{ fontSize:12, color:'#6B7280' }}>
          You’ll set the rules and dates, then get an invite link you can copy and share. Members who open the link will see a
          description and be guided to create a profile and join.
        </div>
        <div style={{ height:12 }} />
        <Link href="/group/new" style={{ textDecoration:'none' }}>
          <div style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #ddd', textAlign:'center', fontWeight:700, color:'#7C3AED' }}>
            Create a group
          </div>
        </Link>

        <div style={{ height:16 }} />
        <div style={{ color:'#6B7280', fontSize:12, minHeight:18 }}>{status}</div>
      </div>
    </div>
  );
}
