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
          <p style="margin: 0;">© Runpool • Making every mile count</p>
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
        'John Runner', 
        'SF Running Club',
        7.2,
        10.0,
        'Less than 24 hours',
        'https://runpool.space/group/123'
      );
      break;
      
    case 'top-performer':
      html = topPerformerHtml(
        'Sarah Champion',
        'Marathon Squad',
        1, // 1st place for gold theme
        15.5,
        '2024-01-15 — 2024-01-21',
        'https://runpool.space/group/456'
      );
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
<html><head><meta charset="UTF-8"><title>Activity Preview</title></head>
<body style="font-family: system-ui; padding: 2rem; text-align: center;">
<h2>🏃‍♂️ Activity Notification Preview</h2>
<p>This template notifies group members when someone logs new miles.</p>
<p><a href="?">← Back to all templates</a></p>
</body></html>`;
      break;
      
    default:
      html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Template Not Found</title></head>
<body style="font-family: system-ui; padding: 2rem; text-align: center;">
<h2>❌ Template Not Found</h2>
<p>Available templates: weekly-goal, top-performer, activity, admin-new-user, top3-milestone</p>
<p><a href="?">← Back to all templates</a></p>
</body></html>`;
  }
  
  return new Response(html, {
    headers: { 'content-type': 'text/html' }
  });
}