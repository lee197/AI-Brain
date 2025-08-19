import { NextRequest, NextResponse } from 'next/server'
import { generateOneClickInstallUrl } from '@/lib/slack/master-app'

/**
 * 真正的一键Slack安装
 * 用户无需任何配置，完全自动化
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id') || ''
    const isDemoMode = searchParams.get('demo') === 'true'
    
    if (!contextId) {
      throw new Error('Missing context_id parameter')
    }
    
    // 演示模式：快速模拟安装成功
    if (isDemoMode) {
      console.log('🔧 演示模式：模拟Slack安装成功')
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/contexts/${contextId}?slack_success=true&demo=true`)
    }
    
    // 生成真正的一键安装URL
    const installUrl = generateOneClickInstallUrl(contextId)
    
    console.log('🚀 一键安装：重定向到Slack OAuth')
    return NextResponse.redirect(installUrl)
    
  } catch (error) {
    console.error('❌ Install error:', error)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const errorMessage = encodeURIComponent(error instanceof Error ? error.message : 'Installation failed')
    return NextResponse.redirect(`${baseUrl}?slack_error=${errorMessage}`)
  }
}