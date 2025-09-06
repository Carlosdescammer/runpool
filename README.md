# RunPool – Social Running Challenges with Real Money Stakes

**RunPool** is a comprehensive platform that transforms running into a social, competitive, and financially motivated experience. Create weekly running challenges with friends, colleagues, or communities where participants put money on the line to achieve distance goals. Winners split the prize pool from those who don't complete their goals.

## What RunPool Does

RunPool gamifies running by combining social accountability, friendly competition, and real financial stakes. It's designed for groups who want to stay motivated, push each other, and make running more engaging through structured weekly challenges.

### The Core Concept
- **Create a Group**: Set up a running group with custom rules, entry fees, and weekly distance goals
- **Weekly Challenges**: Each week, participants pay an entry fee to join that week's challenge
- **Submit Proof**: Upload screenshots from fitness apps (Strava, Apple Fitness, Garmin, etc.) showing completed runs
- **Automatic Payouts**: Winners who meet the goal split the prize money from those who don't
- **Real-Time Competition**: Live leaderboards track progress throughout the week

### How It Works
1. **Group Setup**: A "Coach" creates a group and sets the weekly rule (e.g., "Run 5+ miles")
2. **Weekly Entry**: Participants opt-in each week by paying the entry fee via Stripe
3. **Run & Prove**: Complete your runs and upload proof screenshots showing distance, date, and time
4. **Verification**: Coaches verify submitted proofs for authenticity
5. **Payout**: At week's end, winners split the prize pool from participants who didn't complete the goal
6. **Repeat**: New challenge starts the following week with the same or updated rules

## Core Features

- **Automated Escrow System**: Secure handling of entry fees and prize distribution
- **Stripe Connect Integration**: Secure payment processing and payouts
- **Proof Verification**: Submit and verify run proofs with timestamps and distance
- **Automated Payouts**: Winners are paid automatically when the challenge ends
- **Transparent Fee Structure**: Clear breakdown of all fees before payment
- **Real-time Leaderboard**: Track progress and standings throughout the week

## Complete Feature Set

### 🏃‍♂️ Challenge Management
- **Flexible Group Creation**: Set custom weekly distance goals, entry fees, and challenge periods
- **Role-Based Access Control**: Coaches manage groups, participants compete
- **Weekly Challenge Cycles**: Automatic challenge creation with configurable start/end dates
- **Challenge Status Tracking**: Open, in-progress, and closed challenge states
- **Group Membership Management**: Invite system with email-based joins

### 💰 Payment & Prize System
- **Stripe Connect Integration**: Secure payment processing with automatic escrow
- **Entry Fee Collection**: Participants pay to join each week's challenge
- **Automated Prize Distribution**: Winners automatically split the pot from non-completers
- **Transparent Fee Structure**: Clear breakdown of entry fees, platform fees, and prize amounts
- **Payment Status Tracking**: Real-time payment confirmation and failure handling
- **Payout Notifications**: Automated emails for successful prize distributions

### 📱 Proof Submission & Verification
- **Multi-Platform Support**: Accept screenshots from Strava, Apple Fitness, Garmin, Nike Run Club, etc.
- **Image Upload & Storage**: Secure cloud storage for proof images via Supabase Storage
- **Coach Verification System**: Admins review and approve/reject submitted proofs
- **Proof Requirements**: Distance, date, and user identification must be visible
- **Status Tracking**: Pending, approved, and rejected proof states

### 📊 Real-Time Leaderboards & Analytics
- **Live Progress Tracking**: Real-time updates as participants submit proofs
- **Rank Change Animations**: Visual indicators for position changes and top-3 movements
- **Streak Tracking**: Monitor consecutive week participation and success
- **Performance History**: View past challenge results and personal statistics
- **Social Sharing**: Share leaderboard positions and achievements
- **Podium Recognition**: Special highlighting for top 3 performers

### 📧 Comprehensive Email System
- **Weekly Goal Reminders**: Saturday evening alerts for participants behind on goals
- **Top Performer Celebrations**: Personal congratulations for reaching top 3
- **Admin Notifications**: Alerts for new members, pending proofs, and group activity
- **Payment Confirmations**: Success and failure notifications for all transactions
- **Weekly Recap Emails**: Monday morning summaries with leaderboards and statistics
- **Invitation System**: Email-based group invitations with secure token validation
- **User Preferences**: Granular opt-in/opt-out controls for all notification types

### 🔒 Security & Privacy
- **Row Level Security (RLS)**: Database-level access controls via Supabase
- **Secure Authentication**: Email/password auth with session management
- **Payment Security**: PCI-compliant payment processing through Stripe
- **Data Encryption**: Encrypted storage of sensitive user and financial data
- **Email Verification**: Secure invite system with email validation
- **Admin Controls**: Restricted access to group management and verification functions

## Technology Stack

**Frontend & Framework:**
- **Next.js 15** - React framework with App Router and Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with custom design system
- **Radix UI** - Accessible component primitives
- **Lucide React** - Modern icon library

