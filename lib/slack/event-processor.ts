import { createClient } from '@/lib/supabase/server'
import { SlackWebApi } from '@/lib/slack/api-client'

// 服务端频道配置管理（简化版本）
// 在生产环境中，这应该存储在数据库中
let serverChannelConfig: { [contextId: string]: string[] } = {}

/**
 * 设置服务端频道配置
 * @param contextId Context ID
 * @param channels 频道ID列表
 */
export function setServerChannelConfig(contextId: string, channels: string[]) {
  serverChannelConfig[contextId] = channels
  console.log(`🔧 更新服务端频道配置 (Context: ${contextId}, 频道: ${channels.length})`)
}

/**
 * 检查频道是否允许接收消息
 * @param contextId Context ID
 * @param channelId 频道ID
 * @returns 是否允许
 */
function isChannelAllowed(contextId: string, channelId: string): boolean {
  const allowedChannels = serverChannelConfig[contextId]
  
  // 如果没有配置，默认允许所有频道（向后兼容）
  if (!allowedChannels || allowedChannels.length === 0) {
    return true
  }
  
  return allowedChannels.includes(channelId)
}

// 消息格式化接口
interface MessageFormatOptions {
  userName: string
  channelName: string  
  timestamp: string
}

/**
 * 格式化Slack消息内容
 * @param text 原始消息文本
 * @param options 格式化选项
 * @returns 格式化后的消息
 */
function formatSlackMessage(text: string, options: MessageFormatOptions): string {
  const { userName, channelName, timestamp } = options
  
  // 转换Slack时间戳为可读时间
  const messageTime = new Date(parseFloat(timestamp) * 1000)
  const timeStr = messageTime.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  // 处理特殊格式
  let formattedText = text
    // 处理@用户提及
    .replace(/<@(\w+)>/g, '@$1')
    // 处理#频道提及  
    .replace(/<#(\w+)\|([^>]+)>/g, '#$2')
    // 处理链接
    .replace(/<(https?:\/\/[^|>]+)\|([^>]+)>/g, '[$2]($1)')
    .replace(/<(https?:\/\/[^>]+)>/g, '$1')
    // 处理代码块
    .replace(/```([^`]+)```/g, '\n```\n$1\n```\n')
    // 处理行内代码
    .replace(/`([^`]+)`/g, '`$1`')
    // 处理粗体
    .replace(/\*([^*]+)\*/g, '**$1**')
    // 处理斜体
    .replace(/_([^_]+)_/g, '*$1*')
  
  // 构建最终格式化消息
  return `💬 **${userName}** 在 **#${channelName}** 频道 (${timeStr}):\n\n${formattedText.trim()}`
}

// Slack事件类型定义
export interface SlackEvent {
  type: string
  user?: string
  channel?: string
  ts?: string
  text?: string
  bot_id?: string
  thread_ts?: string
  [key: string]: any
}

export interface SlackMessageEvent extends SlackEvent {
  type: 'message'
  user: string
  channel: string
  ts: string
  text: string
  thread_ts?: string
}

export interface SlackChannelEvent extends SlackEvent {
  type: 'channel_created'
  channel: {
    id: string
    name: string
    creator: string
  }
}

/**
 * 处理Slack事件
 * @param event Slack事件对象
 */
export async function processSlackEvent(event: SlackEvent) {
  console.log('Processing Slack event:', event.type, {
    channel: event.channel,
    user: event.user,
    hasText: !!event.text
  })

  try {
    switch (event.type) {
      case 'message':
        // 过滤机器人消息和没有文本的消息
        if (!event.bot_id && event.text && event.user && event.channel) {
          await handleSlackMessage(event as SlackMessageEvent)
        }
        break
        
      case 'channel_created':
        await handleChannelCreated(event as SlackChannelEvent)
        break
        
      case 'member_joined_channel':
        await handleMemberJoined(event)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }
  } catch (error) {
    console.error('Error processing Slack event:', error)
    throw error
  }
}

/**
 * 处理Slack消息事件
 * @param event Slack消息事件
 */
async function handleSlackMessage(event: SlackMessageEvent) {
  const supabase = await createClient()
  const slackApi = new SlackWebApi()

  try {
    // 暂时简化：直接存储到messages表，跳过Slack专用表
    console.log('Storing Slack message to messages table...')
    
    // 获取默认context
    const contextId = await getDefaultContextId()
    if (!contextId) {
      console.log('No context available, creating a basic conversation')
      return
    }

    // 检查这个频道是否在用户选择的频道列表中
    if (!isChannelAllowed(contextId, event.channel)) {
      console.log(`频道 ${event.channel} 未在监听列表中，跳过消息处理`)
      return
    }

    // 获取用户信息（可选，如果API失败就用默认值）
    let userInfo: any = null
    let channelInfo: any = null
    
    try {
      const [user, channel] = await Promise.all([
        slackApi.getUserInfo(event.user),
        slackApi.getChannelInfo(event.channel)
      ])
      userInfo = user
      channelInfo = channel
    } catch (apiError) {
      console.log('Slack API error, using fallback values:', apiError.message)
    }

    // 创建对话（如果不存在）
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('context_id', contextId)
      .eq('title', `Slack #${channelInfo?.name || 'channel'}`)
      .single()

    let conversationId = conversation?.id

    if (!conversationId) {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          context_id: contextId,
          title: `Slack #${channelInfo?.name || 'channel'}`,
          user_id: null, // System conversation
          metadata: {
            source: 'slack',
            channel_id: event.channel
          }
        })
        .select('id')
        .single()
      
      conversationId = newConversation?.id
    }

    // 格式化消息内容
    const formattedContent = formatSlackMessage(event.text, {
      userName: userInfo?.real_name || userInfo?.display_name || 'Slack User',
      channelName: channelInfo?.name || 'channel',
      timestamp: event.ts
    })

    // 存储消息到messages表
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: formattedContent,
        metadata: {
          source: 'slack',
          channel_id: event.channel,
          channel_name: channelInfo?.name || 'unknown',
          user_id: event.user,
          user_name: userInfo?.real_name || 'Unknown User',
          timestamp: event.ts,
          avatar: userInfo?.profile?.image_72 || ''
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Error storing message:', error)
      return
    }

    console.log('✅ Slack message stored successfully:', message.id)

    // 实时广播
    await broadcastSlackMessage(message, contextId)

  } catch (error) {
    console.error('Error handling Slack message:', error)
    throw error
  }
}

