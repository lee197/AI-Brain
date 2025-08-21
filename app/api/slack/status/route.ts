import { NextRequest, NextResponse } from 'next/server'
import { SlackWebApi } from '@/lib/slack/api-client'

/**
 * Slack连接状态检查端点
 * 用于验证Slack集成是否正常工作
 */
export async function GET(req: NextRequest) {
  try {
    const slackApi = new SlackWebApi()
    
    // 验证Slack连接
    const connectionResult = await slackApi.verifyConnection()

    // 获取频道列表测试API权限
    const channels = await slackApi.getChannelList()
    
    return NextResponse.json({
      status: 'connected',
      connection: {
        user: connectionResult.user,
        user_id: connectionResult.user_id,
        team: connectionResult.team,
        team_id: connectionResult.team_id
      },
      channels: {
        count: Array.isArray(channels) ? channels.length : 0,
        sample: Array.isArray(channels) ? channels.slice(0, 3).map(ch => ({
          id: ch.id,
          name: ch.name,
          is_private: ch.is_private || false
        })) : []
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Slack status check error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Slack状态检查失败',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

/**
 * 测试发送消息功能
 */
export async function POST(req: NextRequest) {
  try {
    const { channelId, message } = await req.json()

    if (!channelId || !message) {
      return NextResponse.json({
        error: 'Missing channelId or message'
      }, { status: 400 })
    }

    const slackApi = new SlackWebApi()
    const result = await slackApi.sendMessage(channelId, message)

    return NextResponse.json({
      success: result.ok,
      result: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Slack message test error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}