// app/onboarding/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Require auth, and fetch current user id
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        router.replace('/signin');
        return;
      }
      // If already in a group, send to that dashboard
      const { data: memberships } = await supabase
        .from('memberships')
        .select('group_id')
        .eq('user_id', uid)
        .limit(1);
      if (memberships && memberships.length > 0) {
        router.replace(`/group/${memberships[0].group_id}`);
      }
    });
  }, [router]);

  async function saveProfile() {
    if (!userId) { setStatus('Please sign in first.'); return; }
    setStatus('Saving profile…');
    const { error } = await supabase.from('user_profiles').upsert({ 
      id: userId, 
      name: name
    });
    if (error) setStatus(error.message); else setStatus('Profile saved.');
  }

  function joinByToken() {
    if (!token) { setStatus('Enter an invite token.'); return; }
    let t = token.trim();
    try {
      if (t.includes('http')) {
        const u = new URL(t);
        t = u.searchParams.get('token') ?? t;
      }
    } catch { /* ignore parse errors */ }
    router.push(`/join?token=${encodeURIComponent(t)}`);
  }

  return (
    <div className="min-h-svh px-4 py-6">
      <div className="mx-auto w-full max-w-[560px]">
        <Card className="p-5">
          <h1 className="m-0 text-[22px] font-extrabold">Welcome — let’s get you set up</h1>
          <div className="mt-1 text-sm text-zinc-700">Choose a display name, then join an existing group or create a new one.</div>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="display-name">Display name</Label>
              <Input id="display-name" placeholder="e.g. Jamie" value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            <Button onClick={saveProfile} variant="primary" className="w-full">Save profile</Button>

            <div className="mt-2 font-extrabold">Join a group</div>
            <div className="text-xs text-zinc-700">
              If someone sent you an invite link, paste the token here. You can also paste the full URL; we’ll extract the token.
            </div>
            <Input placeholder="Invite token or link" value={token} onChange={(e)=>setToken(e.target.value)} />
            <Button onClick={joinByToken} variant="primary" className="w-full">Join group</Button>

            <div className="mt-2 font-extrabold">Or create a new group</div>
            <div className="text-xs text-zinc-700">
              You’ll set the rules and dates, then get an invite link you can copy and share. Members who open the link will see a
              description and be guided to create a profile and join.
            </div>
            <Link href="/group/new" className="no-underline">
              <Button variant="secondary" className="w-full">Create a group</Button>
            </Link>

            <div className="min-h-[18px] text-xs text-zinc-600">{status}</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
