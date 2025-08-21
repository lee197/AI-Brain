const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const SUPABASE_URL = 'https://ewwewswxjyuxfbwzdirx.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3d2V3c3d4anl1eGZid3pkaXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ4NzQ5OCwiZXhwIjoyMDcxMDYzNDk4fQ.7-a6FTsg_u8Kxd2nrZXmPlbzhdiQmtBd-744qK3SZ2E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * 创建Supabase数据库表结构
 */
async function createSupabaseTables() {
  console.log('🛠️ 开始创建Supabase数据库表结构...')
  
  try {
    // 1. 创建 slack_users 表
    console.log('📦 创建 slack_users 表...')
    const { error: usersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS slack_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slack_user_id TEXT NOT NULL,
          team_id TEXT NOT NULL,
          username TEXT NOT NULL,
          display_name TEXT,
          real_name TEXT,
          email TEXT,
          avatar_url TEXT,
          is_bot BOOLEAN DEFAULT FALSE,
          is_admin BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(slack_user_id, team_id)
        );
      `
    })
    
    if (usersError) {
      console.log('⚠️ slack_users 表可能已存在:', usersError.message)
    } else {
      console.log('✅ slack_users 表创建成功')
    }
    
    // 2. 创建 slack_channels 表
    console.log('📦 创建 slack_channels 表...')
    const { error: channelsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS slack_channels (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slack_channel_id TEXT NOT NULL,
          team_id TEXT NOT NULL,
          context_id TEXT NOT NULL,
          name TEXT NOT NULL,
          topic TEXT,
          purpose TEXT,
          is_private BOOLEAN DEFAULT FALSE,
          is_archived BOOLEAN DEFAULT FALSE,
          member_count INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(slack_channel_id, team_id)
        );
      `
    })
    
    if (channelsError) {
      console.log('⚠️ slack_channels 表可能已存在:', channelsError.message)
    } else {
      console.log('✅ slack_channels 表创建成功')
    }
    
    // 3. 创建 slack_messages 表
    console.log('📦 创建 slack_messages 表...')
    const { error: messagesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS slack_messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slack_message_id TEXT NOT NULL,
          slack_channel_id TEXT NOT NULL,
          slack_user_id TEXT NOT NULL,
          team_id TEXT NOT NULL,
          context_id TEXT NOT NULL,
          text TEXT NOT NULL,
          formatted_text TEXT,
          slack_timestamp TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          thread_ts TEXT,
          reply_count INTEGER DEFAULT 0,
          message_type TEXT DEFAULT 'message',
          subtype TEXT,
          metadata JSONB DEFAULT '{}',
          UNIQUE(slack_message_id, team_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_slack_messages_context_time ON slack_messages (context_id, slack_timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_slack_messages_channel_time ON slack_messages (slack_channel_id, slack_timestamp DESC);
      `
    })
    
    if (messagesError) {
      console.log('⚠️ slack_messages 表可能已存在:', messagesError.message)
    } else {
      console.log('✅ slack_messages 表创建成功')
    }
    
    // 4. 创建 slack_reactions 表
    console.log('📦 创建 slack_reactions 表...')
    const { error: reactionsError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS slack_reactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          message_id UUID NOT NULL,
          reaction_name TEXT NOT NULL,
          count INTEGER DEFAULT 1,
          users JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(message_id, reaction_name)
        );
      `
    })
    
    if (reactionsError) {
      console.log('⚠️ slack_reactions 表可能已存在:', reactionsError.message)
    } else {
      console.log('✅ slack_reactions 表创建成功')
    }
    
    console.log('🎉 数据库表结构创建完成！')
    
    // 验证表是否存在
    console.log('\n🔍 验证表结构...')
    const tables = ['slack_users', 'slack_channels', 'slack_messages', 'slack_reactions']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ 表 ${table} 不可访问:`, error.message)
      } else {
        console.log(`✅ 表 ${table} 验证成功`)
      }
    }
    
    return true
    
  } catch (error) {
    console.error('❌ 创建数据库表时发生错误:', error)
    return false
  }
}

// 运行表创建
if (require.main === module) {
  createSupabaseTables().then(success => {
    if (success) {
      console.log('\n💡 下一步可以运行: node scripts/migrate-to-supabase.js')
    } else {
      console.log('\n❌ 表创建失败，请检查配置')
    }
  }).catch(console.error)
}

module.exports = { createSupabaseTables }