const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

// Supabase配置 (从.env.local文件读取)
const SUPABASE_URL = 'https://ewwewswxjyuxfbwzdirx.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3d2V3c3d4anl1eGZid3pkaXJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ4NzQ5OCwiZXhwIjoyMDcxMDYzNDk4fQ.7-a6FTsg_u8Kxd2nrZXmPlbzhdiQmtBd-744qK3SZ2E'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * 数据迁移脚本：从文件存储迁移到Supabase数据库
 */
async function migrateToSupabase() {
  console.log('🚀 开始数据迁移...')
  
  try {
    // 1. 读取配置文件
    const configDir = path.join(process.cwd(), '.slack-configs')
    const messageDir = path.join(process.cwd(), '.slack-messages')
    
    if (!fs.existsSync(configDir) || !fs.existsSync(messageDir)) {
      console.log('⚠️ 未找到现有数据文件，跳过迁移')
      return
    }
    
    const configFiles = fs.readdirSync(configDir).filter(f => f.endsWith('.json'))
    const messageFiles = fs.readdirSync(messageDir).filter(f => f.endsWith('.json'))
    
    console.log(`📁 找到 ${configFiles.length} 个配置文件和 ${messageFiles.length} 个消息文件`)
    
    let totalMigratedMessages = 0
    let totalMigratedChannels = 0
    let totalMigratedUsers = 0
    
    // 2. 处理每个context的数据
    for (const messageFile of messageFiles) {
      const contextId = messageFile.replace('.json', '')
      const messageFilePath = path.join(messageDir, messageFile)
      
      console.log(`\n📨 处理Context: ${contextId}`)
      
      try {
        // 读取消息文件
        const messageData = JSON.parse(fs.readFileSync(messageFilePath, 'utf8'))
        const { messages = [], users = {}, channels = {} } = messageData
        
        console.log(`  - 消息数量: ${messages.length}`)
        console.log(`  - 用户数量: ${Object.keys(users).length}`)
        console.log(`  - 频道数量: ${Object.keys(channels).length}`)
        
        // 3. 迁移用户数据
        for (const [userId, userData] of Object.entries(users)) {
          try {
            const { error } = await supabase
              .from('slack_users')
              .upsert({
                slack_user_id: userData.id,
                team_id: 'T12345', // 默认team_id，实际应用中需要从配置获取
                username: userData.name || `user_${userData.id}`,
                display_name: userData.name,
                real_name: userData.real_name || userData.name,
                avatar_url: userData.avatar,
                is_bot: false,
                is_admin: false,
                is_active: true
              }, {
                onConflict: 'slack_user_id,team_id'
              })
            
            if (error) {
              console.error(`    ❌ 用户迁移失败 ${userId}:`, error.message)
            } else {
              totalMigratedUsers++
            }
          } catch (err) {
            console.error(`    ❌ 用户迁移异常 ${userId}:`, err.message)
          }
        }
        
        // 4. 迁移频道数据
        for (const [channelId, channelData] of Object.entries(channels)) {
          try {
            const { error } = await supabase
              .from('slack_channels')
              .upsert({
                slack_channel_id: channelData.id,
                team_id: 'T12345', // 默认team_id
                context_id: contextId,
                name: channelData.name,
                is_private: false,
                is_archived: false,
                member_count: channelData.messageCount || 0
              }, {
                onConflict: 'slack_channel_id,team_id'
              })
            
            if (error) {
              console.error(`    ❌ 频道迁移失败 ${channelId}:`, error.message)
            } else {
              totalMigratedChannels++
            }
          } catch (err) {
            console.error(`    ❌ 频道迁移异常 ${channelId}:`, err.message)
          }
        }
        
        // 5. 迁移消息数据
        for (const message of messages) {
          try {
            // 先插入消息
            const { data: messageRecord, error: messageError } = await supabase
              .from('slack_messages')
              .upsert({
                slack_message_id: message.id,
                slack_channel_id: message.channel.id,
                slack_user_id: message.user.id,
                team_id: 'T12345', // 默认team_id
                context_id: contextId,
                text: message.text,
                formatted_text: formatSlackText(message.text),
                slack_timestamp: new Date(message.timestamp).toISOString(),
                thread_ts: message.thread_ts,
                reply_count: message.thread_count || 0,
                message_type: 'message',
                metadata: message.metadata || {}
              }, {
                onConflict: 'slack_message_id,team_id'
              })
              .select()
              .single()
            
            if (messageError) {
              console.error(`    ❌ 消息迁移失败 ${message.id}:`, messageError.message)
              continue
            }
            
            // 迁移反应数据
            if (message.reactions && message.reactions.length > 0) {
              for (const reaction of message.reactions) {
                await supabase
                  .from('slack_reactions')
                  .upsert({
                    message_id: messageRecord.id,
                    reaction_name: reaction.name,
                    count: reaction.count,
                    users: reaction.users || []
                  }, {
                    onConflict: 'message_id,reaction_name'
                  })
              }
            }
            
            totalMigratedMessages++
            
            // 每100条消息显示进度
            if (totalMigratedMessages % 100 === 0) {
              console.log(`    📊 已迁移 ${totalMigratedMessages} 条消息...`)
            }
            
          } catch (err) {
            console.error(`    ❌ 消息迁移异常 ${message.id}:`, err.message)
          }
        }
        
        console.log(`  ✅ Context ${contextId} 迁移完成`)
        
      } catch (err) {
        console.error(`  ❌ 处理Context ${contextId} 失败:`, err.message)
      }
    }
    
    // 6. 迁移完成统计
    console.log('\n🎉 数据迁移完成！')
    console.log('=====================================')
    console.log(`📊 统计信息:`)
    console.log(`  - 迁移消息: ${totalMigratedMessages} 条`)
    console.log(`  - 迁移用户: ${totalMigratedUsers} 个`)
    console.log(`  - 迁移频道: ${totalMigratedChannels} 个`)
    
    // 7. 验证迁移结果
    console.log('\n🔍 验证迁移结果...')
    const { data: messageCount } = await supabase
      .from('slack_messages')
      .select('id', { count: 'exact', head: true })
    
    const { data: userCount } = await supabase
      .from('slack_users')
      .select('id', { count: 'exact', head: true })
    
    const { data: channelCount } = await supabase
      .from('slack_channels')
      .select('id', { count: 'exact', head: true })
    
    console.log(`✅ 数据库验证:`)
    console.log(`  - 消息总数: ${messageCount?.length || 'N/A'}`)
    console.log(`  - 用户总数: ${userCount?.length || 'N/A'}`)  
    console.log(`  - 频道总数: ${channelCount?.length || 'N/A'}`)
    
    console.log('\n💡 下一步:')
    console.log('  1. 更新应用代码以使用Supabase存储')
    console.log('  2. 测试新的存储系统')
    console.log('  3. 备份文件数据后删除文件存储')
    
  } catch (error) {
    console.error('❌ 迁移过程中发生错误:', error)
    process.exit(1)
  }
}

/**
 * 格式化Slack文本
 */
function formatSlackText(text) {
  return text
    .replace(/<@(\w+)>/g, '@$1')
    .replace(/<#(\w+)\|([^>]+)>/g, '#$2')
    .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '[$2]($1)')
    .replace(/<(https?:\/\/[^>]+)>/g, '$1')
    .replace(/```([^`]+)```/g, '\n```\n$1\n```\n')
    .replace(/`([^`]+)`/g, '`$1`')
    .replace(/\*([^*]+)\*/g, '**$1**')
    .replace(/_([^_]+)_/g, '*$1*')
}

// 运行迁移
if (require.main === module) {
  migrateToSupabase().catch(console.error)
}

module.exports = { migrateToSupabase }