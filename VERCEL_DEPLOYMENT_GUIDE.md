# Vercel Deployment Guide

## 🚀 Your app is ready for Vercel deployment!

### Required Environment Variables

Make sure to set these in your Vercel project settings:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ffudsetxraiqzoynkbrb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdWRzZXR4cmFpcXpveW5rYnJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MDAxODgsImV4cCI6MjA3MTQ3NjE4OH0.qFiPc2K17rTRPmVDpavyAjuAqCYH9g014cI6ZgZsJro
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmdWRzZXR4cmFpcXpveW5rYnJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTkwMDE4OCwiZXhwIjoyMDcxNDc2MTg4fQ.JEA723pwPotbDOvmJ-Cm0uzBHYETnSShViSrgCWO790

# Email Configuration
RESEND_API_KEY=re_LcNkkLZn_PorqcYYncpGC3nR6ABxAp29i
RESEND_FROM=Runpool <no-reply@runpool.space>

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://runpool.vercel.app

# Optional Settings
CRON_SECRET=some-strong-secret
WEEKLY_RECAP_TEST_TO=no-reply@runpool.space
AUTH_SECRET=your-auth-secret-here
AUTH_URL=https://runpool.vercel.app
AUTH_TRUST_HOST=true
```

### Deployment Steps

1. **Connect to GitHub**: Link your Vercel account to the GitHub repository
2. **Import Project**: Import `Carlosdescammer/runpool` repository
3. **Environment Variables**: Add all the above environment variables in Vercel dashboard
4. **Deploy**: Click deploy!

### Database Setup

⚠️ **Important**: After deployment, you need to create the `participants` table in your Supabase database:

1. Go to [Supabase SQL Editor](https://app.supabase.com/project/ffudsetxraiqzoynkbrb/sql)
2. Run the SQL from `manual_create_participants.sql` (if still exists) or:

```sql
CREATE TABLE IF NOT EXISTS public.participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  week_id UUID NOT NULL,
  user_id UUID NOT NULL,
  proof_url TEXT,
  proof_submitted_at TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week_id, user_id)
);

-- Add constraints and policies (see manual_create_participants.sql for full script)
```

### Features Removed (No Longer Needed)

- ❌ Stripe payment processing
- ❌ Entry fees and prize pools
- ❌ Payment status tracking
- ❌ Payout management

### Features Available

- ✅ Free challenge joining
- ✅ Run proof submission
- ✅ Leaderboards
- ✅ Email notifications
- ✅ Admin management
- ✅ Streak tracking
- ✅ Group management

### Automated Cron Jobs

The following cron jobs are configured in `vercel.json`:

- **Weekly Goals**: Saturday 8 PM - Remind users about goals
- **Weekly Recap**: Monday 9 AM - Send weekly summary emails
- **Email Campaigns**: Daily 8 AM & 6 PM - Motivational emails

## 🎉 Ready to Deploy!

Your application is now a free running challenge platform, ready for production deployment on Vercel.