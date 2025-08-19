import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/**
 * 断开当前Slack连接
 * 通过临时修改环境变量实现断开连接
 */
export async function POST(req: NextRequest) {
  try {
    const { contextId } = await req.json()
    
    if (!contextId) {
      return NextResponse.json({
        error: 'Missing contextId parameter'
      }, { status: 400 })
    }

    // 读取当前的.env.local文件
    const envPath = path.join(process.cwd(), '.env.local')
    
    if (!fs.existsSync(envPath)) {
      return NextResponse.json({
        error: '.env.local file not found'
      }, { status: 500 })
    }

    let envContent = fs.readFileSync(envPath, 'utf8')
    
    // 直接断开连接，不备份token
    const botTokenMatch = envContent.match(/SLACK_BOT_TOKEN=(.+)/)
    if (botTokenMatch && !botTokenMatch[1].includes('your-slack-bot-token')) {
      
      // 替换为断开状态
      envContent = envContent.replace(
        /SLACK_BOT_TOKEN=.+/,
        `SLACK_BOT_TOKEN=xoxb-your-slack-bot-token`
      )
      
      // 写回文件
      fs.writeFileSync(envPath, envContent)
      
      console.log('🔌 Slack连接已断开 - 用户主动断开')
      
      return NextResponse.json({
        success: true,
        message: 'Slack连接已断开',
        action: 'disconnected',
        contextId,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        error: 'Slack已经处于断开状态',
        action: 'already_disconnected'
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json({
      error: 'Failed to disconnect',
      message: error instanceof Error ? error.message : 'Unknown error'
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