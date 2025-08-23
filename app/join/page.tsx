// app/join/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function Join() {
  const [msg, setMsg] = useState('Joining…');

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (!token) { setMsg('Missing invite token'); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMsg('Sign in first, then reload this link.'); return; }

      const { data, error } = await supabase.rpc('join_group_with_token', { p_token: token });
      if (error) { setMsg(error.message); return; }
      window.location.href = `/group/${data}`;
    })();
  }, []);

  return (
    <div style={{ minHeight:'calc(100vh - 80px)', display:'grid', placeItems:'center', padding:'24px 16px',
                  background:'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(236,72,153,0.10))' }}>
      <div style={{ width:'100%', maxWidth:520, background:'#fff', border:'1px solid #eee', borderRadius:12,
                     boxShadow:'0 10px 30px rgba(0,0,0,0.06)', padding:24, textAlign:'center' }}>
        <h1 style={{ fontSize:22, fontWeight:800, margin:0 }}>Joining group…</h1>
        <div style={{ color:'#6B7280', marginTop:8 }}>{msg}</div>
      </div>
    </div>
  );
}
