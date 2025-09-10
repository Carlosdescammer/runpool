'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestEmailCampaigns() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const testPreviewTemplate = async (templateKey: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`/api/email-campaigns/send?action=preview&template_key=${templateKey}`);
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to preview template');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to preview template');
    } finally {
      setLoading(false);
    }
  };

  const testSendEmail = async (templateKey: string) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to test emails');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/email-campaigns/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_key: templateKey,
          target_user_ids: [user.id],
          template_variables: {
            streak_length: 5,
            total_miles: 15.5,
            days_active: 3,
            group_name: 'Test Group',
            group_id: 'test-group-id'
          }
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to send test email');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const triggerAutomatedCampaigns = async (campaignType: string = 'all') => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/email-campaigns/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaign_type: campaignType,
          manual_trigger: true
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to trigger campaigns');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to trigger campaigns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <section className="card">
        <div className="inner">
          <h2>Email Campaign Testing</h2>
          <p className="muted">Test email templates and campaign functionality</p>

          <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
            <div className="card">
              <div className="inner">
                <h3>Streak Reminder (3 days)</h3>
                <p className="muted">Test the streak reminder email for users with a 3+ day streak</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    onClick={() => testPreviewTemplate('streak_reminder_3_days')}
                    className="btn"
                    disabled={loading}
                  >
                    Preview Template
                  </button>
                  <button 
                    onClick={() => testSendEmail('streak_reminder_3_days')}
                    className="btn primary"
                    disabled={loading}
                  >
                    Send Test Email
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="inner">
                <h3>Daily Motivation</h3>
                <p className="muted">Test the daily motivation email for new streaks</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    onClick={() => testPreviewTemplate('daily_motivation_new')}
                    className="btn"
                    disabled={loading}
                  >
                    Preview Template
                  </button>
                  <button 
                    onClick={() => testSendEmail('daily_motivation_new')}
                    className="btn primary"
                    disabled={loading}
                  >
                    Send Test Email
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="inner">
                <h3>Weekly Achievement</h3>
                <p className="muted">Test the weekly achievement celebration email</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    onClick={() => testPreviewTemplate('weekly_achievement')}
                    className="btn"
                    disabled={loading}
                  >
                    Preview Template
                  </button>
                  <button 
                    onClick={() => testSendEmail('weekly_achievement')}
                    className="btn primary"
                    disabled={loading}
                  >
                    Send Test Email
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="inner">
                <h3>Comeback Encouragement</h3>
                <p className="muted">Test the comeback encouragement email</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    onClick={() => testPreviewTemplate('comeback_encouragement')}
                    className="btn"
                    disabled={loading}
                  >
                    Preview Template
                  </button>
                  <button 
                    onClick={() => testSendEmail('comeback_encouragement')}
                    className="btn primary"
                    disabled={loading}
                  >
                    Send Test Email
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="inner">
                <h3>Running Tips (Monday)</h3>
                <p className="muted">Test the Monday running tip email</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button 
                    onClick={() => testPreviewTemplate('running_tip_monday')}
                    className="btn"
                    disabled={loading}
                  >
                    Preview Template
                  </button>
                  <button 
                    onClick={() => testSendEmail('running_tip_monday')}
                    className="btn primary"
                    disabled={loading}
                  >
                    Send Test Email
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="divider" style={{ margin: '32px 0' }}></div>
          
          <div className="card">
            <div className="inner">
              <h3>🤖 Automated Campaign Triggers</h3>
              <p className="muted">Manually trigger automated email campaigns (normally run by cron jobs)</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                <button 
                  onClick={() => triggerAutomatedCampaigns('streak_reminders')}
                  className="btn"
                  disabled={loading}
                >
                  Streak Reminders
                </button>
                <button 
                  onClick={() => triggerAutomatedCampaigns('daily_motivation')}
                  className="btn"
                  disabled={loading}
                >
                  Daily Motivation
                </button>
                <button 
                  onClick={() => triggerAutomatedCampaigns('comeback_encouragement')}
                  className="btn"
                  disabled={loading}
                >
                  Comeback Emails
                </button>
                <button 
                  onClick={() => triggerAutomatedCampaigns('weekly_achievements')}
                  className="btn"
                  disabled={loading}
                >
                  Weekly Achievements
                </button>
                <button 
                  onClick={() => triggerAutomatedCampaigns('running_tips')}
                  className="btn"
                  disabled={loading}
                >
                  Running Tips
                </button>
                <button 
                  onClick={() => triggerAutomatedCampaigns('all')}
                  className="btn primary"
                  disabled={loading}
                  style={{ gridColumn: 'span 2' }}
                >
                  🚀 Trigger All Campaigns
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <div className="muted">Loading...</div>
            </div>
          )}

          {error && (
            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              backgroundColor: 'var(--error-bg)', 
              color: 'var(--error)',
              borderRadius: '8px'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: '24px' }}>
              <h3>Result:</h3>
              <pre style={{ 
                background: 'var(--background-secondary)',
                padding: '16px',
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '12px'
              }}>
                {JSON.stringify(result, null, 2)}
              </pre>
              
              {result.preview_html && (
                <div style={{ marginTop: '16px' }}>
                  <h4>Email Preview:</h4>
                  <div 
                    style={{ 
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                    dangerouslySetInnerHTML={{ __html: result.preview_html }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}