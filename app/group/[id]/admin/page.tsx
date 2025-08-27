// app/group/[id]/admin/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

type InviteRow = { token: string; expires_at: string | null; created_at?: string | null };

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
  const [activeInvites, setActiveInvites] = useState<InviteRow[]>([]);
  const [expiredInvites, setExpiredInvites] = useState<InviteRow[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyAnimating, setCopyAnimating] = useState(false);
  const [notifyOnProof, setNotifyOnProof] = useState<boolean>(true);

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
    } catch {
      setMsg('Unable to copy');
    }
  }, []);

  async function createInviteLink() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMsg('Sign in first.'); return; }
    
    setMsg('Creating invite link…');
    try {
      const token = crypto.randomUUID().replace(/-/g, '');
      const exp = new Date(Date.now() + 14*24*3600*1000).toISOString();
      
      const { error } = await supabase.from('invites').insert({
        token, 
        group_id: groupId, 
        created_by: user.id, 
        expires_at: exp
      });
      
      if (error) { 
        setMsg(error.message); 
        return; 
      }
      
      await loadInvites();
      setMsg('Invite link created! Copy and share it with your friends.');
      
      // Auto-copy the new link
      const inviteUrl = `${window.location.origin}/join?token=${token}`;
      try {
        await navigator.clipboard.writeText(inviteUrl);
        setCopiedKey(token);
        setCopyAnimating(true);
        setTimeout(() => setCopyAnimating(false), 800);
        setTimeout(() => setCopiedKey(null), 1200);
      } catch {
        // Copy failed, but that's ok
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setMsg(message);
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
        setNotifyOnProof((g as { notify_on_proof?: boolean } | null)?.notify_on_proof ?? true);
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
      const item: InviteRow = { token: r.token, expires_at: r.expires_at, created_at: r.created_at };
      if (!exp || exp > now) active.push(item); else expired.push(item);
    });
    setActiveInvites(active);
    setExpiredInvites(expired);
  }, [groupId]);

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
      .update({ name, rule, entry_fee: entryFee, notify_on_proof: notifyOnProof })
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
    <div className="min-h-svh px-4 py-6 md:px-6">
      <div className="mx-auto w-full max-w-[720px]">
        <Card className="p-5 md:p-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h1 className="m-0 text-xl font-extrabold">Admin Tools</h1>
            <Button variant="primary" onClick={() => (window.location.href = `/group/${groupId}`)}>
              ← Back to dashboard
            </Button>
          </div>
          {authLoading && <div className="mt-2 text-zinc-600">Checking permissions…</div>}
          {!authLoading && !authorized && <div className="mt-2 text-zinc-600">Redirecting…</div>}
          <div className="h-4" />

          <div className="text-sm font-extrabold">Group settings</div>
          <div className="h-2" />
          <label className="text-xs font-semibold text-zinc-700">Name</label>
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Group name" className="mt-1" />
          <div className="h-3" />
          <label className="text-xs font-semibold text-zinc-700">Weekly rule</label>
          <Input value={rule} onChange={e=>setRule(e.target.value)} placeholder="e.g. Run at least 5 miles" className="mt-1" />
          <div className="h-3" />
          <label className="text-xs font-semibold text-zinc-700">Entry Fee ($)</label>
          <Input type="number" value={entryFee} onChange={e=>setEntryFee(Number(e.target.value))} className="mt-1" />
          <div className="h-3" />
          <div className="mb-3 flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3">
            <div>
              <div className="text-sm font-semibold">Instant email on miles</div>
              <div className="text-xs text-zinc-600">Email the group when a member logs miles</div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={notifyOnProof}
                onChange={e=>setNotifyOnProof(e.target.checked)}
                className="h-5 w-5 rounded border-zinc-300 text-[var(--rp-accent)]"
              />
              <span className="text-sm">{notifyOnProof ? 'On' : 'Off'}</span>
            </label>
          </div>
          <Button onClick={saveGroup} className="w-full">Save settings</Button>
          <div className="my-3 h-px bg-zinc-200" />

          <div className="text-sm font-extrabold">Create new week</div>
          <div className="h-2" />
          <label className="text-xs font-semibold text-zinc-700">Pot ($)</label>
          <Input type="number" value={pot} onChange={e=>setPot(Number(e.target.value))} className="mt-1" />
          <div className="h-3" />
          <div className="flex flex-wrap gap-3">
            <div className="min-w-[200px] flex-1">
              <div className="text-xs font-semibold text-zinc-700">Week start</div>
              <input type="date" value={weekStart} onChange={e=>setWeekStart(e.target.value)}
                     className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-[15px] text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rp-accent)] focus-visible:ring-offset-2"/>
            </div>
            <div className="min-w-[200px] flex-1">
              <div className="text-xs font-semibold text-zinc-700">Week end</div>
              <input type="date" value={weekEnd} onChange={e=>setWeekEnd(e.target.value)}
                     className="mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-[15px] text-zinc-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rp-accent)] focus-visible:ring-offset-2"/>
            </div>
          </div>
          <div className="h-4" />
          <Button onClick={createWeek} className="w-full">Create Week</Button>

          <div className="my-4 h-px bg-zinc-200" />
          <div className="text-sm font-extrabold">Invite Links</div>
          <div className="h-2" />
          <div className="rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-4 shadow-[0_1px_0_rgba(124,58,237,0.15),0_8px_24px_rgba(124,58,237,0.08)]">
            <div className="mb-2 flex items-center gap-2 font-extrabold">
              <span>🔗 Create invite link</span>
            </div>
            <div className="mb-3 text-sm text-zinc-600">Generate a shareable link that anyone can use to join your group. Share it via text, email, social media, or anywhere you want!</div>
            <Button onClick={createInviteLink} className="w-full">
              Create New Invite Link
            </Button>
          </div>

          {activeInvites.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 font-semibold">Active invites</div>
              <div className="grid gap-2">
                {activeInvites.map((inv) => (
                  <div key={inv.token} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 p-3">
                    <div className="text-sm">
                      <div className="break-all">{`${window.location.origin}/join?token=${inv.token}`}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={()=>copyWithAnim(`${window.location.origin}/join?token=${inv.token}`, inv.token)}
                        className={`${copiedKey===inv.token && copyAnimating ? 'scale-105' : ''} rounded-lg border border-zinc-300 px-3 py-2 text-sm transition`}
                      >
                        {copiedKey===inv.token && copyAnimating ? 'Copied!' : 'Copy'}
                      </button>
                      <button onClick={()=>revokeInvite(inv.token)}
                              className="rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-sm text-rose-800">Revoke</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {expiredInvites.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 font-semibold text-zinc-600">Expired invites</div>
              <div className="grid gap-2">
                {expiredInvites.map((inv) => (
                  <div key={inv.token} className="rounded-xl border border-dashed border-zinc-200 p-3 text-zinc-600">
                    <div className="break-all text-sm">{`${window.location.origin}/join?token=${inv.token}`}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="my-4 h-px bg-zinc-200" />
          <div className="text-sm font-extrabold text-rose-800">Danger zone</div>
          <div className="h-2" />
          <Button onClick={deleteGroupCascade} variant="destructive" className="w-full">Delete group</Button>
          <div className="mt-3 min-h-[18px] text-xs text-zinc-600">{msg}</div>
        </Card>
      </div>
    </div>
  );
}
