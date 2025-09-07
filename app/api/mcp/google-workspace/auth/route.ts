import { NextRequest, NextResponse } from 'next/server'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'
import { markConnected } from '@/lib/mcp/connection-state'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    const userEmail = searchParams.get('user_email') || 'user@example.com'

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Missing context_id' },
        { status: 400 }
      )
    }

    console.log(`🔐 Starting MCP Google Workspace auth for context: ${contextId}`)

    // 初始化 MCP 客户端
    const mcpClient = new GoogleWorkspaceMCPClient()
    
    try {
      // 检查 MCP 服务器连接
      const isConnected = await mcpClient.checkConnection()
      
      if (!isConnected) {
        return NextResponse.json({
          success: false,
          error: 'MCP server not available. Please ensure Google Workspace MCP server is running.',
          details: 'Run: uvx workspace-mcp --single-user --tools gmail drive calendar --transport streamable-http'
        }, { status: 503 })
      }

      // 获取可用工具列表来验证MCP服务器是否已配置认证
      const toolsList = await mcpClient.listTools()
      console.log(`📋 Available MCP tools: ${toolsList.length} tools found`)
      
      // 如果有工具可用，说明MCP服务器已经配置了认证
      if (toolsList.length > 0) {
        // 标记为已连接
        await markConnected(contextId, 'google-workspace-mcp')
        console.log(`✅ Marked Google Workspace MCP as connected for context: ${contextId}`)
        
        return NextResponse.json({
          success: true,
          message: 'Google Workspace MCP already configured and connected',
          authenticated: true,
          contextId,
          mcpIntegration: true,
          toolsAvailable: toolsList.length,
          connectedAt: new Date().toISOString()
        })
      }
      
      // 如果没有工具，尝试启动认证流程（保留原有逻辑作为后备）
      const authResult = await mcpClient.sendRequest('tools/call', {
        name: 'start_google_auth',
        arguments: {
          service_name: 'gmail', // 可以是 gmail, drive, calendar 或 all
          user_google_email: userEmail
        }
      })

      console.log('📧 MCP auth result:', authResult)

      // 检查是否包含 OAuth URL
      if (authResult?.content?.[0]?.text?.includes('Authorization URL:')) {
        const content = authResult.content[0].text
        const urlMatch = content.match(/Authorization URL: (https:\/\/[^\s]+)/i)
        
        if (urlMatch) {
          const authUrl = urlMatch[1]
          console.log('🔗 Extracted OAuth URL:', authUrl)
          
          const enhancedAuthUrl = authUrl
          console.log('🔗 OAuth URL ready for user:', enhancedAuthUrl)
          
          return NextResponse.json({
            success: true,
            authUrl: enhancedAuthUrl,
            message: 'Please complete Google OAuth authentication',
            contextId,
            mcpIntegration: true,
            requiresAuth: true,
            instructionMessage: '完成Google认证后，请关闭认证窗口并返回此页面。页面将自动检测认证状态。 | After completing Google authentication, please close the auth window and return to this page. The page will automatically detect the authentication status.'
          })
        }
      }

      // 检查是否是 OAuth 配置错误
      if (authResult?.structuredContent?.result?.includes('Authentication Error') && 
          authResult.structuredContent.result.includes('OAuth client credentials not found')) {
        return NextResponse.json({
          success: false,
          error: 'MCP OAuth Configuration Missing',
          message: 'Google OAuth credentials are not configured in the MCP server',
          details: 'Please set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET environment variables for the MCP server',
          instructions: [
            '1. Stop the MCP server if running',
            '2. Set environment variables: GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET', 
            '3. Restart MCP server: uvx workspace-mcp --single-user --tools gmail drive calendar --transport streamable-http',
            '4. Return here and click "Quick Connect" again'
          ],
          contextId,
          mcpIntegration: true
        }, { status: 400 })
      }

      // 如果有认证 URL，重定向用户
      if (authResult?.auth_url) {
        return NextResponse.json({
          success: true,
          authUrl: authResult.auth_url,
          message: 'Please complete Google OAuth flow',
          contextId,
          mcpIntegration: true
        })
      }

      // 如果已经认证，返回成功状态
      if (authResult?.result?.includes('authenticated') || authResult?.result?.includes('authorized')) {
        // 标记为已连接
        await markConnected(contextId, 'google-workspace-mcp')
        console.log(`✅ Marked Google Workspace MCP as connected for context: ${contextId}`)
        
        return NextResponse.json({
          success: true,
          message: 'Already authenticated via MCP',
          authenticated: true,
          contextId,
          mcpIntegration: true
        })
      }

      // 返回 MCP 的原始结果
      return NextResponse.json({
        success: false,
        error: 'MCP Authentication Issue',
        result: authResult,
        contextId,
        mcpIntegration: true,
        message: 'MCP server response requires attention'
      }, { status: 400 })

    } catch (mcpError) {
      console.error('❌ MCP auth error:', mcpError)
      
      return NextResponse.json({
        success: false,
        error: 'MCP authentication failed',
        details: mcpError instanceof Error ? mcpError.message : String(mcpError),
        fallbackSuggestion: 'Try direct Google OAuth integration as fallback'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Google Workspace MCP auth error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Authentication service error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// 处理 OAuth 回调（如果需要）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contextId, authCode, state } = body

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Missing context_id' },
        { status: 400 }
      )
    }

    console.log(`🔄 Processing MCP OAuth callback for context: ${contextId}`)

    // 这里可以处理 OAuth 回调，如果 MCP 服务器需要
    // 目前大多数 MCP 服务器自己处理 OAuth 流程

    // 标记为已连接 (假设callback意味着认证成功)
    await markConnected(contextId, 'google-workspace-mcp')
    console.log(`✅ Marked Google Workspace MCP as connected via callback for context: ${contextId}`)

    return NextResponse.json({
      success: true,
      message: 'OAuth callback processed via MCP',
      contextId,
      mcpIntegration: true
    })

  } catch (error) {
    console.error('❌ MCP OAuth callback error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'OAuth callback processing failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}