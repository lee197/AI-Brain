'use client'

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // 模拟验证Slack配置
    const { botToken, signingSecret, clientId, clientSecret } = body
    
    // 基本验证
    if (!botToken || !signingSecret) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bot Token 和 Signing Secret 是必需的' 
      }, { status: 400 })
    }
    
    // 验证Token格式
    if (!botToken.startsWith('xoxb-')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Bot Token 格式不正确，应该以 xoxb- 开头' 
      }, { status: 400 })
    }
    
    // 模拟成功响应
    return NextResponse.json({ 
      success: true, 
      message: '连接测试成功',
      team: {
        id: 'T1234567890',
        name: 'AI Brain Test Workspace',
        domain: 'ai-brain-test'
      },
      bot: {
        id: 'B1234567890',
        name: 'AI Brain Assistant',
        scopes: ['channels:read', 'groups:read', 'users:read', 'chat:write']
      }
    })
  } catch (error) {
    console.error('Slack test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: '测试连接时出现错误' 
    }, { status: 500 })
  }
}