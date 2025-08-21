import { NextRequest, NextResponse } from 'next/server'
import { loadSlackMessages, getSlackStats } from '@/lib/slack/database-storage'

/**
 * 获取Slack消息历史记录API - 纯数据库版本
 * 返回按频道和时间排序的消息数据
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('contextId')
    const channel = searchParams.get('channel') // 可选：按频道过滤
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    if (!contextId) {
      return NextResponse.json({
        success: false,
        error: 'Missing contextId parameter'
      }, { status: 400 })
    }

    // 从数据库加载消息数据
    const { messages, totalCount } = await loadSlackMessages(contextId, {
      limit,
      offset,
      channel
    })
    
    // 按频道分组消息
    const messagesByChannel: Record<string, typeof messages> = {}
    messages.forEach(message => {
      const channelName = message.channel.name
      if (!messagesByChannel[channelName]) {
        messagesByChannel[channelName] = []
      }
      messagesByChannel[channelName].push(message)
    })

    // 获取统计信息
    const stats = await getSlackStats(contextId)

    console.log(`📊 Loaded ${messages.length}/${totalCount} messages from database for context ${contextId}`)

    return NextResponse.json({
      success: true,
      data: {
        messages,
        messagesByChannel,
        totalCount,
        stats
      }
    })

  } catch (error) {
    console.error('Failed to fetch Slack messages from database:', error)
    
    return NextResponse.json({
      success: true,
      data: {
        messages: [],
        messagesByChannel: {},
        totalCount: 0,
        stats: {
          totalMessages: 0,
          channelCount: 0,
          userCount: 0,
          dateRange: { earliest: null, latest: null },
          channelStats: []
        }
      }
    })
  }
}