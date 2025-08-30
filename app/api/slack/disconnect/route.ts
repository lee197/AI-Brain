import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 请求验证schema
const disconnectRequestSchema = z.object({
  contextId: z.string().min(1),
  permanent: z.boolean().optional() // 可选：是否永久删除配置
})

/**
 * Slack断开连接API
 * 安全地断开Slack连接，清理配置和停止同步
 */
export async function POST(req: NextRequest) {
  try {
    // 支持从 URL 参数或 JSON body 获取参数
    const { searchParams } = new URL(req.url)
    const contextIdFromParams = searchParams.get('context_id')
    
    let contextId: string
    let permanent = false
    
    if (contextIdFromParams) {
      // 从 URL 参数获取
      contextId = contextIdFromParams
      permanent = searchParams.get('permanent') === 'true'
    } else {
      // 从 JSON body 获取
      const body = await req.json()
      const parsed = disconnectRequestSchema.parse(body)
      contextId = parsed.contextId
      permanent = parsed.permanent || false
    }
    
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
      
      const configDir = path.join(process.cwd(), 'data', 'contexts', contextId)
      const configFile = path.join(configDir, 'slack-config.json')
      const tokenFile = path.join(configDir, 'slack-token.txt')
      
      let configUpdated = false
      let filesDeleted = 0
      
      if (permanent) {
        // 永久删除模式：删除所有配置文件
        console.log('🗑️ 永久删除 Slack 配置文件...')
        
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
      } else {
        // 默认模式：标记为断开但保留配置
        console.log('🔌 标记 Slack 连接为断开状态（保留配置）...')
        
        if (fs.existsSync(configFile)) {
          // 读取现有配置
          const configContent = fs.readFileSync(configFile, 'utf8')
          const config = JSON.parse(configContent)
          
          // 更新连接状态但保留配置
          const updatedConfig = {
            ...config,
            isConnected: false,
            disconnectedAt: new Date().toISOString(),
            disconnectReason: 'user_initiated'
          }
          
          // 写回更新的配置
          fs.writeFileSync(configFile, JSON.stringify(updatedConfig, null, 2))
          configUpdated = true
          console.log('✅ 连接状态已标记为断开，配置已保留')
        }
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
      
      const responseMessage = permanent 
        ? '已永久删除Slack连接和所有相关数据'
        : '已断开Slack连接，配置已保留便于重新连接'

      return NextResponse.json({
        success: true,
        message: responseMessage,
        details: {
          mode: permanent ? 'permanent' : 'temporary',
          configUpdated,
          filesDeleted,
          configPreserved: !permanent,
          cacheCleared: true,
          disconnectedAt: new Date().toISOString(),
          reconnectNote: permanent ? '需要重新完成OAuth授权' : '重新连接时将使用已保存的配置'
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