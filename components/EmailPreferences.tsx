'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface EmailPreferences {
  // Engagement & Motivation
  streak_reminders: boolean;
  daily_motivation: boolean;
  weekly_recap: boolean;
  achievement_celebrations: boolean;
  comeback_encouragement: boolean;
  
  // Group & Social
  group_activity_updates: boolean;
  new_member_welcome: boolean;
  challenge_updates: boolean;
  
  // Tips & Content
  running_tips: boolean;
  weather_updates: boolean;
  training_plans: boolean;
  
  // Admin & System
  payment_reminders: boolean;
  admin_new_user_alerts: boolean;
  system_notifications: boolean;
  
  // Marketing
  product_updates: boolean;
  newsletter: boolean;
  
  // Master controls
  all_emails: boolean;
  promotional_emails: boolean;
}

interface EmailPreferencesProps {
  compact?: boolean;
}

export function EmailPreferences({ compact = false }: EmailPreferencesProps) {
  const [preferences, setPreferences] = useState<EmailPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_email_preferences');
      
      if (error) {
        console.error('Error loading email preferences:', error);
        toast.error('Failed to load email preferences');
        return;
      }

      setPreferences(data);
      setHasAcceptedTerms(data?.all_emails || false);
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast.error('Failed to load email preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<EmailPreferences>) => {
    if (!preferences) return;

    setSaving(true);
    try {
      const updatedPrefs = { ...preferences, ...newPreferences };
      
      const { data, error } = await supabase.rpc('update_user_email_preferences', {
        preferences: updatedPrefs
      });
      
      if (error) {
        console.error('Error updating preferences:', error);
        toast.error('Failed to update email preferences');
        return;
      }

      setPreferences(data);
      toast.success('Email preferences updated!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update email preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleMasterToggle = (enabled: boolean) => {
    if (enabled && !hasAcceptedTerms) {
      setShowTerms(true);
      return;
    }
    
    updatePreferences({ all_emails: enabled });
  };

  const acceptTermsAndEnable = () => {
    setHasAcceptedTerms(true);
    setShowTerms(false);
    updatePreferences({ all_emails: true });
  };

  if (loading) {
    return (
      <div className={`${compact ? 'inline' : 'card'}`}>
        <div className={compact ? '' : 'inner'}>
          <div className="muted">Loading email preferences...</div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className={`${compact ? 'inline' : 'card'}`}>
        <div className={compact ? '' : 'inner'}>
          <div className="muted">Failed to load email preferences</div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="inline" style={{ padding: '8px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px' }}>📧 Email Updates</span>
          <div 
            className="switch" 
            role="switch" 
            aria-checked={preferences.all_emails} 
            tabIndex={0} 
            data-on={preferences.all_emails.toString()}
            onClick={() => handleMasterToggle(!preferences.all_emails)}
          >
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="inner">
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            📧 Email Preferences
          </h3>
          
          <div className="muted" style={{ marginBottom: '16px', fontSize: '14px' }}>
            Control which emails you receive from RunPool. You can unsubscribe at any time.
          </div>

          {/* Master Toggle */}
          <div className="inline" style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--panel)' }}>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>📬 All Email Communications</div>
              <div className="muted" style={{ fontSize: '12px' }}>
                Master switch for all RunPool emails. Turn off to stop all emails.
              </div>
            </div>
            <div 
              className="switch" 
              role="switch" 
              aria-checked={preferences.all_emails} 
              tabIndex={0} 
              data-on={preferences.all_emails.toString()}
              onClick={() => handleMasterToggle(!preferences.all_emails)}
            >
              <span></span>
            </div>
          </div>

          {preferences.all_emails && (
            <>
              {/* Motivation & Engagement */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--success)' }}>
                  🔥 Motivation & Engagement
                </h4>
                
                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Streak Reminders</div>
                    <div className="muted">Don't let your running streak die!</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.streak_reminders} 
                    tabIndex={0} 
                    data-on={preferences.streak_reminders.toString()}
                    onClick={() => updatePreferences({ streak_reminders: !preferences.streak_reminders })}
                  >
                    <span></span>
                  </div>
                </div>

                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Daily Motivation</div>
                    <div className="muted">Inspiring quotes and tips to start your day</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.daily_motivation} 
                    tabIndex={0} 
                    data-on={preferences.daily_motivation.toString()}
                    onClick={() => updatePreferences({ daily_motivation: !preferences.daily_motivation })}
                  >
                    <span></span>
                  </div>
                </div>

                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Achievement Celebrations</div>
                    <div className="muted">Celebrate your milestones and victories!</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.achievement_celebrations} 
                    tabIndex={0} 
                    data-on={preferences.achievement_celebrations.toString()}
                    onClick={() => updatePreferences({ achievement_celebrations: !preferences.achievement_celebrations })}
                  >
                    <span></span>
                  </div>
                </div>

                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Comeback Encouragement</div>
                    <div className="muted">"We miss you!" emails when you've been away</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.comeback_encouragement} 
                    tabIndex={0} 
                    data-on={preferences.comeback_encouragement.toString()}
                    onClick={() => updatePreferences({ comeback_encouragement: !preferences.comeback_encouragement })}
                  >
                    <span></span>
                  </div>
                </div>
              </div>

              {/* Group & Social */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--accent)' }}>
                  👥 Group & Social
                </h4>
                
                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Weekly Group Recap</div>
                    <div className="muted">See how your group performed this week</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.weekly_recap} 
                    tabIndex={0} 
                    data-on={preferences.weekly_recap.toString()}
                    onClick={() => updatePreferences({ weekly_recap: !preferences.weekly_recap })}
                  >
                    <span></span>
                  </div>
                </div>

                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Group Activity Updates</div>
                    <div className="muted">When others in your group are crushing it!</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.group_activity_updates} 
                    tabIndex={0} 
                    data-on={preferences.group_activity_updates.toString()}
                    onClick={() => updatePreferences({ group_activity_updates: !preferences.group_activity_updates })}
                  >
                    <span></span>
                  </div>
                </div>

                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Challenge Updates</div>
                    <div className="muted">Weekly challenge announcements and results</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.challenge_updates} 
                    tabIndex={0} 
                    data-on={preferences.challenge_updates.toString()}
                    onClick={() => updatePreferences({ challenge_updates: !preferences.challenge_updates })}
                  >
                    <span></span>
                  </div>
                </div>
              </div>

              {/* Tips & Content */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--brand)' }}>
                  💡 Tips & Content
                </h4>
                
                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Running Tips</div>
                    <div className="muted">Weekly tips to improve your running</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.running_tips} 
                    tabIndex={0} 
                    data-on={preferences.running_tips.toString()}
                    onClick={() => updatePreferences({ running_tips: !preferences.running_tips })}
                  >
                    <span></span>
                  </div>
                </div>

                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Weather Updates</div>
                    <div className="muted">"Perfect day for a run!" notifications</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.weather_updates} 
                    tabIndex={0} 
                    data-on={preferences.weather_updates.toString()}
                    onClick={() => updatePreferences({ weather_updates: !preferences.weather_updates })}
                  >
                    <span></span>
                  </div>
                </div>
              </div>

              {/* Essential Communications */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: 'var(--muted)' }}>
                  ⚙️ Essential Communications
                </h4>
                
                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>Payment Reminders</div>
                    <div className="muted">Important billing and payment notifications</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.payment_reminders} 
                    tabIndex={0} 
                    data-on={preferences.payment_reminders.toString()}
                    onClick={() => updatePreferences({ payment_reminders: !preferences.payment_reminders })}
                  >
                    <span></span>
                  </div>
                </div>

                <div className="inline" style={{ marginBottom: '8px' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>System Notifications</div>
                    <div className="muted">Important app updates and security notices</div>
                  </div>
                  <div 
                    className="switch" 
                    role="switch" 
                    aria-checked={preferences.system_notifications} 
                    tabIndex={0} 
                    data-on={preferences.system_notifications.toString()}
                    onClick={() => updatePreferences({ system_notifications: !preferences.system_notifications })}
                  >
                    <span></span>
                  </div>
                </div>
              </div>

              <div className="divider"></div>
              
              <div style={{ fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                <p>You can change these preferences anytime or unsubscribe completely.</p>
                <p>We respect your privacy and will never share your email with third parties.</p>
              </div>
            </>
          )}

          {saving && (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(0,0,0,0.1)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '16px'
            }}>
              <div style={{ color: 'var(--success)', fontWeight: '600' }}>Saving...</div>
            </div>
          )}
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTerms && (
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
          onClick={() => setShowTerms(false)}
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
              <div className="inline" style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                  📧 Email Communication Agreement
                </h3>
                <button 
                  onClick={() => setShowTerms(false)}
                  className="btn ghost"
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  ✕ Close
                </button>
              </div>
              
              <div style={{ lineHeight: '1.6', marginBottom: '20px' }}>
                <p><strong>By enabling email communications, you agree to:</strong></p>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                  <li>Receive motivational emails, running tips, and group updates from RunPool</li>
                  <li>Allow us to send you streak reminders and achievement celebrations</li>
                  <li>Receive essential communications about your account and payments</li>
                  <li>Understand that you can unsubscribe or modify preferences at any time</li>
                </ul>
                
                <p><strong>We promise to:</strong></p>
                <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
                  <li>🔒 Never share your email with third parties</li>
                  <li>📧 Only send relevant, helpful content</li>
                  <li>⏰ Respect frequency limits (max 1 motivational email per day)</li>
                  <li>🚫 Honor your unsubscribe requests immediately</li>
                  <li>💡 Use your data only to improve your RunPool experience</li>
                </ul>
                
                <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                  You can review our full privacy policy and terms of service at runpool.app/privacy
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowTerms(false)}
                  className="btn ghost"
                >
                  Cancel
                </button>
                <button 
                  onClick={acceptTermsAndEnable}
                  className="btn primary"
                >
                  I Agree - Enable Emails
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}