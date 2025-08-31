// app/api/test-email-send/route.ts
// Test endpoint to send actual emails and verify delivery

import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

async function sendResendEmail(to: string[], subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  
  if (!apiKey || !from) {
    return { 
      ok: false, 
      error: 'Missing RESEND_API_KEY or RESEND_FROM env variables',
      config: { hasApiKey: !!apiKey, hasFrom: !!from }
    };
  }
  
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, html }),
    });
    
    const responseData = await res.json();
    
    return { 
      ok: res.ok, 
      status: res.status,
      data: responseData,
      error: res.ok ? null : responseData.message || 'Email send failed'
    };
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, type = 'activity' } = body;
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email address required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }

    let subject = '';
    let html = '';

    switch (type) {
      case 'activity':
        subject = 'SF Running Club — Sarah Runner logged 5.2 miles';
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
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 56px 48px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><defs><pattern id=\"runner\" width=\"40\" height=\"40\" patternUnits=\"userSpaceOnUse\"><circle cx=\"20\" cy=\"15\" r=\"3\" fill=\"%23ffffff\" opacity=\"0.08\"/><ellipse cx=\"20\" cy=\"25\" rx=\"8\" ry=\"4\" fill=\"%23ffffff\" opacity=\"0.05\"/><path d=\"M12 25l8-5 8 5\" stroke=\"%23ffffff\" stroke-width=\"1\" fill=\"none\" opacity=\"0.06\"/></pattern></defs><rect width=\"200\" height=\"200\" fill=\"url(%23runner)\"/></svg>'); opacity: 0.6;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <span style="font-size: 42px;">🏃‍♂️</span>
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Team Activity</h1>
              <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95); font-weight: 600;">SF Running Club</p>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 56px 48px;">
            
            <!-- Achievement Card -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid #e2e8f0; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, #6366f1, #8b5cf6); border-radius: 50%; opacity: 0.04;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">Fresh Activity</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #1e293b; letter-spacing: -0.02em;">Sarah Runner</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: #475569; font-weight: 700;">just logged <strong style="color: #6366f1; font-size: 24px;">5.2 miles</strong></p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(30, 41, 59, 0.3);">
                  <span style="font-size: 20px;">🔥</span>
                  <span>Crushing it!</span>
                </div>
              </div>
            </div>

            <!-- Progress Stats -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px;">
              <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 20px; padding: 28px; text-align: center; border: 2px solid #a7f3d0;">
                <div style="font-size: 28px; font-weight: 900; color: #065f46; margin-bottom: 8px;">5.2</div>
                <div style="font-size: 14px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">Miles Today</div>
              </div>
              <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 28px; text-align: center; border: 2px solid #fbbf24;">
                <div style="font-size: 28px; font-weight: 900; color: #92400e; margin-bottom: 8px;">#2</div>
                <div style="font-size: 14px; font-weight: 700; color: #a16207; text-transform: uppercase; letter-spacing: 0.5px;">Leaderboard</div>
              </div>
            </div>

            <!-- Motivation Section -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h3 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em;">Don't get left behind!</h3>
              <p style="margin: 0; font-size: 18px; color: #64748b; line-height: 1.7; max-width: 480px; margin: 0 auto;">Your teammates are making moves. Log your miles today and show them what you're made of!</p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(99, 102, 241, 0.4); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.5px;">
                Log Your Run →
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 48px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8); font-weight: 500;">Every mile matters • Every step counts</p>
          </div>

        </div>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
        break;

      case 'admin-new-user':
        subject = 'SF Running Club — New member John Runner joined';
        html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>👋 Team Growth - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 56px 48px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><defs><pattern id=\"growth\" width=\"40\" height=\"40\" patternUnits=\"userSpaceOnUse\"><circle cx=\"20\" cy=\"15\" r=\"3\" fill=\"%23ffffff\" opacity=\"0.08\"/><circle cx=\"30\" cy=\"25\" r=\"2\" fill=\"%23ffffff\" opacity=\"0.06\"/><circle cx=\"10\" cy=\"25\" r=\"2\" fill=\"%23ffffff\" opacity=\"0.06\"/></pattern></defs><rect width=\"200\" height=\"200\" fill=\"url(%23growth)\"/></svg>'); opacity: 0.6;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <span style="font-size: 42px;">👋</span>
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Team Growth</h1>
              <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95); font-weight: 600;">SF Running Club</p>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 56px 48px;">
            
            <!-- Welcome Card -->
            <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid #a7f3d0; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, #10b981, #059669); border-radius: 50%; opacity: 0.06;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">New Member</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #064e3b; letter-spacing: -0.02em;">John Runner</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: #065f46; font-weight: 700;">just joined your community</p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #064e3b 0%, #047857 100%); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(6, 78, 59, 0.3);">
                  <span style="font-size: 20px;">🎉</span>
                  <span>Welcome aboard!</span>
                </div>
              </div>
            </div>

            <!-- Admin Action -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border-left: 6px solid #f59e0b; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                <span style="font-size: 24px;">📋</span>
                <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #92400e;">Admin Action</h3>
              </div>
              <p style="margin: 0; font-size: 18px; color: #a16207; line-height: 1.6; font-weight: 600;">Consider welcoming your new member and helping them get started with their first challenge.</p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(16, 185, 129, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                View Members →
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 48px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8); font-weight: 500;">Building stronger communities</p>
          </div>

        </div>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
        break;

      case 'admin-proof-pending':
        subject = 'SF Running Club — New run proof needs verification';
        html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔍 Proof Verification - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); padding: 56px 48px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><defs><pattern id=\"verify\" width=\"40\" height=\"40\" patternUnits=\"userSpaceOnUse\"><path d=\"M15 20l5 5 10-10\" stroke=\"%23ffffff\" stroke-width=\"2\" fill=\"none\" opacity=\"0.08\"/><circle cx=\"20\" cy=\"15\" r=\"2\" fill=\"%23ffffff\" opacity=\"0.06\"/></pattern></defs><rect width=\"200\" height=\"200\" fill=\"url(%23verify)\"/></svg>'); opacity: 0.6;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <span style="font-size: 42px;">🔍</span>
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Verification Required</h1>
              <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95); font-weight: 600;">Admin Review Needed</p>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 56px 48px;">
            
            <!-- Proof Card -->
            <div style="background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid #c4b5fd; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, #7c3aed, #5b21b6); border-radius: 50%; opacity: 0.06;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);">Proof Submitted</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #581c87; letter-spacing: -0.02em;">John Runner</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: #6b21a8; font-weight: 700;">submitted proof for <strong style="color: #581c87; font-size: 24px;">5.2 miles</strong></p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #581c87 0%, #6b21a8 100%); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(88, 28, 135, 0.3);">
                  <span style="font-size: 20px;">📸</span>
                  <span>Awaiting Review</span>
                </div>
              </div>
            </div>

            <!-- Urgency Notice -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border-left: 6px solid #ef4444; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                <span style="font-size: 24px;">⏰</span>
                <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #dc2626;">Time Sensitive</h3>
              </div>
              <p style="margin: 0; font-size: 18px; color: #b91c1c; line-height: 1.6; font-weight: 600;">Please verify this proof within 24 hours to maintain member trust and engagement.</p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(124, 58, 237, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                Review Proof →
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 48px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8); font-weight: 500;">Trusted verification for communities</p>
          </div>

        </div>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
        break;

      case 'top3-milestone':
        subject = 'SF Running Club — Top performer Sarah Champion logged 5.2 miles 🥇';
        html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏆 Elite Achievement - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 56px 48px; text-align: center; position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\"><defs><pattern id=\"trophy\" width=\"50\" height=\"50\" patternUnits=\"userSpaceOnUse\"><path d=\"M25 15v8c0 4 3 7 7 7s7-3 7-7v-8M18 15h14M20 15v-3c0-1.5 1.5-3 3-3h6c1.5 0 3 1.5 3 3v3\" stroke=\"%23ffffff\" stroke-width=\"2\" fill=\"none\" opacity=\"0.08\"/><circle cx=\"25\" cy=\"35\" r=\"3\" fill=\"%23ffffff\" opacity=\"0.06\"/></pattern></defs><rect width=\"200\" height=\"200\" fill=\"url(%23trophy)\"/></svg>'); opacity: 0.6;"></div>
            <div style="position: relative; z-index: 1;">
              <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(20px); border: 3px solid rgba(255,255,255,0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
                <span style="font-size: 42px;">🏆</span>
              </div>
              <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff; letter-spacing: -0.025em; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">Elite Achievement</h1>
              <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95); font-weight: 600;">Top 3 Leaderboard</p>
            </div>
          </div>

          <!-- Content -->
          <div style="padding: 56px 48px;">
            
            <!-- Achievement Card -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid #fbbf24; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, #fbbf24, #f59e0b); border-radius: 50%; opacity: 0.06;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">Top 3 Elite</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #92400e; letter-spacing: -0.02em;">Sarah Champion</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: #a16207; font-weight: 700;">just logged <strong style="color: #92400e; font-size: 24px;">5.2 miles</strong> and is in the Top 3!</p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #92400e 0%, #a16207 100%); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(146, 64, 14, 0.3);">
                  <span style="font-size: 20px;">🔥</span>
                  <span>Elite Performance!</span>
                </div>
              </div>
            </div>

            <!-- Leaderboard Preview -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border: 2px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <h3 style="margin: 0 0 28px 0; font-size: 24px; font-weight: 800; color: #1e293b; text-align: center; letter-spacing: -0.02em;">🏆 Current Top 3</h3>
              <div style="space-y: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 16px; margin-bottom: 16px; border: 2px solid #fbbf24; box-shadow: 0 2px 8px rgba(251, 191, 36, 0.2);">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="font-size: 28px;">🥇</span>
                    <span style="font-weight: 900; color: #92400e; font-size: 18px;">Sarah Champion</span>
                  </div>
                  <span style="font-weight: 800; color: #a16207; font-size: 18px;">24.8 mi</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: #f1f5f9; border-radius: 16px; margin-bottom: 16px; border: 2px solid #e2e8f0;">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="font-size: 28px;">🥈</span>
                    <span style="font-weight: 800; color: #475569; font-size: 18px;">Mike Speed</span>
                  </div>
                  <span style="font-weight: 700; color: #64748b; font-size: 18px;">22.1 mi</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; background: #f1f5f9; border-radius: 16px; border: 2px solid #e2e8f0;">
                  <div style="display: flex; align-items: center; gap: 16px;">
                    <span style="font-size: 28px;">🥉</span>
                    <span style="font-weight: 800; color: #475569; font-size: 18px;">Alex Fast</span>
                  </div>
                  <span style="font-weight: 700; color: #64748b; font-size: 18px;">19.7 mi</span>
                </div>
              </div>
            </div>

            <!-- Motivation -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h3 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 800; color: #1e293b; letter-spacing: -0.02em;">Keep the momentum!</h3>
              <p style="margin: 0; font-size: 18px; color: #64748b; line-height: 1.7; max-width: 480px; margin: 0 auto;">Elite performers inspire the whole community. Every mile counts toward your goals!</p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(251, 191, 36, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                View Leaderboard →
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 40px 48px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <span style="color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">RunPool</span>
            </div>
            <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8); font-weight: 500;">Celebrating every milestone</p>
          </div>

        </div>
        
      </td>
    </tr>
  </table>
