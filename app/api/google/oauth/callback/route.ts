import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // 这是contextId
    const error = searchParams.get('error')
    
    if (error) {
      console.error('❌ OAuth authorization error:', error)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/contexts/${state}/google-workspace-mcp/messages?auth=error&message=${encodeURIComponent(error)}`)
    }
    
    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/contexts/${state}/google-workspace-mcp/messages?auth=error&message=Missing+authorization+code`)
    }

    // 交换授权码获取tokens
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const redirectUri = `${siteUrl}/api/google/oauth/callback`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('❌ Token exchange failed:', errorData)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/contexts/${state}/google-workspace-mcp/messages?auth=error&message=Token+exchange+failed`)
    }

    const tokens = await tokenResponse.json()

    if (!tokens.refresh_token) {
      console.error('❌ No refresh token received:', tokens)
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/contexts/${state}/google-workspace-mcp/messages?auth=error&message=No+refresh+token+received`)
    }

    // 这里您可以将refresh token保存到数据库或环境变量
    // 暂时通过URL参数传递（生产环境应该用更安全的方式）
    console.log('✅ OAuth authorization successful!')
    console.log('🔑 Refresh Token:', tokens.refresh_token.substring(0, 20) + '...')
    
    // 成功页面，显示refresh token
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/contexts/${state}/google-workspace-mcp/messages?auth=success&refresh_token=${encodeURIComponent(tokens.refresh_token)}`
    
    return NextResponse.redirect(successUrl)

  } catch (error) {
    console.error('❌ OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}?auth=error&message=OAuth+callback+failed`)
  }
}