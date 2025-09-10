import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { email, name, weekId, groupId } = await req.json();

    if (!email || !weekId || !groupId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    // Get group and week details
    const { data: weekData, error: weekError } = await supabase
      .from('weeks')
      .select('*, groups(*)')
      .eq('id', weekId)
      .single();

    if (weekError || !weekData) {
      return NextResponse.json({ error: 'Week not found' }, { status: 404 });
    }

    const groupName = weekData.groups?.name || 'Your Running Group';
    const entryFee = weekData.groups?.entry_fee || 2500; // Default $25 in cents
    const formattedFee = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(entryFee / 100);

    // Send reminder email using Resend
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || 'Runpool <no-reply@runpool.space>';

    if (!apiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    const subject = `⏰ Payment Reminder - ${groupName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Reminder</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Payment Reminder</h1>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi ${name},</p>
          
          <p>You joined <strong>${groupName}</strong> but haven't completed your payment yet.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Payment Details</h3>
            <p style="margin: 5px 0;"><strong>Group:</strong> ${groupName}</p>
            <p style="margin: 5px 0;"><strong>Entry Fee:</strong> ${formattedFee}</p>
            <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">Complete your payment to participate in this week's challenge</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/group/${groupId}" 
               style="background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
              Complete Payment Now
            </a>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              ⚠️ <strong>Reminder:</strong> Payment must be completed before the challenge deadline to participate.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Questions? Reply to this email or contact your group admin.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>Sent by Runpool - Making fitness social and rewarding</p>
        </div>
      </body>
      </html>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Resend API error:', errorText);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    const result = await res.json();

    return NextResponse.json({ 
      success: true, 
      message: 'Payment reminder sent successfully',
      emailId: result.id 
    });

  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}