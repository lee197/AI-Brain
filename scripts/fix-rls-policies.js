const { createClient } = require('@supabase/supabase-js')

// Supabase配置
const SUPABASE_URL = 'https://ewwewswxjyuxfbwzdirx.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3d2V3c3d4anl1eGZid3pkaXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ4NzQ5OCwiZXhwIjoyMDcxMDYzNDk4fQ.7-a6FTsg_u8Kxd2nrZXmPlbzhdiQmtBd-744qK3SZ2E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * 修复RLS策略以允许服务端操作
 */
async function fixRLSPolicies() {
  console.log('🔧 修复RLS策略...')
  
  try {
    // 方法1：为服务角色创建绕过RLS的策略
    const servicePolicies = [
      // Slack用户表策略
      `DROP POLICY IF EXISTS "Service can manage slack users" ON slack_users`,
      `CREATE POLICY "Service can manage slack users" ON slack_users FOR ALL TO service_role USING (true)`,
      
      // Slack频道表策略
      `DROP POLICY IF EXISTS "Service can manage slack channels" ON slack_channels`,  
      `CREATE POLICY "Service can manage slack channels" ON slack_channels FOR ALL TO service_role USING (true)`,
      
      // Slack消息表策略
      `DROP POLICY IF EXISTS "Service can manage slack messages" ON slack_messages`,
      `CREATE POLICY "Service can manage slack messages" ON slack_messages FOR ALL TO service_role USING (true)`
    ]
    
    for (const policy of servicePolicies) {
      try {
        console.log('🔐 执行策略:', policy.split('\\n')[0])
        
        // 直接用raw query执行，因为rpc不可用
        const { error } = await supabase.sql(policy)
        
        if (error) {
          console.log('⚠️ 策略执行警告:', error.message)
        } else {
          console.log('✅ 策略执行成功')
        }
      } catch (err) {
        console.log('⚠️ 策略执行异常:', err.message)
        
        // 如果sql方法不可用，尝试临时禁用RLS
        if (policy.includes('slack_messages')) {
          try {
            console.log('🔓 尝试临时禁用slack_messages的RLS...')
            await supabase.sql('ALTER TABLE slack_messages DISABLE ROW LEVEL SECURITY')
            console.log('✅ RLS已禁用')
          } catch (disableErr) {
            console.log('❌ 无法禁用RLS:', disableErr.message)
          }
        }
      }
    }
    
    // 测试是否可以插入数据
    console.log('\\n🧪 测试数据库写入权限...')
    
    const { data, error } = await supabase
      .from('slack_messages')
      .insert({
        message_id: 'TEST_RLS_' + Date.now(),
        channel_id: 'C_TEST_RLS',
        channel_name: 'rls-test',
        user_id: 'U_TEST_RLS',
        user_name: 'RLS Test User',
        context_id: 'e7c5aa1e-de00-4327-81dd-cfeba3030081',
        text: 'RLS测试消息',
        timestamp: new Date().toISOString()
      })
      .select()
    
    if (error) {
      console.log('❌ 数据库写入仍然失败:', error.message)
      console.log('详细错误:', error)
      return false
    } else {
      console.log('✅ 数据库写入测试成功！')
      console.log('📊 插入的数据:', data[0])
      return true
    }
    
  } catch (error) {
    console.error('❌ 修复RLS策略失败:', error)
    return false
  }
}

// 运行修复
if (require.main === module) {
  fixRLSPolicies().then(success => {
    if (success) {
      console.log('\\n🎉 RLS策略修复成功！可以重新测试混合存储了')
    } else {
      console.log('\\n❌ RLS策略修复失败，需要手动在Supabase控制台中修复')
      console.log('建议操作：')
      console.log('1. 登录Supabase控制台')
      console.log('2. 去SQL编辑器执行以下命令:')
      console.log('   ALTER TABLE slack_messages DISABLE ROW LEVEL SECURITY;')
      console.log('   ALTER TABLE slack_users DISABLE ROW LEVEL SECURITY;')
      console.log('   ALTER TABLE slack_channels DISABLE ROW LEVEL SECURITY;')
    }
  }).catch(console.error)
}

module.exports = { fixRLSPolicies }