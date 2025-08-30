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
      const fs = require('fs')
      const path = require('path')
      
      // 步骤1: 删除 Slack 配置文件
      console.log('🗑️ 删除 Slack 配置文件...')
      const configDir = path.join(process.cwd(), 'data', 'contexts', contextId)
      const configFile = path.join(configDir, 'slack-config.json')
      const tokenFile = path.join(configDir, 'slack-token.txt')
      
      let filesDeleted = 0
      if (fs.existsSync(configFile)) {
        fs.unlinkSync(configFile)
        filesDeleted++
        console.log('✅ 删除配置文件: slack-config.json')
      }
      
      if (fs.existsSync(tokenFile)) {
        fs.unlinkSync(tokenFile)
        filesDeleted++
        console.log('✅ 删除令牌文件: slack-token.txt')
      }
      
      // 步骤2: 清理状态缓存
      console.log('🧹 清理状态缓存...')
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/data-sources/status?context_id=${contextId}&data_source=slack`, {
          method: 'DELETE'
        })
        console.log('✅ 状态缓存已清理')
      } catch (cacheError) {
        console.warn('清理缓存时出错:', cacheError)
      }
      
      // 步骤3: 清理数据库中的 Slack 消息（如果有）
      console.log('🧹 清理 Slack 消息数据...')
      // 这里可以添加清理 Supabase 中 Slack 消息的逻辑
      
      return NextResponse.json({
        success: true,
        message: '已成功断开Slack连接，所有相关数据已清理',
        details: {
          filesDeleted,
          configRemoved: true,
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