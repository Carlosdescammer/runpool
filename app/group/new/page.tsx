// app/group/new/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-svh px-4 py-6">
      <div className="mx-auto w-full max-w-[560px]">
        <Card className="p-5">
          <h1 className="m-0 text-[22px] font-extrabold">Create Group</h1>
          <div className="mt-3 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="group-name">Group Name</Label>
              <Input id="group-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Past Our Prime" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="rule">Weekly Rule</Label>
              <Input id="rule" value={rule} onChange={e=>setRule(e.target.value)} placeholder="Run at least 5 miles" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="fee">Entry Fee ($)</Label>
              <Input id="fee" type="number" value={pot} onChange={e=>setPot(Number(e.target.value))} placeholder="25" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="week-start">Week start</Label>
                <Input id="week-start" type="date" value={weekStart} onChange={e=>setWeekStart(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="week-end">Week end</Label>
                <Input id="week-end" type="date" value={weekEnd} onChange={e=>setWeekEnd(e.target.value)} />
              </div>
            </div>
            <Button onClick={createGroup} variant="primary" className="mt-1 w-full">Create</Button>

            {groupId && (
              <>
                <a href={`/group/${groupId}`} className="no-underline">
                  <Button variant="secondary" className="w-full">Go to Group Dashboard</Button>
                </a>
                {inviteUrl && (
                  <div className="mt-3 rounded-lg border border-dashed border-zinc-300 p-3">
                    <div className="mb-1 font-semibold">Invite Link</div>
                    <div className="break-all text-sm">{inviteUrl}</div>
                    <Button onClick={()=>navigator.clipboard.writeText(inviteUrl)} size="sm" variant="secondary" className="mt-2">Copy</Button>
                  </div>
                )}
              </>
            )}

            <div className="min-h-[18px] text-xs text-zinc-600">{status}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
