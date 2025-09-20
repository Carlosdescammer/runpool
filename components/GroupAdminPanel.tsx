// components/GroupAdminPanel.tsx
'use client';
import { supabase } from '@/lib/supabase/client';
import { useCallback, useEffect, useState } from 'react';
import { PaymentStatusCard } from '@/components/PaymentStatusCard';

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
  const [distanceGoal, setDistanceGoal] = useState<number>(5.0);
  const [weekStart, setWeekStart] = useState<string>(new Date().toISOString().slice(0,10));
  const [weekEnd, setWeekEnd] = useState<string>(new Date(Date.now()+6*86400000).toISOString().slice(0,10));
  const [msg, setMsg] = useState('');
  const [activeInvites, setActiveInvites] = useState<InviteRow[]>([]);
  const [expiredInvites, setExpiredInvites] = useState<InviteRow[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyAnimating, setCopyAnimating] = useState(false);
  const [notifyOnProof, setNotifyOnProof] = useState<boolean>(true);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [currentWeekId, setCurrentWeekId] = useState<string | null>(null);
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
      // Continue without profiles if there's an error
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

  const loadCurrentWeek = useCallback(async () => {
    if (!groupId) return;
    try {
      // Try RPC function first for in_progress weeks
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_week', { group_id_param: groupId });
      
      if (!rpcError && rpcData && rpcData.length > 0) {
        setCurrentWeekId(rpcData[0].id);
        console.log('Current week loaded via RPC:', rpcData[0].id);
        return;
      }
      
      // If no in_progress week, look for upcoming weeks as well
      const { data: upcomingWeeks, error: upcomingError } = await supabase
        .from('weeks')
        .select('*')
        .eq('group_id', groupId)
        .in('status', ['upcoming', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!upcomingError && upcomingWeeks && upcomingWeeks.length > 0) {
        setCurrentWeekId(upcomingWeeks[0].id);
        console.log('Found upcoming/in_progress week:', upcomingWeeks[0].id);
        return;
      }
      
      console.log('No current week available - payment status card will be hidden');
      setCurrentWeekId(null);
      
    } catch (error) {
      console.log('Current week lookup failed - payment status card will be hidden');
      setCurrentWeekId(null);
    }
  }, [groupId]);

  useEffect(() => {
    loadCurrentWeek();
  }, [loadCurrentWeek]);

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
    // Calculate week number - get the latest week number for this group and increment
    const { data: existingWeeks, error: weekError } = await supabase
      .from('weeks')
      .select('week_number')
      .eq('group_id', groupId)
      .order('week_number', { ascending: false })
      .limit(1);

    let weekNumber = 1;
    if (!weekError && existingWeeks && existingWeeks.length > 0) {
      weekNumber = existingWeeks[0].week_number + 1;
    }

    const { error } = await supabase.from('weeks').insert({
      group_id: groupId, 
      week_number: weekNumber,
      start_date: weekStart, 
      end_date: weekEnd, 
      distance_goal_km: distanceGoal,
      entry_fee_cents: entryFee * 100, // Convert dollars to cents
      status: 'upcoming'
    });
    
    if (error) {
      setMsg(error.message);
    } else {
      setMsg('Week created successfully!');
      // Refresh the current week to show payment status card
      loadCurrentWeek();
    }
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

    const { data: weeks, error: weekErr } = await supabase.from('weeks').select('id').eq('group_id', groupId);
    if (weekErr) { setMsg(weekErr.message); return; }
    const weekIds = (weeks ?? []).map(w => w.id);
    if (weekIds.length > 0) {
      // Delete participants and payouts for these weeks
      const { error: partErr } = await supabase.from('participants').delete().in('week_id', weekIds);
      if (partErr) { setMsg(partErr.message); return; }
      const { error: payoutErr } = await supabase.from('payouts').delete().in('week_id', weekIds);
      if (payoutErr) { setMsg(payoutErr.message); return; }
    }
    const { error: dWeekErr } = await supabase.from('weeks').delete().eq('group_id', groupId);
    if (dWeekErr) { setMsg(dWeekErr.message); return; }
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
    <div>
      {/* Group Settings */}
      <div style={{marginBottom: '24px'}}>
        <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: '500'}}>Group Settings</h3>
        <div className="grid-2" style={{marginBottom: '16px'}}>
          <div>
            <label htmlFor="group-name">Name</label>
            <input 
              id="group-name" 
              className="field" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Group name" 
            />
          </div>
          <div>
            <label htmlFor="group-rule">Weekly rule</label>
            <input 
              id="group-rule" 
              className="field" 
              value={rule} 
              onChange={e => setRule(e.target.value)} 
              placeholder="e.g. Run at least 5 miles" 
            />
          </div>
        </div>
        <div style={{marginBottom: '16px'}}>
          <label htmlFor="group-entry-fee">Entry Fee ($)</label>
          <input
            id="group-entry-fee"
            className="field"
            type="number"
            value={entryFee}
            onChange={e => setEntryFee(Number(e.target.value))}
          />
        </div>
        <button onClick={saveGroup} className="btn primary" style={{width: '100%'}}>Save Settings</button>
      </div>

      <div className="divider"></div>

      {/* Email Notifications */}
      <div style={{marginBottom: '24px'}}>
        <div className="card">
          <div className="inner">
            <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: '500'}}>📧 Email Status</h3>
            <div className="inline">
              <div>
                <div style={{fontWeight: '600'}}>Instant email on miles</div>
                <div className="muted">Email the group when a member logs miles</div>
              </div>
              <div
                className="switch"
                role="switch"
                aria-checked={notifyOnProof}
                tabIndex={0}
                data-on={notifyOnProof?.toString() ?? 'false'}
                onClick={() => setNotifyOnProof(!notifyOnProof)}
              >
                <span></span>
              </div>
            </div>
            <div className="divider"></div>
            <button onClick={saveGroup} className="btn" style={{fontSize: '14px'}}>
              Save Email Settings
            </button>
          </div>
        </div>
      </div>

      <div className="divider"></div>

      {/* Create New Week */}
      <div style={{marginBottom: '24px'}}>
        <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: '500'}}>Create New Week</h3>
        <div className="grid-2" style={{marginBottom: '16px'}}>
          <div>
            <label htmlFor="distance-goal">Distance Goal (km)</label>
            <input 
              id="distance-goal" 
              className="field" 
              type="number" 
              step="0.1" 
              value={distanceGoal} 
              onChange={e => setDistanceGoal(Number(e.target.value))} 
              placeholder="5.0" 
            />
          </div>
          <div></div>
        </div>
        <div className="grid-2" style={{marginBottom: '16px'}}>
          <div>
            <label htmlFor="week-start">Week start</label>
            <input 
              id="week-start" 
              className="field" 
              type="date" 
              value={weekStart} 
              onChange={e => setWeekStart(e.target.value)} 
            />
          </div>
          <div>
            <label htmlFor="week-end">Week end</label>
            <input 
              id="week-end" 
              className="field" 
              type="date" 
              value={weekEnd} 
              onChange={e => setWeekEnd(e.target.value)} 
            />
          </div>
        </div>
        <button onClick={createWeek} className="btn primary" style={{width: '100%'}}>Create Week</button>
      </div>

      <div className="divider"></div>

      {/* Current Week Payment Status */}
      {currentWeekId ? (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: '500'}}>Current Week Payment Status</h3>
          <PaymentStatusCard weekId={currentWeekId} groupId={groupId} />
        </div>
      ) : (
        <div style={{marginBottom: '24px'}}>
          <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: '500'}}>Payment Status</h3>
          <div style={{padding: '16px'}}>
            <h4 style={{fontWeight: '600', marginBottom: '8px'}}>💳 Payment Tracking</h4>
            <p className="muted" style={{marginBottom: '8px'}}>
              You have created weeks, but none are currently active for payment tracking.
            </p>
            <button 
              onClick={async () => {
                // Look for the most recent upcoming week and activate it
                const { data: weeks, error } = await supabase
                  .from('weeks')
                  .select('*')
                  .eq('group_id', groupId)
                  .eq('status', 'upcoming')
                  .order('created_at', { ascending: false })
                  .limit(1);
                
                if (!error && weeks && weeks.length > 0) {
                  const { error: updateError } = await supabase
                    .from('weeks')
                    .update({ status: 'in_progress' })
                    .eq('id', weeks[0].id);
                  
                  if (!updateError) {
                    setMsg('Week activated for payment tracking!');
                    loadCurrentWeek();
                  } else {
                    setMsg('Failed to activate week: ' + updateError.message);
                  }
                } else {
                  setMsg('No upcoming weeks found to activate.');
                }
              }}
              className="btn primary"
              style={{fontSize: '12px', padding: '6px 12px'}}
            >
              Activate Latest Week
            </button>
          </div>
        </div>
      )}

      <div className="divider"></div>

      {/* Invite Links */}
      <div style={{marginBottom: '24px'}}>
        <h3 style={{marginBottom: '16px', fontSize: '18px', fontWeight: '500'}}>Invite Links</h3>
        <div style={{marginBottom: '16px'}}>
          <h4 style={{fontWeight: '600', marginBottom: '8px'}}>🔗 Create Invite Link</h4>
          <p className="muted" style={{marginBottom: '12px'}}>Generate a shareable link that anyone can use to join your group.</p>
          <button onClick={createInviteLink} className="btn primary" style={{width: '100%'}}>Create New Invite Link</button>
        </div>
        {activeInvites.length > 0 && (
          <div style={{marginBottom: '16px'}}>
            <h4 style={{fontWeight: '600', marginBottom: '8px'}}>Active Invites</h4>
            {activeInvites.map((inv) => (
              <div key={inv.token} className="inline" style={{padding: '12px', marginBottom: '8px'}}>
                <div className="muted" style={{fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all'}}>{`${window.location.origin}/join?token=${inv.token}`}</div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button 
                    onClick={() => copyWithAnim(`${window.location.origin}/join?token=${inv.token}`, inv.token)} 
                    className="btn ghost" 
                    style={{fontSize: '12px', padding: '4px 8px'}}
                  >
                    {copiedKey === inv.token && copyAnimating ? 'Copied!' : 'Copy'}
                  </button>
                  <button 
                    onClick={() => revokeInvite(inv.token)} 
                    className="btn" 
                    style={{fontSize: '12px', padding: '4px 8px', backgroundColor: '#dc3545', color: 'white'}}
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {expiredInvites.length > 0 && (
          <div style={{marginBottom: '16px'}}>
            <div className="inline" style={{marginBottom: '8px'}}>
              <h4 className="muted" style={{fontWeight: '600'}}>Expired Invites</h4>
              <button 
                onClick={async () => {
                  setMsg('Deleting all expired invites...');
                  try {
                    const deletePromises = expiredInvites.map(inv => revokeInvite(inv.token));
                    await Promise.all(deletePromises);
                    setMsg('All expired invites deleted.');
                  } catch (error) {
                    setMsg('Error deleting expired invites. Please try again.');
                  }
                }}
                className="btn ghost" 
                style={{fontSize: '12px', padding: '4px 8px', color: '#dc3545'}}
              >
                🗑️ Delete All
              </button>
            </div>
            {expiredInvites.map((inv) => (
              <div key={inv.token} className="inline" style={{padding: '12px', marginBottom: '8px'}}>
                <div className="muted" style={{fontFamily: 'monospace', fontSize: '12px', wordBreak: 'break-all'}}>
                  {`${window.location.origin}/join?token=${inv.token}`}
                </div>
                <button 
                  onClick={() => revokeInvite(inv.token)} 
                  className="btn ghost" 
                  style={{fontSize: '12px', padding: '4px 8px', color: '#dc3545'}}
                >
                  🗑️ Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="divider"></div>

      {/* Member Management */}
      <div style={{marginBottom: '24px'}}>
        <div className="inline" style={{marginBottom: '16px'}}>
          <h3 style={{fontSize: '18px', fontWeight: '500'}}>Group Members</h3>
          <button onClick={loadGroupMembers} className="btn ghost" style={{fontSize: '12px', padding: '4px 8px'}}>Refresh</button>
        </div>
        <div>
          {groupMembers.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const isOwner = member.role === 'owner';
            const joinedDate = new Date(member.joined_at).toLocaleDateString();
            return (
              <div key={member.user_id} style={{padding: '12px', borderBottom: '1px solid #f0f0f0'}}>
                <div className="inline" style={{gap: '8px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px', flex: '1'}}>
                    <div style={{width: '40px', height: '40px', backgroundColor: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#6c757d'}}>
                      {(member.name || '?')[0].toUpperCase()}
                    </div>
                    <div style={{flex: '1'}}>
                      <div style={{fontWeight: '500'}}>
                        {member.name || 'Anonymous'}
                        {isCurrentUser && <span style={{marginLeft: '8px', fontSize: '12px', color: '#0066cc'}}>(You)</span>}
                        {isOwner && <span style={{marginLeft: '8px', fontSize: '12px', color: '#ff6b35'}}>👑 Owner</span>}
                        {member.role === 'admin' && <span style={{marginLeft: '8px', fontSize: '12px', color: '#6f42c1'}}>⚡ Admin</span>}
                      </div>
                      {member.additional_roles && member.additional_roles.length > 0 && (
                        <div style={{display: 'flex', gap: '4px', marginTop: '4px'}}>
                          {member.additional_roles.map((role: string) => (
                            <span key={role} style={{fontSize: '10px', padding: '2px 6px', backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '12px'}}>
                              {role === 'runner' && '🏃‍♂️ Runner'}
                              {role === 'banker' && '💰 Banker'}
                              {role !== 'runner' && role !== 'banker' && role}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '4px'}}>
                    <button
                      onClick={() => {
                        const currentRoles = member.additional_roles || [];
                        const hasRunner = currentRoles.includes('runner');
                        const newRoles = hasRunner
                          ? currentRoles.filter(r => r !== 'runner')
                          : [...currentRoles, 'runner'];
                        updateMemberRoles(member.user_id, newRoles, member.name || 'Member');
                      }}
                      className={`btn ${member.additional_roles?.includes('runner') ? 'primary' : 'ghost'}`}
                      style={{fontSize: '10px', padding: '2px 6px', height: '28px'}}
                    >
                      🏃‍♂️ Runner
                    </button>
                    <button
                      onClick={() => {
                        const currentRoles = member.additional_roles || [];
                        const hasBanker = currentRoles.includes('banker');
                        const newRoles = hasBanker
                          ? currentRoles.filter(r => r !== 'banker')
                          : [...currentRoles, 'banker'];
                        updateMemberRoles(member.user_id, newRoles, member.name || 'Member');
                      }}
                      className={`btn ${member.additional_roles?.includes('banker') ? 'primary' : 'ghost'}`}
                      style={{fontSize: '10px', padding: '2px 6px', height: '28px'}}
                    >
                      💰 Banker
                    </button>
                    {!isCurrentUser && !isOwner && (
                      <button 
                        onClick={() => removeMember(member.user_id, member.name || 'Member')} 
                        className="btn" 
                        style={{fontSize: '10px', padding: '2px 6px', height: '28px', backgroundColor: '#dc3545', color: 'white'}}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {groupMembers.length === 0 && (
            <div style={{padding: '32px', textAlign: 'center'}}>
              <div className="muted" style={{marginBottom: '4px'}}>No members found</div>
              <div className="muted" style={{fontSize: '12px'}}>Click Refresh to load members</div>
            </div>
          )}
        </div>
      </div>

      <div className="divider"></div>

      {/* Danger Zone */}
      <div style={{marginBottom: '24px'}}>
        <h3 style={{fontSize: '18px', fontWeight: '500', color: '#dc3545', marginBottom: '8px'}}>⚠️ Danger Zone</h3>
        <p className="muted" style={{marginBottom: '12px', color: '#dc3545'}}>Deleting the group is a permanent action and cannot be undone.</p>
        <button onClick={deleteGroupCascade} className="btn" style={{backgroundColor: '#dc3545', color: 'white'}}>Delete Group</button>
      </div>

      {msg && <div className="muted" style={{paddingTop: '16px', fontSize: '12px'}}>{msg}</div>}
    </div>
  );
}
