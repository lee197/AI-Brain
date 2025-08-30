import { createClient } from '@/lib/supabase/server'
import { SlackWebApi } from '@/lib/slack/api-client'
import { DatabaseSlackMessage } from '@/lib/slack/database-storage'
import { storeSlackMessage } from '@/lib/slack/database-storage'
import fs from 'fs'
import path from 'path'

// 服务端频道配置管理（简化版本）
// 在生产环境中，这应该存储在数据库中
const serverChannelConfig: { [contextId: string]: string[] } = {}

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

/**
 * 根据频道ID查找对应的contextId
 * @param channelId Slack频道ID
 * @returns contextId或null
 */
function findContextByChannel(channelId: string): string | null {
  try {
    const contextsDir = path.join(process.cwd(), 'data', 'contexts')
    if (!fs.existsSync(contextsDir)) {
      return null
    }
    
    const contextDirs = fs.readdirSync(contextsDir)
    
    for (const contextId of contextDirs) {
      const configPath = path.join(contextsDir, contextId, 'slack-config.json')
      
      if (fs.existsSync(configPath)) {
        try {
          const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'))
          
          // 检查这个context是否配置了Slack连接
          if (configData.isConnected && configData.teamId) {
            console.log(`✅ Found context ${contextId} with active Slack connection for channel ${channelId}`)
            return contextId
          }
        } catch (error) {
          console.error(`Error reading config file for context ${contextId}:`, error)
        }
      }
    }
  } catch (error) {
    console.error('Error finding context for channel:', error)
  }
  
  return null
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
  const formattedText = text
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
  const slackApi = new SlackWebApi()

  try {
    console.log(`📨 Processing Slack message from user ${event.user} in channel ${event.channel}`)
    
    // 根据频道ID找到对应的contextId
    const contextId = findContextByChannel(event.channel)
    if (!contextId) {
      console.log(`⚠️ No context found for channel ${event.channel}, skipping message`)
      return
    }

    // 检查这个频道是否在用户选择的频道列表中
    if (!isChannelAllowed(contextId, event.channel)) {
      console.log(`⚠️ Channel ${event.channel} not in allowed list for context ${contextId}, skipping`)
      return
    }

    // 获取用户和频道信息
    const [userInfo, channelInfo] = await Promise.all([
      slackApi.getUserInfo(event.user),
      slackApi.getChannelInfo(event.channel)
    ])

    // 构建消息对象
    const message: DatabaseSlackMessage = {
      id: event.ts,
      channel: {
        id: event.channel,
        name: channelInfo.name
      },
      user: {
        id: event.user,
        name: userInfo.profile?.display_name || userInfo.real_name,
        avatar: userInfo.profile?.image_72 || userInfo.profile?.image_48 || '',
        real_name: userInfo.real_name
      },
      text: event.text,
      timestamp: new Date(parseFloat(event.ts) * 1000), // Slack时间戳是秒，需要转换为毫秒
      thread_ts: event.thread_ts,
      thread_count: 0, // 暂时设为0，后续可以实现线程计数
      reactions: [], // 暂时为空，后续可以实现表情反应同步
      metadata: {
        team_id: undefined, // 可以从webhook payload获取
        context_id: contextId,
        event_ts: undefined,
        client_msg_id: undefined
      }
    }

    // 使用纯数据库存储系统保存消息
    await storeSlackMessage(contextId, { ...message, team_id: 'T12345' })

    console.log(`✅ Stored Slack message ${event.ts} from ${message.user.name} in #${message.channel.name} for context ${contextId}`)

    // TODO: 可以在这里添加实时广播到前端的功能

  } catch (error) {
    console.error('❌ Error handling Slack message:', error)
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