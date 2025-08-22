/**
 * Google Calendar OAuth回调处理端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { googleAuthClient } from '@/lib/google-workspace/auth-client'
import fs from 'fs/promises'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    
    if (!code) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/contexts?error=calendar_auth_failed`)
    }

    // 从state参数中提取contextId
    const contextId = state || 'default'

    // 交换授权码获取token
    const tokenResult = await googleAuthClient.exchangeCodeForTokens(code, 'calendar')
    
    if (!tokenResult.success || !tokenResult.tokens) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/contexts?error=calendar_token_failed`)
    }

    // 获取用户信息
    const userInfoResult = await googleAuthClient.getUserInfo(tokenResult.tokens)
    
    if (!userInfoResult.success) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/contexts?error=calendar_userinfo_failed`)
    }

    // 保存认证数据
    const authData = {
      credentials: tokenResult.tokens,
      userInfo: userInfoResult.userInfo,
      connectedAt: new Date().toISOString(),
      lastSync: new Date().toISOString()
    }

    // 确保目录存在
    const dataDir = path.join(process.cwd(), 'data', 'google-calendar')
    await fs.mkdir(dataDir, { recursive: true })

    // 保存到文件
    const authFile = path.join(dataDir, `${contextId}.json`)
    await fs.writeFile(authFile, JSON.stringify(authData, null, 2))

    console.log('✅ Google Calendar认证成功:', {
      contextId,
      email: userInfoResult.userInfo?.email,
      connectedAt: authData.connectedAt
    })

    // 重定向到Google Calendar事件页面
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/contexts/${contextId}/google-calendar/messages?calendar_success=true`)

  } catch (error: any) {
    console.error('Google Calendar OAuth回调处理失败:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/contexts?error=calendar_callback_failed`)
  }
}