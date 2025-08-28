# Email Notification System

This document describes the comprehensive email notification system implemented for Runpool.

## Features Implemented

### 1. **Email Preferences System** 
- ✅ User opt-in/opt-out controls for all notification types
- ✅ Database schema with email preferences table
- ✅ RLS policies for user data security  
- ✅ Settings UI with toggle switches
- ✅ Default preferences (all notifications enabled by default)

### 2. **Weekly Goal Reminders**
- ✅ End-of-week emails for users behind on their goals
- ✅ Shows progress bar with current vs target miles
- ✅ Calculates miles needed to reach goal
- ✅ Respects user email preferences
- ✅ API endpoint: `/api/notify/weekly-goals`

### 3. **Top Performer Notifications** 
- ✅ Personal alerts when user enters top 3 rankings
- ✅ Special styling with rank emojis (🥇🥈🥉)
- ✅ Shows current position and miles logged
- ✅ API endpoint: `/api/notify/top-performer`

### 4. **Admin New User Notifications**
- ✅ Notifies admins/owners when new members join
- ✅ Shows new user details and group stats
- ✅ Only sent to users with admin/owner roles
- ✅ API endpoint: `/api/notify/admin-new-user`

### 5. **Top-3 Milestone Notifications**
- ✅ Enhanced proof notifications for top 3 performers
- ✅ Special email design highlighting top performer activity
- ✅ Integrated into existing `/api/notify/proof` endpoint
- ✅ Separate opt-in setting from regular proof notifications

### 6. **Enhanced Proof Notifications**
- ✅ Updated existing system to respect email preferences
- ✅ Individual preference checking for each recipient
- ✅ Separate top-3 notifications alongside regular notifications

## API Endpoints

### Weekly Goal Reminders
```bash
# Test weekly goal reminders (protected by CRON_SECRET)
curl -X POST "https://runpool.space/api/notify/weekly-goals" \
  -H "x-cron-secret: YOUR_CRON_SECRET"
```

### Top Performer Alert (called automatically when proof submitted)
```bash
curl -X POST "https://runpool.space/api/notify/top-performer" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"challenge_id": "CHALLENGE_ID", "user_id": "USER_ID", "miles": 5.2}'
```

### Admin New User Alert
```bash
curl -X POST "https://runpool.space/api/notify/admin-new-user" \
  -H "Content-Type: application/json" \
  -d '{"group_id": "GROUP_ID", "new_user_id": "USER_ID"}'
```

## Database Schema

### Email Preferences Table
```sql
CREATE TABLE email_preferences (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  weekly_goal_reminders boolean DEFAULT true,
  top_performer_alerts boolean DEFAULT true,
  admin_new_user_alerts boolean DEFAULT true,
  top_three_milestone boolean DEFAULT true,
  proof_notifications boolean DEFAULT true,
  weekly_recap boolean DEFAULT true,
  invite_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Weekly Goals Table
```sql
CREATE TABLE weekly_goals (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  group_id uuid REFERENCES groups(id),
  challenge_id uuid REFERENCES challenges(id),
  target_miles decimal DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);
```

## Setup Instructions

### 1. Database Setup
```sql
-- Run this SQL to set up email preferences
\i supabase/sql/email_preferences.sql
```

### 2. Environment Variables
Ensure these are set in your `.env.local`:
```
RESEND_API_KEY=re_your_api_key
RESEND_FROM="Runpool <no-reply@runpool.space>"
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CRON_SECRET=your_cron_secret
```

### 3. Scheduling Weekly Reminders

#### Option A: Vercel Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/notify/weekly-goals",
      "schedule": "0 20 * * 6"
    }
  ]
}
```

#### Option B: External Cron Service
Use a service like cron-job.org or GitHub Actions to hit:
```
POST https://runpool.space/api/notify/weekly-goals
Headers: x-cron-secret: YOUR_CRON_SECRET
```

## Integration Points

### 1. Proof Submission Integration
Add to your proof submission code:
```typescript
// After proof is successfully created
await fetch('/api/notify/proof', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    challenge_id: challengeId,
    miles: milesLogged,
    proof_id: proofId
  })
});

// Check if user entered top 3 and send personal alert
await fetch('/api/notify/top-performer', {
  method: 'POST', 
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    challenge_id: challengeId,
    user_id: userId,
    miles: milesLogged
  })
});
```

### 2. New Member Integration
Add to your membership creation code:
```typescript
// After new membership is created
await fetch('/api/notify/admin-new-user', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    group_id: groupId,
    new_user_id: newUserId,
    new_user_email: newUserEmail,
    new_user_name: newUserName
  })
});
```

## Email Types & Templates

### 1. Weekly Goal Reminder
- **Subject**: `{GroupName} • Time's running out! Complete your weekly goal`
- **Content**: Progress bar, miles needed, call-to-action
- **Frequency**: Once per week, 24 hours before week end

### 2. Top Performer Alert  
- **Subject**: `{GroupName} • You're in the top 3! 🏆`
- **Content**: Rank position, miles logged, congratulatory message
- **Frequency**: Once per rank achievement

### 3. Admin New User
- **Subject**: `{GroupName} • New member: {NewUserName}`
- **Content**: New user details, group stats, admin actions
- **Frequency**: Per new member join

### 4. Top-3 Milestone
- **Subject**: `{GroupName} • Top performer {UserName} logged {Miles} miles 🥇`
- **Content**: Highlighted top performer activity
- **Frequency**: When top 3 members log miles

## User Experience

### Settings Page
- Clean toggle interface for all notification types
- Clear descriptions of what each notification does
- Real-time updates with success feedback
- Links to settings page in all emails for easy opt-out

### Email Design
- Consistent branding with Runpool styling
- Mobile-responsive HTML templates
- Clear call-to-action buttons
- Easy unsubscribe/preferences links

## Testing

Test each notification type:

```bash
# Test weekly reminders
curl -X POST "http://localhost:3000/api/notify/weekly-goals" \
  -H "x-cron-secret: $CRON_SECRET"

# Test admin notifications  
curl -X POST "http://localhost:3000/api/notify/admin-new-user" \
  -H "Content-Type: application/json" \
  -d '{"group_id":"GROUP_ID","new_user_id":"USER_ID"}'
```

## Security & Privacy

- ✅ RLS policies protect user preferences
- ✅ Individual email sending (no address exposure)
- ✅ CRON_SECRET protection for automated endpoints
- ✅ User authentication required for personal notifications
- ✅ Graceful degradation when service keys missing
- ✅ Opt-out links in all emails