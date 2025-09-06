'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <h1 className="title">Create a Running Pool in Seconds</h1>
            <p className="subtitle">Set the rules, invite your crew, log miles, and watch the leaderboard update automatically. Friendly stakes, serious momentum.</p>
            <div className="hero-cta">
              <Link href="/group/new" className="btn btn-primary">Create a Pool</Link>
              <Link href="/signin" className="btn">Sign In</Link>
            </div>
          </div>

          <div className="hero-card" aria-label="Feature preview">
            <strong style={{display: 'block', marginBottom: '8px'}}>Key Features</strong>
            <div style={{padding: '20px 0'}}>
              <div style={{marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{color: 'var(--success)'}}>✓</span>
                <span>Real-time leaderboard tracking</span>
              </div>
              <div style={{marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{color: 'var(--success)'}}>✓</span>
                <span>Automated mile logging</span>
              </div>
              <div style={{marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{color: 'var(--success)'}}>✓</span>
                <span>Group challenges & stakes</span>
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{color: 'var(--success)'}}>✓</span>
                <span>Email notifications</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section">
        <div className="container">
          <h2>How it works</h2>
          <p className="muted">Simple setup. Clear rules. Automatic tracking.</p>
          <div className="step">
            <div className="num">1</div>
            <div>
              <strong>Set the rules</strong>
              <p className="muted">Choose weekly goal, start/end dates, and stakes. You&apos;re the admin.</p>
            </div>
          </div>
          <div className="step">
            <div className="num">2</div>
            <div>
              <strong>Invite your crew</strong>
              <p className="muted">Share a link. Teammates join in one tap — no friction.</p>
            </div>
          </div>
          <div className="step">
            <div className="num">3</div>
            <div>
              <strong>Log and compete</strong>
              <p className="muted">Members log miles; the leaderboard updates instantly. Winners settle up offline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="section">
        <div className="container">
          <div className="cta">
            <div>
              <strong style={{display: 'block', fontSize: '18px', marginBottom: '6px'}}>Ready to start your first pool?</strong>
              <span className="muted">It takes under a minute. You can tweak rules later.</span>
            </div>
            <div>
              <Link href="/group/new" className="btn btn-primary">Create a Pool</Link>
              <Link href="/signin" className="btn">Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container" style={{display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <span className="logo" aria-hidden="true"></span>
            <span>RunPool</span>
          </div>
          <div>© {new Date().getFullYear()} RunPool — Built for runners, not spreadsheets.</div>
          <div><a href="/privacy">Privacy</a> • <a href="/terms">Terms</a> • <a href="/contact">Contact</a></div>
        </div>
      </footer>
    </>
  );
}
