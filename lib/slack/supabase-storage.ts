import { createClient } from '@/lib/supabase/server'
import { SlackMessage } from './message-storage'

/**
 * Supabase Slack消息存储服务
 * 替换文件存储系统，提供更好的性能和查询能力
 */

export interface SlackUser {
  id: string
  slack_user_id: string
  team_id: string
  username: string
  display_name?: string
  real_name?: string
  email?: string
  avatar_url?: string
  is_bot: boolean
  is_admin: boolean
  is_active: boolean
}

export interface SlackChannel {
  id: string
  slack_channel_id: string
  team_id: string
  context_id: string
  name: string
  topic?: string
  purpose?: string
  is_private: boolean
  is_archived: boolean
  member_count: number
}

export interface SlackMessageRecord {
  id: string
  slack_message_id: string
  slack_channel_id: string
  slack_user_id: string
  team_id: string
  context_id: string
  text: string
  formatted_text?: string
  slack_timestamp: string
  thread_ts?: string
  reply_count: number
  message_type: string
  subtype?: string
  metadata: Record<string, any>
  created_at: string
}

export interface SlackReaction {
  id: string
  message_id: string
  reaction_name: string
  count: number
  users: string[]
}

/**
 * 创建或更新Slack用户
 */
export async function upsertSlackUser(user: {
  slack_user_id: string
  team_id: string
  username: string
  display_name?: string
  real_name?: string
  email?: string
  avatar_url?: string
  is_bot?: boolean
  is_admin?: boolean
}): Promise<SlackUser | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('slack_users')
    .upsert({
      slack_user_id: user.slack_user_id,
      team_id: user.team_id,
      username: user.username,
      display_name: user.display_name,
      real_name: user.real_name,
      email: user.email,
      avatar_url: user.avatar_url,
      is_bot: user.is_bot || false,
      is_admin: user.is_admin || false,
      is_active: true
    }, {
      onConflict: 'slack_user_id,team_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting Slack user:', error)
    return null
  }

  return data as SlackUser
}

/**
 * 创建或更新Slack频道
 */
export async function upsertSlackChannel(channel: {
  slack_channel_id: string
  team_id: string
  context_id: string
  name: string
  topic?: string
  purpose?: string
  is_private?: boolean
  is_archived?: boolean
  member_count?: number
}): Promise<SlackChannel | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('slack_channels')
    .upsert({
      slack_channel_id: channel.slack_channel_id,
      team_id: channel.team_id,
      context_id: channel.context_id,
      name: channel.name,
      topic: channel.topic,
      purpose: channel.purpose,
      is_private: channel.is_private || false,
      is_archived: channel.is_archived || false,
      member_count: channel.member_count || 0
    }, {
      onConflict: 'slack_channel_id,team_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting Slack channel:', error)
    return null
  }

  return data as SlackChannel
}

/**
 * 存储Slack消息
 */
export async function storeSlackMessage(message: {
  slack_message_id: string
  slack_channel_id: string
  slack_user_id: string
  team_id: string
  context_id: string
  text: string
  slack_timestamp: Date
  thread_ts?: string
  reply_count?: number
  message_type?: string
  subtype?: string
  metadata?: Record<string, any>
}): Promise<SlackMessageRecord | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('slack_messages')
    .upsert({
      slack_message_id: message.slack_message_id,
      slack_channel_id: message.slack_channel_id,
      slack_user_id: message.slack_user_id,
      team_id: message.team_id,
      context_id: message.context_id,
      text: message.text,
      formatted_text: formatSlackText(message.text),
      slack_timestamp: message.slack_timestamp.toISOString(),
      thread_ts: message.thread_ts,
      reply_count: message.reply_count || 0,
      message_type: message.message_type || 'message',
      subtype: message.subtype,
      metadata: message.metadata || {}
    }, {
      onConflict: 'slack_message_id,team_id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error storing Slack message:', error)
    return null
  }

  return data as SlackMessageRecord
}

/**
 * 存储或更新消息反应
 */
export async function upsertSlackReactions(messageId: string, reactions: Array<{
  name: string
  count: number
  users: string[]
}>): Promise<void> {
  const supabase = createClient()
  
  // 首先删除该消息的所有现有反应
  await supabase
    .from('slack_reactions')
    .delete()
    .eq('message_id', messageId)
  
  // 然后插入新的反应
  if (reactions.length > 0) {
    const { error } = await supabase
      .from('slack_reactions')
      .insert(
        reactions.map(reaction => ({
          message_id: messageId,
          reaction_name: reaction.name,
          count: reaction.count,
          users: reaction.users
        }))
      )
    
    if (error) {
      console.error('Error upserting Slack reactions:', error)
    }
  }
}

/**
 * 获取Context的Slack消息（带分页）
 */
