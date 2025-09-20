import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailTemplate {
  id: string;
  template_key: string;
  template_type: string;
  subject_template: string;
  html_template: string;
  text_template: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
}

// Template variable replacement
function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}

// Send individual email
async function sendEmail(user: User, template: EmailTemplate, variables: Record<string, any>) {
  const templateVars = {
    name: user.full_name || user.email.split('@')[0],
    email: user.email,
    app_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://runpool.app',
    unsubscribe_url: `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?token=${user.id}`,
    ...variables
  };

  const subject = replaceTemplateVariables(template.subject_template, templateVars);
  const htmlContent = replaceTemplateVariables(template.html_template, templateVars);
  const textContent = template.text_template 
    ? replaceTemplateVariables(template.text_template, templateVars)
    : undefined;

  try {
    const { data, error } = await resend.emails.send({
      from: 'RunPool <no-reply@runpool.space>',
      to: [user.email],
      subject: subject,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    // Record campaign in database
    await supabase.from('email_campaigns').insert({
      campaign_type: template.template_type,
      recipient_id: user.id,
      subject: subject,
      template_name: template.template_key,
      personalization_data: templateVars,
      provider_message_id: data?.id,
      email_provider: 'resend',
      status: 'sent'
    });

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email send error:', error);
    
    // Record failed campaign
    await supabase.from('email_campaigns').insert({
      campaign_type: template.template_type,
      recipient_id: user.id,
      subject: subject,
      template_name: template.template_key,
      personalization_data: templateVars,
      email_provider: 'resend',
      status: 'failed',
      error_message: error instanceof Error ? error.message : 'Unknown error'
    });

    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Get users who should receive a specific campaign type
async function getTargetUsers(campaignType: string, additionalFilters: Record<string, any> = {}) {
  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      current_streak,
      best_streak,
      email_preferences!inner(*)
    `)
    .eq('email_preferences.all_emails', true);

  // Add campaign-specific filters
  switch (campaignType) {
    case 'streak_reminder':
      query = query
        .eq('email_preferences.streak_reminders', true)
        .gte('current_streak', additionalFilters.min_streak || 1);
      break;
    
    case 'daily_motivation':
      query = query.eq('email_preferences.daily_motivation', true);
      break;
    
    case 'comeback_encouragement':
      query = query.eq('email_preferences.comeback_encouragement', true);
      break;
    
    case 'achievement_celebration':
      query = query.eq('email_preferences.achievement_celebrations', true);
      break;
    
    case 'running_tips':
      query = query.eq('email_preferences.running_tips', true);
      break;
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching target users:', error);
    return [];
  }

  return data || [];
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      template_key, 
      campaign_type, 
      target_user_ids, 
      template_variables = {},
      filters = {} 
    } = body;

    // Validate required fields
    if (!template_key && !campaign_type) {
      return NextResponse.json(
        { error: 'Either template_key or campaign_type is required' },
        { status: 400 }
      );
    }

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', template_key)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found or inactive' },
        { status: 404 }
      );
    }

    // Get target users
    let targetUsers: User[];
    
    if (target_user_ids && target_user_ids.length > 0) {
      // Send to specific users
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', target_user_ids);
      
      if (error) {
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
      }
      
      targetUsers = data || [];
    } else {
      // Send to filtered audience
      targetUsers = await getTargetUsers(template.template_type, filters);
    }

    if (targetUsers.length === 0) {
      return NextResponse.json(
        { message: 'No users match the criteria for this campaign' },
        { status: 200 }
      );
    }

    // Send emails
    const results = await Promise.allSettled(
      targetUsers.map(user => sendEmail(user, template, template_variables))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      message: `Campaign sent`,
      stats: {
        total_targeted: targetUsers.length,
        successful_sends: successful,
        failed_sends: failed
      },
      template_used: template.template_key
    });

  } catch (error) {
    console.error('Email campaign error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to preview template or get campaign stats
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const templateKey = searchParams.get('template_key');

  try {
    if (action === 'preview' && templateKey) {
      // Get template for preview
      const { data: template, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .single();

      if (error || !template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      // Generate preview with sample data
      const sampleData = {
        name: 'Alex Runner',
        email: 'alex@example.com',
        streak_length: 7,
        total_miles: 25.5,
        days_active: 5,
        group_name: 'Morning Runners',
        app_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://runpool.app',
        group_id: 'sample-group-id'
      };

      const previewSubject = replaceTemplateVariables(template.subject_template, sampleData);
      const previewHtml = replaceTemplateVariables(template.html_template, sampleData);

      return NextResponse.json({
        template_key: template.template_key,
        template_type: template.template_type,
        preview_subject: previewSubject,
        preview_html: previewHtml,
        sample_data: sampleData
      });
    }

    if (action === 'stats') {
      // Get campaign statistics
      const { data: stats, error } = await supabase
        .from('email_campaigns')
        .select('campaign_type, status, sent_at')
        .gte('sent_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 });
      }

      return NextResponse.json({ campaigns: stats });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('GET email campaign error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}