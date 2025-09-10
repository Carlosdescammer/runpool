// app/group/[id]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
// Remove unused imports

// Components
import { Leaderboard } from './components/Leaderboard/Leaderboard';
import { MileageSubmissionModal } from './components/MileageSubmission/MileageSubmissionModal';
import { supabase } from '@/lib/supabase/client';

// Types
type Challenge = {
  id: string;
  group_id: string;
  week_start: string;
  week_end: string;
  pot: number;
  status: 'OPEN' | 'CLOSED';
};

type Group = {
  id: string;
  name: string;
  created_at: string;
  member_count: number;
  is_member: boolean;
  rule?: string;
  entry_fee?: number;
};

type LeaderboardRow = {
  user_id: string;
  name: string | null;
  miles: number;
  overallMiles: number;
  rank: number;
  rankChange?: number;
  streak?: number;
};


export default function GroupPage() {
  // Router
  const { id: groupId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // UI State
  const [loading, setLoading] = useState({
    group: true,
    challenge: true,
    leaderboard: true,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Invite State
  const [joinLink, setJoinLink] = useState('');
  
  // Animation/UI State
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Auth error:', error);
        router.replace('/signin');
        return;
      }
      
      if (!user) {
        router.replace('/signin');
        return;
      }
      
      setUserId(user.id);
    };
    
    checkAuth();
  }, [router]);

  // Load group data
  useEffect(() => {
    if (!groupId || !userId) {
      return;
    }
    
    const loadGroupData = async () => {
      setLoading(prev => ({ ...prev, group: true }));
      
      try {
        // First, let's discover what tables and columns actually exist
        const { data: sampleMembership, error: membershipSchemaError } = await supabase
          .from('memberships')
          .select('*')
          .limit(1);
        
        
        const { data: sampleGroup, error: groupSchemaError } = await supabase
          .from('groups')
          .select('*')
          .limit(1);
        
        
        const { data: sampleChallenge, error: challengeSchemaError } = await supabase
          .from('challenges')
          .select('*')
          .limit(1);
        
        
        const { data: sampleProof, error: proofSchemaError } = await supabase
          .from('proofs')
          .select('*')
          .limit(1);
        
        
        const { data: sampleProfile, error: profileSchemaError } = await supabase
          .from('user_profiles')
          .select('*')
          .limit(1);
        
        
        
        // Now check if user is a member of this group using discovered schema
        const { data: membershipData, error: membershipError } = await supabase
          .from('memberships')
          .select('*')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .single();
        
        if (membershipError) {
          console.error('Membership error:', membershipError.message, membershipError.details, membershipError.code);
          if (membershipError.code === 'PGRST116') {
            toast.error('You are not a member of this group');
            router.replace('/onboarding');
          } else {
            toast.error('Failed to verify membership');
          }
          return;
        }
        
        
        // Load group data using discovered schema
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();
        
        
        if (groupError) {
          console.error('Group error:', groupError.message, groupError.details, groupError.code);
          toast.error('Failed to load group information');
          return;
        }
        
        
        const groupWithMemberCount = {
          ...groupData,
          member_count: 0,
          is_member: true
        };
        
        setGroup(groupWithMemberCount);
        
        // Check admin status using actual membership data structure
        const userRole = membershipData?.role || membershipData?.user_role || 'member';
        setIsAdmin(['admin', 'owner'].includes(userRole));
        
        // Load current challenge
        const { data: challengeData, error: challengeError } = await supabase
          .from('challenges')
          .select('*')
          .eq('group_id', groupId)
          .order('week_start', { ascending: false })
          .limit(1);
        
          
        if (challengeError) {
          console.error('Challenge error:', challengeError.message, challengeError.details);
          // Don't fail if no challenges exist, just log it
        }
        
        
        if (challengeData && challengeData.length > 0) {
          setChallenge(challengeData[0]);
          await loadLeaderboard(challengeData[0].id);
        } else {
          setLeaderboard([]);
          setLoading(prev => ({ ...prev, leaderboard: false }));
        }
        
        
      } catch (error: any) {
        console.error('Unexpected error loading group data:', {
          error,
          message: error?.message,
          stack: error?.stack,
          name: error?.name
        });
        toast.error(`Failed to load group data: ${error?.message || 'Unknown error'}`);
      } finally {
        setLoading(prev => ({ ...prev, group: false, challenge: false }));
      }
    };
    
    loadGroupData();
  }, [groupId, userId, router]);

  useEffect(() => {
    try { 
      setJoinLink(`${window.location.origin}/join?group=${groupId}`); 
    } catch (error) {
      console.error('Error setting join link:', error);
    }
  }, [groupId]);

  // Handle user authentication and welcome message
  useEffect(() => {
    const justJoined = searchParams?.get('joined') === 'true';
    
    if (justJoined) {
      setShowWelcome(true);
      setTimeout(() => {
        try {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.25 } });
        } catch {}
        toast.success('Welcome to the group!');
      }, 1000);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);


  // Calculate period string from challenge dates
  const period = useMemo(() => {
    if (!challenge) return '';
    const s = new Date(challenge.week_start).toLocaleDateString(undefined, { month:'short', day:'numeric' });
    const e = new Date(challenge.week_end).toLocaleDateString(undefined, { month:'short', day:'numeric' });
    return `${s} – ${e}`;
  }, [challenge]);

  // Calculate deadline label
  const deadlineLabel = useMemo(() => {
    if (!challenge) return '';
    try {
      const d = new Date(challenge.week_end);
      return d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).replace(',', '');
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  }, [challenge]);

  // Submit proof function
  const submitProof = async (miles: number, file: File | null) => {
    if (!userId || !challenge) {
      toast.error('You must be logged in and have an active challenge to submit proof');
      return;
    }

    setStatus('loading');

    try {
      let imageUrl = null;
      
      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('proof-images')
          .upload(fileName, file);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload image. Submitting without proof.');
        } else {
          const { data: urlData } = supabase.storage
            .from('proof-images')
            .getPublicUrl(uploadData.path);
          imageUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('proofs')
        .upsert({
          user_id: userId,
          challenge_id: challenge.id,
          miles,
          image_url: imageUrl,
        });

      if (error) throw error;

      toast.success('Proof submitted successfully!');
      setStatus('success');
      
      // Refresh leaderboard
      loadLeaderboard(challenge.id);
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast.error('Failed to submit proof. Please try again.');
      setStatus('error');
    }
  };

  // Load leaderboard function
  const loadLeaderboard = async (challengeId: string) => {
    setLoading(prev => ({ ...prev, leaderboard: true }));
    
    try {
      
      // First, get all group members with accurate schema
      const { data: members, error: membersError } = await supabase
        .from('memberships')
        .select('*')
        .eq('group_id', groupId);
      
      
      if (membersError) {
        console.error('Members error:', membersError);
        throw membersError;
      }
      
      
      // Now get user profiles for all members
      const userIds = members?.map(m => m.user_id).filter(Boolean) || [];
      
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .in('id', userIds);
      
      
      // Fetch weekly proofs for the current challenge
      const { data: proofs, error: proofsError } = await supabase
        .from('proofs')
        .select('*')
        .eq('challenge_id', challengeId);
      
      if (proofsError) {
        console.error('Proofs error:', proofsError);
        // Don't throw - it's OK if there are no proofs yet
      }
      
      
      // Aggregate miles by user from current challenge
      const milesByUser: Record<string, number> = {};
      proofs?.forEach((proof, index) => {
        
        const userId = proof.user_id;
        if (!userId) {
          return;
        }
        
        // Try multiple possible column names for miles
        let miles = 0;
        const possibleColumns = ['miles', 'distance', 'mileage', 'total_miles', 'weekly_miles'];
        
        for (const col of possibleColumns) {
          if (proof[col] !== undefined && proof[col] !== null) {
            miles = parseFloat(proof[col]) || 0;
            break;
          }
        }
        
        if (miles === 0) {
        }
        
        milesByUser[userId] = (milesByUser[userId] || 0) + miles;
      });
      
      // Fetch all-time proofs for overall miles calculation
      const { data: allProofs, error: allProofsError } = await supabase
        .from('proofs')
        .select('*');
        
      if (allProofsError) {
        console.error('All proofs error:', allProofsError);
        // Don't throw - overall miles is optional
      }
      
      
      // Calculate overall miles by user
      const overallMilesByUser: Record<string, number> = {};
      allProofs?.forEach((proof, index) => {
        const userId = proof.user_id;
        if (!userId) return;
        
        // Try multiple possible column names for miles
        let miles = 0;
        const possibleColumns = ['miles', 'distance', 'mileage', 'total_miles', 'weekly_miles'];
        
        for (const col of possibleColumns) {
          if (proof[col] !== undefined && proof[col] !== null) {
            miles = parseFloat(proof[col]) || 0;
            break;
          }
        }
        
        overallMilesByUser[userId] = (overallMilesByUser[userId] || 0) + miles;
      });
      
      // Create leaderboard rows for ALL group members using actual data structure
      const rows: LeaderboardRow[] = members?.map(member => {
        const userId = member.user_id;
        const profile = profiles?.find(p => p.id === userId);
        
        const weeklyMiles = milesByUser[userId] || 0;
        const totalMiles = overallMilesByUser[userId] || 0;
        const userName = profile?.name || profile?.display_name || profile?.full_name || `User ${userId.slice(0, 8)}`;
        
        
        // Validate miles data
        
        return {
          user_id: userId,
          name: userName,
          miles: Math.max(0, weeklyMiles), // Ensure non-negative
          overallMiles: Math.max(0, totalMiles), // Ensure non-negative
          rank: 0, // Will be set after sorting
        };
      }) || [];
      
      // Sort by miles (descending)
      rows.sort((a, b) => b.miles - a.miles);
      
      // Assign ranks
      rows.forEach((row, index) => {
        row.rank = index + 1;
      });
      
      
      setLeaderboard(rows);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(prev => ({ ...prev, leaderboard: false }));
    }
  };

  if (loading.group) {
    return (
      <div className="wrap">
        <div className="topbar">
          <div className="brand">
            <div className="logo" aria-hidden="true"></div>
            <h1>RunPool</h1>
            <span className="chip">Loading...</span>
          </div>
        </div>
        <section className="card">
          <div className="inner">
            <div>Loading group data...</div>
          </div>
        </section>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="wrap">
        <div className="topbar">
          <div className="brand">
            <div className="logo" aria-hidden="true"></div>
            <h1>RunPool</h1>
            <span className="chip">Error</span>
          </div>
        </div>
        <section className="card">
          <div className="inner">
            <div>Failed to load group. Please try refreshing the page.</div>
            <div className="divider"></div>
            <button onClick={() => window.location.reload()} className="btn primary">
              Refresh Page
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="wrap">
      {/* Topbar */}
      <div className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden="true"></div>
          <h1>RunPool</h1>
          {group && <span className="chip" title="Group status"><span className="dot"></span> {group.name}</span>}
        </div>
        <div className="actions">
          <button onClick={() => router.push('/settings')} className="btn ghost">Settings</button>
          <button onClick={async () => { await supabase.auth.signOut(); router.replace('/signin'); }} className="btn success">Sign Out</button>
        </div>
      </div>

      {showWelcome && group && (
        <section className="card" style={{marginBottom: '18px'}}>
          <div className="inner">
            <button
              onClick={() => setShowWelcome(false)}
              className="btn ghost"
              style={{position: 'absolute', right: '12px', top: '12px', padding: '6px 8px'}}
            >
              ✕
            </button>
            <div style={{fontWeight: '700', fontSize: '16px', marginBottom: '8px'}}>Group Rules</div>
            <div className="subtle">{group.rule || 'No specific rule set for this group.'}</div>
          </div>
        </section>
      )}

      {/* Grid */}
      <div className="grid">
        {/* Group / Left */}
        <section className="card">
          <div className="inner">
            <div className="group-title">
              <div>
                <div style={{fontWeight: '700', fontSize: '16px'}}>{group?.name || 'Loading...'}</div>
                <div className="subtle" style={{marginTop: '2px'}}>{group?.rule || 'No rule specified'}</div>
              </div>
              {isAdmin && <a href={`/group/${groupId}/edit`} className="muted-link">Edit</a>}
            </div>

            <div className="divider"></div>

            <div className="inline-actions" style={{marginBottom: '8px'}}>
              <span className="subtle">Entry Fee</span>
              <span className="chip green"><span className="dot"></span>${group?.entry_fee ? (group.entry_fee / 100).toFixed(2) : '0.00'} / week</span>
            </div>

            <div style={{margin: '12px 0 6px', fontWeight: '600'}}>Invite Link <span className="subtle">· share to join</span></div>
            <div className="invite">
              {joinLink}
            </div>

            <div className="divider"></div>

            <div className="row">
              {isAdmin && <a className="btn" href={`/group/${groupId}/edit`} style={{padding: '8px 12px'}}>Admin Settings</a>}
              <button 
                className="btn" 
                style={{padding: '8px 12px'}}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(joinLink);
                    toast.success('Invite link copied!');
                  } catch {
                    toast.error('Failed to copy link');
                  }
                }}
              >
                Share Group
              </button>
            </div>
          </div>
        </section>

        {/* This week at a glance / Right */}
        <section className="card">
          <div className="inner">
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px'}}>
              <div style={{fontWeight: '700', fontSize: '16px'}}>This week at a glance</div>
              <span className="pill">{period}</span>
            </div>

            <div className="row" style={{margin: '12px 0 8px'}}>
              {group?.rule && <span className="kv"><span className="tag">Rule: {group.rule}</span></span>}
              {typeof group?.entry_fee === 'number' && <span className="kv"><span className="tag">Entry: ${(group.entry_fee / 100).toFixed(2)}</span></span>}
              {deadlineLabel && <span className="kv"><span className="tag">Deadline: {deadlineLabel}</span></span>}
              {group?.entry_fee && leaderboard.length > 0 && <span className="kv"><span className="tag">Pot: ${((leaderboard.length * group.entry_fee) / 100).toFixed(2)}</span></span>}
            </div>

            <button onClick={() => setShowWelcome(true)} className="btn ghost">View Rules</button>
          </div>
        </section>

        {/* Submit weekly data */}
        <section className="card" style={{gridColumn: '1 / -1'}}>
          <div className="inner submit">
            <div>
              <div style={{fontWeight: '700', fontSize: '16px', marginBottom: '4px'}}>Submit Weekly Data</div>
              <div className="subtle">Log your miles before the deadline.</div>
            </div>
            <div className="row">
              <MileageSubmissionModal
                onSubmit={submitProof}
                isLoading={status === 'loading'}
                currentMiles={userId && leaderboard ? leaderboard.find(r => r.user_id === userId)?.miles : null}
                isChallengeClosed={challenge?.status === 'CLOSED'}
              />
              <button 
                className="btn" 
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(joinLink);
                    toast.success('Invite link copied!');
                  } catch {
                    toast.error('Failed to copy link');
                  }
                }}
              >
                Share
              </button>
            </div>
          </div>
        </section>

        {/* Leaderboard */}
        <Leaderboard 
          leaderboard={leaderboard ?? []}
          currentUserId={userId}
          groupOwnerId={''}
          isLoading={loading.leaderboard}
          groupRule={group?.rule}
          challengePot={group?.entry_fee && leaderboard ? (leaderboard.length * group.entry_fee) / 100 : undefined}
          challengePeriod={challenge ? `${new Date(challenge.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(challenge.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : null}
        />
      </div>
    </div>
  );
}
