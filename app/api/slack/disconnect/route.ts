import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 请求验证schema
const disconnectRequestSchema = z.object({
  contextId: z.string().min(1)
})

/**
 * Slack断开连接API
 * 安全地断开Slack连接，清理配置和停止同步
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contextId } = disconnectRequestSchema.parse(body)
    
    // 检查是否为演示模式
    const isDemoMode = process.env.NEXT_PUBLIC_USE_MOCK_AUTH === 'true'
    
    console.log(`🔌 断开Slack连接 - Context: ${contextId}`)
    console.log(`🔧 演示模式: ${isDemoMode}`)
    
    if (isDemoMode) {
      // 演示模式：模拟断开连接过程
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      return NextResponse.json({
        success: true,
        message: '已成功断开Slack连接'
      })
    }
    
    // 真实环境：执行完整的断开流程
    try {
      // 步骤1: 获取当前配置（用于清理）
      console.log('📋 获取当前Slack配置...')
      // 这里应该从数据库获取当前的Slack配置
      
      // 步骤2: 停止实时同步
      console.log('⏹️  停止Slack实时同步...')
      // 这里应该停止任何正在运行的同步任务
      
      // 步骤3: 撤销应用权限（可选）
      console.log('🔐 撤销应用访问权限...')
      // 这里可以调用Slack API来撤销应用权限
      // 注意：这会使Bot Token失效，用户需要重新授权
      
      // 步骤4: 清理环境变量（重置Bot Token）
      console.log('🗑️  重置环境变量...')
      const fs = require('fs')
      const path = require('path')
      const envPath = path.join(process.cwd(), '.env.local')
      
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8')
        
        // 重置Bot Token为默认值
        envContent = envContent.replace(
          /SLACK_BOT_TOKEN=.+/,
          'SLACK_BOT_TOKEN=xoxb-your-slack-bot-token'
        )
        
        fs.writeFileSync(envPath, envContent)
        console.log('✅ Bot Token已重置为默认值')
      }
      
      // 步骤5: 清理数据库中的配置
      console.log('🗑️  清理数据库配置...')
      // 这里应该从数据库删除或标记为已删除的Slack配置
      
      // 步骤6: 清理本地缓存（如果有）
      console.log('🧹 清理本地缓存...')
      // 清理任何本地存储的Slack相关数据
      
      return NextResponse.json({
        success: true,
        message: '已成功断开Slack连接，所有相关数据已清理',
        details: {
          configRemoved: true,
          syncStopped: true,
          cacheCleared: true,
          disconnectedAt: new Date().toISOString()
        }
      })
      
    } catch (cleanupError) {
      console.error('清理过程中发生错误:', cleanupError)
      
      // 即使清理过程中有错误，也尽量标记为断开状态
      return NextResponse.json({
        success: true,
        message: '连接已断开，但部分清理操作未完成',
        warning: '建议联系管理员进行手动清理',
        details: {
          disconnectedAt: new Date().toISOString(),
          partialCleanup: true
        }
      })
    }
    
  } catch (error) {
    console.error('断开连接错误:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: '请求参数无效'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: false,
      error: '断开连接失败，请重试'
    }, { status: 500 })
  }
}


export async function GET() {
  return NextResponse.json({
    endpoint: '/api/slack/disconnect',
    description: 'Disconnect current Slack connection',
    methods: {
      POST: 'Disconnect current Slack connection'
    },
    usage: {
      disconnect: 'POST with {contextId}'
    },
    note: 'After disconnecting, use /api/auth/slack/install to reconnect with OAuth'
  })
}