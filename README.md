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

- **Light-only Sage Theme**: Removed all Tailwind `dark:` classes and disabled dark mode across the app.
  - Forced light theme via `ThemeProvider` (`defaultTheme="light"`, `enableSystem={false}`) in `src/app/layout.tsx`.
  - Set a single light `viewport.themeColor` of `#DAD7CD` in both `src/app/layout.tsx` and `app/layout.tsx`.
  - Removed `@media (prefers-color-scheme: dark)` overrides from `src/app/globals.css` and `app/globals.css`.
  - Updated shared components to ensure light surfaces/colors only: `components/ui/{card,input,badge,button,avatar,progress,label,skeleton}.tsx`.
  - Cleaned dark classes from pages: `app/group/[id]/page.tsx`, `app/group/[id]/admin/page.tsx`, and `src/app/page.tsx`.

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

- **Secure invite fetch**: Added `get_invite_public(p_token text)` security-definer RPC to fetch limited invite fields by token and updated the Join page to use it instead of reading the `invites` table directly.
- **Weekly recap API**: Implemented `app/api/weekly-recap/route.ts` to compute recaps for recent CLOSED challenges and optionally send emails via Resend (`send=1`). Endpoint can be protected via `x-cron-secret` if `CRON_SECRET` is set.

## Bugs fixed

- **Missing `invited_email` column in SQL**: Applying DB enforcement failed with `column i.invited_email does not exist`.
  - Fix: added `alter table if exists public.invites add column if not exists invited_email text;` at the top of `supabase/sql/join_enforcement.sql`.
- **Invite visibility vs. RLS**: Join page previously read `invites` directly, which can be blocked by strict RLS.
  - Fix: created security-definer RPC `get_invite_public(p_token text)` (limited fields) and updated `app/join/page.tsx` to call it.
- **Deno TS import lint in Edge Function**: Local TypeScript tooling flagged Deno URL imports.
  - Fix: added `// @ts-nocheck` to `supabase/functions/weekly-recap/index.ts` to avoid Node-oriented linting.
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

Additional for weekly recap and email sending:

```bash
# Weekly recap and email
SUPABASE_SERVICE_ROLE_KEY=...     # server-only, used by recap compute API
CRON_SECRET=some-strong-secret    # optional: protects /api/weekly-recap endpoint

# Resend
RESEND_API_KEY=...
RESEND_FROM="Runpool <no-reply@yourdomain.com>"
WEEKLY_RECAP_TEST_TO=you@example.com,teammate@example.com  # optional default recipients
```

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

### Weekly Recap Email

- Next.js API route: `app/api/weekly-recap/route.ts` computes recaps for recent CLOSED challenges and can optionally send emails via Resend when `send=1` is passed. Protect with `x-cron-secret` if `CRON_SECRET` is set.
- Supabase Edge Function: `supabase/functions/weekly-recap/index.ts` exists as a stub (returns 501) and can be used if you prefer Supabase Scheduled Functions; logic can be ported from the API route.

How to test locally:

```bash
# compute only
curl -s -X POST 'http://localhost:3000/api/weekly-recap?limit=5' -H 'x-cron-secret: some-strong-secret' | jq .

# send via Resend using default recipients from WEEKLY_RECAP_TEST_TO
curl -s -X POST 'http://localhost:3000/api/weekly-recap?limit=5&send=1' -H 'x-cron-secret: some-strong-secret' | jq .

# send to explicit recipients (comma-separated)
curl -s -X POST 'http://localhost:3000/api/weekly-recap?limit=5&send=1&to=first@example.com,second@example.com' -H 'x-cron-secret: some-strong-secret' | jq .
```

Scheduling options:

- Vercel Cron → POST `/api/weekly-recap?limit=10&send=1` with header `x-cron-secret: <CRON_SECRET>`.
- Supabase Scheduled Functions → deploy and schedule the Edge Function (after porting compute logic).

What’s next:

- Improve email template and add per-group recipient lists/opt-in.
- Optionally port recap compute to the Supabase Edge Function.
- Add fine-grained RLS around invites if needed, keeping RPCs as the public interface.

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
