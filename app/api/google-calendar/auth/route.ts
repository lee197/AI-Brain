/**
 * Google Calendar OAuth认证初始化端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { googleAuthClient } from '@/lib/google-workspace/auth-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    
    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    // 生成OAuth授权URL
    const authUrl = googleAuthClient.generateAuthUrl(contextId, 'calendar')
    
    return NextResponse.json({
      success: true,
      authUrl,
      message: '授权URL生成成功'
    })

  } catch (error: any) {
    console.error('Google Calendar OAuth初始化失败:', error)
    return NextResponse.json({
      success: false,
      error: 'OAuth初始化失败',
      details: error.message
    }, { status: 500 })
  }
}