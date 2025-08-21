import fs from 'fs'
import path from 'path'

/**
 * Slack消息存储管理器
 * 使用文件系统存储接收到的Slack消息（生产环境将使用数据库）
 */

export interface SlackMessage {
  id: string
  channel: { id: string; name: string }
  user: { id: string; name: string; avatar: string; real_name?: string }
  text: string
  timestamp: Date
  reactions?: Array<{ name: string; count: number; users: string[] }>
  thread_count?: number
  thread_ts?: string
  metadata?: {
    team_id?: string
    context_id?: string
    event_ts?: string
    client_msg_id?: string
  }
}

export interface SlackMessageStorage {
  messages: SlackMessage[]
  channels: Record<string, { id: string; name: string; messageCount: number }>
  users: Record<string, { id: string; name: string; avatar: string; real_name?: string }>
  stats: {
    totalMessages: number
    lastUpdate: string
  }
}

const getStorageDir = () => {
  const storageDir = path.join(process.cwd(), '.slack-messages')
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true })
  }
  return storageDir
}

const getStoragePath = (contextId: string) => {
  return path.join(getStorageDir(), `${contextId}.json`)
}

/**
 * 加载指定上下文的消息存储
 */
export const loadMessageStorage = (contextId: string): SlackMessageStorage => {
  const storagePath = getStoragePath(contextId)
  
  if (fs.existsSync(storagePath)) {
    try {
      const data = fs.readFileSync(storagePath, 'utf8')
      const storage = JSON.parse(data)
      
      // 将时间戳字符串转换回Date对象
      storage.messages = storage.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
      
      return storage
    } catch (error) {
      console.error('Error loading message storage:', error)
    }
  }
  
  // 返回空的存储结构
  return {
    messages: [],
    channels: {},
    users: {},
    stats: {
      totalMessages: 0,
      lastUpdate: new Date().toISOString()
    }
  }
}

/**
 * 保存消息存储
 */
export const saveMessageStorage = (contextId: string, storage: SlackMessageStorage): void => {
  const storagePath = getStoragePath(contextId)
  
  try {
    // 更新统计信息
    storage.stats.totalMessages = storage.messages.length
    storage.stats.lastUpdate = new Date().toISOString()
    
    fs.writeFileSync(storagePath, JSON.stringify(storage, null, 2))
    console.log(`✅ Saved ${storage.messages.length} messages to ${contextId}`)
  } catch (error) {
    console.error('Error saving message storage:', error)
  }
}

/**
 * 添加新的Slack消息
 */
export const addSlackMessage = (contextId: string, message: SlackMessage): void => {
  const storage = loadMessageStorage(contextId)
  
  // 检查消息是否已存在（避免重复）
  const existingIndex = storage.messages.findIndex(m => m.id === message.id)
  
  if (existingIndex >= 0) {
    // 更新现有消息
    storage.messages[existingIndex] = message
    console.log(`🔄 Updated message ${message.id} in ${contextId}`)
  } else {
    // 添加新消息
    storage.messages.push(message)
    console.log(`➕ Added new message ${message.id} to ${contextId}`)
  }
  
  // 更新频道信息
  storage.channels[message.channel.id] = {
    id: message.channel.id,
    name: message.channel.name,
    messageCount: storage.messages.filter(m => m.channel.id === message.channel.id).length
  }
  
  // 更新用户信息
  storage.users[message.user.id] = {
    id: message.user.id,
    name: message.user.name,
    avatar: message.user.avatar,
    real_name: message.user.real_name
  }
  
  // 按时间排序（最新的在前）
  storage.messages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  
  // 保存到文件
  saveMessageStorage(contextId, storage)
}

/**
 * 获取频道的消息统计
 */
export const getChannelStats = (contextId: string) => {
  const storage = loadMessageStorage(contextId)
  
  const channelStats = Object.values(storage.channels).map(channel => ({
    name: channel.name,
    messageCount: channel.messageCount,
    latestMessage: storage.messages
      .filter(m => m.channel.id === channel.id)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.timestamp
  }))
  
  return {
    totalMessages: storage.stats.totalMessages,
    channelCount: Object.keys(storage.channels).length,
    userCount: Object.keys(storage.users).length,
    channelStats,
    dateRange: {
      earliest: storage.messages.length > 0 ? 
        storage.messages[storage.messages.length - 1].timestamp : null,
      latest: storage.messages.length > 0 ? 
        storage.messages[0].timestamp : null
    }
  }
}

/**
 * 清空指定上下文的所有消息
 */
export const clearMessages = (contextId: string): void => {
  const storagePath = getStoragePath(contextId)
  
  if (fs.existsSync(storagePath)) {
    fs.unlinkSync(storagePath)
    console.log(`🗑️ Cleared all messages for ${contextId}`)
  }
}

/**
 * 获取所有存储的上下文ID
 */
export const getAllContextIds = (): string[] => {
  const storageDir = getStorageDir()
  
  if (!fs.existsSync(storageDir)) {
    return []
  }
  
  return fs.readdirSync(storageDir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''))
}