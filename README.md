# Run Pool – Next.js + Supabase

A semi-automatic escrow system for weekly running challenges where participants compete to complete distance goals. The app handles payments, proof submission, and automatic prize distribution using Stripe Connect for secure fund handling.

## Core Features

- **Automated Escrow System**: Secure handling of entry fees and prize distribution
- **Stripe Connect Integration**: Secure payment processing and payouts
- **Proof Verification**: Submit and verify run proofs with timestamps and distance
- **Automated Payouts**: Winners are paid automatically when the challenge ends
- **Transparent Fee Structure**: Clear breakdown of all fees before payment
- **Real-time Leaderboard**: Track progress and standings throughout the week

## Key Features

### Group & Challenge Management
- **Group Creation**: Set up running groups with custom rules and entry fees
- **Weekly Challenges**: Create time-bound running challenges with specific distance goals
- **Role-Based Access**: Clear distinction between Coaches (admins) and Participants
- **Email Notifications**: Automated reminders and status updates

### Payment & Payouts
- **Secure Payments**: Entry fees processed via Stripe Connect
- **Automated Escrow**: Funds held securely until challenge completion
- **Transparent Payouts**: Clear breakdown of prize distribution
- **Multiple Payout Methods**: Support for bank transfers and instant payouts

### Proof & Verification
- **Proof Submission**: Upload run proofs with timestamps and distance
- **Coach Verification**: Coaches review and verify submissions
- **Status Tracking**: Real-time updates on verification status

### Leaderboard & Analytics
- **Real-time Updates**: Live leaderboard showing current standings
- **Performance Metrics**: Track progress and improvements over time
- **Historical Data**: View past challenge results and statistics

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account with Connect enabled

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/runpool.git
   cd runpool
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   ```bash
   cp .env.local.example .env.local
   ```
   Update the values in `.env.local` with your Supabase and Stripe credentials.

4. Run the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

We use Supabase with the following main tables:

- `profiles`: User profiles (extends auth.users)
- `groups`: Running challenge groups
- `weeks`: Weekly challenge details
- `participants`: User participation in weekly challenges
- `payouts`: Record of prize distributions
- `group_members`: User-group relationships

## Security

- Row Level Security (RLS) enabled on all tables
- Secure payment processing with Stripe Connect
- Encrypted storage of sensitive data
- Regular security audits and updates

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Recent Updates (2025-08-30)

### 📧 Comprehensive Email Notification System

- **Complete Email Infrastructure**: Built full-featured email notification system with Resend integration
  - **Weekly goal reminders**: Automated Saturday evening alerts for users behind on weekly goals
  - **Top performer celebrations**: Personal congratulation emails when users reach top 3 rankings
  - **Admin notifications**: Alerts when new members join groups
  - **Activity notifications**: Real-time alerts for proof submissions and top-3 milestone updates
  - **Weekly recap emails**: Automated Monday morning summaries with leaderboards and stats

- **Premium Email Templates**: Completely redesigned all email templates with professional HTML structure
  - Table-based layouts for email client compatibility across Gmail, Outlook, Apple Mail
  - Gradient backgrounds, shadows, and modern typography
  - Fixed UTF-8 character encoding issues that caused "funny characters"
  - Consistent Runpool branding and responsive design
  - Personalized content with user names and group-specific information

- **User Email Preferences**: Full opt-in/opt-out system with granular controls
  - Database schema: `email_preferences` table with RLS policies
  - Settings UI: Toggle switches for each notification type
  - Preference checking: All email endpoints respect user preferences
  - API: `get_user_email_preferences()` and `update_user_email_preferences()` functions

- **Automated Scheduling**: Vercel Cron integration for hands-off email automation
  - Saturday 8PM: Weekly goal reminder checks
  - Monday 9AM: Weekly recap email delivery
  - Configurable via `vercel.json` cron jobs

- **Email Testing System**: Comprehensive preview and testing infrastructure
  - Test endpoint: `/api/test-emails` with all template previews
  - Environment-based recipient configuration
  - Easy template debugging and validation

### 🐛 Major Bugs Fixed

- **Duplicate RESEND_FROM Environment Variables** (Critical Fix)
  - **Problem**: `.env.local` had two `RESEND_FROM` entries, second one overriding first with incorrect format
  - **Impact**: All email sending was failing silently
  - **Fix**: Removed duplicate entry, kept proper format `"Runpool <no-reply@runpool.space>"`
  - **File**: `.env.local`

- **Character Encoding Issues in Emails** (Critical Fix)
  - **Problem**: Emails displayed "funny characters that don't make sense" due to missing charset declarations
  - **Impact**: Poor user experience with garbled text in email clients
  - **Fix**: Added proper HTML DOCTYPE, UTF-8 charset declarations, and HTML entity encoding
  - **Files**: All email template functions across `/api/notify/*` and `/api/weekly-recap`

