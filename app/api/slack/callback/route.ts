import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getEnvironmentConfig, getSlackRedirectUri } from '@/lib/environment'

// Slack OAuth configuration
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '9357659075127.9357750428823'
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || '646e389189541340c0ec7406d0362613'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // 使用智能环境检测
    const envConfig = getEnvironmentConfig()
    const baseUrl = envConfig.baseUrl
    
    // Handle OAuth errors
    if (error) {
      console.error('Slack OAuth error:', error)
      return NextResponse.redirect(`${baseUrl}/contexts?error=slack_auth_denied`)
    }
    
    if (!code || !state) {
      return NextResponse.redirect(`${baseUrl}/contexts?error=invalid_oauth_response`)
    }
    
    // Decode and validate state
    let stateData
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch (e) {
      console.error('Invalid state parameter:', e)
      return NextResponse.redirect(`${baseUrl}/contexts?error=invalid_state`)
    }
    
    const { contextId } = stateData
    
    // 使用智能环境检测获取重定向URI
    const SLACK_REDIRECT_URI = getSlackRedirectUri(req)
    
    console.log('🔗 Using redirect URI for token exchange:', SLACK_REDIRECT_URI)
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: SLACK_CLIENT_ID,
        client_secret: SLACK_CLIENT_SECRET,
        code: code,
        redirect_uri: SLACK_REDIRECT_URI,
      }),
    })
    
    const tokenData = await tokenResponse.json()
    
    if (!tokenData.ok) {
      console.error('Failed to exchange code for token:', tokenData)
      return NextResponse.redirect(`${baseUrl}/contexts/${contextId}/settings?tab=overview&error=slack_auth_failed`)
    }
    
    console.log('✅ Slack OAuth successful!')
    console.log('Team:', tokenData.team)
    console.log('Bot User ID:', tokenData.bot_user_id)
    console.log('Scopes:', tokenData.scope)
    
    // Save the Slack configuration
    const configDir = path.join(process.cwd(), 'data', 'contexts', contextId)
    await fs.mkdir(configDir, { recursive: true })
    
    const configFile = path.join(configDir, 'slack-config.json')
    const config = {
      accessToken: tokenData.access_token,
      botUserId: tokenData.bot_user_id,
      teamId: tokenData.team.id,
      teamName: tokenData.team.name,
      scope: tokenData.scope,
      appId: tokenData.app_id,
      isConnected: true,
      connectedAt: new Date().toISOString(),
      contextId: contextId,
    }
    
    await fs.writeFile(configFile, JSON.stringify(config, null, 2))
    
    // Also save the token for the Slack API client
    const tokenFile = path.join(configDir, 'slack-token.txt')
    await fs.writeFile(tokenFile, tokenData.access_token)
    
    console.log('💾 Saved Slack configuration for context:', contextId)
    
    // Redirect back to settings page with success message
    return NextResponse.redirect(`${baseUrl}/contexts/${contextId}/settings?tab=overview&success=slack_connected`)
  } catch (error) {
    console.error('Slack callback error:', error)
    return NextResponse.redirect(`${baseUrl}/contexts?error=slack_callback_failed`)
  }
}