</body>
</html>`;
        break;

      case 'payment-success':
        subject = 'Payment Confirmed - RunPool Challenge';
        html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>✅ Payment Success - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4);">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 56px 48px; text-align: center; position: relative;">
            <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 42px;">✅</span>
            </div>
            <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff;">Payment Confirmed</h1>
            <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95);">SF Running Club</p>
          </div>
          <div style="padding: 56px 48px; text-align: center;">
            <h2 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 800; color: #064e3b;">You're all set!</h2>
            <p style="margin: 0 0 32px 0; font-size: 18px; color: #065f46;">Your payment of $25.00 has been processed successfully.</p>
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px;">
              View Challenge →
            </a>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
        break;

      case 'payment-failure':
        subject = 'Payment Issue - RunPool Challenge';
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
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4);">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 56px 48px; text-align: center; position: relative;">
            <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 42px;">❌</span>
            </div>
            <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff;">Payment Failed</h1>
            <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95);">SF Running Club</p>
          </div>
          <div style="padding: 56px 48px; text-align: center;">
            <h2 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 800; color: #dc2626;">Payment Unsuccessful</h2>
            <p style="margin: 0 0 32px 0; font-size: 18px; color: #b91c1c;">We couldn't process your payment. Please try again.</p>
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px;">
              Try Again →
            </a>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
        break;

      case 'payout-success':
        subject = '🎉 Prize Payout - RunPool Winner!';
        html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏆 Prize Payout - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4);">
          <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 56px 48px; text-align: center; position: relative;">
            <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 42px;">🏆</span>
            </div>
            <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff;">Prize Payout!</h1>
            <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95);">SF Running Club</p>
          </div>
          <div style="padding: 56px 48px; text-align: center;">
            <h2 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 800; color: #92400e;">Congratulations!</h2>
            <p style="margin: 0 0 32px 0; font-size: 18px; color: #a16207;">Your prize of $150.00 has been sent to your account.</p>
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px;">
              View Account →
            </a>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
        break;

      case 'stripe-setup':
        subject = 'Stripe Account Connected - RunPool';
        html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🔗 Account Connected - RunPool</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  </style>
</head>
<body style="margin: 0; padding: 0; background: #0a0a0a; font-family: 'Inter', sans-serif;">
  <table role="presentation" style="width: 100%; border: none; border-spacing: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div style="max-width: 680px; background: #ffffff; border-radius: 28px; overflow: hidden; box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.4);">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 56px 48px; text-align: center; position: relative;">
            <div style="width: 96px; height: 96px; background: rgba(255,255,255,0.15); border-radius: 50%; margin: 0 auto 28px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 42px;">🔗</span>
            </div>
            <h1 style="margin: 0 0 16px 0; font-size: 36px; font-weight: 900; color: #ffffff;">Account Connected</h1>
            <p style="margin: 0; font-size: 20px; color: rgba(255,255,255,0.95);">SF Running Club</p>
          </div>
          <div style="padding: 56px 48px; text-align: center;">
            <h2 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 800; color: #1e40af;">Setup Complete!</h2>
            <p style="margin: 0 0 32px 0; font-size: 18px; color: #1e3a8a;">Your Stripe account is now connected and ready for payouts.</p>
            <a href="#" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px;">
              View Dashboard →
            </a>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid email type' }), {
          status: 400,
          headers: { 'content-type': 'application/json' }
        });
    }

    const result = await sendResendEmail([email], subject, html);
    
    return new Response(JSON.stringify({
      success: result.ok,
      email_sent_to: email,
      type: type,
      subject: subject,
      resend_response: result.data,
      error: result.error,
      timestamp: new Date().toISOString()
    }), {
      status: result.ok ? 200 : 500,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'content-type': 'application/json' }
    });
  }
}