export async function getSlackMessages(
  contextId: string,
  options: {
    limit?: number
    offset?: number
    channelId?: string
    userId?: string
    searchQuery?: string
    startDate?: Date
    endDate?: Date
  } = {}
): Promise<{
  messages: Array<SlackMessageRecord & {
    user: SlackUser
    channel: SlackChannel
    reactions: SlackReaction[]
  }>
  totalCount: number
}> {
  const supabase = createClient()
  
  let query = supabase
    .from('slack_messages')
    .select(`
      *,
      slack_users!slack_messages_slack_user_id_fkey(*),
      slack_channels!slack_messages_slack_channel_id_fkey(*),
      slack_reactions(*)
    `)
    .eq('context_id', contextId)
    .order('slack_timestamp', { ascending: false })
  
  // 应用过滤条件
  if (options.channelId) {
    query = query.eq('slack_channel_id', options.channelId)
  }
  
  if (options.userId) {
    query = query.eq('slack_user_id', options.userId)
  }
  
  if (options.searchQuery) {
    query = query.textSearch('text', options.searchQuery)
  }
  
  if (options.startDate) {
    query = query.gte('slack_timestamp', options.startDate.toISOString())
  }
  
  if (options.endDate) {
    query = query.lte('slack_timestamp', options.endDate.toISOString())
  }
  
  // 获取总数
  const { count } = await query.select('*', { count: 'exact', head: true })
  
  // 应用分页
  if (options.limit) {
    query = query.limit(options.limit)
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('Error fetching Slack messages:', error)
    return { messages: [], totalCount: 0 }
  }
  
  // 转换数据格式
  const messages = (data || []).map((item: any) => ({
    ...item,
    user: item.slack_users,
    channel: item.slack_channels,
    reactions: item.slack_reactions || []
  }))
  
  return {
    messages,
    totalCount: count || 0
  }
}

/**
 * 获取消息统计信息
 */
export async function getSlackMessageStats(contextId: string): Promise<{
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
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_slack_message_stats', { context_uuid: contextId })
  
  if (error) {
    console.error('Error fetching Slack message stats:', error)
    return {
      totalMessages: 0,
      channelCount: 0,
      userCount: 0,
      dateRange: { earliest: null, latest: null },
      channelStats: []
    }
  }
  
  const stats = data || {}
  
  return {
    totalMessages: stats.totalMessages || 0,
    channelCount: stats.channelCount || 0,
    userCount: stats.userCount || 0,
    dateRange: {
      earliest: stats.dateRange?.earliest ? new Date(stats.dateRange.earliest) : null,
      latest: stats.dateRange?.latest ? new Date(stats.dateRange.latest) : null
    },
    channelStats: (stats.channelStats || []).map((stat: any) => ({
      name: stat.name,
      messageCount: stat.messageCount,
      latestMessage: stat.latestMessage ? new Date(stat.latestMessage) : null
    }))
  }
}

/**
 * 获取Context的Slack频道列表
 */
export async function getSlackChannels(contextId: string): Promise<SlackChannel[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('slack_channels')
    .select('*')
    .eq('context_id', contextId)
    .eq('is_archived', false)
    .order('name')
  
  if (error) {
    console.error('Error fetching Slack channels:', error)
    return []
  }
  
  return data as SlackChannel[]
}

/**
 * 清理Context的所有Slack消息
 */
export async function clearSlackMessages(contextId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('slack_messages')
    .delete()
    .eq('context_id', contextId)
  
  if (error) {
    console.error('Error clearing Slack messages:', error)
    return false
  }
  
  return true
}

/**
 * 格式化Slack文本（转换为markdown）
 */
function formatSlackText(text: string): string {
  return text
    // 处理@用户提及
    .replace(/<@(\\w+)>/g, '@$1')
    // 处理#频道提及  
    .replace(/<#(\\w+)\\|([^>]+)>/g, '#$2')
    // 处理链接
    .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '[$2]($1)')
    .replace(/<(https?:\/\/[^>]+)>/g, '$1')
    // 处理代码块
    .replace(/```([^`]+)```/g, '\\n```\\n$1\\n```\\n')
    // 处理行内代码
    .replace(/`([^`]+)`/g, '`$1`')
    // 处理粗体
    .replace(/\\*([^*]+)\\*/g, '**$1**')
    // 处理斜体
    .replace(/_([^_]+)_/g, '*$1*')
}

/**
 * 批量迁移文件数据到数据库
 */
export async function migrateFileDataToDatabase(contextId: string): Promise<{
  success: boolean
  migratedMessages: number
  errors: string[]
}> {
  try {
    // 这里将实现从文件系统读取数据并迁移到数据库的逻辑
    // 暂时返回占位符
    return {
      success: true,
      migratedMessages: 0,
      errors: []
    }
  } catch (error) {
    console.error('Error migrating file data to database:', error)
    return {
      success: false,
      migratedMessages: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    }
  }
}