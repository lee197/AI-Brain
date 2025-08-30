/**
 * 创建测试数据 - 模拟真实的团队Slack对话
 * 包含各种情感、任务、会议场景用于测试深度分析
 */

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://ewwewswxjyuxfbwzdirx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3d2V3c3d4anl1eGZid3pkaXJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NDMwNjEsImV4cCI6MjA3MjAxOTA2MX0.L-jWavUt-VLpITdcE7c0RJFIgpSjNjhPF2MZnKfywgI'

const supabase = createClient(supabaseUrl, supabaseKey)

// 测试用户数据
const testUsers = [
  { id: 'U001', name: '张三', real_name: '张三 (产品经理)' },
  { id: 'U002', name: '李四', real_name: '李四 (开发)' },
  { id: 'U003', name: '王五', real_name: '王五 (设计师)' },
  { id: 'U004', name: '赵六', real_name: '赵六 (测试)' },
  { id: 'U005', name: 'Qi Lee', real_name: 'Qi Lee (Tech Lead)' }
]

// 测试频道数据
const testChannels = [
  { id: 'C001', name: 'ai-brain', type: 'channel' },
  { id: 'C002', name: 'dev-team', type: 'channel' },
  { id: 'C003', name: 'urgent', type: 'channel' }
]

// 丰富的测试消息数据 (包含各种分析场景)
const testMessages = [
  // === 积极情感 + 任务完成 ===
  {
    message_id: 'test_msg_001',
    text: '太棒了！AI Brain的用户注册功能终于搞定了，测试都通过了 🎉',
    user_id: 'U002',
    channel_id: 'C001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2小时前
  },
  {
    message_id: 'test_msg_002', 
    text: '@王五 设计稿看起来很不错，用户体验很好！',
    user_id: 'U001',
    channel_id: 'C001',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  },
  
  // === 任务分配和截止时间 ===
  {
    message_id: 'test_msg_003',
    text: '@李四 需要你明天完成数据库优化，这个比较紧急',
    user_id: 'U005',
    channel_id: 'C002',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    message_id: 'test_msg_004',
    text: '记得本周要完成API文档整理，@赵六 负责测试用例编写',
    user_id: 'U001',
    channel_id: 'C002', 
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  
  // === 压力和紧急情况 ===
  {
    message_id: 'test_msg_005',
    text: '又要加班了 😞 客户那边催得很紧，说一定要这周上线',
    user_id: 'U002',
    channel_id: 'C003',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    message_id: 'test_msg_006',
    text: '紧急！生产环境有bug，用户无法登录，马上需要修复',
    user_id: 'U005',
    channel_id: 'C003',
    timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString()
  },
  
  // === 会议和决策 ===
  {
    message_id: 'test_msg_007',
    text: '我们开个会讨论一下API设计方案吧，今天下午3点？',
    user_id: 'U001',
    channel_id: 'C002',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    message_id: 'test_msg_008',
    text: '可以的，3点会议室见',
    user_id: 'U002',
    channel_id: 'C002',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString()
  },
  {
    message_id: 'test_msg_009',
    text: '会议总结：决定采用RESTful API设计，@李四负责实现，下周五前完成',
    user_id: 'U001',
    channel_id: 'C002',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
  },
  
  // === 问题和困难 ===
  {
    message_id: 'test_msg_010',
    text: '遇到个棘手的问题，第三方API一直返回错误，有点头疼',
    user_id: 'U002',
    channel_id: 'C002',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    message_id: 'test_msg_011',
    text: '我来帮你看看，可能是认证token的问题',
    user_id: 'U005', 
    channel_id: 'C002',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString()
  },
  {
    message_id: 'test_msg_012',
    text: '搞定了！原来是API版本号写错了，谢谢 Tech Lead！',
    user_id: 'U002',
    channel_id: 'C002', 
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString()
  },
  
  // === 日常协作 ===
  {
    message_id: 'test_msg_013',
    text: '今天的进度同步：用户界面完成80%，还需要优化移动端适配',
    user_id: 'U003',
    channel_id: 'C001',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 昨天
  },
  {
    message_id: 'test_msg_014',
    text: '移动端我来处理，明天能搞定',
    user_id: 'U003',
    channel_id: 'C001',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString()
  },
  
  // === 更多压力指标 ===
  {
    message_id: 'test_msg_015',
    text: '这个功能复杂度超出预期了，可能来不及按时完成',
    user_id: 'U004',
    channel_id: 'C002',
    timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString()
  }
]

async function createTestData() {
  console.log('🧪 Creating test data for deep analysis...')
  
  const contextId = 'e7c5aa1e-de00-4327-81dd-cfeba3030081'
  
  try {
    // 1. 创建测试用户
    console.log('👥 Creating test users...')
    for (const user of testUsers) {
      const { error } = await supabase
        .from('slack_users')
        .upsert({
          id: crypto.randomUUID(),
          slack_user_id: user.id,
          real_name: user.real_name,
          display_name: user.name,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`
        })
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`Failed to create user ${user.name}:`, error)
      }
    }
    
    // 2. 创建测试频道
    console.log('📺 Creating test channels...')
    for (const channel of testChannels) {
      const { error } = await supabase
        .from('slack_channels')
        .upsert({
          id: crypto.randomUUID(),
          slack_channel_id: channel.id,
          name: channel.name,
          type: channel.type,
          context_id: contextId
        })
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`Failed to create channel ${channel.name}:`, error)
      }
    }
    
    // 3. 创建测试消息
    console.log('💬 Creating test messages...')
    for (const msg of testMessages) {
      const { error } = await supabase
        .from('slack_messages')
        .upsert({
          id: crypto.randomUUID(),
          message_id: msg.message_id,
          channel_id: msg.channel_id,
          user_id: msg.user_id,
          context_id: contextId,
          text: msg.text,
          timestamp: msg.timestamp,
          metadata: {}
        })
      
      if (error && !error.message.includes('duplicate')) {
        console.error(`Failed to create message ${msg.message_id}:`, error)
      }
    }
    
    console.log('✅ Test data created successfully!')
    console.log(`📊 Created ${testMessages.length} messages for analysis`)
    
    // 4. 验证数据
    const { data: messageCount } = await supabase
      .from('slack_messages')
      .select('*', { count: 'exact' })
      .eq('context_id', contextId)
    
    console.log(`✨ Total messages in database: ${messageCount?.length || 0}`)
    
  } catch (error) {
    console.error('❌ Failed to create test data:', error)
  }
}

// 运行测试数据创建
createTestData()