// app/auth/update-password/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-[100svh] grid place-items-center px-4 py-6 md:px-6">
      <Card className="w-full max-w-[480px] p-6">
        <h1 className="m-0 text-2xl font-extrabold">Set a new password</h1>
        <div className="h-3" />
        {ready && (
          <>
            <Label>New password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2"
            />
            <div className="h-3" />
            <Label>Confirm new password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2"
            />
            <div className="h-4" />
            <Button onClick={updatePassword} variant="primary" size="lg" className="w-full">
              Update password
            </Button>
            <div className="mt-2 text-xs text-zinc-700">
              After updating, return to{' '}
              <Link href="/signin" className="text-[color:var(--rp-text)] underline">Sign in</Link>.
            </div>
          </>
        )}
        <div className="mt-3 min-h-[18px] text-sm text-zinc-700">{status}</div>
      </Card>
    </div>
  );
}
