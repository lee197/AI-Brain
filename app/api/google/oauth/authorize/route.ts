import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { contextId } = await req.json()
    
    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Missing context_id' },
        { status: 400 }
      )
    }

    // Google OAuth 2.0 配置
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: 'Google OAuth credentials not configured' },
        { status: 500 }
      )
    }

    // 构建授权URL
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/presentations.readonly'
    ]
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', `${siteUrl}/api/google/oauth/callback`)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('state', contextId) // 传递context_id作为state

    return NextResponse.json({
      success: true,
      authUrl: authUrl.toString(),
      message: 'Authorization URL generated'
    })

  } catch (error) {
    console.error('❌ Google OAuth authorize error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate authorization URL',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}