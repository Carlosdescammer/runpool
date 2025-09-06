// app/auth/update-password/page.tsx
'use client';
import { supabase } from '@/lib/supabase/client';
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
    const handlePasswordReset = async () => {
      // Check for password reset token in URL
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.slice(1)); // Remove the '#' character
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      
      if (type === 'recovery' && accessToken && refreshToken) {
        // Set the session from the URL parameters
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (!error) {
          setReady(true);
          setStatus('Ready to set your new password.');
          // Clean up the URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setStatus('Invalid or expired reset link. Please request a new password reset.');
        }
      } else {
        // Check if user already has a session (maybe they're already logged in)
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setReady(true);
          setStatus('You can change your password below.');
        } else {
          setStatus('Please use the link from your password reset email. If you don&apos;t have one, go back to sign in and click "Forgot your password?"');
        }
      }
    };
    
    handlePasswordReset();
  }, []);

  async function updatePassword() {
    if (!newPassword || !confirmPassword) { setStatus('Enter and confirm your new password.'); return; }
    if (newPassword !== confirmPassword) { setStatus('Passwords do not match.'); return; }
    if (newPassword.length < 6) { setStatus('Password must be at least 6 characters long.'); return; }

    setStatus('Updating password…');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setStatus(error.message);
    } else {
      setStatus('✅ Password updated successfully! You can now sign in with your new password.');
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-redirect to sign in after 3 seconds
      setTimeout(() => {
        window.location.href = '/signin';
      }, 3000);
    }
  }

  return (
    <div className="min-h-[100svh] grid place-items-center px-4 py-6 md:px-6">
      <Card className="w-full max-w-[480px] p-6">
        <h1 className="m-0 text-2xl font-extrabold">Update your password</h1>
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
            <div className="mt-2 text-xs text-zinc-600">
              Password must be at least 6 characters long.
            </div>
            <div className="mt-1 text-xs text-zinc-700">
              After updating, you&apos;ll be redirected to{' '}
              <Link href="/signin" className="text-[color:var(--rp-text)] underline">sign in</Link>.
            </div>
          </>
        )}
        <div className="mt-3 min-h-[18px] text-sm text-zinc-700">{status}</div>
      </Card>
    </div>
  );
}