**Backend & Database:**
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Row Level Security (RLS)** - Database-level access controls
- **Supabase Auth** - User authentication and session management
- **Supabase Storage** - File storage for proof images
- **Edge Functions** - Serverless functions for background tasks

**Payments & Financial:**
- **Stripe Connect** - Payment processing and marketplace functionality
- **Stripe Webhooks** - Real-time payment event handling
- **Automated Escrow** - Secure fund holding and distribution

**Email & Notifications:**
- **Resend** - Transactional email delivery
- **Premium HTML Templates** - Professional email design with responsive layouts
- **Vercel Cron Jobs** - Automated email scheduling
- **Real-time Notifications** - Live updates via Supabase Realtime

**Deployment & Infrastructure:**
- **Vercel** - Hosting and deployment platform
- **Vercel Analytics** - Performance monitoring
- **Environment-based Configuration** - Secure credential management

## Getting Started

### Prerequisites
- **Node.js 18+** - JavaScript runtime
- **npm/yarn/pnpm** - Package manager
- **Supabase Account** - Database and auth provider
- **Stripe Account** - Payment processing (Connect enabled)
- **Resend Account** - Email delivery service
- **Vercel Account** - Deployment platform (optional)

### Quick Setup

1. **Clone and Install**
   ```bash
   git clone https://github.com/yourusername/runpool.git
   cd runpool
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.local.example .env.local
   ```
   Configure your `.env.local` with the required services (see Environment Variables section below).

