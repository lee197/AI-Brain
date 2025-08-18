import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DataAnalyzer, AnalysisRequest } from '@/lib/ai/data-analyzer'
import { z } from 'zod'

// 请求验证模式
const analysisRequestSchema = z.object({
  type: z.enum(['team_performance', 'project_status', 'data_source_health', 'task_analysis', 'meeting_schedule']),
  contextId: z.string().optional(),
  timeRange: z.enum(['today', 'week', 'month', 'quarter']).optional(),
  filters: z.record(z.any()).optional()
})

const dataAnalyzer = new DataAnalyzer()

export async function POST(req: NextRequest) {
  try {
    // 1. 认证检查
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 验证输入
    const body = await req.json()
    const analysisRequest = analysisRequestSchema.parse(body)

    // 3. 执行智能分析
    const result = await dataAnalyzer.analyzeData(analysisRequest)

    // 4. 记录分析请求（可选）
    await supabase
      .from('analysis_logs')
      .insert({
        user_id: user.id,
        analysis_type: analysisRequest.type,
        context_id: analysisRequest.contextId,
        request_data: analysisRequest,
        result_summary: result.summary,
        created_at: new Date().toISOString()
      })
      .then(() => {}) // 忽略日志记录错误
      .catch(() => {}) // 忽略日志记录错误

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid request parameters',
        details: error.errors 
      }, { status: 400 })
    }
    
    console.error('Analysis Error:', error)
    return NextResponse.json({ 
      error: 'Analysis service temporarily unavailable' 
    }, { status: 500 })
  }
}

// 获取数据源状态
export async function GET(req: NextRequest) {
  try {
    // 认证检查
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 获取数据源状态
    const dataSources = dataAnalyzer.getDataSourceStatus()

    return NextResponse.json({
      success: true,
      data: {
        dataSources,
        summary: {
          total: dataSources.length,
          connected: dataSources.filter(ds => ds.status === 'connected').length,
          syncing: dataSources.filter(ds => ds.status === 'syncing').length,
          error: dataSources.filter(ds => ds.status === 'error').length,
          disconnected: dataSources.filter(ds => ds.status === 'disconnected').length
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Data Source Status Error:', error)
    return NextResponse.json({ 
      error: 'Unable to fetch data source status' 
    }, { status: 500 })
  }
}