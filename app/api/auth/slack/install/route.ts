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
    
    if (!contextId) {
      throw new Error('Missing context_id parameter')
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