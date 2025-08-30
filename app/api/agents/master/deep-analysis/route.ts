/**
 * Master Agent 深度分析测试端点
 * 验证 Master Agent + Slack SubAgent 深度分析集成
 */

import { NextRequest, NextResponse } from 'next/server'
import { MasterAgent } from '@/lib/agents/master-agent'
import { z } from 'zod'

// 请求参数验证
const masterAnalysisSchema = z.object({
  contextId: z.string().min(1),
  userMessage: z.string().min(1),
  options: z.object({
    priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    enableSubAgents: z.boolean().default(true),
    enableDeepAnalysis: z.boolean().default(true),
    maxSubTasks: z.number().min(1).max(20).optional()
  }).optional()
})

export async function POST(req: NextRequest) {
  try {
    console.log('🧠 Master Agent Deep Analysis API called')
    
    // 解析请求参数
    const body = await req.json()
    const { contextId, userMessage, options = {} } = masterAnalysisSchema.parse(body)
    
    // 初始化 Master Agent
    const masterAgent = new MasterAgent({
      debugMode: true,
      maxConcurrentTasks: 5,
      timeoutMs: 60000 // 1分钟超时
    })
    
    // 执行用户请求处理
    const result = await masterAgent.processUserRequest(
      userMessage,
      contextId,
      'demo-user', // 测试用户ID
      {
        priority: options.priority,
        enableSubAgents: options.enableSubAgents,
        enableDeepAnalysis: options.enableDeepAnalysis,
        maxSubTasks: options.maxSubTasks
      }
    )

    // 记录处理结果
    console.log(`✅ Master Agent processing completed successfully`)
    
    return NextResponse.json({
      success: true,
      agent: 'MasterAgent',
      contextId,
      userMessage,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Master Agent Deep Analysis API error:', error)
    
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
      error: 'Master Agent processing failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // 从URL参数获取配置
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('contextId')
    const userMessage = searchParams.get('message') || '分析一下最近团队的工作情况'
    
    if (!contextId) {
      return NextResponse.json({
        success: false,
        error: 'Missing contextId parameter'
      }, { status: 400 })
    }

    // 执行快速深度分析
    const masterAgent = new MasterAgent({ debugMode: true })
    const result = await masterAgent.processUserRequest(
      userMessage,
      contextId,
      'demo-user',
      {
        enableSubAgents: true,
        enableDeepAnalysis: true
      }
    )

    return NextResponse.json({
      success: true,
      agent: 'MasterAgent',
      analysisType: 'quick_comprehensive',
      contextId,
      userMessage,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Master Agent GET error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Quick analysis failed',
      message: error.message
    }, { status: 500 })
  }
}

/**
 * 获取支持的分析类型列表
 */
export async function OPTIONS(req: NextRequest) {
  return NextResponse.json({
    supportedMethods: ['GET', 'POST'],
    supportedAnalysisTypes: [
      'team_status', 
      'task_analysis',
      'sentiment_analysis', 
      'collaboration_insights',
      'comprehensive_analysis'
    ],
    sampleRequests: {
      GET: '/api/agents/master/deep-analysis?contextId=e7c5aa1e-de00-4327-81dd-cfeba3030081&message=团队最近怎么样',
      POST: {
        contextId: 'e7c5aa1e-de00-4327-81dd-cfeba3030081',
        userMessage: '帮我深度分析一下团队最近的协作情况',
        options: {
          enableDeepAnalysis: true,
          priority: 'NORMAL'
        }
      }
    },
    capabilities: [
      '🧠 智能意图识别',
      '📊 多维度深度分析',
      '🤖 自动SubAgent调用',
      '💡 智能洞察生成',
      '📈 关键指标提取',
      '🎯 行动建议推荐'
    ]
  })
}