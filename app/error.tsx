'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error digest:', error.digest);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg)'
    }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="inner" style={{ textAlign: 'center' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '16px',
            color: 'var(--text)'
          }}>
            Something went wrong!
          </h2>
          <p style={{
            color: 'var(--muted)',
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            We're sorry, but something unexpected happened. Please try again.
          </p>

          {/* Show error details in development */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              background: 'var(--chip)',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>
                Error Details:
              </h3>
              <pre style={{
                fontSize: '12px',
                color: 'var(--muted)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {error.message}
                {error.stack && '\n\nStack trace:\n' + error.stack}
              </pre>
            </div>
          )}

          <button
            onClick={reset}
            className="btn primary"
            style={{ padding: '12px 24px' }}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}