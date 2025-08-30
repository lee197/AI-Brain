/**
 * Master Agent API端点 - 新架构的演示端点
 * 与现有API并行存在，不影响旧系统行为
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { compatibilityLayer } from '@/lib/agents/compatibility-layer'

// 请求验证Schema
const requestSchema = z.object({
  message: z.string().min(1),
  contextId: z.string(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  enableSubAgents: z.boolean().optional(),
  enableWorkflows: z.boolean().optional()
})

export async function POST(req: NextRequest) {
  try {
    console.log('🎯 Master Agent API called')
    
    // 验证输入
    const body = await req.json()
    const { message, contextId, priority, enableSubAgents, enableWorkflows } = requestSchema.parse(body)

    // 记录请求
    console.log(`📝 Processing request: "${message.substring(0, 50)}..." for context: ${contextId}`)

    // 通过兼容性层处理请求
    const result = await compatibilityLayer.handleAIChat({
      message,
      contextId,
      includeGoogleWorkspace: true
    })

    // 添加Master Agent特有的元数据
    const enhancedResult = {
      ...result,
      architecture: 'master-agent',
      version: '2.0',
      capabilities: {
        multiAgent: enableSubAgents,
        workflows: enableWorkflows,
        fallbackEnabled: true
      },
      metadata: {
        processingTime: Date.now(),
        requestId: `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        contextId,
        priority: priority || 'NORMAL'
      }
    }

    console.log(`✅ Master Agent response ready (${result.model || 'unknown'} model)`)

    return NextResponse.json(enhancedResult)

  } catch (error: any) {
    console.error('Master Agent API Error:', error)
    
    // 错误时也要保持格式兼容
    return NextResponse.json(
      {
        success: false,
        error: 'Master Agent service temporarily unavailable',
        fallback: true,
        timestamp: new Date().toISOString(),
        message: error.message
      },
      { status: 500 }
    )
  }
}