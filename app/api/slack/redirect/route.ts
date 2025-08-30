import { NextRequest, NextResponse } from 'next/server'
import { getEnvironmentConfig } from '@/lib/environment'

/**
 * 通用 Slack OAuth 重定向处理器
 * 这个端点可以处理来自任何域名的重定向，然后转发到实际的回调处理器
 */
export async function GET(req: NextRequest) {
  try {
    // 获取所有查询参数
    const url = new URL(req.url)
    const params = url.searchParams
    
    // 使用智能环境检测构建回调 URL
    const envConfig = getEnvironmentConfig()
    const callbackUrl = new URL(`${envConfig.baseUrl}/api/slack/callback`)
    
    // 复制所有查询参数
    params.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value)
    })
    
    console.log('🔄 Redirecting from universal handler to callback:', callbackUrl.toString())
    
    // 重定向到本地回调处理器
    return NextResponse.redirect(callbackUrl.toString())
  } catch (error) {
    console.error('Slack redirect handler error:', error)
    return NextResponse.json({ 
      error: 'Redirect failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}