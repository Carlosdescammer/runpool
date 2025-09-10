import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize supabase with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST endpoint to manually trigger email campaigns
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaign_type, manual_trigger = false } = body;

    // Verify request is authorized (could add API key check here)
    const authHeader = request.headers.get('authorization');
    if (!manual_trigger && !authHeader?.includes(process.env.CRON_SECRET || 'secret')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let result;

    switch (campaign_type) {
      case 'streak_reminders':
        const { data: streakResult, error: streakError } = await supabase.rpc('check_and_send_streak_reminders');
        if (streakError) throw streakError;
        result = streakResult;
        break;

      case 'daily_motivation':
        const { data: motivationResult, error: motivationError } = await supabase.rpc('check_and_send_daily_motivation');
        if (motivationError) throw motivationError;
        result = motivationResult;
        break;

      case 'comeback_encouragement':
        const { data: comebackResult, error: comebackError } = await supabase.rpc('check_and_send_comeback_emails');
        if (comebackError) throw comebackError;
        result = comebackResult;
        break;

      case 'weekly_achievements':
        const { data: achievementResult, error: achievementError } = await supabase.rpc('check_and_send_weekly_achievements');
        if (achievementError) throw achievementError;
        result = achievementResult;
        break;

      case 'running_tips':
        const { data: tipsResult, error: tipsError } = await supabase.rpc('check_and_send_running_tips');
        if (tipsError) throw tipsError;
        result = tipsResult;
        break;

      case 'all':
      default:
        // Run all automated campaigns
        const { data: allResult, error: allError } = await supabase.rpc('run_automated_email_campaigns');
        if (allError) throw allError;
        result = allResult;
        break;
    }

    return NextResponse.json({
      success: true,
      campaign_type,
      result,
      triggered_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email campaign trigger error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger email campaigns' },
      { status: 500 }
    );
  }
}

// GET endpoint for health check and stats
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    if (action === 'stats') {
      // Get recent campaign statistics
      const { data: campaigns, error } = await supabase
        .from('email_campaigns')
        .select('campaign_type, status, sent_at')
        .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('sent_at', { ascending: false });

      if (error) throw error;

      // Group by campaign type and status
      const stats = campaigns.reduce((acc: any, campaign) => {
        const type = campaign.campaign_type;
        if (!acc[type]) {
          acc[type] = { sent: 0, failed: 0, total: 0 };
        }
        acc[type].total++;
        if (campaign.status === 'sent') {
          acc[type].sent++;
        } else if (campaign.status === 'failed') {
          acc[type].failed++;
        }
        return acc;
      }, {});

      return NextResponse.json({
        stats,
        total_campaigns: campaigns.length,
        period: 'last_7_days'
      });
    }

    return NextResponse.json({
      status: 'healthy',
      available_triggers: [
        'streak_reminders',
        'daily_motivation',
        'comeback_encouragement',
        'weekly_achievements',
        'running_tips',
        'all'
      ]
    });

  } catch (error) {
    console.error('Email campaign stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get campaign stats' },
      { status: 500 }
    );
  }
}