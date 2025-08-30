/**
 * Slack SubAgent 深度分析 API 端点
 * 提供情感分析、任务提取、会议分析等高级功能
 */

import { NextRequest, NextResponse } from 'next/server'
import { SlackSubAgentSimple } from '@/lib/agents/sub-agents/slack-agent-simple'
import { z } from 'zod'

// 深度分析请求参数验证
const deepAnalysisSchema = z.object({
  contextId: z.string().min(1),
  analysisType: z.enum(['comprehensive', 'sentiment', 'tasks', 'meetings']).default('comprehensive'),
  options: z.object({
    days: z.number().min(1).max(30).default(7),
    includeSentiment: z.boolean().default(true),
    includeTasks: z.boolean().default(true),
    includeMeetings: z.boolean().default(true),
    includeTeamInsights: z.boolean().default(true)
  }).optional()
})

export async function POST(req: NextRequest) {
  try {
    console.log('🧠 Deep Analysis API called')
    
    // 解析请求参数
    const body = await req.json()
    const { contextId, analysisType, options = {} } = deepAnalysisSchema.parse(body)
    
    // 初始化 Slack SubAgent
    const slackAgent = new SlackSubAgentSimple(contextId)
    
    let result
    
    // 根据分析类型执行相应分析
    switch (analysisType) {
      case 'comprehensive':
        result = await slackAgent.performDeepAnalysis({
          days: options.days,
          includeSentiment: options.includeSentiment,
          includeTasks: options.includeTasks,
          includeMeetings: options.includeMeetings,
          includeTeamInsights: options.includeTeamInsights
        })
        break
        
      case 'sentiment':
        result = await slackAgent.analyzeSentiment(options.days)
        break
        
      case 'tasks':
        result = await slackAgent.extractTasks(options.days)
        break
        
      case 'meetings':
        result = await slackAgent.analyzeMeetings(options.days)
        break
        
      default:
        throw new Error(`Unsupported analysis type: ${analysisType}`)
    }

    // 记录分析结果
    console.log(`✅ Deep analysis completed: ${analysisType} in ${result.metadata.processingTime}ms`)
    
    return NextResponse.json({
      success: true,
      agent: 'SlackSubAgent',
      analysisType,
      contextId,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Deep Analysis API error:', error)
    
    // Zod 验证错误
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request parameters',
        details: error.errors
      }, { status: 400 })
    }
    
    // 其他错误
    return NextResponse.json({
      success: false,
      error: 'Deep analysis failed',
      message: error.message
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // 从URL参数获取配置
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('contextId')
    const analysisType = searchParams.get('type') || 'comprehensive'
    const days = parseInt(searchParams.get('days') || '7')
    
    if (!contextId) {
      return NextResponse.json({
        success: false,
        error: 'Missing contextId parameter'
      }, { status: 400 })
    }

    // 执行快速综合分析
    const slackAgent = new SlackSubAgentSimple(contextId)
    const result = await slackAgent.performDeepAnalysis({ 
      days,
      includeSentiment: true,
      includeTasks: true,
      includeMeetings: false, // GET请求不包含耗时的会议分析
      includeTeamInsights: true
    })

    return NextResponse.json({
      success: true,
      agent: 'SlackSubAgent',
      analysisType: 'quick_comprehensive',
      contextId,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Deep Analysis GET error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Quick analysis failed',
      message: error.message
    }, { status: 500 })
  }
}