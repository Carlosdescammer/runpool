// app/group/[id]/admin/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type InviteRow = { token: string; expires_at: string | null; created_at?: string | null; invited_email?: string | null };

export default function Admin() {
  const { id: groupId } = useParams<{ id: string }>();
  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [name, setName] = useState('');
  const [rule, setRule] = useState('');
  const [entryFee, setEntryFee] = useState<number>(100);
  const [pot, setPot] = useState(100);
  const [weekStart, setWeekStart] = useState<string>(new Date().toISOString().slice(0,10));
  const [weekEnd, setWeekEnd] = useState<string>(new Date(Date.now()+6*86400000).toISOString().slice(0,10));
  const [msg, setMsg] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [activeInvites, setActiveInvites] = useState<InviteRow[]>([]);
  const [expiredInvites, setExpiredInvites] = useState<InviteRow[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyAnimating, setCopyAnimating] = useState(false);
  const [emailsInput, setEmailsInput] = useState('');
  const [sendingInvites, setSendingInvites] = useState(false);

  const copyWithAnim = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setCopyAnimating(true);
      setTimeout(() => setCopyAnimating(false), 800);
      setTimeout(() => {
        // Clear the copied key after animation completes
        setCopiedKey((k) => (k === key ? null : k));
      }, 1200);
    } catch (e) {
      setMsg('Unable to copy');
    }
  }, []);

  async function sendMagicLink(email: string, token: string) {
    const redirect = `${window.location.origin}/join?token=${token}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirect },
    });
    return error;
  }

  async function inviteByEmail() {
    if (!emailsInput.trim()) return;
    setSendingInvites(true);
    setMsg('Sending invites…');
    const emails = emailsInput
      .split(/[\n,;]/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg('Sign in first.'); setSendingInvites(false); return; }
    try {
      for (const email of emails) {
        const token = crypto.randomUUID().replace(/-/g, '');
        const exp = new Date(Date.now() + 14*24*3600*1000).toISOString();
        // Try to insert with invited_email; if the column doesn't exist yet, fallback to legacy insert
        const { error } = await supabase.from('invites').insert({
          token, group_id: groupId, created_by: user.id, expires_at: exp, invited_email: email
        } as any);
        if (error) {
          // Fallback without invited_email for backward compatibility
          const { error: fallbackErr } = await supabase.from('invites').insert({
            token, group_id: groupId, created_by: user.id, expires_at: exp
          });
          if (fallbackErr) { setMsg(fallbackErr.message); break; }
        }
        const mailErr = await sendMagicLink(email, token);
        if (mailErr) { setMsg(mailErr.message ?? 'Failed to send some invites'); break; }
      }
      await loadInvites();
      setMsg('Invites sent.');
      setEmailsInput('');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setMsg(message);
    } finally {
      setSendingInvites(false);
    }
  }

  // Client-side guard: ensure current user is admin/owner
  useEffect(() => {
    (async () => {
      setAuthLoading(true);
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      if (!uid) {
        window.location.href = '/signin';
        return;
      }
      const { data: m } = await supabase
        .from('memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', uid)
        .maybeSingle();
      const role = m?.role as ('owner' | 'admin' | 'member' | undefined);
      const ok = role === 'owner' || role === 'admin';
      setAuthorized(!!ok);
      setAuthLoading(false);
      if (!ok) {
        // Redirect non-admins back to group page
        window.location.href = `/group/${groupId}`;
      }
    })();
  }, [groupId]);

  useEffect(() => {
    (async () => {
      // Load current group details
      const { data: g, error } = await supabase.from('groups').select('*').eq('id', groupId).single();
      if (error) { setMsg(error.message); return; }
      if (g) {
        setName(g.name ?? '');
        setRule(g.rule ?? '');
        setEntryFee(g.entry_fee ?? 100);
        setPot(g.entry_fee ?? 100);
      }
    })();
  }, [groupId]);

  const loadInvites = useCallback(async () => {
    const { data: rows, error } = await supabase
      .from('invites')
      .select('*')
      .eq('group_id', groupId)
      .order('expires_at', { ascending: true });
    if (error) { setMsg(error.message); return; }
    const now = Date.now();
    // using InviteRow type declared above
    const active: InviteRow[] = [];
    const expired: InviteRow[] = [];
    const list = (rows ?? []) as InviteRow[];
    list.forEach((r) => {
      const exp = r.expires_at ? Date.parse(r.expires_at) : null;
      const item: InviteRow = { token: r.token, expires_at: r.expires_at, created_at: r.created_at, invited_email: r.invited_email ?? null };
      if (!exp || exp > now) active.push(item); else expired.push(item);
    });
    setActiveInvites(active);
    setExpiredInvites(expired);
  }, [groupId]);

  async function generateInvite() {
    setMsg('Generating invite…');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg('Sign in first.'); return; }
    try {
      const token = crypto.randomUUID().replace(/-/g, '');
      const exp = new Date(Date.now() + 14*24*3600*1000).toISOString();
      const { error } = await supabase.from('invites').insert({
        token, group_id: groupId, created_by: user.id, expires_at: exp
      });
      if (error) { setMsg(error.message); return; }
      const link = `${window.location.origin}/join?token=${token}`;
      setInviteUrl(link);
      setMsg('Invite created.');
      await loadInvites();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setMsg(message);
    }
  }

  useEffect(() => {
    // Load invites after mount or when group changes
    loadInvites();
  }, [groupId, loadInvites]);

  async function revokeInvite(token: string) {
    setMsg('Revoking invite…');
    const { error } = await supabase.from('invites').delete().eq('group_id', groupId).eq('token', token);
    if (error) { setMsg(error.message); return; }
    await loadInvites();
    setMsg('Invite revoked.');
  }

  async function saveGroup() {
    setMsg('Saving…');
    const { error } = await supabase
      .from('groups')
      .update({ name, rule, entry_fee: entryFee })
      .eq('id', groupId);
    setMsg(error ? error.message : 'Saved.');
  }

  async function createWeek() {
    const { error } = await supabase.from('challenges').insert({
      group_id: groupId, pot, week_start: weekStart, week_end: weekEnd, status:'OPEN'
    });
    setMsg(error ? error.message : 'Week created.');
  }

  async function deleteGroupCascade() {
    const ok = window.confirm('Delete this group and all its data? This cannot be undone.');
    if (!ok) return;
    setMsg('Deleting…');
    // Prefer server-side RPC for atomic cascade if available
    try {
      const { error: rpcErr } = await supabase.rpc('delete_group_cascade', { p_group_id: groupId });
      if (!rpcErr) {
        setMsg('Group deleted.');
        setTimeout(() => { window.location.href = '/'; }, 800);
        return;
      }
    } catch {
      // fall through to client-side cascade
    }

    // Fallback: client-side cascade
    // 1) challenges for this group
    const { data: ch, error: chErr } = await supabase.from('challenges').select('id').eq('group_id', groupId);
    if (chErr) { setMsg(chErr.message); return; }
    const challengeIds = (ch ?? []).map(c => c.id);
    // 2) proofs under those challenges
    if (challengeIds.length > 0) {
      const { error: pErr } = await supabase.from('proofs').delete().in('challenge_id', challengeIds);
      if (pErr) { setMsg(pErr.message); return; }
    }
    // 3) delete challenges
    const { error: dChErr } = await supabase.from('challenges').delete().eq('group_id', groupId);
    if (dChErr) { setMsg(dChErr.message); return; }
    // 4) delete memberships
    const { error: mErr } = await supabase.from('memberships').delete().eq('group_id', groupId);
    if (mErr) { setMsg(mErr.message); return; }
    // 5) delete invites
    const { error: iErr } = await supabase.from('invites').delete().eq('group_id', groupId);
    if (iErr) { setMsg(iErr.message); return; }
    // 6) delete group
    const { error: gErr } = await supabase.from('groups').delete().eq('id', groupId);
    if (gErr) { setMsg(gErr.message); return; }
    setMsg('Group deleted.');
    setTimeout(() => { window.location.href = '/'; }, 800);
  }

  return (
    <div style={{ minHeight:'calc(100vh - 80px)', display:'grid', placeItems:'center', padding:'24px 16px',
                  background:'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(236,72,153,0.10))' }}>
      <div style={{ width:'100%', maxWidth:640, background:'#fff', border:'1px solid #eee', borderRadius:12,
                     boxShadow:'0 10px 30px rgba(0,0,0,0.06)', padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <h1 style={{ fontSize:24, fontWeight:800, margin:0 }}>Admin Tools</h1>
          <a href={`/group/${groupId}`} style={{ textDecoration:'none' }}>
            <div style={{ padding:'10px 14px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:800 }}>
              ← Back to dashboard
            </div>
          </a>
        </div>
        {authLoading && (
          <div style={{ marginTop:12, color:'#6B7280' }}>Checking permissions…</div>
        )}
        {!authLoading && !authorized && (
          <div style={{ marginTop:12, color:'#6B7280' }}>Redirecting…</div>
        )}
        <div style={{ height:16 }} />
        <div style={{ fontWeight:800 }}>Group settings</div>
        <div style={{ height:8 }} />
        <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Name</label>
        <input value={name} onChange={e=>setName(e.target.value)}
               placeholder="Group name"
               style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }} />
        <div style={{ height:12 }} />
        <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Weekly rule</label>
        <input value={rule} onChange={e=>setRule(e.target.value)}
               placeholder="e.g. Run at least 5 miles"
               style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }} />
        <div style={{ height:12 }} />
        <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Entry Fee ($)</label>
        <input type="number" value={entryFee} onChange={e=>setEntryFee(Number(e.target.value))}
               style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }} />
        <div style={{ height:12 }} />
        <button onClick={saveGroup}
                style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:700 }}>
          Save settings
        </button>
        <div style={{ height:12 }} />
        <div style={{ height:12, borderTop:'1px solid #eee' }} />
        <div style={{ fontWeight:800 }}>Create new week</div>
        <div style={{ height:8 }} />
        <label style={{ fontSize:12, fontWeight:700, color:'#374151' }}>Pot ($)</label>
        <input type="number" value={pot} onChange={e=>setPot(Number(e.target.value))}
               style={{ marginTop:6, padding:12, border:'1px solid #ddd', borderRadius:8, width:'100%' }} />
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
        <button onClick={createWeek}
                style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:700 }}>
          Create Week
        </button>
        <div style={{ height:20 }} />
        <div style={{ height:12, borderTop:'1px solid #eee' }} />
        <div style={{ fontWeight:800 }}>Invites</div>
        <div style={{ height:8 }} />
        <div style={{ border:'2px solid #C4B5FD', borderRadius:12, padding:16, background:'#F5F3FF',
                      boxShadow:'0 1px 0 rgba(124,58,237,0.15), 0 8px 24px rgba(124,58,237,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:800, marginBottom:8, fontSize:18 }}>
            <span>📧 Invite by email</span>
            <span style={{ fontSize:12, background:'#7C3AED', color:'#fff', padding:'2px 6px', borderRadius:6, fontWeight:800 }}>Recommended</span>
          </div>
          <div style={{ fontSize:13, color:'#4B5563', marginBottom:10 }}>Enter one or more emails (comma or newline separated). Each person will receive a magic link to join.</div>
          <textarea value={emailsInput} onChange={e=>setEmailsInput(e.target.value)} rows={4}
                    placeholder="friend1@example.com, friend2@example.com"
                    style={{ width:'100%', padding:12, border:'1px solid #C4B5FD', borderRadius:10, background:'#fff' }} />
          <div style={{ height:10 }} />
          <button onClick={inviteByEmail} disabled={sendingInvites}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:'#7C3AED', color:'#fff', fontWeight:800 }}>
            {sendingInvites ? 'Sending…' : 'Send invites'}
          </button>
        </div>
        <div style={{ height:12 }} />
        <details style={{ border:'1px solid #eee', borderRadius:8, padding:12 }}>
          <summary style={{ cursor:'pointer', fontWeight:700 }}>Legacy: Generate invite link (non-email)</summary>
          <div style={{ height:8 }} />
          <button onClick={generateInvite}
                  style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:'#111827', color:'#fff', fontWeight:700 }}>
            Generate invite link
          </button>
          {inviteUrl && (
            <div style={{ marginTop:12, padding:12, border:'1px dashed #bbb', borderRadius:8 }}>
              <div style={{ fontWeight:600, marginBottom:6 }}>Invite Link</div>
              <div style={{ fontSize:14, wordBreak:'break-all' }}>{inviteUrl}</div>
              <button
                onClick={()=>copyWithAnim(inviteUrl, 'main')}
                style={{ marginTop:8, padding:'6px 10px', borderRadius:6, border:'1px solid #ddd',
                         transform: copiedKey==='main' && copyAnimating ? 'scale(1.05)' : 'scale(1)',
                         transition: 'transform 180ms ease' }}
              >
                {copiedKey==='main' && copyAnimating ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}
          <div style={{ color:'#6B7280', fontSize:12, marginTop:8 }}>Use email invites above for a more secure, personalized flow.</div>
        </details>
        {activeInvites.length > 0 && (
          <div style={{ marginTop:12 }}>
            <div style={{ fontWeight:600, marginBottom:6 }}>Active invites</div>
            <div style={{ display:'grid', gap:8 }}>
              {activeInvites.map((inv) => (
                <div key={inv.token} style={{ border:'1px solid #eee', borderRadius:8, padding:10, display:'flex', gap:8, alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:14, wordBreak:'break-all' }}>
                    <div>{`${window.location.origin}/join?token=${inv.token}`}</div>
                    {inv.invited_email && (
                      <div style={{ color:'#6B7280', fontSize:12 }}>Invited: {inv.invited_email}</div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button
                      onClick={()=>copyWithAnim(`${window.location.origin}/join?token=${inv.token}`, inv.token)}
                      style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #ddd',
                               transform: copiedKey===inv.token && copyAnimating ? 'scale(1.05)' : 'scale(1)',
                               transition: 'transform 180ms ease' }}
                    >
                      {copiedKey===inv.token && copyAnimating ? 'Copied!' : 'Copy'}
                    </button>
                    {inv.invited_email && (
                      <button onClick={()=>sendMagicLink(inv.invited_email as string, inv.token)}
                              style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #ddd', background:'#EEF2FF' }}>Resend</button>
                    )}
                    <button onClick={()=>revokeInvite(inv.token)}
                            style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #fca5a5', background:'#fee2e2', color:'#991b1b' }}>Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {expiredInvites.length > 0 && (
          <div style={{ marginTop:16 }}>
            <div style={{ fontWeight:600, marginBottom:6, color:'#6B7280' }}>Expired invites</div>
            <div style={{ display:'grid', gap:8 }}>
              {expiredInvites.map((inv) => (
                <div key={inv.token} style={{ border:'1px dashed #eee', borderRadius:8, padding:10, display:'flex', gap:8, alignItems:'center', justifyContent:'space-between', color:'#6B7280' }}>
                  <div style={{ fontSize:14, wordBreak:'break-all' }}>{`${window.location.origin}/join?token=${inv.token}`}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ height:20 }} />
        <div style={{ height:12, borderTop:'1px solid #eee' }} />
        <div style={{ fontWeight:800, color:'#991B1B' }}>Danger zone</div>
        <div style={{ height:8 }} />
        <button onClick={deleteGroupCascade}
                style={{ width:'100%', padding:'12px 16px', borderRadius:10, background:'#DC2626', color:'#fff', fontWeight:800 }}>
          Delete group
        </button>
        <div style={{ color:'#6B7280', fontSize:12, minHeight:18, marginTop:12 }}>{msg}</div>
      </div>
    </div>
  );
}