/**
 * 处理频道创建事件
 * @param event 频道创建事件
 */
async function handleChannelCreated(event: SlackChannelEvent) {
  const supabase = await createClient()
  
  try {
    // 创建或更新频道信息
    const { error } = await supabase
      .from('slack_channels')
      .upsert({
        channel_id: event.channel.id,
        channel_name: event.channel.name,
        is_private: false, // 公开频道
        created_at: new Date()
      })

    if (error) {
      console.error('Error storing channel info:', error)
    } else {
      console.log('Channel created:', event.channel.name)
    }
  } catch (error) {
    console.error('Error handling channel creation:', error)
  }
}

/**
 * 处理成员加入频道事件
 * @param event 成员加入事件
 */
async function handleMemberJoined(event: SlackEvent) {
  console.log('Member joined channel:', {
    user: event.user,
    channel: event.channel
  })
  
  // TODO: 可以在这里实现欢迎消息或其他逻辑
}

/**
 * 根据Slack频道ID获取对应的Context ID
 * @param channelId Slack频道ID  
 * @returns Context ID或null
 */
async function getContextIdByChannel(channelId: string): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    // 从slack_channels表中查找对应的context_id
    const { data, error } = await supabase
      .from('slack_channels')
      .select('context_id')
      .eq('channel_id', channelId)
      .single()

    if (error || !data) {
      // 如果没有找到映射关系，尝试从默认context获取
      console.log('No channel mapping found, using default context for channel:', channelId)
      return await getDefaultContextId()
    }

    return data.context_id
  } catch (error) {
    console.error('Error in getContextIdByChannel:', error)
    // 如果表不存在或其他错误，直接返回默认context
    return await getDefaultContextId()
  }
}

/**
 * 获取默认Context ID
 * @returns 默认Context ID或null
 */
async function getDefaultContextId(): Promise<string | null> {
  const supabase = await createClient()
  
  // 获取第一个可用的context作为默认值
  const { data, error } = await supabase
    .from('contexts')
    .select('id')
    .limit(1)
    .single()

  if (error || !data) {
    console.warn('No default context found')
    return null
  }

  return data.id
}

/**
 * 向前端广播Slack消息
 * @param message 存储的消息对象
 * @param contextId Context ID
 */
async function broadcastSlackMessage(message: any, contextId: string) {
  const supabase = await createClient()
  
  try {
    const channel = supabase.channel(`context-${contextId}`)
    
    await channel.send({
      type: 'broadcast',
      event: 'slack_message_received',
      payload: {
        ...message,
        source: 'slack'
      }
    })

    console.log('Broadcasted Slack message to context:', contextId)
  } catch (error) {
    console.error('Error broadcasting Slack message:', error)
  }
}