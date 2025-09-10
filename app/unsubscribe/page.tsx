'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function UnsubscribePage() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleUnsubscribe = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setError('Invalid unsubscribe link');
        setLoading(false);
        return;
      }

      try {
        // Get user by ID from token
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', token)
          .single();

        if (profileError || !profile) {
          setError('Invalid unsubscribe link');
          setLoading(false);
          return;
        }

        setUserEmail(profile.email);

        // Update email preferences to unsubscribe from all emails
        const { error: updateError } = await supabase.rpc('update_user_email_preferences', {
          preferences: {
            all_emails: false,
            streak_reminders: false,
            daily_motivation: false,
            weekly_recap: false,
            achievement_celebrations: false,
            comeback_encouragement: false,
            group_activity_updates: false,
            new_member_welcome: false,
            challenge_updates: false,
            running_tips: false,
            weather_updates: false,
            training_plans: false,
            product_updates: false,
            newsletter: false,
            promotional_emails: false
          }
        });

        if (updateError) {
          setError('Failed to unsubscribe. Please try again later.');
        } else {
          setSuccess(true);
        }
      } catch (err) {
        setError('An error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    handleUnsubscribe();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="wrap">
        <section className="card">
          <div className="inner" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
            <h2>Processing your request...</h2>
            <p className="muted">Please wait while we unsubscribe you from our emails.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="wrap">
      <section className="card">
        <div className="inner" style={{ textAlign: 'center', padding: '40px' }}>
          {success ? (
            <>
              <div style={{ fontSize: '48px', marginBottom: '24px' }}>✅</div>
              <h2>Successfully Unsubscribed</h2>
              <p>You have been unsubscribed from all RunPool emails.</p>
              {userEmail && (
                <p className="muted" style={{ marginTop: '16px' }}>
                  Email: {userEmail}
                </p>
              )}
              <div style={{ marginTop: '32px' }}>
                <button 
                  onClick={() => router.push('/')}
                  className="btn primary"
                >
                  Return to RunPool
                </button>
              </div>
              <div style={{ marginTop: '24px', fontSize: '14px', color: 'var(--muted)' }}>
                <p>You can re-enable email notifications anytime by:</p>
                <ol style={{ textAlign: 'left', display: 'inline-block', marginTop: '8px' }}>
                  <li>Signing into your RunPool account</li>
                  <li>Going to Settings → Notifications</li>
                  <li>Updating your email preferences</li>
                </ol>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '48px', marginBottom: '24px' }}>❌</div>
              <h2>Unsubscribe Failed</h2>
              <p style={{ color: 'var(--error)', marginBottom: '24px' }}>{error}</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => router.push('/')}
                  className="btn primary"
                >
                  Return to RunPool
                </button>
              </div>
              <div style={{ marginTop: '24px', fontSize: '14px', color: 'var(--muted)' }}>
                <p>If you continue having issues, please contact our support team.</p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}