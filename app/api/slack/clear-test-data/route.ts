import { NextRequest, NextResponse } from 'next/server'
import { loadMessageStorage, saveMessageStorage } from '@/lib/slack/message-storage'

/**
 * 清理测试数据，只保留真实的Slack消息
 */
export async function POST(req: NextRequest) {
  try {
    const { contextId } = await req.json()
    
    if (!contextId) {
      return NextResponse.json({
        success: false,
        error: 'Missing contextId parameter'
      }, { status: 400 })
    }

    // 加载当前存储的消息
    const storage = loadMessageStorage(contextId)
    const originalCount = storage.messages.length

    // 过滤掉测试数据，只保留真实的Slack消息
    // 真实消息的特征：
    // 1. 时间戳是 2025 年的（真实webhook消息）
    // 2. 或者用户ID以 "U0" 开头的真实Slack用户
    const realMessages = storage.messages.filter(message => {
      // 检查时间戳是否是2025年的（真实消息）
      const messageYear = new Date(message.timestamp).getFullYear()
      const isRecentMessage = messageYear >= 2025

      // 检查是否是真实的Slack用户ID（通常以U开头且长度合理）
      const hasRealUserId = message.user.id.startsWith('U0') && message.user.id.length >= 10

      // 检查是否有真实的Slack avatar URL（包含slack-edge.com）
      const hasRealAvatar = message.user.avatar && message.user.avatar.includes('slack-edge.com')

      // 至少满足一个条件就认为是真实消息
      return isRecentMessage || hasRealUserId || hasRealAvatar
    })

    // 重建用户和频道信息
    const newUsers: { [key: string]: any } = {}
    const newChannels: { [key: string]: any } = {}

    realMessages.forEach(message => {
      // 更新用户信息
      newUsers[message.user.id] = {
        id: message.user.id,
        name: message.user.name,
        avatar: message.user.avatar,
        real_name: message.user.real_name
      }

      // 更新频道信息
      const channelMessages = realMessages.filter(m => m.channel.id === message.channel.id)
      newChannels[message.channel.id] = {
        id: message.channel.id,
        name: message.channel.name,
        messageCount: channelMessages.length
      }
    })

    // 更新存储
    storage.messages = realMessages
    storage.users = newUsers
    storage.channels = newChannels
    storage.stats.totalMessages = realMessages.length

    // 保存更新后的存储
    saveMessageStorage(contextId, storage)

    const cleanedCount = originalCount - realMessages.length

    console.log(`🧹 Cleaned ${cleanedCount} test messages, kept ${realMessages.length} real messages for context ${contextId}`)

    return NextResponse.json({
      success: true,
      message: `Cleaned ${cleanedCount} test messages, kept ${realMessages.length} real messages`,
      data: {
        originalCount,
        realMessagesCount: realMessages.length,
        cleanedCount
      }
    })

  } catch (error) {
    console.error('Failed to clear test data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear test data'
    }, { status: 500 })
  }
}

// 支持GET请求用于快速清理
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const contextId = searchParams.get('contextId')
  
  if (!contextId) {
    return NextResponse.json({
      success: false,
      error: 'Missing contextId parameter'
    }, { status: 400 })
  }

  try {
    // 直接调用POST逻辑
    const response = await POST(new NextRequest(req.url, {
      method: 'POST',
      body: JSON.stringify({ contextId })
    }))
    
    return response
  } catch (error) {
    console.error('Failed to clear test data:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to clear test data'
    }, { status: 500 })
  }
}