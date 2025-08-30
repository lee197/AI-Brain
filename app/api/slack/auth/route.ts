import { NextRequest, NextResponse } from 'next/server'

// Slack OAuth configuration
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '9357659075127.9357750428823'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const contextId = searchParams.get('context_id')
    
    if (!contextId) {
      return NextResponse.json({ error: 'Context ID is required' }, { status: 400 })
    }

    // 始终使用当前的 ngrok URL 进行重定向，这样 Slack App 中只需要配置一个固定的 URL
    const currentHost = req.headers.get('host') || 'localhost:3000'
    
    // 如果是 localhost 访问，强制重定向到 ngrok URL 以保持一致性
    if (currentHost.includes('localhost')) {
      const ngrokUrl = process.env.NGROK_URL || 'https://25c6f1ccf0bf.ngrok-free.app'
      return NextResponse.redirect(`${ngrokUrl}/api/slack/auth?context_id=${contextId}`)
    }
    
    // 使用固定的 ngrok 重定向 URL（已在 Slack App 中配置）
    const SLACK_REDIRECT_URI = `https://${currentHost}/api/slack/redirect`
    
    console.log('🔗 Redirect URI:', SLACK_REDIRECT_URI)
    console.log('📍 Current host:', currentHost)

    // Generate a state parameter to prevent CSRF attacks
    const state = Buffer.from(JSON.stringify({ 
      contextId,
      timestamp: Date.now() 
    })).toString('base64')

    // Slack OAuth scopes we need
    const scopes = [
      'channels:read',      // Read channel information
      'channels:history',   // Read channel messages
      'chat:write',        // Send messages
      'groups:read',       // Read private channels
      'groups:history',    // Read private channel messages
      'im:read',          // Read direct messages
      'im:history',       // Read direct message history
      'mpim:read',        // Read group direct messages
      'mpim:history',     // Read group direct message history
      'users:read',       // Read user information
      'users:read.email', // Read user emails
      'team:read',        // Read team information
      'files:read',       // Read file information
    ].join(',')

    // Construct Slack OAuth URL
    const slackAuthUrl = new URL('https://slack.com/oauth/v2/authorize')
    slackAuthUrl.searchParams.append('client_id', SLACK_CLIENT_ID)
    slackAuthUrl.searchParams.append('scope', scopes)
    slackAuthUrl.searchParams.append('redirect_uri', SLACK_REDIRECT_URI)
    slackAuthUrl.searchParams.append('state', state)
    
    // Use user_scope for user token (optional)
    // slackAuthUrl.searchParams.append('user_scope', 'identity.basic,identity.email')

    console.log('🔗 Redirecting to Slack OAuth:', slackAuthUrl.toString())
    
    // Redirect to Slack OAuth page
    return NextResponse.redirect(slackAuthUrl.toString())
  } catch (error) {
    console.error('Slack auth error:', error)
    return NextResponse.json({ 
      error: 'Failed to initiate Slack authentication',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}