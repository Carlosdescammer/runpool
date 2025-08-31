import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, amount, weekId, challengeName, failureReason } = await req.json();

    const html = `<!DOCTYPE html>
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
          
          <!-- Header -->
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

          <!-- Content -->
          <div style="padding: 56px 48px;">
            
            <!-- Error Card -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 24px; padding: 40px; margin-bottom: 40px; border: 2px solid #fca5a5; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="position: absolute; top: -40%; right: -20%; width: 240px; height: 240px; background: linear-gradient(45deg, #ef4444, #dc2626); border-radius: 50%; opacity: 0.06;"></div>
              <div style="position: relative; z-index: 1; text-align: center;">
                <div style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 10px 24px; border-radius: 50px; font-size: 15px; font-weight: 800; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">Payment Issue</div>
                <h2 style="margin: 0 0 12px 0; font-size: 32px; font-weight: 900; color: #991b1b; letter-spacing: -0.02em;">$${(amount / 100).toFixed(2)} Payment Failed</h2>
                <p style="margin: 0 0 28px 0; font-size: 22px; color: #b91c1c; font-weight: 700;">for ${challengeName}</p>
                <div style="display: inline-flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%); color: white; padding: 16px 32px; border-radius: 50px; font-weight: 800; font-size: 16px; box-shadow: 0 6px 20px rgba(153, 27, 27, 0.3);">
                  <span style="font-size: 20px;">⚠️</span>
                  <span>${failureReason || 'Payment declined'}</span>
                </div>
              </div>
            </div>

            <!-- Troubleshooting -->
            <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border: 2px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <h3 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 800; color: #1e293b; text-align: center;">🔧 Quick Fixes</h3>
              <ul style="margin: 0; padding-left: 0; list-style: none; color: #64748b; line-height: 1.7;">
                <li style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <span style="font-size: 20px;">💳</span>
                  <span style="font-weight: 600; font-size: 16px;">Check your card details and expiration date</span>
                </li>
                <li style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <span style="font-size: 20px;">💰</span>
                  <span style="font-weight: 600; font-size: 16px;">Ensure sufficient funds are available</span>
                </li>
                <li style="margin-bottom: 16px; display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <span style="font-size: 20px;">🔄</span>
                  <span style="font-weight: 600; font-size: 16px;">Try a different payment method</span>
                </li>
                <li style="display: flex; align-items: center; gap: 12px; padding: 16px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <span style="font-size: 20px;">📞</span>
                  <span style="font-weight: 600; font-size: 16px;">Contact your bank if the issue persists</span>
                </li>
              </ul>
            </div>

            <!-- Support -->
            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 20px; padding: 32px; margin-bottom: 40px; border-left: 6px solid #f59e0b; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                <span style="font-size: 24px;">💬</span>
                <h3 style="margin: 0; font-size: 22px; font-weight: 800; color: #92400e;">Need Help?</h3>
              </div>
              <p style="margin: 0; font-size: 18px; color: #a16207; line-height: 1.6; font-weight: 600;">Our support team is here to help. Contact us if you continue experiencing payment issues.</p>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 40px;">
              <a href="#" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; padding: 20px 40px; border-radius: 16px; font-weight: 800; font-size: 18px; box-shadow: 0 12px 28px rgba(239, 68, 68, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                Try Payment Again →
              </a>
            </div>

          </div>

          <!-- Footer -->
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

    await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: email,
      subject: '❌ Payment Failed - Let\'s get you back in the challenge',
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment failure email error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
