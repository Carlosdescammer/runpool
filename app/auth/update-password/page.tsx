// app/auth/update-password/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function UpdatePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Ensure user arrived via the email reset link (recovery session)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setStatus('Open this page using the link from your reset password email.');
    });
  }, []);

  async function updatePassword() {
    if (!newPassword || !confirmPassword) { setStatus('Enter and confirm your new password.'); return; }
    if (newPassword !== confirmPassword) { setStatus('Passwords do not match.'); return; }

    setStatus('Updating password…');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setStatus(error.message);
    else setStatus('Password updated! You can now sign in.');
  }

  return (
    <div style={{ minHeight:'calc(100vh - 80px)', display:'grid', placeItems:'center', padding:'24px 16px',
                  background:'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(236,72,153,0.10))' }}>
      <div style={{ width:'100%', maxWidth:480, background:'#fff', border:'1px solid #eee', borderRadius:12,
                     boxShadow:'0 10px 30px rgba(0,0,0,0.06)', padding:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, margin:0 }}>Set a new password</h1>
        <div style={{ height:12 }} />
        {ready && (
          <>
            <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>New password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ marginTop:6, padding:12, border: '1px solid #ddd', borderRadius: 8, width:'100%' }}
            />
            <div style={{ height:12 }} />
            <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Confirm new password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ marginTop:6, padding: 12, border: '1px solid #ddd', borderRadius: 8, width:'100%' }}
            />
            <div style={{ height:16 }} />
            <button onClick={updatePassword}
                    style={{ width:'100%', padding: '12px 16px', borderRadius: 10, background: '#7C3AED', color: '#fff', fontWeight: 700 }}>
              Update Password
            </button>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop:8 }}>
              After updating, return to <Link href="/signin">Sign In</Link>.
            </div>
          </>
        )}
        <div style={{ color: '#6B7280', fontSize:12, minHeight:18, marginTop:12 }}>{status}</div>
      </div>
    </div>
  );
}
