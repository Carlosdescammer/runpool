// app/group/new/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';

export default function NewGroup() {
  const [name, setName] = useState('Past Our Prime');
  const [rule, setRule] = useState('Run at least 5 miles');
  const [pot, setPot] = useState(100);
  const [status, setStatus] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const [weekStart, setWeekStart] = useState<string>(() => {
    const d = new Date();
    const day = d.getDay(); // 0=Sun
    const diff = d.getDate() - day + 1; // Monday start
    const m = new Date(d.setDate(diff));
    return m.toISOString().slice(0,10);
  });
  const [weekEnd, setWeekEnd] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + (7 - d.getDay()));
    return d.toISOString().slice(0,10);
  });

  async function createGroup() {
    setStatus('Creating group…');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus('Sign in first.'); return; }

    const { error: pErr } = await supabase.from('user_profiles').select('id').eq('id', user.id).single();
    if (pErr) { setStatus('Save profile first on the home page.'); return; }

    const { data: g, error } = await supabase.from('groups')
      .insert({ name, rule, entry_fee: pot, owner_id: user.id })
      .select().single();
    if (error) { setStatus(error.message); return; }

    await supabase.from('memberships').insert({ user_id: user.id, group_id: g.id, role: 'admin' });
    setGroupId(g.id);
    setStatus('Group created.');

    // Create this week's challenge
    const { error: cErr } = await supabase.from('challenges')
      .insert({ group_id: g.id, week_start: weekStart, week_end: weekEnd, pot, status: 'OPEN' });
    if (cErr) { setStatus(`Group ok, challenge error: ${cErr.message}`); }

    // Create invite token
    const token = crypto.randomUUID().replace(/-/g, '');
    const exp = new Date(Date.now() + 14*24*3600*1000).toISOString();
    const { error: iErr } = await supabase.from('invites').insert({
      token, group_id: g.id, created_by: user.id, expires_at: exp
    });
    if (iErr) { setStatus(`Invite error: ${iErr.message}`); return; }
    const link = `${window.location.origin}/join?token=${token}`;
    setInviteUrl(link);
  }

  return (
    <div style={{ minHeight:'calc(100vh - 80px)', display:'grid', placeItems:'center', padding:'24px 16px',
                  background:'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(236,72,153,0.10))' }}>
      <div style={{ width:'100%', maxWidth:520, background:'#fff', border:'1px solid #eee', borderRadius:12,
                     boxShadow:'0 10px 30px rgba(0,0,0,0.06)', padding:24 }}>
        <h1 style={{ fontSize:24, fontWeight:800, margin:0 }}>Create Group</h1>
        <div style={{ height:12 }} />
        <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Group Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Past Our Prime"
               style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }}/>
        <div style={{ height:12 }} />
        <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Weekly Rule</label>
        <input value={rule} onChange={e=>setRule(e.target.value)} placeholder="Run at least 5 miles"
               style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }}/>
        <div style={{ height:12 }} />
        <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Entry Fee ($)</label>
        <input type="number" value={pot} onChange={e=>setPot(Number(e.target.value))} placeholder="25"
               style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }}/>
        <div style={{ height:12 }} />
        <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 180px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Week start</div>
            <input type="date" value={weekStart} onChange={e=>setWeekStart(e.target.value)}
                   style={{ marginTop:6, padding:10, border:'1px solid #ddd', borderRadius:8, width:'100%' }}/>
          </div>
          <div style={{ flex:'1 1 180px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Week end</div>
            <input type="date" value={weekEnd} onChange={e=>setWeekEnd(e.target.value)}
                   style={{ marginTop:6, padding:10, border:'1px solid #ddd', borderRadius:8, width:'100%' }}/>
          </div>
        </div>
        <div style={{ height:16 }} />
        <button onClick={createGroup}
                style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:700 }}>
          Create
        </button>

        {groupId && (
          <>
            <a href={`/group/${groupId}`} style={{ textDecoration:'none' }}>
              <div style={{ marginTop:12, padding:'10px 14px', borderRadius:8, border:'1px solid #ddd', textAlign:'center' }}>
                Go to Group Dashboard
              </div>
            </a>
            {inviteUrl && (
              <div style={{ marginTop:12, padding:12, border:'1px dashed #bbb', borderRadius:8 }}>
                <div style={{ fontWeight:600, marginBottom:6 }}>Invite Link</div>
                <div style={{ fontSize:14, wordBreak:'break-all' }}>{inviteUrl}</div>
                <button onClick={()=>navigator.clipboard.writeText(inviteUrl)}
                        style={{ marginTop:8, padding:'6px 10px', borderRadius:6, border:'1px solid #ddd' }}>
                  Copy
                </button>
              </div>
            )}
          </>
        )}
        <div style={{ color:'#6B7280', fontSize:12, minHeight:18, marginTop:12 }}>{status}</div>
      </div>
    </div>
  );
}
