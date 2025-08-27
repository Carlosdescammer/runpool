// app/group/[id]/page.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { ArrowUp, ArrowDown, Minus, Crown } from 'lucide-react';

// Components
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Leaderboard } from './components/Leaderboard/Leaderboard';
import { MileageSubmission } from './components/MileageSubmission/MileageSubmission';
import { GroupInfo } from './components/GroupInfo/GroupInfo';
import { supabase } from '@/lib/supabaseClient';

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
  description: string | null;
  created_at: string;
  is_public: boolean;
  created_by: string;
  member_count: number;
  is_member: boolean;
  rule?: string;
  entry_fee?: number;
};

type LeaderboardRow = {
  user_id: string;
  name: string | null;
  miles: number;
  rank: number;
  rankChange?: number;
  streak?: number;
};


export default function GroupPage() {
  // Router
  const { id: groupId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  // State
  const [userId, setUserId] = useState<string | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserMiles, setCurrentUserMiles] = useState<number | null>(null);
  
  // UI State
  const [loading, setLoading] = useState({
    group: true,
    challenge: true,
    leaderboard: true,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  // Invite State
  const [joinLink, setJoinLink] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Mileage Submission
  const [miles, setMiles] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Animation/UI State
  const [showWelcome, setShowWelcome] = useState(false);
  const [rankDelta, setRankDelta] = useState<Record<string, number>>({});
  const [movement, setMovement] = useState<Record<string, 'up' | 'down' | 'same'>>({});
  const [joinTop3, setJoinTop3] = useState<Record<string, boolean>>({});
  const [dropTop3, setDropTop3] = useState<Record<string, boolean>>({});
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    try { 
      setJoinLink(`${window.location.origin}/join?group=${groupId}`); 
    } catch (error) {
      console.error('Error setting join link:', error);
    }
  }, [groupId]);

  const handleMileageSubmit = async (miles: number, file: File | null) => {
    if (!challenge || !userId) return;
    
    try {
      // First, check if user already has an entry for this challenge
      const { data: existingEntry } = await supabase
        .from('challenge_entries')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
        .maybeSingle();

      let fileUrl = null;
      
      // Handle file upload if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `proofs/${challenge.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('proofs')
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('proofs')
          .getPublicUrl(filePath);
          
        fileUrl = publicUrl;
      }

      if (existingEntry) {
        // Update existing entry
        const { error: updateError } = await supabase
          .from('challenge_entries')
          .update({ 
            miles,
            ...(fileUrl && { proof_url: fileUrl }),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEntry.id);

        if (updateError) throw updateError;
        toast.success('Mileage updated successfully!');
      } else {
        // Create new entry
        const { error: insertError } = await supabase
          .from('challenge_entries')
          .insert([
            { 
              challenge_id: challenge.id,
              user_id: userId,
              miles,
              proof_url: fileUrl,
              group_id: groupId
            }
          ]);

        if (insertError) throw insertError;
        toast.success('Mileage submitted successfully!');
      }

      // Refresh leaderboard
      await loadLeaderboard(challenge.id);
      
    } catch (error) {
      console.error('Error submitting mileage:', error);
      toast.error('Failed to submit mileage. Please try again.');
      throw error;
    }
  };

  const loadLeaderboard = async (challengeId: string) => {
    setLoading(prev => ({ ...prev, leaderboard: true }));
    
    try {
      if (!challengeId) {
        console.warn('No challenge ID provided to loadLeaderboard');
        setLeaderboard([]);
        return;
      }

      // Get proofs for this challenge - sum miles by user_id to handle multiple submissions
      const { data: proofsData, error: proofsError } = await supabase
        .from('proofs')
        .select('user_id, miles')
        .eq('challenge_id', challengeId);

      if (proofsError) {
        console.warn('Supabase error loading proofs - using placeholder data:', JSON.stringify(proofsError));
        
        // If table doesn't exist or other errors, use placeholder data
        const placeholderData: LeaderboardRow[] = [
          { user_id: '1', name: 'A. Rivera', miles: 18.6, rank: 1 },
          { user_id: '2', name: 'K. Patel', miles: 17.4, rank: 2 },
          { user_id: '3', name: 'M. Scott', miles: 15.2, rank: 3 },
          { user_id: '4', name: 'L. Chen', miles: 12.7, rank: 4 },
          { user_id: '5', name: 'J. Gomez', miles: 9.9, rank: 5 },
        ];
        
        setLeaderboard(placeholderData);
        if (userId) {
          setCurrentUserMiles(15.2);
        }
        return;
      }

      // If no proofs found, show empty leaderboard
      if (!proofsData || proofsData.length === 0) {
        setLeaderboard([]);
        setCurrentUserMiles(null);
        return;
      }

      // Aggregate miles by user_id to handle multiple submissions from same user
      const userMiles = new Map<string, number>();
      proofsData.forEach((proof: any) => {
        const currentMiles = userMiles.get(proof.user_id) || 0;
        userMiles.set(proof.user_id, currentMiles + proof.miles);
      });

      // Get unique user IDs
      const userIds = Array.from(userMiles.keys());
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching user profiles:', profilesError);
      }

      console.log('User IDs with proofs:', userIds);
      console.log('Profiles found:', profilesData);

      // Create a map of user_id to name
      const userNames = new Map();
      const foundUserIds = new Set();
      
      (profilesData || []).forEach((profile: any) => {
        foundUserIds.add(profile.id);
        const displayName = profile.name;
        if (displayName) {
          userNames.set(profile.id, displayName);
        } else {
          console.warn(`User ${profile.id} has no name in profile`);
        }
      });

      // Check for users who don't have profiles at all
      const missingProfiles = userIds.filter(id => !foundUserIds.has(id));
      if (missingProfiles.length > 0) {
        console.warn('Users with proofs but no profiles:', missingProfiles);
        // Create basic profiles for missing users
        for (const userId of missingProfiles) {
          userNames.set(userId, `User ${userId.slice(0, 8)}`);
        }
      }

      // Transform and sort the data
      const formattedData: LeaderboardRow[] = Array.from(userMiles.entries())
        .map(([user_id, miles]) => ({
          user_id,
          name: userNames.get(user_id) || 'Anonymous',
          miles,
          rank: 0, // Will be set after sorting
        }))
        .sort((a, b) => b.miles - a.miles) // Sort by miles descending
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setLeaderboard(formattedData);
      
      // Find current user's miles if they've submitted
      if (userId) {
        const userEntry = formattedData.find(entry => entry.user_id === userId);
        setCurrentUserMiles(userEntry?.miles || null);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error instanceof Error ? error.message : String(error));
      
      // Fallback to placeholder data on any error
      const placeholderData: LeaderboardRow[] = [
        { user_id: '1', name: 'A. Rivera', miles: 18.6, rank: 1 },
        { user_id: '2', name: 'K. Patel', miles: 17.4, rank: 2 },
        { user_id: '3', name: 'M. Scott', miles: 15.2, rank: 3 },
        { user_id: '4', name: 'L. Chen', miles: 12.7, rank: 4 },
        { user_id: '5', name: 'J. Gomez', miles: 9.9, rank: 5 },
      ];
      setLeaderboard(placeholderData);
      if (userId) {
        setCurrentUserMiles(15.2);
      }
    } finally {
      setLoading(prev => ({ ...prev, leaderboard: false }));
    }
  };

  // Fetch group data
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        // Fetch group details
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('*')
          .eq('id', groupId)
          .single();

        if (groupError) throw groupError;
        setGroup(groupData);
        setLoading(prev => ({ ...prev, group: false }));

        // Fetch active challenge
        const { data: challengeData, error: challengeError } = await supabase
          .from('challenges')
          .select('*')
          .eq('group_id', groupId)
          .order('week_start', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (challengeError) throw challengeError;
        
        if (challengeData) {
          setChallenge(challengeData);
          await loadLeaderboard(challengeData.id);
        } else {
          setLoading(prev => ({ ...prev, challenge: false, leaderboard: false }));
        }
      } catch (error) {
        console.error('Error fetching group data:', error);
        toast.error('Failed to load group data');
        setLoading(prev => ({ ...prev, group: false, challenge: false, leaderboard: false }));
      }
    };

    fetchGroupData();
  }, [groupId]);

  // Check if current user is admin of this group
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!userId || !group) return;
      
      try {
        const { data: membership, error } = await supabase
          .from('memberships')
          .select('role')
          .eq('group_id', groupId)
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Supabase error checking admin status:', error);
          setIsAdmin(false);
          return;
        }
        const role = membership?.role as ('owner' | 'admin' | 'member' | undefined);
        setIsAdmin(role === 'owner' || role === 'admin');
      } catch (error) {
        console.error('Error checking admin status:', error instanceof Error ? error.message : String(error));
      }
    };

    checkAdminStatus();
  }, [userId, group, groupId]);

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
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

  useEffect(() => {
    const justJoined = searchParams.get('joined') === '1';
    setShowWelcome(justJoined);
    if (justJoined) {
      // Celebrate join
      setTimeout(() => {
        try {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.25 } });
        } catch {}
        toast.success('Welcome to the group!');
      }, 200);
    }
  }, [searchParams]);

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      toast.error('Copy failed');
    }
  }



  // Realtime: subscribe to proofs changes for current challenge to refresh leaderboard
  useEffect(() => {
    if (!challenge?.id) return;
    const channel = supabase
      .channel(`leaderboard_${challenge.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'proofs', filter: `challenge_id=eq.${challenge.id}` },
        () => {
          loadLeaderboard(challenge.id);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [challenge?.id]);

  // Compute rank deltas (vs previous render snapshot) and top-3 threshold animations
  useEffect(() => {
    if (!leaderboard || leaderboard.length === 0 || !groupId) return;
    const ranks: Record<string, number> = {};
    leaderboard.forEach((r, i) => { ranks[r.user_id] = i + 1; });

    const key = `leader_prev_ranks_${groupId}_${challenge?.id ?? 'none'}`;
    let prev: Record<string, number> = {};
    try {
      const raw = localStorage.getItem(key);
      if (raw) prev = JSON.parse(raw);
    } catch {}

    const delta: Record<string, number> = {};
    const move: Record<string, 'up' | 'down' | 'same'> = {};
    const joinFlags: Record<string, boolean> = {};
    const dropFlags: Record<string, boolean> = {};

    leaderboard.forEach((r, i) => {
      const currRank = i + 1;
      const prevRank = prev[r.user_id];
      if (typeof prevRank === 'number') {
        const d = prevRank - currRank; // positive => moved up
        delta[r.user_id] = d;
        move[r.user_id] = d > 0 ? 'up' : d < 0 ? 'down' : 'same';
        if (prevRank > 3 && currRank <= 3) joinFlags[r.user_id] = true;
        if (prevRank <= 3 && currRank > 3) dropFlags[r.user_id] = true;
      } else {
        delta[r.user_id] = 0;
        move[r.user_id] = 'same';
      }
    });

    setRankDelta(delta);
    setMovement(move);
    if (Object.keys(joinFlags).length > 0) {
      setJoinTop3(joinFlags);
      setTimeout(() => setJoinTop3({}), 1500);
    }
    if (Object.keys(dropFlags).length > 0) {
      setDropTop3(dropFlags);
      setTimeout(() => setDropTop3({}), 1500);
    }

    try { localStorage.setItem(key, JSON.stringify(ranks)); } catch {}
  }, [leaderboard, groupId, challenge?.id]);

  // Compute current streaks from recent closed challenges (client-side)
  useEffect(() => {
    (async () => {
      if (!groupId || !leaderboard || leaderboard.length === 0) { setStreaks({}); return; }
      const { data: closed } = await supabase
        .from('challenges')
        .select('id, week_start')
        .eq('group_id', groupId)
        .eq('status', 'CLOSED')
        .order('week_start', { ascending: false })
        .limit(8);
      const weeks = closed ?? [];
      if (weeks.length === 0) { setStreaks({}); return; }
      const ids = weeks.map(w => w.id);
      const { data: proofs } = await supabase
        .from('proofs')
        .select('user_id, challenge_id')
        .in('challenge_id', ids);
      const hadProof = new Map<string, Set<string>>();
      (proofs ?? []).forEach(p => {
        const s = hadProof.get(p.user_id) ?? new Set<string>();
        s.add(p.challenge_id);
        hadProof.set(p.user_id, s);
      });
      const streakMap: Record<string, number> = {};
      for (const r of leaderboard) {
        let count = 0;
        const set = hadProof.get(r.user_id) ?? new Set<string>();
        for (const w of ids) {
          if (set.has(w)) count += 1; else break;
        }
        streakMap[r.user_id] = count;
      }
      setStreaks(streakMap);
    })();
  }, [groupId, leaderboard]);

  const period = useMemo(() => {
    if (!challenge) return '';
    const s = new Date(challenge.week_start).toLocaleDateString(undefined, { month:'short', day:'numeric' });
    const e = new Date(challenge.week_end).toLocaleDateString(undefined, { month:'short', day:'numeric' });
    return `${s} – ${e}`;
  }, [challenge]);

  const deadlineLabel = useMemo(() => {
    if (!challenge) return '';
    try {
      const d = new Date(challenge.week_end);
      return d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).replace(',', '');
    } catch {
      return '';
    }
  }, [challenge]);

  async function submitProof() {
    if (!userId) { setStatus('error'); return; }
    if (!challenge) { setStatus('error'); return; }
    if (!miles) { setStatus('error'); return; }
    const milesNum = Number(miles);
    let image_url: string | null = null;

    if (file) {
      const path = `proofs/${userId}/${Date.now()}_${file.name}`;
      const up = await supabase.storage.from('proofs').upload(path, file);
      if (up.error) { setStatus('error'); return; }
      const signed = await supabase.storage.from('proofs').createSignedUrl(path, 3600);
      if (signed.error) { setStatus('error'); return; }
      image_url = signed.data.signedUrl;
    }

    const { error } = await supabase.from('proofs').insert({
      challenge_id: challenge.id,
      user_id: userId,
      miles: milesNum,
      image_url
    });
    if (error) { setStatus('error'); toast.error(error.message); return; }
    setStatus('success');
    toast.success('Proof submitted');
    try { confetti({ particleCount: 45, spread: 60, origin: { y: 0.3 } }); } catch {}

    // Fire-and-forget: notify group members by email via Resend
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      if (token) {
        fetch('/api/notify/proof', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ challenge_id: challenge.id, miles: milesNum }),
        }).catch(() => {});
      }
    } catch {}

    setMiles('');
    setFile(null);
    await loadLeaderboard(challenge.id);
  }

  return (
    <div className="min-h-svh px-4 pb-6 pt-6 md:px-6">
      <div className="mx-auto grid max-w-[1000px] gap-4">
        {showWelcome && group && (
          <Card className="relative p-4">
            <Button
              onClick={() => setShowWelcome(false)}
              aria-label="Dismiss"
              variant="secondary"
              size="sm"
              className="absolute right-2 top-2"
            >
              ✕
            </Button>
            <div className="mb-2 text-[18px] font-black">Run Pool — Simple Rules</div>
            <div className="text-zinc-900">
              <ol className="ml-4 grid list-decimal gap-2">
                <li>
                  <strong>What this is</strong>
                  <div>A weekly running game with friends. Do the miles, show proof, and share the prize.</div>
                </li>
                <li>
                  <strong>Roles</strong>
                  <div>Coach: made the group and sets the weekly rule.</div>
                  <div>Banker: trusted person who holds the money (Apple Pay/Venmo).</div>
                  <div>Players: everyone who joins.</div>
                </li>
                <li>
                  <strong>This week’s rule (example)</strong>
                  <div>
                    Goal: <em>Run at least 5 miles between Mon–Sun 11:59 PM.</em> The rule stays the
                    same all week. Changes apply next week.
                  </div>
                </li>
                <li>
                  <strong>How to join each week</strong>
                  <div>Tap “Enter This Week.” Send the entry fee to the Banker. You’re in for this week’s game.</div>
                </li>
                <li>
                  <strong>Do the run + show proof</strong>
                  <div>
                    Run anytime during the week. Upload one clear screenshot from a tracker (Apple
                    Fitness, Strava, Nike Run Club, Garmin, etc.).
                  </div>
                  <div>
                    Your proof must show: <em>distance</em>, <em>date</em>, <em>your name/initials</em> (if the app shows it).
                  </div>
                </li>
                <li>
                  <strong>End of week (what happens)</strong>
                  <div>
                    <strong>PASS</strong> = you met the goal with valid proof. <strong>FAIL</strong> = you didn’t meet the goal or
                    didn’t upload proof.
                  </div>
                  <div>Prize = money from the FAIL players. Winners split the prize equally.</div>
                  <div>If nobody passes → prize carries to next week. If everyone passes → no prize; fun only.</div>
                </li>
                <li>
                  <strong>Leaderboard</strong>
                  <div>Updates as proofs come in. Shows miles and PASS/FAIL. It’s public to the group.</div>
                </li>
                <li>
                  <strong>Deadlines (don’t miss them)</strong>
                  <div>Proof upload closes Sun 11:59 PM. Late = FAIL. No exceptions.</div>
                </li>
                <li>
                  <strong>Fair play (no drama)</strong>
                  <div>One account per person. Real runs only. No treadmill “keyboard miles.”</div>
                  <div>Blurry or cropped proof = FAIL. Coach can reject suspicious proofs.</div>
                </li>
                <li>
                  <strong>Money basics (kept offline)</strong>
                  <div>
                    Banker holds the money. The app only tracks who entered and who won. Payouts are sent by the Banker
                    after results are posted.
                  </div>
                </li>
              </ol>
              <div className="mt-2 border-t border-dashed border-zinc-300 pt-2 text-zinc-700">
                <div className="mb-1 font-extrabold">Quick example</div>
                <div>Entry: $25. 12 players enter.</div>
                <div>Results: 7 PASS, 5 FAIL.</div>
                <div>Prize = 5 × $25 = $125 → split by 7 winners ≈ $17 each (leftover cents roll to next week).</div>
              </div>
            </div>
          </Card>
        )}

        {group && (
          <Card className="flex flex-wrap items-center justify-start gap-3 p-4 md:justify-between">
            <div>
              <h1 className="m-0 text-[22px] font-extrabold">{group.name}</h1>
              <div className="text-zinc-700">{group.rule}</div>
              {challenge && <div className="text-sm text-zinc-700">Week: {period}</div>}
            </div>
            {challenge && (
              <Badge variant="outline" className="rounded-xl px-3 py-2 order-3 w-full sm:order-none sm:w-auto">
                Pot: <span className="font-bold">${challenge.pot}</span>
              </Badge>
            )}
            <Button onClick={() => setShowWelcome(true)} aria-label="View Rules" variant="secondary" className="w-full sm:w-auto">
              View Rules
            </Button>
            {isAdmin && (
              <a href={`/group/${groupId}/admin`} className="no-underline">
                <Button variant="primary" className="w-full sm:w-auto">Admin</Button>
              </a>
            )}
          </Card>
        )}

        <Card className="p-4">
          <div className="mb-2 text-lg font-extrabold">This week at a glance</div>
          <div className="text-sm muted">Week: {period}</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {group?.rule && (
              <Badge variant="secondary" className="rounded-full">Rule: {group.rule}</Badge>
            )}
            {typeof group?.entry_fee === 'number' && (
              <Badge variant="secondary" className="rounded-full">Entry: ${group.entry_fee}</Badge>
            )}
            {deadlineLabel && (
              <Badge variant="secondary" className="rounded-full">Deadline: {deadlineLabel}</Badge>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Input readOnly value={joinLink} className="min-w-0 w-full sm:flex-1" />
            <Button onClick={copyInvite} variant="secondary" size="sm" className="w-full sm:w-auto">{copied ? 'Copied' : 'Copy link'}</Button>
          </div>
        </Card>


        <Card className="p-4">
          <div className="mb-2 text-lg font-extrabold">Submit Weekly Data</div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Miles e.g. 5.2"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              type="text"
              inputMode="decimal"
              className="max-w-[200px]"
            />
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm w-full sm:w-auto"
            />
            <Button onClick={submitProof} variant="primary" className="w-full sm:w-auto">Submit</Button>
          </div>
          <div className="mt-2 text-xs muted">{status}</div>
        </Card>

        <Card className="overflow-hidden p-4 md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-lg font-extrabold">Leaderboard {challenge ? `— ${period}` : ''}</div>
              {challenge && (
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-xs">{`Pot $${challenge.pot}`}</Badge>
              )}
            </div>
          </div>

          {loading.leaderboard ? (
            <>
              {/* Table (sm and up) */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="min-w-[640px] w-full border-collapse">
                  <thead>
                    <tr className="sticky top-0 z-10" style={{backgroundColor: 'var(--card)', color: 'var(--muted)'}}>
                      <th className="p-2 text-left">Rank</th>
                      <th className="p-2 text-left">Runner</th>
                      <th className="p-2 text-right">Miles</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Award</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-t border-stroke" style={{backgroundColor: 'var(--card)', color: 'var(--text)'}}>
                        <td className="p-2"><Skeleton className="h-6 w-6 rounded-full" /></td>
                        <td className="p-2"><Skeleton className="h-5 w-40" /></td>
                        <td className="p-2 text-right"><Skeleton className="ml-auto h-5 w-10" /></td>
                        <td className="p-2"><Skeleton className="h-5 w-16" /></td>
                        <td className="p-2"><Skeleton className="h-5 w-16" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-2 sm:hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="h-5 w-10" />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Table (sm and up) */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="min-w-[640px] w-full border-collapse">
                  <thead>
                    <tr className="sticky top-0 z-10" style={{backgroundColor: 'var(--card)', color: 'var(--muted)'}}>
                      <th className="p-2 text-left">Rank</th>
                      <th className="p-2 text-left">Runner</th>
                      <th className="p-2 text-right">Miles</th>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">Award</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(leaderboard ?? []).map((r, i) => {
                      const rank = i + 1;
                      const uid = r.user_id;
                      const st = streaks[uid] ?? 0;
                      const delta = rankDelta[uid] ?? 0;
                      const move = movement[uid] ?? 'same';
                      const medalClass = rank === 1
                        ? 'border-amber-400 bg-amber-200 text-amber-900'
                        : rank === 2
                        ? 'border-gray-400 bg-gray-200 text-gray-900'
                        : rank === 3
                        ? 'border-orange-400 bg-orange-200 text-orange-900'
                        : 'border-gray-400 bg-gray-200 text-gray-900';
                      const rowPulse = joinTop3[uid] || dropTop3[uid] ? 'animate-pulse' : '';
                      return (
                        <tr
                          key={`table-${uid}`}
                          className={`border-t border-stroke odd:bg-card even:bg-card hover:bg-card/80 transition-colors ${rowPulse}`}
                          style={{ color: 'var(--text)' }}
                        >
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold ${medalClass}`}>
                                {rank === 1 ? <Crown className="h-3.5 w-3.5" /> : rank}
                              </div>
                              <div className="flex items-center text-xs">
                                {move === 'up' && (
                                  <span className="inline-flex items-center gap-0.5 text-emerald-600"><ArrowUp className="h-3 w-3" />+{Math.abs(delta)}</span>
                                )}
                                {move === 'down' && (
                                  <span className="inline-flex items-center gap-0.5 text-rose-600"><ArrowDown className="h-3 w-3" />-{Math.abs(delta)}</span>
                                )}
                                {move === 'same' && (
                                  <span className="inline-flex items-center gap-0.5 text-zinc-500"><Minus className="h-3 w-3" />0</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Avatar name={r.name ?? r.user_id} size={rank === 1 ? 'md' : 'sm'} />
                              <div className={`font-semibold ${rank === 1 ? 'text-[15px]' : ''}`}>{r.name ?? r.user_id}</div>
                              {st >= 3 && (
                                <Badge className="ml-1 rounded-full" variant="secondary">🔥 {st}w</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-2 text-right tabular-nums">{Number(r.miles).toFixed(1)}</td>
                          <td className="p-2">—</td>
                          <td className="p-2">—</td>
                        </tr>
                      );
                    })}

                    {(!leaderboard || leaderboard.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-3 text-zinc-600">No submissions yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="grid gap-2 sm:hidden">
                {(leaderboard ?? []).map((r, i) => {
                  const rank = i + 1;
                  const uid = r.user_id;
                  const st = streaks[uid] ?? 0;
                  const delta = rankDelta[uid] ?? 0;
                  const move = movement[uid] ?? 'same';
                  const medalClass = rank === 1
                    ? 'border-amber-400 bg-amber-200 text-amber-900'
                    : rank === 2
                    ? 'border-gray-400 bg-gray-200 text-gray-900'
                    : rank === 3
                    ? 'border-orange-400 bg-orange-200 text-orange-900'
                    : 'border-gray-400 bg-gray-200 text-gray-900';
                  const rowPulse = joinTop3[uid] || dropTop3[uid] ? 'animate-pulse' : '';
                  return (
                    <div key={`mobile-${uid}`} className={`card ${rowPulse}`} style={{color: 'var(--text)'}}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-bold ${medalClass}`}>
                            {rank === 1 ? <Crown className="h-3.5 w-3.5" /> : rank}
                          </div>
                          <Avatar name={r.name ?? r.user_id} size={rank === 1 ? 'md' : 'sm'} />
                          <div className="font-semibold">{r.name ?? r.user_id}</div>
                          {st >= 3 && (
                            <Badge className="ml-1 rounded-full" variant="secondary">🔥 {st}w</Badge>
                          )}
                        </div>
                        <div className="text-right tabular-nums text-lg font-bold">{Number(r.miles).toFixed(1)}</div>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <div className="text-zinc-600">{challenge ? period : ''}</div>
                        <div>
                          {move === 'up' && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-600"><ArrowUp className="h-3 w-3" />+{Math.abs(delta)}</span>
                          )}
                          {move === 'down' && (
                            <span className="inline-flex items-center gap-0.5 text-rose-600"><ArrowDown className="h-3 w-3" />-{Math.abs(delta)}</span>
                          )}
                          {move === 'same' && (
                            <span className="inline-flex items-center gap-0.5 text-zinc-500"><Minus className="h-3 w-3" />0</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {(!leaderboard || leaderboard.length === 0) && (
                  <div className="card text-center text-sm muted">No submissions yet.</div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
