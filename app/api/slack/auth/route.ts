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

    // 获取当前访问的域名
    const currentHost = req.headers.get('host') || 'localhost:3000'
    
    // 构建重定向 URL - 使用当前域名（无论是 Vercel 还是 localhost）
    const protocol = currentHost.includes('localhost') ? 'http' : 'https'
    const SLACK_REDIRECT_URI = `${protocol}://${currentHost}/api/slack/redirect`
    
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