/**
 * Google Workspace OAuth回调处理端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { googleAuthClient } from '@/lib/google-workspace/auth-client'
import fs from 'fs/promises'
import path from 'path'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // contextId
    const error = searchParams.get('error')

    // 处理用户拒绝授权的情况
    if (error) {
      const redirectUrl = state 
        ? `/contexts/${state}?google_auth=denied`
        : `/contexts?google_auth=denied`
      
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    if (!code) {
      const redirectUrl = state 
        ? `/contexts/${state}?google_auth=error&message=missing_code`
        : `/contexts?google_auth=error&message=missing_code`
      
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // 交换授权码获取tokens
    const credentials = await googleAuthClient.exchangeCodeForTokens(code)
    
    if (!credentials) {
      const redirectUrl = state 
        ? `/contexts/${state}?google_auth=error&message=token_exchange_failed`
        : `/contexts?google_auth=error&message=token_exchange_failed`
      
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // 获取用户信息
    const userInfo = await googleAuthClient.getUserInfo(credentials.access_token)
    
    if (!userInfo) {
      const redirectUrl = state 
        ? `/contexts/${state}?google_auth=error&message=user_info_failed`
        : `/contexts?google_auth=error&message=user_info_failed`
      
      return NextResponse.redirect(new URL(redirectUrl, req.url))
    }

    // 保存认证信息到文件（生产环境应该保存到数据库）
    const contextId = state || 'default'
    const authData = {
      contextId,
      credentials,
      userInfo,
      connectedAt: new Date().toISOString(),
      lastSync: null
    }

    // 确保目录存在
    const authDir = path.join(process.cwd(), 'data', 'google-workspace')
    await fs.mkdir(authDir, { recursive: true })

    // 保存认证信息
    const authFile = path.join(authDir, `${contextId}.json`)
    await fs.writeFile(authFile, JSON.stringify(authData, null, 2))

    console.log(`Google Workspace认证成功: ${userInfo.email} (Context: ${contextId})`)

    // 重定向回context页面，带上成功参数
    const redirectUrl = `/contexts/${contextId}?google_auth=success&email=${encodeURIComponent(userInfo.email)}`
    return NextResponse.redirect(new URL(redirectUrl, req.url))

  } catch (error) {
    console.error('Google OAuth回调处理失败:', error)
    
    const redirectUrl = '/contexts?google_auth=error&message=callback_error'
    return NextResponse.redirect(new URL(redirectUrl, req.url))
  }
}