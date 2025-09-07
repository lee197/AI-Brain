import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    
    console.log('🚀 Starting OAuth tokens table migration...')
    
    // Create the oauth_tokens table directly using SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        context_id UUID REFERENCES contexts(id) ON DELETE CASCADE,
        provider VARCHAR(50) NOT NULL,
        refresh_token TEXT NOT NULL,
        access_token TEXT,
        token_expiry TIMESTAMPTZ,
        scopes TEXT[],
        error_count INTEGER DEFAULT 0,
        last_error TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        
        UNIQUE(user_id, context_id, provider)
      );
    `
    
    const { data: createResult, error: createError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .limit(1)
      
    if (createError && createError.code === 'PGRST116') {
      // Table doesn't exist, create it using a different approach
      console.log('📝 Creating oauth_tokens table...')
      
      // Try using the SQL editor approach
      const { error: sqlError } = await supabase.rpc('create_oauth_tokens_table')
      
      if (sqlError) {
        console.log('⚠️ RPC approach failed, trying direct table creation...')
        
        // Since direct SQL execution isn't available via REST API,
        // let's create a minimal version that works with existing infrastructure
        return NextResponse.json({
          success: false,
          message: 'Migration requires manual database access',
          instructions: {
            step1: 'Connect to Supabase Dashboard',
            step2: 'Go to SQL Editor',
            step3: 'Run the migration SQL provided below',
            sql: createTableSQL.trim()
          }
        })
      }
    } else if (!createError) {
      console.log('✅ oauth_tokens table already exists')
    }
    
    // Verify the table structure
    const { data: verifyData, error: verifyError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .limit(1)
      
    if (verifyError) {
      console.error('❌ Table verification failed:', verifyError)
      return NextResponse.json({
        success: false,
        error: 'Table verification failed',
        details: verifyError.message
      })
    }
    
    console.log('✅ Migration completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'OAuth tokens table migration completed',
      tableExists: true,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}