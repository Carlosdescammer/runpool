import { NextRequest, NextResponse } from 'next/server';

// Vercel cron job endpoint for automated email campaigns
export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Trigger all automated email campaigns
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/email-campaigns/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      },
      body: JSON.stringify({
        campaign_type: 'all',
        triggered_by: 'cron'
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to trigger email campaigns');
    }

    return NextResponse.json({
      success: true,
      message: 'Email campaigns triggered successfully',
      result,
      triggered_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron email campaign error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      triggered_at: new Date().toISOString()
    }, { status: 500 });
  }
}