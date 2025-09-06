// app/api/test-emails/route.ts
// Quick way to test email templates without sending actual emails

export const runtime = 'nodejs';

function weeklyGoalReminderHtml(
  userName: string,
  groupName: string,
  currentMiles: number,
  goalMiles: number,
  timeLeft: string,
  groupUrl: string
): string {
  const milesNeeded = Math.max(0, goalMiles - currentMiles);
  const progressPercent = Math.min(100, (currentMiles / goalMiles) * 100);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Goal Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 32px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #1f2937; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">
        Almost there, ${userName}!
      </h1>
      <div style="color: #6b7280; font-size: 16px; margin: 0;">
        ${groupName} &bull; ${timeLeft} left this week
      </div>
    </div>

    <!-- Progress Card -->
    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #e0f2fe;">
      <h3 style="color: #0f172a; font-size: 18px; font-weight: 600; margin: 0 0 16px 0;">
        Your Weekly Progress
      </h3>
      
      <!-- Miles Display -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="color: #374151; font-size: 16px; font-weight: 500;">${currentMiles.toFixed(1)} miles logged</span>
        <span style="color: #6b7280; font-size: 16px;">Goal: ${goalMiles.toFixed(1)} miles</span>
      </div>
      
      <!-- Progress Bar -->
      <div style="width: 100%; height: 12px; background-color: #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 16px;">
        <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 6px;"></div>
      </div>
      
      <!-- Status Message -->
      <div style="text-align: center;">
        ${milesNeeded > 0 ? 
          `<div style="color: #d97706; font-weight: 600; font-size: 18px;">Only ${milesNeeded.toFixed(1)} miles to go!</div>` : 
          `<div style="color: #059669; font-weight: 600; font-size: 18px;">Goal achieved! Keep it up!</div>`
        }
      </div>
    </div>

    <!-- Call to Action -->
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${groupUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(31, 41, 55, 0.25);">
        Log Your Miles
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0;">
        Keep up the great work! Every mile counts.
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        <a href="/settings" style="color: #6366f1; text-decoration: none;">Update email preferences</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

function topPerformerHtml(
  userName: string,
  groupName: string,
  currentRank: number,
  miles: number,
  period: string,
  leaderboardUrl: string
): string {
  const rankEmoji = currentRank === 1 ? '🥇' : currentRank === 2 ? '🥈' : '🥉';
  const rankText = currentRank === 1 ? '1st place' : currentRank === 2 ? '2nd place' : '3rd place';
  const rankColor = currentRank === 1 ? '#f59e0b' : currentRank === 2 ? '#6b7280' : '#d97706';
  const bgGradient = currentRank === 1 
    ? 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)' 
    : currentRank === 2 
    ? 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)' 
    : 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏆 Top Performer Alert - Runpool</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <!-- Main Card -->
        <div style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); color: white; text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🏆</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              Congratulations, ${userName}!
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              ${groupName} &bull; ${period}
            </p>
          </div>

          <!-- Achievement Banner -->
          <div style="background: ${bgGradient}; padding: 40px 32px; text-align: center;">
            
            <!-- Medal Icon -->
            <div style="font-size: 80px; margin-bottom: 20px; line-height: 1; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));">
              ${rankEmoji}
            </div>
            
            <!-- Achievement Text -->
            <h2 style="color: #7c2d12; font-size: 26px; font-weight: 900; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.05em;">
              You are in ${rankText}!
            </h2>
            
            <!-- Miles Badge -->
            <div style="display: inline-block; background: rgba(255, 255, 255, 0.95); border-radius: 50px; padding: 12px 24px; margin-top: 8px; border: 2px solid ${rankColor};">
              <div style="color: #451a03; font-size: 20px; font-weight: 700;">
                ${miles.toFixed(1)} miles logged
              </div>
            </div>
          </div>

          <!-- Content Section -->
          <div style="padding: 32px;">
            
            <!-- Motivational Message -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #0ea5e9;">
              <h3 style="color: #0c4a6e; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                Amazing Achievement! 🎉
              </h3>
              <p style="color: #0369a1; font-size: 16px; margin: 0; line-height: 1.5;">
                You have climbed into the top 3! Keep up the incredible work and maintain your position on the leaderboard.
              </p>
            </div>

            <!-- Stats Grid -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Your Rank</div>
                <div style="color: #1e293b; font-size: 24px; font-weight: 800;">#${currentRank}</div>
              </div>
              <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center;">
                <div style="color: #64748b; font-size: 14px; font-weight: 500; margin-bottom: 4px;">Miles Logged</div>
                <div style="color: #1e293b; font-size: 24px; font-weight: 800;">${miles.toFixed(1)}</div>
              </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${leaderboardUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3); transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.025em;">
                View Leaderboard 📊
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; text-align: center; padding: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
              Keep pushing forward and stay at the top! 💪
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              <a href="/settings" style="color: #3b82f6; text-decoration: none; font-weight: 500;">Update preferences</a> &bull; 
              <a href="${leaderboardUrl}" style="color: #3b82f6; text-decoration: none; font-weight: 500;">View group</a>
            </p>
          </div>

        </div>
        
        <!-- Email Footer -->
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">&copy; Runpool • Making every mile count</p>
        </div>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getTestIndex(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>📧 Email Template Previews - Runpool</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; padding: 2rem; background: #f8fafc; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 3rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }
    .card { background: white; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .card h3 { margin: 0 0 0.5rem 0; color: #1f2937; }
    .card p { margin: 0 0 1rem 0; color: #6b7280; font-size: 14px; }
    .btn { display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 14px; }
    .btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📧 Runpool Email Templates</h1>
      <p>Preview all email notification designs</p>
    </div>
    
    <div class="grid">
      <div class="card">
        <h3>⏰ Weekly Goal Reminder</h3>
        <p>End-of-week reminders for users behind on their weekly goals</p>
        <a href="?type=weekly-goal" class="btn">Preview Template</a>
      </div>
      
      <div class="card">
        <h3>🏆 Top Performer Alert</h3>
        <p>Personal celebration when users enter top 3 rankings</p>
        <a href="?type=top-performer" class="btn">Preview Template</a>
      </div>
      
      <div class="card">
        <h3>🏃‍♂️ Activity Notification</h3>
        <p>General activity updates when group members log miles</p>
        <a href="?type=activity" class="btn">Preview Template</a>
      </div>
      
      <div class="card">
        <h3>👋 New Member Alert</h3>
        <p>Admin notifications when new users join groups</p>
        <a href="?type=admin-new-user" class="btn">Preview Template</a>
      </div>
      
      <div class="card">
        <h3>🥇 Top 3 Milestone</h3>
        <p>Special notifications when top performers are active</p>
        <a href="?type=top3-milestone" class="btn">Preview Template</a>
      </div>
      
      <div class="card">
        <h3>🔍 Admin Proof Pending</h3>
        <p>Admin alerts when new run proofs need verification</p>
        <a href="?type=admin-proof-pending" class="btn">Preview Template</a>
      </div>
      
      <div class="card">
        <h3>✅ Payment Success</h3>
        <p>Confirmation email when payments are successfully processed</p>
        <a href="?type=payment-success" class="btn">Preview Template</a>
      </div>
      
      <div class="card">
        <h3>❌ Payment Failure</h3>
        <p>Alert email when payment processing fails</p>
        <a href="?type=payment-failure" class="btn">Preview Template</a>
      </div>
      
      <div class="card">
        <h3>🏆 Prize Payout</h3>
        <p>Celebration email when prize money is sent to winners</p>
        <a href="?type=payout-success" class="btn">Preview Template</a>
      </div>
      
      <div class="card">
        <h3>🔗 Stripe Setup</h3>
        <p>Account connection confirmation for payment processing</p>
        <a href="?type=stripe-setup" class="btn">Preview Template</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  
  if (!type) {
    return new Response(getTestIndex(), {
      headers: { 'content-type': 'text/html' }
    });
  }
  
  let html = '';
  
  switch (type) {
    case 'weekly-goal':
      html = weeklyGoalReminderHtml(
        'Sample Runner', 
        'Sample Running Group',
        7.2,
        10.0,
        'Less than 24 hours',
        '#'
      );
      break;
      
    case 'top-performer':
      html = topPerformerHtml(
        'Sample Runner',
        'Sample Group',
        1, // 1st place for gold theme
        15.5,
        'Sample Period',
        '#'
      );
      break;
      
    case 'admin-new-user':
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>👋 New Member - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0f0f23; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: #0f0f23;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <div style="max-width: 640px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 48px 40px; text-align: center; position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"dots\" width=\"20\" height=\"20\" patternUnits=\"userSpaceOnUse\"><circle cx=\"10\" cy=\"10\" r=\"1.5\" fill=\"%23ffffff\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23dots)\"/></svg>'); opacity: 0.4;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.3);">
                <span style="font-size: 36px;">👋</span>
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em;">Team Growth</h1>
              <p style="margin: 0; font-size: 18px; color: rgba(255,255,255,0.9); font-weight: 500;">Sample Running Group</p>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 48px 40px;">
            
            <!-- Welcome Card -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 20px; padding: 32px; margin-bottom: 32px; border: 1px solid #a7f3d0; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -30%; right: -15%; width: 150px; height: 150px; background: linear-gradient(45deg, #10b981, #059669); border-radius: 50%; opacity: 0.08;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: #10b981; color: white; padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px;">New Member</div>
                <h2 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 800; color: #064e3b;">Sample Runner</h2>
                <p style="margin: 0 0 24px 0; font-size: 18px; color: #065f46; font-weight: 600;">joined your running community</p>
                <div style="display: inline-flex; align-items: center; gap: 8px; background: #064e3b; color: white; padding: 12px 24px; border-radius: 50px; font-weight: 700;">
                  <span>🎉</span>
                  <span>Welcome aboard!</span>
                </div>
              </div>
            </div>

            <!-- Admin Notice -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #f59e0b;">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <span style="font-size: 20px;">📋</span>
                <h3 style="margin: 0; font-size: 18px; font-weight: 700; color: #92400e;">Admin Notification</h3>
              </div>
              <p style="margin: 0; font-size: 16px; color: #a16207; line-height: 1.5;">Consider welcoming your new member and helping them get started with their first challenge.</p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);">
                View Members →
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 32px 40px; text-align: center;">
            <div style="margin-bottom: 16px;">
              <span style="color: #ffffff; font-size: 20px; font-weight: 800;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">Building stronger running communities</p>
          </div>

        </div>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
      break;
      
    case 'top3-milestone':
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏆 Top 3 Achievement - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0f0f23; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: #0f0f23;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <div style="max-width: 640px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 48px 40px; text-align: center; position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"trophy\" width=\"30\" height=\"30\" patternUnits=\"userSpaceOnUse\"><path d=\"M15 8v6c0 3 2 5 5 5s5-2 5-5V8M10 8h20M12 8V6c0-1 1-2 2-2h4c1 0 2 1 2 2v2\" stroke=\"%23ffffff\" stroke-width=\"1.5\" fill=\"none\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23trophy)\"/></svg>'); opacity: 0.4;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.3);">
                <span style="font-size: 36px;">🏆</span>
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em;">Elite Achievement</h1>
              <p style="margin: 0; font-size: 18px; color: rgba(255,255,255,0.9); font-weight: 500;">Top 3 Leaderboard</p>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 48px 40px;">
            
            <!-- Achievement Card -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin-bottom: 32px; border: 1px solid #fbbf24; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -30%; right: -15%; width: 150px; height: 150px; background: linear-gradient(45deg, #fbbf24, #f59e0b); border-radius: 50%; opacity: 0.08;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: #f59e0b; color: white; padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.5px;">Top 3 Achievement</div>
                <h2 style="margin: 0 0 12px 0; font-size: 28px; font-weight: 800; color: #92400e;">Sample Runner</h2>
                <p style="margin: 0 0 24px 0; font-size: 18px; color: #a16207; font-weight: 600;">just logged <strong style="color: #92400e;">5.2 miles</strong> and is in the Top 3!</p>
                <div style="display: inline-flex; align-items: center; gap: 8px; background: #92400e; color: white; padding: 12px 24px; border-radius: 50px; font-weight: 700;">
                  <span>🔥</span>
                  <span>Elite Performance!</span>
                </div>
              </div>
            </div>

            <!-- Leaderboard Preview -->
            <div style="background: #f8fafc; border-radius: 16px; padding: 24px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
              <h3 style="margin: 0 0 20px 0; font-size: 20px; font-weight: 700; color: #1e293b; text-align: center;">🏆 Current Top 3</h3>
              <div style="space-y: 12px;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; margin-bottom: 12px; border: 2px solid #fbbf24;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">🥇</span>
                    <span style="font-weight: 800; color: #92400e; font-size: 16px;">Runner A</span>
                  </div>
                  <span style="font-weight: 700; color: #a16207; font-size: 16px;">24.8 mi</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #f1f5f9; border-radius: 12px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">🥈</span>
                    <span style="font-weight: 700; color: #475569; font-size: 16px;">Runner B</span>
                  </div>
                  <span style="font-weight: 600; color: #64748b; font-size: 16px;">22.1 mi</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 24px;">🥉</span>
                    <span style="font-weight: 700; color: #475569; font-size: 16px;">Runner C</span>
                  </div>
                  <span style="font-weight: 600; color: #64748b; font-size: 16px;">19.7 mi</span>
                </div>
              </div>
            </div>

            <!-- Motivation -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1e293b;">Keep the momentum!</h3>
              <p style="margin: 0; font-size: 16px; color: #64748b; line-height: 1.6;">Elite performers inspire the whole community. Every mile counts toward your goals!</p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px rgba(251, 191, 36, 0.3);">
                View Full Leaderboard →
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 32px 40px; text-align: center;">
            <div style="margin-bottom: 16px;">
              <span style="color: #ffffff; font-size: 20px; font-weight: 800;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">Celebrating every milestone</p>
          </div>

        </div>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
      break;
      
    case 'weekly-recap':
      html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Weekly Recap Preview</title></head>
<body style="font-family: system-ui; padding: 2rem; text-align: center;">
<h2>📊 Weekly Recap Preview</h2>
<p>This template shows weekly group performance summaries with top performers.</p>
<p><a href="?">← Back to all templates</a></p>
</body></html>`;
      break;
      
    case 'invite':
      html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invite Preview</title></head>
<body style="font-family: system-ui; padding: 2rem; text-align: center;">
<h2>🎉 Group Invite Preview</h2>
<p>This template is used when inviting new members to join running groups.</p>
<p><a href="?">← Back to all templates</a></p>
</body></html>`;
      break;
      
    case 'activity':
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏃‍♂️ New Activity - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0f0f23; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: #0f0f23;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <div style="max-width: 640px; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 48px 40px; text-align: center; position: relative;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"50\" cy=\"50\" r=\"1\" fill=\"%23ffffff\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>'); opacity: 0.3;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px); border: 2px solid rgba(255,255,255,0.3);">
                <span style="font-size: 36px;">🏃‍♂️</span>
              </div>
              <h1 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: -0.02em;">Activity Alert</h1>
              <p style="margin: 0; font-size: 18px; color: rgba(255,255,255,0.9); font-weight: 500;">Sample Running Group</p>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 48px 40px;">
            
            <!-- Achievement Card -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 20px; padding: 32px; margin-bottom: 32px; border: 1px solid #e2e8f0; position: relative; overflow: hidden;">
              <div style="position: absolute; top: -50%; right: -20%; width: 200px; height: 200px; background: linear-gradient(45deg, #667eea, #764ba2); border-radius: 50%; opacity: 0.05;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: #667eea; color: white; padding: 8px 20px; border-radius: 50px; font-size: 14px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">New Activity</div>
                <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; color: #1e293b;">Sample Runner</h2>
                <p style="margin: 0 0 20px 0; font-size: 20px; color: #475569; font-weight: 600;">logged <strong style="color: #667eea;">5.2 miles</strong></p>
                <div style="display: inline-flex; align-items: center; gap: 8px; background: #667eea; color: white; padding: 12px 24px; border-radius: 50px; font-weight: 700;">
                  <span>🎯</span>
                  <span>Great work!</span>
                </div>
              </div>
            </div>

            <!-- Motivation Section -->
            <div style="text-align: center; margin-bottom: 32px;">
              <h3 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #1e293b;">Your turn to shine!</h3>
              <p style="margin: 0; font-size: 16px; color: #64748b; line-height: 1.6;">Don't let your teammates get ahead. Log your miles today and climb the leaderboard!</p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3); transition: all 0.3s ease;">
                View Leaderboard →
              </a>
            </div>

            <!-- Test Notice -->
            <div style="text-align: center; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #64748b; font-weight: 500;">📧 This is a test email to verify delivery</p>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 32px 40px; text-align: center;">
            <div style="margin-bottom: 16px;">
              <span style="color: #ffffff; font-size: 20px; font-weight: 800;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">Making every mile count • Powered by community</p>
          </div>

        </div>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
      break;
      
    case 'admin-proof-pending':
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔍 Proof Verification Needed - Runpool</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0;">
    <tr>
      <td align="center" style="padding: 20px;">
        
        <!-- Main Card -->
        <div style="max-width: 600px; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header Section -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; text-align: center; padding: 32px;">
            <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
            <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">
              Proof Verification Needed
            </h1>
            <p style="margin: 0; font-size: 16px; opacity: 0.9;">
              Sample Group • Sample Period
            </p>
          </div>

          <!-- Content Section -->
          <div style="padding: 32px;">
            
            <!-- Submission Alert -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 28px; margin-bottom: 32px; border: 2px solid #f59e0b; text-align: center;">
              <div style="color: #92400e; font-size: 24px; font-weight: 800; margin-bottom: 8px;">
                Sample Runner
              </div>
              <div style="color: #a16207; font-size: 18px; margin-bottom: 16px;">
                submitted a run proof for 5.2 miles 📸
              </div>
              
              <!-- Status Badge -->
              <div style="display: inline-block; background: rgba(245, 158, 11, 0.2); border: 2px solid #f59e0b; border-radius: 50px; padding: 12px 24px;">
                <div style="color: #92400e; font-size: 16px; font-weight: 700;">
                  ⏳ Awaiting Verification
                </div>
              </div>
            </div>

            <!-- Admin Action Required -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 16px; padding: 24px; margin-bottom: 32px; border-left: 4px solid #ef4444;">
              <h3 style="color: #991b1b; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">
                Admin Action Required 🚨
              </h3>
              <p style="color: #dc2626; font-size: 16px; margin: 0; line-height: 1.5;">
                A new run proof has been submitted and needs your verification. Please review the submission and approve or reject it.
              </p>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="#" 
                 style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: #ffffff; text-decoration: none; padding: 18px 36px; border-radius: 50px; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4); text-transform: uppercase; letter-spacing: 0.025em;">
                Review & Verify 🔍
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #1e293b; padding: 32px 40px; text-align: center;">
            <div style="margin-bottom: 16px;">
              <span style="color: #ffffff; font-size: 20px; font-weight: 800;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">Maintaining community trust</p>
          </div>

        </div>

      </td>
    </tr>
  </table>
</body>
</html>`;
      break;
      
    case 'payment-success':
      // Generate the HTML directly for preview
      const amount = 2500; // $25.00
      const challengeName = 'Sample Running Group';
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>✅ Payment Confirmed - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 56px 48px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><defs><pattern id=\"success\" width=\"40\" height=\"40\" patternUnits=\"userSpaceOnUse\"><circle cx=\"20\" cy=\"20\" r=\"3\" fill=\"%23ffffff\" opacity=\"0.08\"/><path d=\"M12 20l6 6 12-12\" stroke=\"%23ffffff\" stroke-width=\"2\" opacity=\"0.06\"/></pattern></defs><rect width=\"200\" height=\"200\" fill=\"url(%23success)\"/></svg>'); opacity: 0.6;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <span style="font-size: 42px;">✅</span>
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Payment Confirmed</h1>
              <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95); font-weight: 600;">You're in the challenge!</p>
            </div>
          </div>
          <div style="padding: 56px 48px;">
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid #a7f3d0; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, #10b981, #059669); border-radius: 50%; opacity: 0.06;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">Payment Success</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #064e3b; letter-spacing: -0.02em;">$${(amount / 100).toFixed(2)} Paid</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: #065f46; font-weight: 700;">for ${challengeName}</p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(6, 78, 59, 0.3);">
                  <span style="font-size: 20px;">🎉</span>
                  <span>Successfully charged!</span>
                </div>
              </div>
            </div>
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border-left: 6px solid #f59e0b; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                <span style="font-size: 24px;">🏃‍♂️</span>
                <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #92400e;">Ready to Run!</h3>
              </div>
              <p style="margin: 0; font-size: 18px; color: #a16207; line-height: 1.6; font-weight: 600;">Your payment is confirmed and you're officially in the challenge. Time to lace up and start logging those miles!</p>
            </div>
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                View Challenge →
              </a>
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 48px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8); font-weight: 500;">Secure payments, competitive running</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
      break;
      
    case 'payment-failure':
      // Generate the HTML directly for preview
      const failureAmount = 2500;
      const failureChallengeName = 'Sample Running Group';
      const failureReason = 'Your card was declined';
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>❌ Payment Failed - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 56px 48px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><defs><pattern id=\"error\" width=\"40\" height=\"40\" patternUnits=\"userSpaceOnUse\"><circle cx=\"20\" cy=\"15\" r=\"3\" fill=\"%23ffffff\" opacity=\"0.08\"/><path d=\"M12 12l16 16M28 12l-16 16\" stroke=\"%23ffffff\" stroke-width=\"2\" opacity=\"0.06\"/></pattern></defs><rect width=\"200\" height=\"200\" fill=\"url(%23error)\"/></svg>'); opacity: 0.6;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <span style="font-size: 42px;">❌</span>
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Payment Failed</h1>
              <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95); font-weight: 600;">Don't worry, let's fix this</p>
            </div>
          </div>
          <div style="padding: 56px 48px;">
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid #fca5a5; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, #ef4444, #dc2626); border-radius: 50%; opacity: 0.06;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">Payment Issue</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #991b1b; letter-spacing: -0.02em;">$${(failureAmount / 100).toFixed(2)} Payment Failed</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: #b91c1c; font-weight: 700;">for ${failureChallengeName}</p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(153, 27, 27, 0.3);">
                  <span style="font-size: 20px;">⚠️</span>
                  <span>${failureReason}</span>
                </div>
              </div>
            </div>
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(239, 68, 68, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                Try Payment Again →
              </a>
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 48px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8); font-weight: 500;">Secure payments, trusted platform</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
      break;
      
    case 'payout-success':
      // Generate the HTML directly for preview
      const payoutAmount = 15000; // $150.00
      const payoutChallengeName = 'Sample Running Group';
      const position = 1;
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏆 Payout Sent - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 56px 48px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><defs><pattern id=\"money\" width=\"40\" height=\"40\" patternUnits=\"userSpaceOnUse\"><circle cx=\"20\" cy=\"20\" r=\"12\" stroke=\"%23ffffff\" stroke-width=\"2\" fill=\"none\" opacity=\"0.08\"/><text x=\"20\" y=\"26\" text-anchor=\"middle\" font-size=\"12\" fill=\"%23ffffff\" opacity=\"0.1\">$</text></pattern></defs><rect width=\"200\" height=\"200\" fill=\"url(%23money)\"/></svg>'); opacity: 0.6;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <span style="font-size: 42px;">🏆</span>
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Congratulations!</h1>
              <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95); font-weight: 600;">Your prize is on the way</p>
            </div>
          </div>
          <div style="padding: 56px 48px;">
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid #fbbf24; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, #fbbf24, #f59e0b); border-radius: 50%; opacity: 0.06;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">${position === 1 ? '🥇 Winner' : position === 2 ? '🥈 2nd Place' : position === 3 ? '🥉 3rd Place' : 'Prize Winner'}</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #92400e; letter-spacing: -0.02em;">$${(payoutAmount / 100).toFixed(2)} Prize</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: #a16207; font-weight: 700;">from ${payoutChallengeName}</p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #92400e 0%, #a16207 100%); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(146, 64, 14, 0.3);">
                  <span style="font-size: 20px;">💰</span>
                  <span>Payout sent!</span>
                </div>
              </div>
            </div>
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(251, 191, 36, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                View Challenge Results →
              </a>
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 48px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8); font-weight: 500;">Celebrating your achievement</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
      break;
      
    case 'stripe-setup':
      // Generate the HTML directly for preview
      const accountStatus = 'complete';
      const groupName = 'Sample Running Group';
      html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔗 Stripe Account ${accountStatus === 'complete' ? 'Connected' : 'Setup'} - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          <div style="background: linear-gradient(135deg, ${accountStatus === 'complete' ? '#10b981 0%, #059669 100%' : '#3b82f6 0%, #2563eb 100%'}); padding: 56px 48px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><defs><pattern id=\"connect\" width=\"40\" height=\"40\" patternUnits=\"userSpaceOnUse\"><circle cx=\"12\" cy=\"20\" r=\"3\" fill=\"%23ffffff\" opacity=\"0.08\"/><circle cx=\"28\" cy=\"20\" r=\"3\" fill=\"%23ffffff\" opacity=\"0.08\"/><path d=\"M15 20h10\" stroke=\"%23ffffff\" stroke-width=\"2\" opacity=\"0.06\"/></pattern></defs><rect width=\"200\" height=\"200\" fill=\"url(%23connect)\"/></svg>'); opacity: 0.6;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <span style="font-size: 42px;">${accountStatus === 'complete' ? '✅' : '🔗'}</span>
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${accountStatus === 'complete' ? 'Account Connected!' : 'Setup Started'}</h1>
              <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95); font-weight: 600;">Stripe Payment Processing</p>
            </div>
          </div>
          <div style="padding: 56px 48px;">
            <div style="background: linear-gradient(135deg, ${accountStatus === 'complete' ? '#ecfdf5 0%, #d1fae5 100%' : '#dbeafe 0%, #bfdbfe 100%'}); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid ${accountStatus === 'complete' ? '#a7f3d0' : '#93c5fd'}; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, ${accountStatus === 'complete' ? '#10b981, #059669' : '#3b82f6, #2563eb'}); border-radius: 50%; opacity: 0.06;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, ${accountStatus === 'complete' ? '#10b981 0%, #059669 100%' : '#3b82f6 0%, #2563eb 100%'}); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(${accountStatus === 'complete' ? '16, 185, 129' : '59, 130, 246'}, 0.3);">${accountStatus === 'complete' ? 'Account Active' : 'Setup In Progress'}</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: ${accountStatus === 'complete' ? '#064e3b' : '#1e40af'}; letter-spacing: -0.02em;">${groupName}</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: ${accountStatus === 'complete' ? '#065f46' : '#2563eb'}; font-weight: 700;">${accountStatus === 'complete' ? 'can now receive payments' : 'Stripe setup initiated'}</p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, ${accountStatus === 'complete' ? '#064e3b 0%, #065f46 100%' : '#1e40af 0%, #2563eb 100%'}); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(${accountStatus === 'complete' ? '6, 78, 59' : '30, 64, 175'}, 0.3);">
                  <span style="font-size: 20px;">${accountStatus === 'complete' ? '🎉' : '⚡'}</span>
                  <span>${accountStatus === 'complete' ? 'Ready to go!' : 'Almost there!'}</span>
                </div>
              </div>
            </div>
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, ${accountStatus === 'complete' ? '#10b981 0%, #059669 100%' : '#3b82f6 0%, #2563eb 100%'}); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(${accountStatus === 'complete' ? '16, 185, 129' : '59, 130, 246'}, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                ${accountStatus === 'complete' ? 'Manage Group →' : 'Complete Setup →'}
              </a>
            </div>
          </div>
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 48px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8); font-weight: 500;">Secure payments powered by Stripe</p>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
      break;
      
    default:
      html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Template Not Found</title></head>
<body style="font-family: system-ui; padding: 2rem; text-align: center;">
<h2>❌ Template Not Found</h2>
<p>Available templates: weekly-goal, top-performer, activity, admin-new-user, top3-milestone, admin-proof-pending, payment-success, payment-failure, payout-success, stripe-setup</p>
<p><a href="?">← Back to all templates</a></p>
</body></html>`;
  }
  
  return new Response(html, {
    headers: { 'content-type': 'text/html' }
  });
}