// components/GroupAdminPanel.tsx
'use client';
import { supabase } from '@/lib/supabase/client';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type InviteRow = { token: string; expires_at: string | null; created_at?: string | null };

type GroupMember = {
  user_id: string;
  name: string | null;
  email: string | null;
  role: 'owner' | 'admin' | 'member';
  additional_roles?: string[];
  joined_at: string;
};

interface GroupAdminPanelProps {
  groupId: string;
}

export function GroupAdminPanel({ groupId }: GroupAdminPanelProps) {
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
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const copyWithAnim = useCallback(async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setCopyAnimating(true);
      setTimeout(() => setCopyAnimating(false), 800);
      setTimeout(() => {
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

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id ?? null;
      setCurrentUserId(uid);
    })();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    (async () => {
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
    if (!groupId) return;
    const { data: rows, error } = await supabase
      .from('invites')
      .select('*')
      .eq('group_id', groupId)
      .order('expires_at', { ascending: true });
    if (error) { setMsg(error.message); return; }
    const now = Date.now();
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

  const loadGroupMembers = useCallback(async () => {
    if (!groupId) return;
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('memberships')
      .select('user_id, role')
      .eq('group_id', groupId);

    if (membershipsError) {
      console.error('Error loading memberships:', membershipsError);
      setMsg(membershipsError.message);
      return;
    }

    if (!membershipsData || membershipsData.length === 0) {
      setGroupMembers([]);
      return;
    }

    const userIds = membershipsData.map(m => m.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, name, additional_roles')
      .in('id', userIds);

    if (profilesError) {
      console.warn('Error loading profiles:', profilesError);
    }

    const profileMap = new Map();
    (profilesData || []).forEach((profile: { id: string; name?: string; additional_roles?: string[] }) => {
      profileMap.set(profile.id, profile);
    });

    const members: GroupMember[] = membershipsData.map((membership: { user_id: string; role: 'owner' | 'admin' | 'member' }) => {
      const profile = profileMap.get(membership.user_id);
      
      return {
        user_id: membership.user_id,
        name: profile?.name || null,
        email: null, 
        role: membership.role,
        additional_roles: profile?.additional_roles || [],
        joined_at: new Date().toISOString()
      };
    });

    setGroupMembers(members);
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    loadInvites();
    loadGroupMembers();
  }, [groupId, loadInvites, loadGroupMembers]);

  async function revokeInvite(token: string) {
    setMsg('Revoking invite…');
    const { error } = await supabase.from('invites').delete().eq('group_id', groupId).eq('token', token);
    if (error) { setMsg(error.message); return; }
    await loadInvites();
    setMsg('Invite revoked.');
  }

  async function removeMember(userId: string, userName: string) {
    if (userId === currentUserId) {
      setMsg('You cannot remove yourself from the group.');
      return;
    }

    const confirmMsg = `Remove ${userName || 'this member'} from the group? They will lose access immediately and all their data will remain.`;
    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    setMsg('Removing member…');
    
    try {
      const { error } = await supabase
        .from('memberships')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        setMsg(error.message);
        return;
      }

      await loadGroupMembers();
      setMsg(`${userName || 'Member'} removed from group.`);
    } catch {
      setMsg('Failed to remove member. Please try again.');
    }
  }

  async function updateMemberRoles(userId: string, newAdditionalRoles: string[], userName: string) {
    setMsg(`Updating roles for ${userName}...`);
    
    try {
      const profileData = {
        id: userId,
        name: userName || `User ${userId.slice(0, 8)}`,
        additional_roles: newAdditionalRoles
      };
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData);

      if (error) {
        console.error('Detailed error:', JSON.stringify(error, null, 2));
        setMsg(`Error: ${error.message || error.details || 'Unknown error'}`);
        return;
      }

      await loadGroupMembers();
      setMsg(`Updated roles for ${userName}.`);
    } catch (error) {
      console.error('Exception updating member roles:', error);
      setMsg(`Exception: ${error instanceof Error ? error.message : 'Unknown exception'}`);
    }
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
    try {
      const { error: rpcErr } = await supabase.rpc('delete_group_cascade', { p_group_id: groupId });
      if (!rpcErr) {
        setMsg('Group deleted. Refreshing page...');
        setTimeout(() => { window.location.reload(); }, 1200);
        return;
      }
    } catch {
      // fall through to client-side cascade
    }

    const { data: ch, error: chErr } = await supabase.from('challenges').select('id').eq('group_id', groupId);
    if (chErr) { setMsg(chErr.message); return; }
    const challengeIds = (ch ?? []).map(c => c.id);
    if (challengeIds.length > 0) {
      const { error: pErr } = await supabase.from('proofs').delete().in('challenge_id', challengeIds);
      if (pErr) { setMsg(pErr.message); return; }
    }
    const { error: dChErr } = await supabase.from('challenges').delete().eq('group_id', groupId);
    if (dChErr) { setMsg(dChErr.message); return; }
    const { error: mErr } = await supabase.from('memberships').delete().eq('group_id', groupId);
    if (mErr) { setMsg(mErr.message); return; }
    const { error: iErr } = await supabase.from('invites').delete().eq('group_id', groupId);
    if (iErr) { setMsg(iErr.message); return; }
    const { error: gErr } = await supabase.from('groups').delete().eq('id', groupId);
    if (gErr) { setMsg(gErr.message); return; }
    setMsg('Group deleted. Refreshing page...');
    setTimeout(() => { window.location.reload(); }, 1200);
  }

  return (
    <div className="space-y-6">
      {/* Group Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-none">Group Settings</h3>
        <div className="space-y-2">
          <Label htmlFor="group-name">Name</Label>
          <Input id="group-name" value={name} onChange={e => setName(e.target.value)} placeholder="Group name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="group-rule">Weekly rule</Label>
          <Input id="group-rule" value={rule} onChange={e => setRule(e.target.value)} placeholder="e.g. Run at least 5 miles" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="group-entry-fee">Entry Fee ($)</Label>
          <Input id="group-entry-fee" type="number" value={entryFee} onChange={e => setEntryFee(Number(e.target.value))} />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="notify-on-proof" className="font-medium">Instant email on miles</Label>
            <p className="text-xs text-zinc-600">Email the group when a member logs miles</p>
          </div>
          <Switch
            id="notify-on-proof"
            checked={notifyOnProof}
            onCheckedChange={setNotifyOnProof}
          />
        </div>
        <Button onClick={saveGroup} className="w-full">Save Settings</Button>
      </div>

      <div className="border-t"></div>

      {/* Create New Week */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-none">Create New Week</h3>
        <div className="space-y-2">
          <Label htmlFor="week-pot">Pot ($)</Label>
          <Input id="week-pot" type="number" value={pot} onChange={e => setPot(Number(e.target.value))} />
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label htmlFor="week-start">Week start</Label>
            <Input id="week-start" type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[200px] space-y-2">
            <Label htmlFor="week-end">Week end</Label>
            <Input id="week-end" type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)} />
          </div>
        </div>
        <Button onClick={createWeek} className="w-full">Create Week</Button>
      </div>

      <div className="border-t"></div>

      {/* Invite Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-none">Invite Links</h3>
        <div className="rounded-lg border bg-card text-card-foreground p-4 space-y-2">
          <h4 className="font-semibold">🔗 Create Invite Link</h4>
          <p className="text-sm text-muted-foreground">Generate a shareable link that anyone can use to join your group.</p>
          <Button onClick={createInviteLink} className="w-full">Create New Invite Link</Button>
        </div>
        {activeInvites.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Active Invites</h4>
            {activeInvites.map((inv) => (
              <div key={inv.token} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                <div className="text-sm break-all font-mono">{`${window.location.origin}/join?token=${inv.token}`}</div>
                <div className="flex gap-2 shrink-0">
                  <Button onClick={() => copyWithAnim(`${window.location.origin}/join?token=${inv.token}`, inv.token)} variant="outline" size="sm">
                    {copiedKey === inv.token && copyAnimating ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button onClick={() => revokeInvite(inv.token)} variant="destructive" size="sm">Revoke</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {expiredInvites.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-muted-foreground">Expired Invites</h4>
            {expiredInvites.map((inv) => (
              <div key={inv.token} className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground break-all font-mono">
                {`${window.location.origin}/join?token=${inv.token}`}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t"></div>

      {/* Member Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium leading-none">Group Members</h3>
          <Button onClick={loadGroupMembers} variant="secondary" size="sm">Refresh</Button>
        </div>
        <div className="rounded-lg border">
          <div className="divide-y">
            {groupMembers.map((member) => {
              const isCurrentUser = member.user_id === currentUserId;
              const isOwner = member.role === 'owner';
              const joinedDate = new Date(member.joined_at).toLocaleDateString();
              return (
                <div key={member.user_id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold shrink-0">
                        {(member.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {member.name || 'Anonymous'}
                          {isCurrentUser && <span className="ml-2 text-xs font-normal text-blue-600">(You)</span>}
                          {isOwner && <span className="ml-2 text-xs font-normal text-amber-600">👑 Owner</span>}
                          {member.role === 'admin' && <span className="ml-2 text-xs font-normal text-purple-600">⚡ Admin</span>}
                        </div>
                        {member.additional_roles && member.additional_roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {member.additional_roles.map((role: string) => (
                              <span key={role} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                {role === 'runner' && '🏃‍♂️ Runner'}
                                {role === 'banker' && '💰 Banker'}
                                {role !== 'runner' && role !== 'banker' && role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={() => {
                          const currentRoles = member.additional_roles || [];
                          const hasRunner = currentRoles.includes('runner');
                          const newRoles = hasRunner
                            ? currentRoles.filter(r => r !== 'runner')
                            : [...currentRoles, 'runner'];
                          updateMemberRoles(member.user_id, newRoles, member.name || 'Member');
                        }}
                        variant={member.additional_roles?.includes('runner') ? 'default' : 'secondary'}
                        size="sm"
                        className="text-xs h-7"
                      >
                        🏃‍♂️ Runner
                      </Button>
                      <Button
                        onClick={() => {
                          const currentRoles = member.additional_roles || [];
                          const hasBanker = currentRoles.includes('banker');
                          const newRoles = hasBanker
                            ? currentRoles.filter(r => r !== 'banker')
                            : [...currentRoles, 'banker'];
                          updateMemberRoles(member.user_id, newRoles, member.name || 'Member');
                        }}
                        variant={member.additional_roles?.includes('banker') ? 'default' : 'secondary'}
                        size="sm"
                        className="text-xs h-7"
                      >
                        💰 Banker
                      </Button>
                      {!isCurrentUser && !isOwner && (
                        <Button onClick={() => removeMember(member.user_id, member.name || 'Member')} variant="destructive" size="sm" className="text-xs h-7">Remove</Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {groupMembers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-sm">No members found</div>
                <div className="text-xs mt-1">Click Refresh to load members</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t"></div>

      {/* Danger Zone */}
      <div className="space-y-3 rounded-lg border border-destructive p-4">
        <h3 className="text-lg font-medium text-destructive">Danger Zone</h3>
        <p className="text-sm text-destructive/80">Deleting the group is a permanent action and cannot be undone.</p>
        <Button onClick={deleteGroupCascade} variant="destructive" className="w-full sm:w-auto">Delete Group</Button>
      </div>

      {msg && <div className="text-sm text-muted-foreground pt-4">{msg}</div>}
    </div>
  );
}
