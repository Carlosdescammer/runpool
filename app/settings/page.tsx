// app/settings/page.tsx
'use client';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GroupAdminPanel } from '@/components/GroupAdminPanel';
import { EmailPreferences } from '@/components/EmailPreferences';


interface AdminGroup {
  id: string;
  name: string;
}

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
  const [adminGroups, setAdminGroups] = useState<AdminGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/signin');
        return;
      }
      setUser(user);

      // Load user profile and admin groups
      const [{ data: profile }, { data: adminMemberships }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('name')
          .eq('id', user.id)
          .single(),
        supabase
          .from('memberships')
          .select('group_id, groups!inner(name)')
          .in('role', ['admin', 'owner'])
          .eq('user_id', user.id)
      ]);
      
      const currentName = profile?.name || '';
      setName(currentName);
      setOriginalName(currentName);
      
      if (adminMemberships) {
        const groups = adminMemberships.map((m: any) => ({ id: m.group_id, name: m.groups.name }));
        setAdminGroups(groups);
        if (groups.length > 0) {
          setSelectedGroupId(groups[0].id);
        }
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

      showToast('Name updated ✅');
      
      const { data: memberships } = await supabase
        .from('memberships')
        .select('group_id')
        .eq('user_id', user?.id)
        .limit(1);
      
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword
      });

      if (signInError) {
        setStatus('Current password is incorrect.');
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setStatus(updateError.message);
        return;
      }

      setStatus('✅ Password changed successfully!');
      showToast('Password updated ✅');
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch {
      setStatus('An error occurred. Please try again.');
    }
  }

  async function backToDashboard() {
    const { data: memberships } = await supabase
      .from('memberships')
      .select('group_id')
      .eq('user_id', user?.id)
      .limit(1);
    
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

  // Toast function
  const showToast = (msg = 'Saved') => {
    toast(msg);
  };

  // Get contextual help content based on active tab
  const getHelpContent = () => {
    switch (activeTab) {
      case 'profile':
        return {
          title: '📝 Profile Help',
          content: [
            'Your display name is shown to all members in your groups.',
            'Choose a name that helps others identify you during challenges.',
            'Your email address cannot be changed from this page - contact support if needed.',
            'Profile updates are saved immediately and will be visible to all group members.'
          ]
        };
      case 'notifications':
        return {
          title: '🔔 Notification Settings',
          content: [
            'Weekly goal reminders: Get notified when you\'re behind on your weekly mileage.',
            'Top performer alerts: Receive notifications when you enter the top 3 rankings.',
            'Activity notifications: Get updates when other group members log their miles.',
            'Admin alerts: (Admin only) Get notified when new users join groups you manage.',
            'Weekly recap: Receive weekly summaries of your group\'s performance.',
            'All notifications are sent to your registered email address.',
            'Motivational emails: Daily streaks, comeback reminders, and running tips.',
            'Terms acceptance: You can review and accept our terms before enabling email campaigns.'
          ]
        };
      case 'security':
        return {
          title: '🔒 Security & Password',
          content: [
            'Use a strong password with at least 6 characters.',
            'Your current password is required to make changes.',
            'New passwords must be different from your current password.',
            'Password changes take effect immediately.',
            'If you forget your password, use the "Forgot Password" link on the sign-in page.'
          ]
        };
      case 'admin':
        return {
          title: '⚡ Admin Panel Guide',
          content: [
            'Create weekly challenges: Set distance goals and entry fees for your group.',
            'Manage payments: Track who has paid and send reminders to unpaid participants.',
            'Invite links: Generate shareable links for new members to join your group.',
            'Member management: View group members and manage their roles.',
            'Delete expired invites: Clean up old invitation links that are no longer valid.',
            'Group settings: Update group name, description, and notification preferences.'
          ]
        };
      default:
        return {
          title: '❓ Settings Help',
          content: ['Navigate between tabs to access different settings and features.']
        };
    }
  };


  if (loading) {
    return (
      <div className="wrap">
        <section className="card">
          <div className="inner">
            <div>Loading settings...</div>
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
          <span className="pill">Settings</span>
        </div>
        <div className="row">
          <button onClick={backToDashboard} className="btn ghost">
            ← Back to Dashboard
          </button>
          <button onClick={() => setShowHelpModal(true)} className="btn">Help</button>
          <button onClick={signOut} className="btn primary">
            Sign Out
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <section className="card">
        <div className="inner">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
            <button 
              className={`tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            {adminGroups.length > 0 && (
              <button 
                className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                Admin
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <section className="card">
          <div className="inner">
            <h2>Profile</h2>
            <div className="grid-2">
              <div>
                <label htmlFor="gname">Display name</label>
                <input
                  id="gname"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field"
                  autoComplete="name"
                />
                <div className="muted" style={{marginTop: '4px'}}>
                  This name will be shown to other members in your groups.
                </div>
              </div>
              <div>
                <label>Email address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="field"
                />
                <div className="muted" style={{marginTop: '4px'}}>
                  Contact support to change your email address.
                </div>
              </div>
            </div>
            <div className="divider"></div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div className="muted" style={{minHeight: '18px', fontSize: '12px'}}>{nameStatus}</div>
              <button 
                onClick={updateName} 
                className="btn primary"
                disabled={name.trim() === originalName.trim() || !name.trim()}
              >
                Update Profile
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <EmailPreferences />
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <section className="card">
          <div className="inner">
            <h2>Security</h2>
            <div className="grid-2">
              <div>
                <label htmlFor="curpass">Current password</label>
                <input 
                  id="curpass" 
                  type="password" 
                  placeholder="Enter current password" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  className="field" 
                  autoComplete="current-password" 
                />
              </div>
              <div></div>
              <div>
                <label htmlFor="newpass">New password</label>
                <input 
                  id="newpass" 
                  type="password" 
                  placeholder="Enter new password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  className="field" 
                  autoComplete="new-password" 
                />
              </div>
              <div>
                <label htmlFor="confpass">Confirm new password</label>
                <input 
                  id="confpass" 
                  type="password" 
                  placeholder="Confirm new password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  className="field" 
                  autoComplete="new-password" 
                />
              </div>
            </div>
            <div className="divider"></div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div className="muted" style={{minHeight: '18px', fontSize: '12px', color: status.includes('✅') ? 'var(--success)' : '#ef4444'}}>{status}</div>
              <button onClick={changePassword} className="btn">
                Change Password
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Admin Tab */}
      {activeTab === 'admin' && adminGroups.length > 0 && (
        <section className="card">
          <div className="inner">
            <h2>Group Management</h2>
            <div style={{marginBottom: '16px'}}>
              <label htmlFor="groupSelect">Select a group to manage</label>
              <select 
                id="groupSelect" 
                className="field" 
                value={selectedGroupId ?? ''}
                onChange={(e) => setSelectedGroupId(e.target.value)}
              >
                {adminGroups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedGroupId && (
              <div>
                <div className="divider"></div>
                <GroupAdminPanel groupId={selectedGroupId} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="card"
            style={{
              maxWidth: 'min(500px, calc(100vw - 32px))',
              width: '90%',
              maxHeight: 'min(80vh, calc(100vh - 64px))',
              overflow: 'auto',
              margin: 0
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inner">
            <div className="inline" style={{marginBottom: '16px'}}>
              <h3 style={{margin: 0, fontSize: '18px', fontWeight: '600'}}>
                {getHelpContent().title}
              </h3>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="btn ghost"
                style={{fontSize: '12px', padding: '4px 8px'}}
              >
                ✕ Close
              </button>
            </div>
            
            <div style={{lineHeight: '1.6'}}>
              {getHelpContent().content.map((item, index) => (
                <div key={index} style={{marginBottom: '12px', paddingLeft: '8px'}}>
                  • {item}
                </div>
              ))}
            </div>

            <div className="divider"></div>
            
            <div style={{fontSize: '14px', color: '#6c757d', textAlign: 'center'}}>
              Need more help? Contact support or check our documentation.
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast placeholder */}
      <div className="toast" id="toast" role="status" aria-live="polite">Saved</div>
    </div>
  );
}