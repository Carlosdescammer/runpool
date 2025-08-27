// app/settings/page.tsx
'use client';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Settings() {
  const [user, setUser] = useState<{email?: string; id: string} | null>(null);
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string>('');
  const [nameStatus, setNameStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/signin');
        return;
      }
      setUser(user);

      // Load user profile name
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      
      const currentName = profile?.name || '';
      setName(currentName);
      setOriginalName(currentName);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  async function updateName() {
    if (!name.trim()) {
      setNameStatus('Name cannot be empty.');
      return;
    }

    if (name.trim() === originalName.trim()) {
      setNameStatus('No changes made.');
      return;
    }

    setNameStatus('Updating name…');

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({ 
          id: user?.id, 
          name: name.trim()
        });

      if (error) {
        setNameStatus(error.message);
        return;
      }

      toast.success('Name updated successfully! Redirecting...');
      
      // Check if user has any group memberships to redirect to
      const { data: memberships } = await supabase
        .from('memberships')
        .select('group_id')
        .eq('user_id', user?.id)
        .limit(1);
      
      // Redirect to appropriate page
      if (memberships && memberships.length > 0) {
        router.replace(`/group/${memberships[0].group_id}`);
      } else {
        router.replace('/onboarding');
      }
      
    } catch {
      setNameStatus('An error occurred. Please try again.');
    }
  }

  async function changePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setStatus('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setStatus('New password must be at least 6 characters long.');
      return;
    }

    if (currentPassword === newPassword) {
      setStatus('New password must be different from current password.');
      return;
    }

    setStatus('Changing password…');

    try {
      // First verify current password by trying to sign in with it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (signInError) {
        setStatus('Current password is incorrect.');
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setStatus(updateError.message);
        return;
      }

      setStatus('✅ Password changed successfully!');
      toast.success('Password changed successfully!');
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch {
      setStatus('An error occurred. Please try again.');
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/signin');
  }

  if (loading) {
    return (
      <div className="min-h-[100svh] grid place-items-center px-4 py-6 md:px-6">
        <Card className="w-full max-w-[480px] p-6">
          <div>Loading...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] grid place-items-center px-4 py-6 md:px-6">
      <Card className="w-full max-w-[480px] p-6">
        <h1 className="m-0 text-2xl font-extrabold">Account Settings</h1>
        
        <div className="h-4" />
        
        {/* User Info */}
        <div className="mb-6 p-4 card">
          <div className="text-sm muted">Signed in as:</div>
          <div className="font-medium">{user?.email}</div>
        </div>

        {/* Update Name Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Profile Name</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Display name</Label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2"
                autoComplete="name"
              />
              <div className="mt-1 text-xs text-zinc-600">
                This name will be shown to other members in your groups.
              </div>
            </div>

            <Button 
              onClick={updateName} 
              variant="primary" 
              size="lg" 
              className="w-full"
              disabled={name.trim() === originalName.trim() || !name.trim()}
            >
              Update Name
            </Button>
            
            <div className="min-h-[18px] text-sm muted">{nameStatus}</div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Change Password</h2>
          
          <div className="space-y-4">
            <div>
              <Label>Current password</Label>
              <Input
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-2"
                autoComplete="current-password"
              />
            </div>

            <div>
              <Label>New password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-2"
                autoComplete="new-password"
              />
            </div>

            <div>
              <Label>Confirm new password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2"
                autoComplete="new-password"
              />
            </div>

            <Button onClick={changePassword} variant="primary" size="lg" className="w-full">
              Change Password
            </Button>
            
            <div className="text-xs text-zinc-600">
              💡 <strong>Tip:</strong> Choose a strong password with at least 6 characters.
            </div>
          </div>
        </div>

        <div className="h-6" />
        
        {/* Other Actions */}
        <div className="border-t pt-6 space-y-3">
          <Button onClick={signOut} variant="secondary" size="sm" className="w-full">
            Sign Out
          </Button>
        </div>

        <div className="h-3" />
        <div className="min-h-[18px] text-sm muted">{status}</div>
      </Card>
    </div>
  );
}