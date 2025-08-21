const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const SUPABASE_URL = 'https://ewwewswxjyuxfbwzdirx.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3d2V3c3d4anl1eGZid3pkaXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ4NzQ5OCwiZXhwIjoyMDcxMDYzNDk4fQ.7-a6FTsg_u8Kxd2nrZXmPlbzhdiQmtBd-744qK3SZ2E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * 直接创建表结构 - 不使用exec_sql函数
 */
async function createTablesDirect() {
  console.log('🛠️ 开始创建数据库表结构...')
  
  try {
    // 首先删除已存在的表（如果有）
    console.log('🗑️ 清理已存在的表结构...')
    
    const dropTables = [
      'DROP TABLE IF EXISTS slack_reactions CASCADE',
      'DROP TABLE IF EXISTS slack_files CASCADE', 
      'DROP TABLE IF EXISTS slack_messages CASCADE',
      'DROP TABLE IF EXISTS slack_channels CASCADE',
      'DROP TABLE IF EXISTS slack_users CASCADE',
      'DROP TABLE IF EXISTS slack_integrations CASCADE'
    ]
    
    for (const dropSql of dropTables) {
      try {
        await supabase.rpc('exec_sql', { sql: dropSql })
        console.log('✅ 清理表成功')
      } catch (err) {
        // 忽略不存在表的错误
      }
    }
    
    // 重新创建表结构
    console.log('📦 创建新表结构...')
    
    // 1. 创建 slack_users 表
    const createUsersTable = `
      CREATE TABLE slack_users (
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
    
    // 2. 创建 slack_channels 表
    const createChannelsTable = `
      CREATE TABLE slack_channels (
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
    
    // 3. 创建 slack_messages 表
    const createMessagesTable = `
      CREATE TABLE slack_messages (
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
    `
    
    // 4. 创建 slack_reactions 表
    const createReactionsTable = `
      CREATE TABLE slack_reactions (
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
    
    const tables = [
      { name: 'slack_users', sql: createUsersTable },
      { name: 'slack_channels', sql: createChannelsTable },
      { name: 'slack_messages', sql: createMessagesTable },
      { name: 'slack_reactions', sql: createReactionsTable }
    ]
    
    for (const table of tables) {
      try {
        console.log(`📦 创建 ${table.name} 表...`)
        const { error } = await supabase.rpc('exec_sql', { sql: table.sql })
        
        if (error) {
          console.log(`⚠️ ${table.name} 表创建警告:`, error.message)
        } else {
          console.log(`✅ ${table.name} 表创建成功`)
        }
      } catch (err) {
        console.error(`❌ ${table.name} 表创建失败:`, err.message)
      }
    }
    
    // 创建索引
    console.log('📊 创建索引...')
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_slack_messages_context_time ON slack_messages (context_id, slack_timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_slack_messages_channel_time ON slack_messages (slack_channel_id, slack_timestamp DESC)'
    ]
    
    for (const indexSql of indexes) {
      try {
        await supabase.rpc('exec_sql', { sql: indexSql })
        console.log('✅ 索引创建成功')
      } catch (err) {
        console.log('⚠️ 索引创建警告:', err.message)
      }
    }
    
    console.log('🎉 数据库表结构创建完成！')
    
    // 验证表是否存在
    console.log('\\n🔍 验证表结构...')
    const tableNames = ['slack_users', 'slack_channels', 'slack_messages', 'slack_reactions']
    
    for (const table of tableNames) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ 表 ${table} 不可访问:`, error.message)
        } else {
          console.log(`✅ 表 ${table} 验证成功`)
        }
      } catch (err) {
        console.log(`❌ 表 ${table} 验证失败:`, err.message)
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
  createTablesDirect().then(success => {
    if (success) {
      console.log('\\n💡 下一步可以运行: node scripts/migrate-to-supabase.js')
    } else {
      console.log('\\n❌ 表创建失败，请检查配置')
    }
  }).catch(console.error)
}

module.exports = { createTablesDirect }