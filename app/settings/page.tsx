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
  const [emailPrefs, setEmailPrefs] = useState({
    weekly_goal_reminders: true,
    top_performer_alerts: true,
    admin_new_user_alerts: true,
    top_three_milestone: true,
    proof_notifications: true,
    weekly_recap: true,
    invite_notifications: true,
  });
  const [emailPrefsStatus, setEmailPrefsStatus] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/signin');
        return;
      }
      setUser(user);

      // Load user profile name and email preferences
      const [{ data: profile }, { data: prefs }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('name')
          .eq('id', user.id)
          .single(),
        supabase
          .rpc('get_user_email_preferences', { target_user_id: user.id })
          .single()
      ]);
      
      const currentName = profile?.name || '';
      setName(currentName);
      setOriginalName(currentName);
      
      if (prefs) {
        setEmailPrefs({
          weekly_goal_reminders: prefs.weekly_goal_reminders ?? true,
          top_performer_alerts: prefs.top_performer_alerts ?? true,
          admin_new_user_alerts: prefs.admin_new_user_alerts ?? true,
          top_three_milestone: prefs.top_three_milestone ?? true,
          proof_notifications: prefs.proof_notifications ?? true,
          weekly_recap: prefs.weekly_recap ?? true,
          invite_notifications: prefs.invite_notifications ?? true,
        });
      }
      
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

  async function updateEmailPreferences() {
    setEmailPrefsStatus('Updating preferences…');

    try {
      const { error } = await supabase.rpc('upsert_user_email_preferences', {
        target_user_id: user?.id,
        weekly_goal_reminders: emailPrefs.weekly_goal_reminders,
        top_performer_alerts: emailPrefs.top_performer_alerts,
        admin_new_user_alerts: emailPrefs.admin_new_user_alerts,
        top_three_milestone: emailPrefs.top_three_milestone,
        proof_notifications: emailPrefs.proof_notifications,
        weekly_recap: emailPrefs.weekly_recap,
        invite_notifications: emailPrefs.invite_notifications,
      });

      if (error) {
        setEmailPrefsStatus(error.message);
        return;
      }

      setEmailPrefsStatus('✅ Email preferences updated!');
      toast.success('Email preferences updated successfully!');
      
    } catch {
      setEmailPrefsStatus('An error occurred. Please try again.');
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

  async function backToDashboard() {
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

        {/* Email Preferences Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Email Notifications</h2>
          
          <div className="space-y-4">
            <div className="text-sm text-zinc-600 mb-4">
              Choose which email notifications you'd like to receive. You can always update these preferences later.
            </div>

            {/* Weekly Goal Reminders */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Weekly goal reminders</div>
                <div className="text-sm text-zinc-600">Get reminded when you're behind on your weekly mileage goal</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailPrefs.weekly_goal_reminders}
                  onChange={(e) => setEmailPrefs(prev => ({ ...prev, weekly_goal_reminders: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Top Performer Alerts */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Top performer alerts</div>
                <div className="text-sm text-zinc-600">Get notified when you enter the top 3 rankings</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailPrefs.top_performer_alerts}
                  onChange={(e) => setEmailPrefs(prev => ({ ...prev, top_performer_alerts: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Top 3 Milestone */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Top 3 milestone notifications</div>
                <div className="text-sm text-zinc-600">Get notified when top 3 performers log new miles</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailPrefs.top_three_milestone}
                  onChange={(e) => setEmailPrefs(prev => ({ ...prev, top_three_milestone: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Proof Notifications */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Activity notifications</div>
                <div className="text-sm text-zinc-600">Get notified when other group members log miles</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailPrefs.proof_notifications}
                  onChange={(e) => setEmailPrefs(prev => ({ ...prev, proof_notifications: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Admin New User Alerts */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">New member alerts (Admin only)</div>
                <div className="text-sm text-zinc-600">Get notified when new users join groups you admin</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailPrefs.admin_new_user_alerts}
                  onChange={(e) => setEmailPrefs(prev => ({ ...prev, admin_new_user_alerts: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Weekly Recap */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Weekly recap emails</div>
                <div className="text-sm text-zinc-600">Receive weekly summaries of group performance</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailPrefs.weekly_recap}
                  onChange={(e) => setEmailPrefs(prev => ({ ...prev, weekly_recap: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Invite Notifications */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium">Invite notifications</div>
                <div className="text-sm text-zinc-600">Receive group invitations and related emails</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={emailPrefs.invite_notifications}
                  onChange={(e) => setEmailPrefs(prev => ({ ...prev, invite_notifications: e.target.checked }))}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <Button 
              onClick={updateEmailPreferences} 
              variant="primary" 
              size="lg" 
              className="w-full mt-4"
            >
              Save Email Preferences
            </Button>
            
            <div className="min-h-[18px] text-sm muted">{emailPrefsStatus}</div>
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
          <Button onClick={backToDashboard} variant="primary" size="sm" className="w-full">
            ← Back to Dashboard
          </Button>
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