3. **Database Setup**
   ```bash
   # Apply database migrations
   npx supabase db push
   
   # Set up email preferences and security policies
   # Run the SQL files in supabase/sql/ via Supabase dashboard
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Architecture

RunPool uses **Supabase PostgreSQL** with a comprehensive schema designed for scalability and security:

### Core Tables
- **`profiles`** - User profiles extending Supabase Auth with running-specific data
- **`groups`** - Running challenge groups with coach ownership and settings
- **`challenges`** - Weekly challenge instances with status tracking and prize pools
- **`memberships`** - User-group relationships with role-based permissions
- **`proofs`** - Run proof submissions with image storage and verification status
- **`payouts`** - Prize distribution records with Stripe integration
- **`invites`** - Secure group invitation system with email validation
- **`email_preferences`** - Granular user notification preferences

### Advanced Features
- **Row Level Security (RLS)** - Database-level access controls for all tables
- **Real-time Subscriptions** - Live leaderboard updates via Supabase Realtime
- **Automated Triggers** - Database functions for user creation and data consistency
- **Security Definer Functions** - Secure server-side operations for sensitive actions
- **Comprehensive Indexing** - Optimized queries for leaderboards and user lookups

## User Journey & Experience

### For Group Creators (Coaches)
1. **Setup**: Create account, set up Stripe Connect for payouts
2. **Group Creation**: Define group name, weekly distance goal, entry fee
3. **Member Management**: Send email invitations, manage member roles
4. **Weekly Administration**: Review and verify submitted proofs
5. **Prize Distribution**: Automatic payouts to winners via Stripe

### For Participants
1. **Join**: Receive email invitation, create account, join group
2. **Weekly Entry**: Opt-in to each week's challenge by paying entry fee
3. **Run & Submit**: Complete runs, upload proof screenshots
4. **Track Progress**: Monitor real-time leaderboard and personal stats
5. **Collect Winnings**: Automatic prize distribution for successful weeks

### Example Challenge Flow
**Monday**: New challenge opens, participants pay entry fees
**Tuesday-Saturday**: Members run and submit proofs throughout the week
**Sunday**: Challenge closes, coach verifies final proofs
**Monday**: Winners receive automatic payouts, new challenge begins

## Real-World Use Cases

- **Corporate Wellness**: Companies create internal running challenges for employee health
- **Friend Groups**: Social circles add stakes to weekend warrior running goals
- **Running Clubs**: Formal clubs organize structured weekly competitions
- **Fitness Communities**: Online communities create accountability through financial commitment
- **Training Groups**: Marathon training groups maintain consistency through weekly challenges
- **Charity Fundraising**: Groups donate winnings to charitable causes while staying fit

## Security & Compliance

### Financial Security
- **PCI DSS Compliance**: All payment processing through Stripe's secure infrastructure
- **Automated Escrow**: Funds held securely until challenge completion
- **Fraud Prevention**: Stripe's built-in fraud detection and prevention
- **Secure Payouts**: Direct bank transfers via Stripe Connect

### Data Protection
- **Row Level Security (RLS)**: Database-level access controls on all tables
- **Encrypted Storage**: All sensitive data encrypted at rest and in transit
- **Secure Authentication**: Industry-standard email/password auth with session management
- **Privacy Controls**: Granular user preferences for data sharing and notifications

### Platform Security
- **Input Validation**: Comprehensive validation on all user inputs
- **SQL Injection Prevention**: Parameterized queries and ORM protection
- **CSRF Protection**: Built-in Next.js security features
- **Rate Limiting**: API endpoint protection against abuse

## API Documentation

### Core Endpoints
- **`/api/groups`** - Group management (create, update, delete)
- **`/api/challenges`** - Weekly challenge operations
- **`/api/proofs`** - Proof submission and verification
- **`/api/payments`** - Stripe payment processing
- **`/api/notify/*`** - Email notification system

### Webhook Handlers
- **`/api/webhooks/stripe`** - Stripe payment event processing
- **`/api/webhooks/cron`** - Automated task scheduling

### Testing Endpoints
- **`/api/test-emails`** - Email template preview system
- **`/test-payments`** - Stripe payment testing interface

## Development & Deployment

### Local Development
```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

### Testing
- **Email Templates**: Visit `/api/test-emails` for template previews
- **Payment Flow**: Use `/test-payments` for Stripe integration testing
- **Database**: Supabase dashboard for direct database access
- **Real-time Features**: Test leaderboard updates with multiple browser windows

### Deployment
1. **Vercel Deployment**: Automatic deployment from Git repository
2. **Environment Variables**: Configure production secrets in Vercel dashboard
3. **Database Migrations**: Apply via Supabase CLI or dashboard
4. **Cron Jobs**: Configured in `vercel.json` for automated emails

## Contributing

### Development Setup
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Install dependencies (`npm install`)
4. Set up local environment variables
5. Run database migrations
6. Start development server

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Configured with Next.js and accessibility rules
- **Prettier**: Consistent code formatting
- **Component Structure**: Organized by feature with shared UI components

### Pull Request Process
1. Ensure all tests pass and linting is clean
2. Update documentation for new features
3. Add appropriate commit messages
4. Request review from maintainers

## License & Legal

**MIT License** - See `LICENSE` file for full terms

### Third-Party Services
- **Stripe**: Subject to Stripe's Terms of Service and privacy policy
- **Supabase**: Subject to Supabase's Terms of Service and privacy policy
- **Resend**: Subject to Resend's Terms of Service and privacy policy
- **Vercel**: Subject to Vercel's Terms of Service and privacy policy

## Recent Updates & Changelog

### Version 2.0 (2025-08-30)

#### 📧 Advanced Email Notification System
- **Complete Email Infrastructure**: Full-featured notification system with Resend integration
- **Premium HTML Templates**: Professional designs with cross-client compatibility
- **Automated Scheduling**: Vercel Cron jobs for hands-off email automation
- **User Preferences**: Granular opt-in/opt-out controls for all notification types
- **Testing System**: Comprehensive preview and debugging tools

#### 🐛 Critical Bug Fixes
- **Email System Reliability**: Fixed duplicate environment variables and character encoding
- **Payment Processing**: Resolved Stripe webhook handling and payout automation
- **Real-time Updates**: Improved leaderboard synchronization and rank animations
- **Security Enhancements**: Strengthened RLS policies and input validation

#### 🎨 UI/UX Improvements (2025-08-23)
- **Sage Theme Implementation**: Clean, light-only design system with consistent branding
- **Gamification Features**: Podium colors, streak badges, and rank change animations
- **Real-time Leaderboards**: Live updates via Supabase Realtime subscriptions
- **Enhanced Invite System**: Email-based invitations with secure token validation
- **Admin Dashboard**: Comprehensive group management and member administration

#### 🔧 Technical Debt Resolution
- **Database Schema Consistency**: Resolved missing columns and constraint issues
- **Security Policy Refinement**: Enhanced RLS policies for invite system
- **TypeScript Configuration**: Improved type safety and linting rules
- **Navigation Enhancement**: Consistent back button behavior across admin routes

## Roadmap & Future Enhancements

### Planned Features
- **Advanced Analytics**: Detailed performance metrics and trend analysis
- **Mobile App**: Native iOS/Android applications with push notifications
- **Integration Expansion**: Direct Strava/Garmin API integration for automatic proof submission
- **Social Features**: Friend connections, cross-group challenges, and achievement sharing
- **Gamification**: Milestone badges, streak rewards, and seasonal competitions

### Technical Improvements
- **Performance Optimization**: Enhanced caching and database query optimization
- **Scalability**: Horizontal scaling preparation for larger user bases
- **Monitoring**: Advanced error tracking and performance monitoring
- **Testing**: Comprehensive test suite with automated CI/CD
- **Documentation**: API documentation and developer guides


## Support & Community

### Getting Help
- **Documentation**: Comprehensive guides in this README
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Feature requests and community support
- **Email**: Technical support for deployment issues

### Community Guidelines
- **Fair Play**: Real runs only, no artificial mileage
- **Respectful Competition**: Supportive community environment
- **Privacy**: Respect member privacy and data protection
- **Integrity**: Honest proof submission and verification

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
