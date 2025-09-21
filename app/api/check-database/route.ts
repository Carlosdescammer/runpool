import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(_request: NextRequest) {
  try {
    // Check what tables exist in the database
    const { data, error } = await supabase
      .rpc('check_existing_tables');

    if (error) {
      // If the function doesn't exist, try a simpler approach
      const tables = [];
      
      // Test common tables one by one
      const tablesToCheck = ['profiles', 'users', 'user_profiles', 'auth.users'];
      
      for (const tableName of tablesToCheck) {
        try {
          const { error: testError } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!testError) {
            tables.push(tableName);
          }
        } catch (_err) {
          // Table doesn't exist or we can't access it
        }
      }

      return NextResponse.json({
        available_tables: tables,
        note: 'Found these tables by testing queries'
      });
    }

    return NextResponse.json({
      available_tables: data,
      note: 'Found tables using database function'
    });

  } catch (error) {
    console.error('Database check error:', error);
    return NextResponse.json(
      { error: 'Failed to check database structure' },
      { status: 500 }
    );
  }
}

// Also create a simple function to check the auth system
export async function POST(_request: NextRequest) {
  try {
    // Try to get current user tables
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    return NextResponse.json({
      auth_working: !authError,
      auth_error: authError?.message,
      user_present: !!authData?.user,
      suggestions: [
        'If auth is working but profiles table missing, you may need to create it',
        'Check your Supabase project setup and ensure RLS policies are configured',
        'The email system can work with auth.users table instead of profiles'
      ]
    });

  } catch (error) {
    return NextResponse.json({
      auth_working: false,
      error: error instanceof Error ? error.message : 'Unknown auth error'
    });
  }
}