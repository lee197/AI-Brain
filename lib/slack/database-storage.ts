import { createServiceClient } from '@/lib/supabase/server'
import { SlackMessage } from './message-storage'

/**
 * 纯数据库存储系统 - 替换混合存储，只使用Supabase数据库
 */

export interface DatabaseSlackMessage extends SlackMessage {
  team_id?: string
}

/**
 * 存储Slack消息到数据库
 */
export async function storeSlackMessage(
  contextId: string, 
  message: DatabaseSlackMessage
): Promise<boolean> {
  try {
    const supabase = createServiceClient()
    
    console.log(`💾 Storing message ${message.id} to database...`)
    
    // 1. 确保用户存在
    await upsertSlackUser(supabase, {
      user_id: message.user.id,
      real_name: message.user.real_name || message.user.name,
      display_name: message.user.name,
      avatar_url: message.user.avatar
    })
    
    // 2. 确保频道存在
    await upsertSlackChannel(supabase, {
      channel_id: message.channel.id,
      context_id: contextId,
      channel_name: message.channel.name
    })
    
    // 3. 存储消息
    const { data: messageRecord, error: messageError } = await supabase
      .from('slack_messages')
      .upsert({
        message_id: message.id,
        channel_id: message.channel.id,
        channel_name: message.channel.name,
        user_id: message.user.id,
        user_name: message.user.name,
        user_avatar: message.user.avatar,
        context_id: contextId,
        text: message.text,
        timestamp: message.timestamp.toISOString(),
        thread_ts: message.thread_ts,
        reply_count: message.thread_count || 0,
        metadata: message.metadata || {}
      }, {
        onConflict: 'message_id'
      })
      .select()
      .single()
    
    if (messageError) {
      console.error(`❌ Failed to store message ${message.id}:`, messageError.message)
      return false
    }
    
    console.log(`✅ Message ${message.id} stored in database`)
    return true
    
  } catch (error) {
    console.error(`❌ Database storage error for message ${message.id}:`, error)
    return false
  }
}

/**
 * 从数据库读取Slack消息
 */
export async function loadSlackMessages(
  contextId: string,
  options: {
    limit?: number
    offset?: number
    channel?: string
    startDate?: Date
    endDate?: Date
  } = {}
): Promise<{
  messages: SlackMessage[]
  totalCount: number
}> {
  try {
    const supabase = createServiceClient()
    
    let query = supabase
      .from('slack_messages')
      .select('*', { count: 'exact' })
      .eq('context_id', contextId)
      .order('timestamp', { ascending: false })
    
    // 条件过滤
    if (options.channel) {
      query = query.eq('channel_id', options.channel)
    }
    
    if (options.startDate) {
      query = query.gte('timestamp', options.startDate.toISOString())
    }
    
    if (options.endDate) {
      query = query.lte('timestamp', options.endDate.toISOString())
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Database query error:', error)
      return { messages: [], totalCount: 0 }
    }
    
    // 转换为标准格式
    const messages: SlackMessage[] = (data || []).map((item: any) => ({
      id: item.message_id,
      channel: {
        id: item.channel_id,
        name: item.channel_name
      },
      user: {
        id: item.user_id,
        name: item.user_name,
        avatar: item.user_avatar || '',
        real_name: item.user_name
      },
      text: item.text,
      timestamp: new Date(item.timestamp),
      reactions: [], // 当前schema不支持
      thread_count: item.reply_count || 0,
      thread_ts: item.thread_ts,
      metadata: item.metadata || {}
    }))
    
    console.log(`📊 Loaded ${messages.length} messages from database`)
    return {
      messages,
      totalCount: count || messages.length
    }
    
  } catch (error) {
    console.error('Failed to load messages from database:', error)
    return { messages: [], totalCount: 0 }
  }
}

/**
 * 获取Slack消息统计
 */
export async function getSlackStats(contextId: string): Promise<{
  totalMessages: number
  channelCount: number
  userCount: number
  dateRange: {
    earliest: Date | null
    latest: Date | null
  }
  channelStats: Array<{
    name: string
    messageCount: number
    latestMessage: Date | null
  }>
}> {
  try {
    const supabase = createServiceClient()
    
    const { data: messages, error } = await supabase
      .from('slack_messages')
      .select('id, timestamp, channel_id, channel_name, user_id')
      .eq('context_id', contextId)
    
    if (error || !messages) {
      return {
        totalMessages: 0,
        channelCount: 0,
        userCount: 0,
        dateRange: { earliest: null, latest: null },
        channelStats: []
      }
    }
    
    const channelStats = new Map<string, { name: string, count: number, latest: Date }>()
    const users = new Set<string>()
    
    let earliest: Date | null = null
    let latest: Date | null = null
    
    for (const msg of messages) {
      const timestamp = new Date(msg.timestamp)
      
      if (!earliest || timestamp < earliest) earliest = timestamp
      if (!latest || timestamp > latest) latest = timestamp
      
      users.add(msg.user_id)
      
      const channelName = msg.channel_name
      const existing = channelStats.get(msg.channel_id) || { name: channelName, count: 0, latest: timestamp }
      
      existing.count++
      if (timestamp > existing.latest) existing.latest = timestamp
      
      channelStats.set(msg.channel_id, existing)
    }
    
    return {
      totalMessages: messages.length,
      channelCount: channelStats.size,
      userCount: users.size,
      dateRange: { earliest, latest },
      channelStats: Array.from(channelStats.values()).map(stat => ({
        name: stat.name,
        messageCount: stat.count,
        latestMessage: stat.latest
      }))
    }
    
  } catch (error) {
    console.error('Failed to get stats from database:', error)
    return {
      totalMessages: 0,
      channelCount: 0,
      userCount: 0,
      dateRange: { earliest: null, latest: null },
      channelStats: []
    }
  }
}

/**
 * 批量导入消息到数据库
 */
export async function importMessagesToDatabase(
  contextId: string,
  messages: DatabaseSlackMessage[]
): Promise<{ success: number, failed: number }> {
  console.log(`📥 Importing ${messages.length} messages to database...`)
  
  let success = 0
  let failed = 0
  
  for (const message of messages) {
    const result = await storeSlackMessage(contextId, message)
    if (result) {
      success++
    } else {
      failed++
    }
    
    // 显示进度
    if ((success + failed) % 10 === 0) {
      console.log(`📊 Progress: ${success + failed}/${messages.length} (${success} success, ${failed} failed)`)
    }
  }
  
  console.log(`✅ Import completed: ${success} success, ${failed} failed`)
  return { success, failed }
}

// 辅助函数
async function upsertSlackUser(supabase: any, user: {
  user_id: string
  real_name?: string
  display_name?: string
  avatar_url?: string
}) {
  await supabase
    .from('slack_users')
    .upsert({
      user_id: user.user_id,
      real_name: user.real_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      is_bot: false
    }, {
      onConflict: 'user_id'
    })
}

async function upsertSlackChannel(supabase: any, channel: {
  channel_id: string
  context_id: string
  channel_name: string
}) {
  await supabase
    .from('slack_channels')
    .upsert({
      channel_id: channel.channel_id,
      context_id: channel.context_id,
      channel_name: channel.channel_name,
      is_private: false,
      is_archived: false
    }, {
      onConflict: 'channel_id'
    })
}