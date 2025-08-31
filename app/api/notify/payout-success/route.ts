import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, amount, weekId, challengeName, position } = await req.json();

    const html = `<!DOCTYPE html>
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
          
          <!-- Header -->
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

          <!-- Content -->
          <div style="padding: 56px 48px;">
            
            <!-- Winner Card -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid #fbbf24; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, #fbbf24, #f59e0b); border-radius: 50%; opacity: 0.06;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);">${position === 1 ? '🥇 Winner' : position === 2 ? '🥈 2nd Place' : position === 3 ? '🥉 3rd Place' : 'Prize Winner'}</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #92400e; letter-spacing: -0.02em;">$${(amount / 100).toFixed(2)} Prize</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: #a16207; font-weight: 700;">from ${challengeName}</p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #92400e 0%, #a16207 100%); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(146, 64, 14, 0.3);">
                  <span style="font-size: 20px;">💰</span>
                  <span>Payout sent!</span>
                </div>
              </div>
            </div>

            <!-- Payout Details -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border: 2px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <h3 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #1e293b; text-align: center;">💸 Payout Details</h3>
              <div style="space-y: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                  <span style="font-weight: 700; color: #64748b; font-size: 16px;">Prize Amount:</span>
                  <span style="font-weight: 900; color: #fbbf24; font-size: 20px;">$${(amount / 100).toFixed(2)}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                  <span style="font-weight: 700; color: #64748b; font-size: 16px;">Challenge:</span>
                  <span style="font-weight: 800; color: #1e293b; font-size: 16px;">${challengeName}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
                  <span style="font-weight: 700; color: #64748b; font-size: 16px;">Finish Position:</span>
                  <span style="font-weight: 800; color: #1e293b; font-size: 16px;">${position === 1 ? '🥇 1st Place' : position === 2 ? '🥈 2nd Place' : position === 3 ? '🥉 3rd Place' : `#${position}`}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <span style="font-weight: 700; color: #64748b; font-size: 16px;">Status:</span>
                  <span style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); color: #065f46; padding: 8px 20px; border-radius: 20px; font-size: 15px; font-weight: 800; border: 1px solid #a7f3d0;">✅ Sent to Bank</span>
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border-left: 6px solid #0ea5e9; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                <span style="font-size: 24px;">⏰</span>
                <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #0c4a6e;">When Will I Receive It?</h3>
              </div>
              <p style="margin: 0; font-size: 18px; color: #0369a1; line-height: 1.6; font-weight: 600;">Your payout typically arrives in 1-3 business days, depending on your bank. You'll receive a notification once it's deposited.</p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(251, 191, 36, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                View Challenge Results →
              </a>
            </div>

          </div>

          <!-- Footer -->
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

    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: '🏆 Congratulations! Your prize payout has been sent',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payout success email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
