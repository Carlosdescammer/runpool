# Run Pool – Next.js + Supabase

A lightweight group challenge app built with Next.js App Router and Supabase. It supports creating groups, weekly challenges, proofs, and admin tools to manage settings, invite links, and group deletion.

## Features

- **Group management**: create, view, and manage groups (`app/group/[id]/`).
- **Admin controls**: edit group name/rules/entry fee, create weeks, delete group, and a prominent "Back to dashboard" control (`app/group/[id]/admin/page.tsx` + header).
- **Email invites (primary)**: send magic-link invites by email, show invited email on each invite, resend magic link, revoke; legacy token link generation is available under a collapsed "Legacy" section.
- **Leaderboard gamification**: color-coded podium for top 3, streak badges, rank change (up/down) indicators, and subtle animations for entering/leaving top 3.
- **Client-side guards**: admin page checks current user membership role and redirects non-admins.
- **RLS-secured**: relies on Supabase Row Level Security to enforce permissions.

## Recent Updates (2025-08-23)

- **Prioritized email invite flow** (`app/group/[id]/admin/page.tsx`): textarea for multiple emails; sends Supabase magic-link emails; shows active and expired invites; supports resending per-invite when `invited_email` is known; supports revoking.
- **Legacy invites de-emphasized**: legacy "Generate invite link" moved into a `<details>` section labeled "Legacy" to steer users toward email invites.
- **Back to dashboard**:
  - On-page back button in the admin card header linking to `/group/[id]`.
  - Global header shows a route-aware "Back" button on `/group/[id]/admin` (with or without trailing slash).
- **Leaderboard gamification** (`app/group/[id]/page.tsx`):
  - Podium colors for ranks 1–3.
  - Streak badges derived from recent challenge participation.
  - Rank deltas computed using a localStorage snapshot of previous ranks.
  - Enter/leave top-3 join/drop animations.

- **Realtime leaderboard** (`app/group/[id]/page.tsx`): Subscribes to `proofs` changes for the active challenge via Supabase Realtime and refreshes `leaderboard_week` instantly.
- **Email-locked joins** (`app/join/page.tsx`): If an invite has `invited_email`, the join flow requires the signed-in email to match (case-insensitive). Uses `join_group_with_token_email` with legacy RPC fallback.

## Bugs fixed

- **Invite row typing/compat**: Some projects lacked the `invited_email` column, causing insert/select issues.
  - Fix: when sending invites, attempt insert with `invited_email` and fall back to legacy insert if the column is missing.
  - Fix: join page selects `*` from `invites` to avoid column-specific errors and maintain backward compatibility.
- **Back navigation missing on Admin**: Back button wasn’t visible in some admin routes (e.g., trailing slash).
  - Fix: added on-page back control and header-level route detection that handles `/group/[id]/admin` and `/group/[id]/admin/`.

## What's next

- **Weekly recap email**: scheduled weekly summary with winners, streaks, and deltas (Supabase Scheduled Functions / Edge Functions).
- **Invite UX**: tooltips/docs explaining email vs legacy invites; optional full removal of legacy links.
- **Admin enhancements**: bulk revoke, manual expire, CSV import for emails.
- **More gamification**: milestone badges, streak decay warnings, confetti for podium changes, animated progress.
- **Security/RLS**: tighten policies around invites and membership creation.


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

Scripts:

```bash
npm run dev       # start dev server
npm run build     # production build (Turbopack)
npm run start     # start production server
npm run lint      # run ESLint
```

## Environment Variables

Create `.env.local` with your Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Client initialized in `lib/supabaseClient.ts`.

## Supabase Setup

- Ensure tables like `groups`, `memberships`, `challenges`, `proofs`, and `invites` exist.
- Enable RLS and add policies so only group owners/admins can edit/delete groups and manage invites.
- Admin page includes a client guard, but security must be enforced by RLS.

### Security: Recommended RPC & RLS (Email-locked joins)

To enforce email-locked joins at the database level (source of truth), apply the SQL in:

- `supabase/sql/join_enforcement.sql`

What it does:

- Defines `join_group_with_token_email(p_token text)` which:
  - Verifies token exists and is not expired.
  - Enforces that the JWT email matches `invited_email` when present.
  - Inserts a `memberships` row (if not already a member) and consumes the invite.
- RLS policies:
  - Blocks direct `INSERT` into `memberships` by authenticated users (forces use of the RPC).
  - Restricts invite management to group admins/owners.

How to apply:

1) Open Supabase SQL editor and paste the contents of `supabase/sql/join_enforcement.sql`, or include it in your migrations.
2) Ensure your JWT includes the `email` claim (Supabase default for email/password auth).
3) On the client, continue to call `join_group_with_token_email`; legacy RPC is still used as a fallback.

### Optional RPC for Atomic Deletion

App prefers an RPC named `delete_group_cascade` to delete a group and related rows atomically, with a client-side fallback if RPC is absent. Example PostgreSQL function signature:

```sql
create or replace function delete_group_cascade(p_group_id uuid)
returns void language plpgsql security definer as $$
begin
  delete from proofs where challenge_id in (select id from challenges where group_id = p_group_id);
  delete from challenges where group_id = p_group_id;
  delete from invites where group_id = p_group_id;
  delete from memberships where group_id = p_group_id;
  delete from groups where id = p_group_id;
end; $$;
```

Grant execute to relevant roles if needed.

## Directory Highlights

- `app/group/[id]/page.tsx` – group dashboard; shows Admin button for owners/admins.
- `app/group/[id]/admin/page.tsx` – admin tools (edit settings, weeks, invites, delete).
- `app/signin/page.tsx` – email/password auth + post-auth redirect.
- `lib/supabaseClient.ts` – Supabase client.

### Weekly Recap Email (Pending)

Scaffolding is in place; implementation is pending:

- Next.js API route: `app/api/weekly-recap/route.ts` (returns 501 until implemented). Useful for Vercel Cron.
- Supabase Edge Function: `supabase/functions/weekly-recap/index.ts` (returns 501). Deploy via `supabase functions deploy weekly-recap`.

Suggested next steps:

- Implement aggregation (top 3, winners, streaks, totals) from `leaderboard_week` + `proofs` after a challenge closes.
- Send emails via your provider (e.g., Resend, Postmark) using API keys stored in Supabase secrets or Vercel env.
- Schedule weekly execution (Vercel Cron → API route, or Supabase Scheduled Functions → Edge Function).

## E2E Test Checklist

- **Sign in**: create account or sign in with email/password.
- **Admin access**: visit `/group/[id]/admin` as owner/admin; non-admins are redirected.
- **Invite flow**: generate invite, copy URL, join via `/join?token=...`, confirm membership.
- **Revoke invite**: revoke and verify link no longer works.
- **Delete group**: use Danger Zone; verify RPC path works or client cascade fallback.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

You can deploy to any platform supporting Next.js. For Vercel, see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
