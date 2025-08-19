import { NextRequest, NextResponse } from 'next/server'
import { SlackWebApi } from '@/lib/slack/api-client'
import { z } from 'zod'

// 请求参数验证
const sendMessageSchema = z.object({
  channelId: z.string().min(1, '频道ID不能为空'),
  message: z.string().min(1, '消息内容不能为空'),
  contextId: z.string().optional(),
  threadTs: z.string().optional(), // 用于回复特定消息
  blocks: z.array(z.any()).optional(), // Slack Block Kit 格式
  attachments: z.array(z.any()).optional() // 附件
})

export async function POST(req: NextRequest) {
  try {
    // 检查Slack连接状态
    const botToken = process.env.SLACK_BOT_TOKEN
    if (!botToken || botToken === 'xoxb-your-slack-bot-token') {
      return NextResponse.json({ 
        error: 'Slack未连接',
        success: false
      }, { status: 400 })
    }

    // 验证请求参数
    const body = await req.json()
    const validated = sendMessageSchema.parse(body)

    const slackApi = new SlackWebApi()
    
    // 检查Bot是否在目标频道中
    const isBotInChannel = await slackApi.isBotInChannel(validated.channelId)
    if (!isBotInChannel) {
      return NextResponse.json({
        error: 'Bot未加入目标频道，无法发送消息',
        success: false,
        needsInvite: true,
        channelId: validated.channelId
      }, { status: 403 })
    }

    // 发送消息到Slack
    const result = await slackApi.sendMessage({
      channel: validated.channelId,
      text: validated.message,
      thread_ts: validated.threadTs,
      blocks: validated.blocks,
      attachments: validated.attachments
    })

    if (!result.ok) {
      throw new Error(result.error || '发送消息失败')
    }

    console.log('✅ 消息已发送到Slack:', {
      channel: validated.channelId,
      messageTs: result.ts,
      messageLength: validated.message.length
    })

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '消息发送成功',
      data: {
        messageTs: result.ts,
        channel: validated.channelId,
        permalink: result.message?.permalink
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: '请求参数错误',
        details: error.errors,
        success: false
      }, { status: 400 })
    }

    console.error('发送Slack消息失败:', error)
    
    // 处理Slack API特定错误
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase()
      
      if (errorMessage.includes('channel_not_found')) {
        return NextResponse.json({
          error: '频道不存在或Bot无权访问',
          success: false
        }, { status: 404 })
      }
      
      if (errorMessage.includes('not_in_channel')) {
        return NextResponse.json({
          error: 'Bot未加入目标频道',
          success: false,
          needsInvite: true
        }, { status: 403 })
      }
      
      if (errorMessage.includes('rate_limited')) {
        return NextResponse.json({
          error: '发送频率过高，请稍后重试',
          success: false
        }, { status: 429 })
      }
    }

    return NextResponse.json({ 
      error: '发送消息失败',
      details: error instanceof Error ? error.message : '未知错误',
      success: false
    }, { status: 500 })
  }
}

// 获取频道信息（用于发送前验证）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const channelId = searchParams.get('channelId')
    
    if (!channelId) {
      return NextResponse.json({
        error: '缺少频道ID参数',
        success: false
      }, { status: 400 })
    }

    const botToken = process.env.SLACK_BOT_TOKEN
    if (!botToken || botToken === 'xoxb-your-slack-bot-token') {
      return NextResponse.json({ 
        error: 'Slack未连接',
        success: false
      }, { status: 400 })
    }

    const slackApi = new SlackWebApi()
    
    // 获取频道信息和Bot权限
    const [channelInfo, isBotMember] = await Promise.all([
      slackApi.getChannelInfo(channelId),
      slackApi.isBotInChannel(channelId)
    ])

    return NextResponse.json({
      success: true,
      data: {
        channel: channelInfo,
        canSendMessages: isBotMember,
        botMember: isBotMember
      }
    })

  } catch (error) {
    console.error('获取频道信息失败:', error)
    return NextResponse.json({ 
      error: '获取频道信息失败',
      details: error instanceof Error ? error.message : '未知错误',
      success: false
    }, { status: 500 })
  }
}