/**
 * Slack SubAgent 测试API端点
 * 用于验证新架构下Slack SubAgent的各项功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SlackSubAgent } from '@/lib/agents/sub-agents/slack-agent'

// 测试请求Schema
const testRequestSchema = z.object({
  action: z.enum([
    'search_messages',
    'get_recent_messages', 
    'analyze_conversations',
    'get_channel_activity',
    'find_key_discussions'
  ]),
  contextId: z.string(),
  parameters: z.record(z.any()).optional()
})

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Slack SubAgent Test API called')
    
    const body = await req.json()
    const { action, contextId, parameters = {} } = testRequestSchema.parse(body)

    console.log(`🎯 Testing Slack SubAgent: ${action} for context: ${contextId}`)

    // 创建Slack SubAgent实例
    const slackAgent = new SlackSubAgent(contextId)

    // 执行指定的操作
    const result = await slackAgent.execute(action, parameters)

    // 返回详细的测试结果
    return NextResponse.json({
      success: true,
      testResult: {
        action,
        contextId,
        parameters,
        executionTime: result.metadata.processingTime,
        agentResult: result
      },
      metadata: {
        timestamp: new Date().toISOString(),
        agentType: 'SLACK_SUB_AGENT',
        version: '1.0.0'
      }
    })

  } catch (error: any) {
    console.error('Slack SubAgent Test Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        testInfo: {
          endpoint: '/api/agents/slack/test',
          availableActions: [
            'search_messages',
            'get_recent_messages',
            'analyze_conversations', 
            'get_channel_activity',
            'find_key_discussions'
          ]
        }
      },
      { status: 500 }
    )
  }
}

// GET方法返回测试说明
export async function GET() {
  return NextResponse.json({
    message: 'Slack SubAgent Test Endpoint',
    description: '用于测试Slack SubAgent各项功能的API端点',
    availableActions: [
      {
        action: 'search_messages',
        description: '搜索Slack消息',
        parameters: { query: 'string', limit: 'number' }
      },
      {
        action: 'get_recent_messages', 
        description: '获取最近消息',
        parameters: { days: 'number', limit: 'number' }
      },
      {
        action: 'analyze_conversations',
        description: '分析对话模式',
        parameters: { timeframe: 'day|week|month' }
      },
      {
        action: 'get_channel_activity',
        description: '获取频道活跃度',
        parameters: { hours: 'number' }
      },
      {
        action: 'find_key_discussions',
        description: '查找关键讨论',
        parameters: { keywords: 'string[]', days: 'number' }
      }
    ],
    usage: {
      method: 'POST',
      endpoint: '/api/agents/slack/test',
      body: {
        action: 'search_messages',
        contextId: 'your-context-id',
        parameters: { query: 'bug', limit: 10 }
      }
    }
  })
}