- **Top-Performer Template Inconsistency** (UI Fix)
  - **Problem**: Test email template for top-performer alerts wasn't updated with premium design
  - **Impact**: Inconsistent email appearance between test previews and actual notifications
  - **Fix**: Updated `/api/test-emails/route.ts` with matching premium template design
  - **Files**: `/api/test-emails/route.ts`

### Previous Updates (2025-08-23)

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
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # server-only, used by admin functions

# Email System (Resend)
RESEND_API_KEY=...                # Your Resend API key
RESEND_FROM="Runpool <no-reply@runpool.space>"  # Must match verified domain

# Email Testing & Security
WEEKLY_RECAP_TEST_TO=you@example.com,teammate@example.com  # Test recipients
CRON_SECRET=some-strong-secret    # Optional: protects cron endpoints

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://yoursite.com  # Used for email links
```

**Important**: Ensure `RESEND_FROM` uses proper email format with verified domain. Duplicate entries will cause the second to override the first.

## Supabase Setup

- Ensure tables like `groups`, `memberships`, `challenges`, `proofs`, `invites`, and `email_preferences` exist.
- Enable RLS and add policies so only group owners/admins can edit/delete groups and manage invites.
- Admin page includes a client guard, but security must be enforced by RLS.

### Email Preferences Database Schema

Apply the SQL from `supabase/sql/email_preferences.sql` to add:

- `email_preferences` table with user notification controls
- RLS policies for secure preference management  
- Helper functions: `get_user_email_preferences()` and `update_user_email_preferences()`

This enables granular opt-in/opt-out controls for all email notification types.

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

### Email Notification System

The comprehensive email system includes multiple notification types:

**API Endpoints:**
- `app/api/notify/weekly-goals/route.ts` - End-of-week goal reminder emails
- `app/api/notify/top-performer/route.ts` - Personal celebration emails for top 3 achievements  
- `app/api/notify/admin-new-user/route.ts` - Admin alerts for new group members
- `app/api/notify/proof/route.ts` - Activity notifications and top-3 milestone updates
- `app/api/weekly-recap/route.ts` - Weekly summary emails with leaderboards
- `app/api/test-emails/route.ts` - Template preview and testing interface

**Testing Email Templates:**

Visit `/api/test-emails` to preview all email templates or test individual endpoints:

```bash
# Test weekly goal reminders
curl -X POST 'http://localhost:3000/api/notify/weekly-goals' \
  -H 'Content-Type: application/json' \
  -d '{"group_id":"uuid","test_mode":true}'

# Test weekly recap
curl -X POST 'http://localhost:3000/api/weekly-recap?limit=5&send=1' \
  -H 'x-cron-secret: your-secret'

# Test top performer notifications  
curl -X POST 'http://localhost:3000/api/notify/top-performer' \
  -H 'Content-Type: application/json' \
  -d '{"user_id":"uuid","group_id":"uuid","rank":1,"test_mode":true}'
```

**Automated Scheduling (Vercel Cron):**

Configured in `vercel.json`:
- Saturday 8PM: Weekly goal reminder checks (`/api/notify/weekly-goals`)
- Monday 9AM: Weekly recap delivery (`/api/weekly-recap?send=1`)

All endpoints respect user email preferences and include proper error handling.

### Email System Files

**Database Schema:**
- `supabase/sql/email_preferences.sql` - Email preferences table and functions

**API Routes:**
- `app/api/notify/weekly-goals/route.ts` - Saturday evening goal reminders
- `app/api/notify/top-performer/route.ts` - Top 3 celebration emails
- `app/api/notify/admin-new-user/route.ts` - Admin new member alerts  
- `app/api/notify/proof/route.ts` - Activity and milestone notifications
- `app/api/weekly-recap/route.ts` - Monday morning recap emails
- `app/api/invites/send/route.ts` - Enhanced invitation emails
- `app/api/test-emails/route.ts` - Template preview dashboard

**Frontend:**
- `app/settings/page.tsx` - Email preferences toggle switches

**Configuration:**
- `vercel.json` - Automated cron job scheduling

## E2E Test Checklist

### Core Functionality
- **Sign in**: create account or sign in with email/password.
- **Admin access**: visit `/group/[id]/admin` as owner/admin; non-admins are redirected.
- **Invite flow**: generate invite, copy URL, join via `/join?token=...`, confirm membership.
- **Revoke invite**: revoke and verify link no longer works.
- **Delete group**: use Danger Zone; verify RPC path works or client cascade fallback.

### Email System Testing
- **Email preferences**: Visit `/settings`, toggle notification preferences, verify database updates
- **Template previews**: Visit `/api/test-emails` to view all email templates
- **Weekly reminders**: Test `/api/notify/weekly-goals` with test mode
- **Top performer alerts**: Test `/api/notify/top-performer` with different ranks
- **Admin notifications**: Test `/api/notify/admin-new-user` when new members join
- **Weekly recap**: Test `/api/weekly-recap?send=1` with test recipients
- **Invitation emails**: Test `/api/invites/send` with proper email formatting

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy

You can deploy to any platform supporting Next.js. For Vercel, see the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).
