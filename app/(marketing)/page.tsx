// app/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from "next/link";
import Header from '@/components/Header';
import { supabase } from '@/lib/supabase/client';

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // User is signed in, check if they have groups (try both possible table names)
        let memberships = null;
        
        // Try group_members table first
        const { data: groupMembers, error: gmErr } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .limit(1);
        
        if (!gmErr && groupMembers) {
          memberships = groupMembers;
        } else {
          // Try memberships table as fallback
          const { data: membershipData, error: mErr } = await supabase
            .from('memberships')
            .select('group_id')
            .eq('user_id', user.id)
            .limit(1);
          
          if (!mErr && membershipData) {
            memberships = membershipData;
          }
        }
        
        if (memberships && memberships.length > 0) {
          // User has groups, redirect to their group
          router.replace(`/group/${memberships[0].group_id}`);
          return;
        } else {
          // User is signed in but has no groups, go to onboarding
          router.replace('/onboarding');
          return;
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuthAndRedirect();
  }, [router]);

  if (isCheckingAuth) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <Header />
      <main>
        <div className="wrap">
        {/* HERO */}
        <section className="home-hero">
          <div className="home-hero__copy">
            <h1 className="home-title">
              Create a Running Pool in <span className="home-accent">Seconds</span>
            </h1>
            <p className="home-sub">
              Set the rules, invite your crew, log miles, and watch the leaderboard update automatically.
              Friendly stakes, serious momentum.
            </p>

            <div className="home-cta">
              <Link href="/group/new" className="btn btn-primary">Create a Pool</Link>
              <Link href="/signin" className="btn">Sign In</Link>
            </div>

            <ul className="home-checks">
              <li><CheckIcon /> Real-time leaderboard tracking</li>
              <li><CheckIcon /> Automated mile logging</li>
              <li><CheckIcon /> Group challenges & stakes</li>
              <li><CheckIcon /> Email notifications</li>
            </ul>
          </div>

          <div className="home-hero__card card">
            <div className="inner">
              <h3 className="home-card-title">This week at a glance</h3>

              <ul className="home-metrics">
                <li><span>Goal</span><strong>25&nbsp;mi</strong></li>
                <li><span>Participants</span><strong>12</strong></li>
                <li><span>Pot</span><strong>$120</strong></li>
                <li><span>Deadline</span><strong>Sat&nbsp;8:00&nbsp;PM</strong></li>
              </ul>

              <div className="home-progress">
                <div className="progress"><span style={{ "--pct": "64%" } as React.CSSProperties} /></div>
                <div className="home-progress__label">
                  <span>Team total</span>
                  <b>160 / 250 miles</b>
                </div>
              </div>

              <div className="home-hero__actions">
                <Link href="/group/new" className="btn btn-primary">Start your pool</Link>
                <Link href="#how" className="btn">How it works</Link>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="home-section" id="how">
          <h2 className="home-h2">How it works</h2>
          <p className="home-muted">Simple setup. Clear rules. Automatic tracking.</p>

          <div className="steps-grid">
            <Step num={1} title="Set the rules"
                  text="Choose weekly goal, start/end dates, and stakes. You're the admin." />
            <Step num={2} title="Invite your crew"
                  text="Share a link. Teammates join in one tap — no friction." />
            <Step num={3} title="Log and compete"
                  text="Members log miles; the leaderboard updates instantly. Winners settle up offline." />
          </div>
        </section>

        {/* CTA STRIP */}
        <section className="card home-cta-strip">
          <div className="inner">
            <div className="home-cta-text">
              <h3 className="home-h3">Ready to start your first pool?</h3>
              <p className="home-muted">It takes under a minute. You can tweak rules later.</p>
            </div>
            <div className="home-cta-actions">
              <Link href="/group/new" className="btn btn-primary">Create a Pool</Link>
              <Link href="/signin" className="btn">Sign In</Link>
            </div>
          </div>
        </section>

        <footer className="home-footer">
          <p>© {new Date().getFullYear()} RunPool — Built for runners, not spreadsheets.</p>
        </footer>
      </div>
    </main>
    </>
  );
}

function Step({ num, title, text }: { num: number; title: string; text: string }) {
  return (
    <div className="card step-card">
      <div className="inner">
        <div className="step-num">{num}</div>
        <h3 className="home-h3">{title}</h3>
        <p className="home-muted">{text}</p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden className="check">
      <path fill="currentColor" d="M9.55 17.05 4.9 12.4l1.4-1.4 3.25 3.25 7.2-7.2 1.4 1.4-8.6 8.6Z"/>
    </svg>
  );
}
