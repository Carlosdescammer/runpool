import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, accountStatus, groupName } = await req.json();

    const html = `<!DOCTYPE html>
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
          
          <!-- Header -->
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

          <!-- Content -->
          <div style="padding: 56px 48px;">
            
            <!-- Status Card -->
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

            ${accountStatus === 'complete' ? `
            <!-- Benefits -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border-left: 6px solid #0ea5e9; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                <span style="font-size: 24px;">🚀</span>
                <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #0c4a6e;">What's Next?</h3>
              </div>
              <p style="margin: 0; font-size: 18px; color: #0369a1; line-height: 1.6; font-weight: 600;">Your group can now accept payments for challenges and you'll automatically receive payouts when participants join. Start creating paid challenges!</p>
            </div>
            ` : `
            <!-- Next Steps -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border-left: 6px solid #f59e0b; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                <span style="font-size: 24px;">📋</span>
                <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #92400e;">Complete Your Setup</h3>
              </div>
              <p style="margin: 0; font-size: 18px; color: #a16207; line-height: 1.6; font-weight: 600;">You'll need to complete your Stripe account verification to start receiving payments. Check your email for next steps from Stripe.</p>
            </div>
            `}

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, ${accountStatus === 'complete' ? '#10b981 0%, #059669 100%' : '#3b82f6 0%, #2563eb 100%'}); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(${accountStatus === 'complete' ? '16, 185, 129' : '59, 130, 246'}, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                ${accountStatus === 'complete' ? 'Manage Group →' : 'Complete Setup →'}
              </a>
            </div>

          </div>

          <!-- Footer -->
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

    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: accountStatus === 'complete' 
        ? '✅ Stripe Account Connected - Start accepting payments!' 
        : '🔗 Stripe Setup Started - Complete your account',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stripe setup email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
