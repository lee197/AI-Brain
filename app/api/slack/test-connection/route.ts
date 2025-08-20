import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 请求验证schema
const testRequestSchema = z.object({
  contextId: z.string().min(1),
  config: z.object({
    botToken: z.string().min(1),
    signingSecret: z.string().min(1)
  })
})

/**
 * Slack连接测试API
 * 验证Bot Token和权限，获取工作区信息和频道列表
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contextId, config } = testRequestSchema.parse(body)
    
    const { botToken, signingSecret } = config
    
    // 检查是否为演示模式
    const isDemoMode = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true' || !process.env.SLACK_BOT_TOKEN
    
    if (isDemoMode) {
      console.log('🔧 演示模式：模拟Slack连接测试')
      
      // 模拟测试延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 返回模拟数据
      return NextResponse.json({
        success: true,
        data: {
          team: {
            id: 'T1234567890',
            name: 'AI Brain Demo Team',
            domain: 'aibrain-demo',
            icon: 'https://a.slack-edge.com/80588/img/avatars-teams/ava_0001-88.png'
          },
          user: {
            id: 'U1234567890',
            name: 'AI Brain Bot',
            profile: {
              display_name: 'AI Brain',
              real_name: 'AI Brain Bot'
            }
          },
          channels: [
            {
              id: 'C1234567890',
              name: 'general',
              isPrivate: false,
              memberCount: 25,
              isMonitored: true
            },
            {
              id: 'C1234567891',
              name: 'random',
              isPrivate: false,
              memberCount: 18,
              isMonitored: false
            },
            {
              id: 'C1234567892',
              name: 'development',
              isPrivate: false,
              memberCount: 8,
              isMonitored: true
            },
            {
              id: 'C1234567893',
              name: 'ai-discussions',
              isPrivate: false,
              memberCount: 12,
              isMonitored: true
            },
            {
              id: 'C1234567894',
              name: 'leadership',
              isPrivate: true,
              memberCount: 5,
              isMonitored: false
            }
          ],
          scopes: [
            'channels:read',
            'channels:history',
            'chat:write',
            'users:read',
            'team:read'
          ]
        }
      })
    }
    
    // 真实Slack API调用
    try {
      // 验证Bot Token
      const authResponse = await fetch('https://slack.com/api/auth.test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const authData = await authResponse.json()
      
      if (!authData.ok) {
        return NextResponse.json({
          success: false,
          error: `认证失败: ${authData.error}`
        }, { status: 400 })
      }
      
      // 获取团队信息
      const teamResponse = await fetch('https://slack.com/api/team.info', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      const teamData = await teamResponse.json()
      
      // 获取频道列表
      const channelsResponse = await fetch('https://slack.com/api/conversations.list', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          types: 'public_channel,private_channel',
          exclude_archived: true
        })
      })
      
      const channelsData = await channelsResponse.json()
      
      // 格式化频道数据
      const formattedChannels = channelsData.channels?.map((channel: any) => ({
        id: channel.id,
        name: channel.name,
        isPrivate: channel.is_private || false,
        memberCount: channel.num_members || 0,
        isMonitored: false // 默认不监控
      })) || []
      
      return NextResponse.json({
        success: true,
        data: {
          team: teamData.team,
          user: authData,
          channels: formattedChannels,
          scopes: authData.response_metadata?.scopes || []
        }
      })
      
    } catch (slackError) {
      console.error('Slack API错误:', slackError)
      return NextResponse.json({
        success: false,
        error: '无法连接到Slack API，请检查您的网络连接和Bot Token'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('连接测试错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求参数无效'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}