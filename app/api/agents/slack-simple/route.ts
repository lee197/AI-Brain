/**
 * 简化的Slack SubAgent测试API
 * 用于验证SubAgent架构概念
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { SlackSubAgentSimple } from '@/lib/agents/sub-agents/slack-agent-simple'

const testRequestSchema = z.object({
  action: z.enum(['get_recent_messages', 'search_messages', 'analyze_activity']),
  contextId: z.string(),
  parameters: z.object({
    days: z.number().optional(),
    hours: z.number().optional(),
    limit: z.number().optional(),
    query: z.string().optional()
  }).optional()
})

export async function POST(req: NextRequest) {
  try {
    console.log('🧪 Slack SubAgent Simple Test API called')
    
    const body = await req.json()
    const { action, contextId, parameters = {} } = testRequestSchema.parse(body)

    console.log(`🎯 Testing action: ${action} for context: ${contextId}`)

    // 创建简化版Slack SubAgent
    const slackAgent = new SlackSubAgentSimple(contextId)

    let result

    switch (action) {
      case 'get_recent_messages':
        result = await slackAgent.getRecentMessages(
          parameters.days || 7, 
          parameters.limit || 10
        )
        break
      
      case 'search_messages':
        if (!parameters.query) {
          throw new Error('Query parameter required for search_messages')
        }
        result = await slackAgent.searchMessages(
          parameters.query, 
          parameters.limit || 20
        )
        break
        
      case 'analyze_activity':
        result = await slackAgent.analyzeActivity(parameters.hours || 24)
        break
        
      default:
        throw new Error(`Unsupported action: ${action}`)
    }

    return NextResponse.json({
      success: true,
      testResult: {
        action,
        contextId,
        parameters,
        result
      },
      metadata: {
        timestamp: new Date().toISOString(),
        agentVersion: 'simple-1.0',
        api: 'slack-subagent-test'
      }
    })

  } catch (error: any) {
    console.error('Slack SubAgent Simple Test Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        testInfo: {
          endpoint: '/api/agents/slack-simple',
          availableActions: ['get_recent_messages', 'search_messages', 'analyze_activity'],
          requiredParams: {
            get_recent_messages: { days: 'number', limit: 'number' },
            search_messages: { query: 'string (required)', limit: 'number' },
            analyze_activity: { hours: 'number' }
          }
        }
      },
      { status: 400 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Slack SubAgent Simple Test API',
    status: 'ready',
    availableActions: ['get_recent_messages', 'search_messages', 'analyze_activity'],
    usage: {
      method: 'POST',
      body: {
        action: 'get_recent_messages',
        contextId: 'e7c5aa1e-de00-4327-81dd-cfeba3030081',
        parameters: { days: 7, limit: 5 }
      }
    }
  })
}