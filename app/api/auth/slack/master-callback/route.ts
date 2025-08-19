import { NextRequest, NextResponse } from 'next/server'
import { 
  exchangeCodeForTokens, 
  storeUserSlackInstallation 
} from '@/lib/slack/master-app'

/**
 * Master Slack App OAuth回调处理
 * 实现真正的一键安装 - 用户无需任何配置
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // 处理用户拒绝授权
    if (error) {
      console.log('User denied Slack authorization:', error)
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}?slack_error=access_denied`)
    }
    
    if (!code || !state) {
      throw new Error('Missing authorization code or state')
    }
    
    // 解析state获取contextId和userHash
    const [contextId, userHash] = state.split(':')
    if (!contextId || !userHash) {
      throw new Error('Invalid state parameter')
    }
    
    console.log('🔄 Processing Slack installation for context:', contextId)
    
    // 使用Master App exchange tokens
    const tokens = await exchangeCodeForTokens(code)
    
    console.log('✅ Successfully obtained tokens for team:', tokens.teamName)
    
    // 存储用户的Slack安装信息
    await storeUserSlackInstallation({
      contextId,
      userHash, 
      tokens,
      teamId: tokens.teamId,
      teamName: tokens.teamName
    })
    
    console.log('💾 Installation stored successfully')
    
    // 重定向回用户的context页面，显示成功
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUrl = `${baseUrl}/contexts/${contextId}?slack_success=true&team=${encodeURIComponent(tokens.teamName)}`
    
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('❌ Master callback error:', error)
    
    // 重定向到错误页面
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const errorMessage = encodeURIComponent(error instanceof Error ? error.message : 'Installation failed')
    return NextResponse.redirect(`${baseUrl}?slack_error=${errorMessage}`)
  }
}

/**
 * 获取回调信息 (调试用)
 */
export async function POST() {
  return NextResponse.json({
    endpoint: '/api/auth/slack/master-callback',
    description: 'Master Slack App OAuth callback handler',
    flow: [
      '1. User clicks "Add to Slack"',
      '2. Redirected to Slack OAuth with Master App',
      '3. User authorizes (no app creation needed)',
      '4. Slack redirects back with code',
      '5. Exchange code for tokens automatically',
      '6. Store encrypted tokens for user',
      '7. Redirect back to user app with success'
    ],
    advantages: [
      'Zero configuration for users',
      'No manual token copying',
      'No Slack app creation required',
      'Automatic token management',
      'Secure encrypted storage',
      'True one-click experience'
    ]
  })
}