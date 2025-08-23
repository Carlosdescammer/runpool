// app/page.tsx
import Link from 'next/link';
import type React from 'react';

export default function Home() {
  const btn = {
    base: {
      padding: '12px 16px',
      borderRadius: 10,
      fontWeight: 700 as const,
      textDecoration: 'none',
      display: 'inline-block',
      minHeight: 44,
      fontSize: 16,
    },
    primary: { background: '#7C3AED', color: '#fff', boxShadow: '0 8px 20px rgba(124,58,237,0.25)' },
    ghost:   { border: '1px solid #e5e7eb', color: '#111', background: '#fff' },
  };

  const card: React.CSSProperties = {
    padding: 16, border: '1px solid #eee', borderRadius: 12, background: '#fff',
  };

  return (
    <div style={{
      display: 'grid',
      gap: 24,
      minHeight: '100svh',
      padding: 'calc(16px + env(safe-area-inset-top)) calc(16px + env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) calc(16px + env(safe-area-inset-left))',
    }}>
      {/* HERO */}
      <section
        style={{
          borderRadius: 16,
          padding: 'clamp(32px, 8vw, 56px) 24px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.10), rgba(236,72,153,0.10))',
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gap: 24, alignItems: 'center',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(28px, 8vw, 44px)', lineHeight: 1.1, margin: 0, fontWeight: 900 }}>Run Pool</h1>
            <p style={{ margin: '14px 0 24px', fontSize: 18, color: '#374151' }}>
              Create a group, set weekly miles, invite with a link, upload proof, and
              watch the live leaderboard. Money is held offline by your group’s banker.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="/group/new" style={{ ...btn.base, ...btn.primary }}>Create a Group</Link>
              <Link href="/signin" style={{ ...btn.base, ...btn.ghost }}>Sign In</Link>
            </div>
          </div>
          <div style={{ display:'grid', placeItems:'center' }}>
            <div style={{ width: '100%', maxWidth: 420, background:'#fff', border:'1px solid #eee', borderRadius:16,
                           boxShadow:'0 20px 40px rgba(0,0,0,0.08)', padding:16 }}>
              <div style={{ height: 10, width: 60, background:'#e5e7eb', borderRadius: 9999 }} />
              <div style={{ height: 14 }} />
              <div style={{ display:'grid', gap:10 }}>
                <div style={{ height: 36, background:'#f3f4f6', borderRadius:8 }} />
                <div style={{ height: 36, background:'#f3f4f6', borderRadius:8 }} />
                <div style={{ height: 36, background:'#f3f4f6', borderRadius:8 }} />
                <div style={{ height: 160, background:'#f9fafb', border: '1px dashed #e5e7eb', borderRadius:12, display:'grid', placeItems:'center', color:'#9ca3af', fontSize:12 }}>
                  Leaderboard preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT THIS APP DOES */}
      <section>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>What it does</h2>
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          }}
        >
          <div style={card}>
            <div style={{ fontSize: 20 }}>🛠️</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>Admin Sets Rules</div>
            <div style={{ color: '#555', marginTop: 6 }}>
              Distance goal & weekly pot (display only). You control the group.
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 20 }}>🔗</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>Invite Link</div>
            <div style={{ color: '#555', marginTop: 6 }}>
              Share a single join URL. No emails. No friction.
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 20 }}>📸</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>Upload Proof</div>
            <div style={{ color: '#555', marginTop: 6 }}>
              Members log miles and attach a screenshot each week.
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 20 }}>📊</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>Live Leaderboard</div>
            <div style={{ color: '#555', marginTop: 6 }}>
              Everyone sees standings in real time—no scrolling chats.
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 20 }}>🧾</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>History & Transparency</div>
            <div style={{ color: '#555', marginTop: 6 }}>
              Past weeks are archived so nobody argues about results.
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: 20 }}>💳</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>Offline Pot</div>
            <div style={{ color: '#555', marginTop: 6 }}>
              One trusted banker holds money via Apple Pay/Venmo. App tracks only.
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>How it works</h2>
        <ol style={{ paddingLeft: 18, color: '#333', lineHeight: 1.7 }}>
          <li>Create a group and set this week’s rule + pot.</li>
          <li>Copy the invite link and share it anywhere.</li>
          <li>Members sign in, join, log miles, and upload proof.</li>
          <li>Leaderboard updates live. Close the week and start the next.</li>
        </ol>
        <div style={{ marginTop: 12 }}>
          <Link href="/group/new" style={{ ...btn.base, ...btn.primary }}>Get Started</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ color: '#777', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
        Built with Next.js + Supabase. No payments—pot is offline for MVP.
      </footer>
    </div>
  );
}
