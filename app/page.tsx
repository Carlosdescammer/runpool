// app/page.tsx
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import WeeklyRecapPreview from '@/components/WeeklyRecapPreview';

export default function Home() {
  return (
    <div className="grid min-h-svh gap-6 px-4 py-6 md:px-6">
      {/* HERO */}
      <Card className="mx-auto w-full max-w-[1100px] p-6 md:p-8">
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div>
            <h1 className="m-0 text-[28px] font-black leading-tight md:text-[44px]">Run Pool</h1>
            <p className="mt-3 text-[17px] text-zinc-700">
              Create a group, set weekly miles, invite with a link, upload proof, and
              watch the live leaderboard. Money is held offline by your group’s banker.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/group/new"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--rp-primary)] px-5 text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rp-accent)] focus-visible:ring-offset-2"
              >
                Create a Group
              </Link>
              <Link
                href="/signin"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-[var(--rp-accent)] bg-[var(--rp-bg)] px-5 text-[var(--rp-text)] shadow-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rp-accent)] focus-visible:ring-offset-2"
              >
                Sign In
              </Link>
            </div>
          </div>
          <div className="grid place-items-center">
            <WeeklyRecapPreview />
          </div>
        </div>
      </Card>

      {/* WHAT THIS APP DOES */}
      <section className="mx-auto w-full max-w-[1100px]">
        <h2 className="mb-3 text-[22px] font-extrabold">What it does</h2>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Card className="p-4">
            <div className="text-xl">🛠️</div>
            <div className="mt-1 font-semibold">Admin Sets Rules</div>
            <div className="mt-1 text-zinc-600">Distance goal & weekly pot (display only). You control the group.</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl">🔗</div>
            <div className="mt-1 font-semibold">Invite Link</div>
            <div className="mt-1 text-zinc-600">Share a single join URL. No emails. No friction.</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl">📸</div>
            <div className="mt-1 font-semibold">Upload Proof</div>
            <div className="mt-1 text-zinc-600">Members log miles and attach a screenshot each week.</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl">📊</div>
            <div className="mt-1 font-semibold">Live Leaderboard</div>
            <div className="mt-1 text-zinc-600">Everyone sees standings in real time—no scrolling chats.</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl">🧾</div>
            <div className="mt-1 font-semibold">History & Transparency</div>
            <div className="mt-1 text-zinc-600">Past weeks are archived so nobody argues about results.</div>
          </Card>
          <Card className="p-4">
            <div className="text-xl">💳</div>
            <div className="mt-1 font-semibold">Offline Pot</div>
            <div className="mt-1 text-zinc-600">One trusted banker holds money via Apple Pay/Venmo. App tracks only.</div>
          </Card>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto w-full max-w-[1100px]">
        <h2 className="mb-3 text-[22px] font-extrabold">How it works</h2>
        <ol className="list-decimal space-y-1 pl-5 text-zinc-800">
          <li>Create a group and set this week’s rule + pot.</li>
          <li>Copy the invite link and share it anywhere.</li>
          <li>Members sign in, join, log miles, and upload proof.</li>
          <li>Leaderboard updates live. Close the week and start the next.</li>
        </ol>
        <div className="mt-3">
          <Link
            href="/group/new"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[var(--rp-primary)] px-5 text-white shadow-sm transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rp-accent)] focus-visible:ring-offset-2"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mx-auto w-full max-w-[1100px] text-center text-[13px] text-zinc-500">
        Built with Next.js + Supabase. No payments—pot is offline for MVP.
      </footer>
    </div>
  );
}
