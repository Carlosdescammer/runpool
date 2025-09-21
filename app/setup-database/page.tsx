'use client';

import { useState } from 'react';

export default function SetupDatabase() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const setupEmailTemplates = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/setup-email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Failed to setup templates');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError('Failed to setup email templates');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <section className="card">
        <div className="inner">
          <h2>Database Setup</h2>
          <p className="muted">Set up email templates and database schema for the email campaign system</p>

          <div className="card" style={{ marginTop: '24px' }}>
            <div className="inner">
              <h3>📧 Email Templates Setup</h3>
              <p className="muted">
                This will create the email templates needed for automated campaigns including:
              </p>
              <ul style={{ marginTop: '12px' }}>
                <li>🔥 Streak reminder emails</li>
                <li>🌟 Daily motivation emails</li>
                <li>🏆 Weekly achievement emails</li>
                <li>👥 Comeback encouragement emails</li>
                <li>💡 Running tip emails</li>
              </ul>
              
              <div style={{ marginTop: '20px' }}>
                <button 
                  onClick={setupEmailTemplates}
                  className="btn primary"
                  disabled={loading}
                >
                  {loading ? 'Setting up...' : '🚀 Setup Email Templates'}
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <div className="muted">Setting up database...</div>
            </div>
          )}

          {error && (
            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              backgroundColor: '#fee2e2', 
              color: '#dc2626',
              borderRadius: '8px',
              border: '1px solid #fecaca'
            }}>
              <strong>Error:</strong> {error}
              
              {error.includes('does not exist') && (
                <div style={{ marginTop: '12px', fontSize: '14px' }}>
                  <strong>Next Steps:</strong>
                  <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
                    <li>Go to your Supabase dashboard</li>
                    <li>Navigate to the SQL Editor</li>
                    <li>Run the migration files from <code>supabase/migrations/</code></li>
                    <li>Then try this setup again</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {result && (
            <div style={{ 
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#f0fdf4',
              color: '#166534',
              borderRadius: '8px',
              border: '1px solid #bbf7d0'
            }}>
              <strong>✅ Success!</strong> {result.message}
              
              {result.templates_created && (
                <div style={{ marginTop: '8px' }}>
                  Created {result.templates_created} email templates
                </div>
              )}
              
              <div style={{ marginTop: '16px' }}>
                <strong>Next Steps:</strong>
                <ol style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li>Go to <a href="/settings" style={{ color: '#166534', textDecoration: 'underline' }}>Settings → Notifications</a> to configure your email preferences</li>
                  <li>Visit <a href="/test-email-campaigns" style={{ color: '#166534', textDecoration: 'underline' }}>Test Email Campaigns</a> to preview and test the templates</li>
                  <li>The automated campaigns will run twice daily via cron jobs</li>
                </ol>
              </div>
            </div>
          )}

          <div style={{ marginTop: '32px', fontSize: '14px', color: '#6b7280' }}>
            <h4>Manual Setup Instructions</h4>
            <p>If the automated setup doesn&apos;t work, you can manually run these SQL files in your Supabase dashboard:</p>
            <ul>
              <li><code>supabase/migrations/20241210000001_email_campaigns.sql</code></li>
              <li><code>supabase/migrations/20241210000002_email_templates.sql</code></li>
              <li><code>supabase/migrations/20241210000003_automated_email_triggers.sql</code></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}