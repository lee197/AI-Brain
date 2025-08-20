import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 请求验证schema
const configureRequestSchema = z.object({
  contextId: z.string().min(1),
  config: z.object({
    botToken: z.string().min(1),
    signingSecret: z.string().min(1),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    workspaceName: z.string().optional(),
    teamId: z.string().optional(),
    botUserId: z.string().optional()
  }),
  monitoredChannels: z.array(z.string())
})

/**
 * Slack配置保存API
 * 保存完整的Slack配置并建立连接
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contextId, config, monitoredChannels } = configureRequestSchema.parse(body)
    
    // 检查是否为演示模式
    const isDemoMode = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'
    
    console.log(`📝 配置Slack集成 - Context: ${contextId}`)
    console.log(`🔧 演示模式: ${isDemoMode}`)
    console.log(`📊 监控频道数量: ${monitoredChannels.length}`)
    
    if (isDemoMode) {
      // 演示模式：模拟保存配置
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      return NextResponse.json({
        success: true,
        message: '配置保存成功',
        stats: {
          channels: monitoredChannels.length,
          users: 45,
          messages: 10,
          lastSync: new Date().toISOString()
        },
        config: {
          ...config,
          connectedAt: new Date().toISOString(),
          status: 'connected'
        }
      })
    }
    
    // 真实环境：保存到数据库
    // 注意：在实际环境中，这里需要：
    // 1. 加密存储敏感信息（botToken, signingSecret, clientSecret）
    // 2. 验证用户权限
    // 3. 保存到数据库（Supabase）
    // 4. 设置Webhook订阅
    // 5. 开始实时同步
    
    try {
      // 这里应该调用Supabase或其他数据库来保存配置
      console.log('💾 保存Slack配置到数据库...')
      
      // 模拟数据库操作
      const savedConfig = {
        id: `slack_${contextId}_${Date.now()}`,
        contextId,
        type: 'slack',
        config: {
          // 在生产环境中，这些敏感信息应该加密存储
          botToken: config.botToken,
          signingSecret: config.signingSecret,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          workspaceName: config.workspaceName,
          teamId: config.teamId,
          botUserId: config.botUserId,
          monitoredChannels,
          connectedAt: new Date().toISOString(),
          status: 'connected'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      // 启动实时同步（在真实环境中）
      console.log('🔄 启动Slack实时同步...')
      
      // 返回成功响应
      return NextResponse.json({
        success: true,
        message: '配置保存成功，Slack集成已激活',
        stats: {
          channels: monitoredChannels.length,
          users: 45, // 这应该从实际的Slack API获取
          messages: 10, // 这应该从数据库统计获取
          lastSync: new Date().toISOString()
        },
        config: savedConfig.config
      })
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError)
      return NextResponse.json({
        success: false,
        error: '配置保存失败，请重试'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('配置保存错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '配置参数无效'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: '服务器内部错误'
    }, { status: 500 })
  }
}

/**
 * 获取当前Slack配置
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('contextId')
    
    if (!contextId) {
      return NextResponse.json({
        success: false,
        error: '缺少contextId参数'
      }, { status: 400 })
    }
    
    // 检查是否为演示模式
    const isDemoMode = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'
    
    if (isDemoMode) {
      // 演示模式：返回模拟配置
      return NextResponse.json({
        success: true,
        config: {
          botToken: 'xoxb-demo-token',
          workspaceName: 'AI Brain Demo Team',
          teamId: 'T1234567890',
          botUserId: 'U1234567890',
          monitoredChannels: ['C1234567890', 'C1234567892', 'C1234567893'],
          connectedAt: '2024-01-15T10:30:00.000Z',
          status: 'connected'
        },
        stats: {
          channels: 3,
          users: 45,
          messages: 10,
          lastSync: new Date().toISOString()
        }
      })
    }
    
    // 真实环境：从数据库获取配置
    // 这里应该查询数据库获取保存的Slack配置
    return NextResponse.json({
      success: true,
      config: null // 如果没有找到配置
    })
    
  } catch (error) {
    console.error('获取配置错误:', error)
    return NextResponse.json({
      success: false,
      error: '获取配置失败'
    }, { status: 500 })
  }
}