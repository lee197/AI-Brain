import { NextRequest, NextResponse } from 'next/server'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'
import { isConnected, getConnectionDetails } from '@/lib/mcp/connection-state'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Missing context_id' },
        { status: 400 }
      )
    }

    console.log(`📊 Checking MCP Google Workspace status for context: ${contextId}`)

    // 首先检查应用层连接状态
    const appConnected = await isConnected(contextId, 'google-workspace-mcp')
    const connectionDetails = await getConnectionDetails(contextId, 'google-workspace-mcp')

    // 如果应用层标记为已断开，直接返回断开状态
    if (!appConnected) {
      return NextResponse.json({
        connected: false,
        mcpIntegration: true,
        mcpServer: {
          status: 'disconnected',
          toolsAvailable: 0,
          authenticationStatus: 'disconnected'
        },
        services: {
          gmail: { connected: false, error: 'Disconnected by user' },
          drive: { connected: false, error: 'Disconnected by user' },
          calendar: { connected: false, error: 'Disconnected by user' }
        },
        contextId,
        totalTools: 0,
        disconnectedAt: connectionDetails?.disconnectedAt,
        message: 'Google Workspace MCP integration is disconnected'
      })
    }

    // 初始化 MCP 客户端
    const mcpClient = new GoogleWorkspaceMCPClient()
    
    try {
      // 检查 MCP 服务器连接
      const serverConnected = await mcpClient.checkConnection()
      
      if (!serverConnected) {
        return NextResponse.json({
          connected: false,
          error: 'MCP server not available',
          mcpIntegration: true,
          services: {
            gmail: { connected: false, error: 'MCP server offline' },
            drive: { connected: false, error: 'MCP server offline' },
            calendar: { connected: false, error: 'MCP server offline' }
          },
          suggestions: [
            'Start MCP server: uvx workspace-mcp --single-user --tools gmail drive calendar --transport streamable-http',
            'Check server logs for authentication status',
            'Ensure Google credentials are configured'
          ]
        })
      }

      // 获取可用工具列表
      const tools = await mcpClient.listTools()
      console.log('🛠️ Available MCP tools:', tools)

      // 检查各个 Google 服务的状态
      const services = {
        gmail: {
          connected: tools.some(tool => tool.includes('gmail')),
          tools: tools.filter(tool => tool.includes('gmail')),
          capabilities: tools.filter(tool => tool.includes('gmail')).map(tool => {
            if (tool.includes('search')) return 'search'
            if (tool.includes('send')) return 'send'
            if (tool.includes('read')) return 'read'
            if (tool.includes('label')) return 'labels'
            return 'other'
          })
        },
        drive: {
          connected: tools.some(tool => tool.includes('drive')),
          tools: tools.filter(tool => tool.includes('drive')),
          capabilities: tools.filter(tool => tool.includes('drive')).map(tool => {
            if (tool.includes('search')) return 'search'
            if (tool.includes('read')) return 'read'
            if (tool.includes('create')) return 'create'
            if (tool.includes('list')) return 'list'
            return 'other'
          })
        },
        calendar: {
          connected: tools.some(tool => tool.includes('calendar') || tool.includes('event')),
          tools: tools.filter(tool => tool.includes('calendar') || tool.includes('event')),
          capabilities: tools.filter(tool => tool.includes('calendar') || tool.includes('event')).map(tool => {
            if (tool.includes('list')) return 'list'
            if (tool.includes('get')) return 'read'
            if (tool.includes('create')) return 'create'
            if (tool.includes('update')) return 'update'
            return 'other'
          })
        }
      }

      // 尝试测试实际 API 调用（可选）
      let authenticationStatus = 'unknown'
      try {
        // 快速测试调用，看是否需要认证
        await mcpClient.sendRequest('tools/call', {
          name: 'list_calendars',
          arguments: {
            user_google_email: 'test@example.com'
          }
        })
        authenticationStatus = 'authenticated'
      } catch (error) {
        if (error instanceof Error && error.message.includes('auth')) {
          authenticationStatus = 'requires_auth'
        } else {
          authenticationStatus = 'error'
        }
      }

      const overallConnected = Object.values(services).some(service => service.connected)

      return NextResponse.json({
        connected: overallConnected,
        mcpIntegration: true,
        mcpServer: {
          status: 'online',
          toolsAvailable: tools.length,
          authenticationStatus
        },
        services,
        contextId,
        totalTools: tools.length,
        recommendations: authenticationStatus === 'requires_auth' ? 
          ['Complete Google OAuth authentication via MCP'] : 
          ['MCP integration ready to use']
      })

    } catch (mcpError) {
      console.error('❌ MCP status check error:', mcpError)
      
      return NextResponse.json({
        connected: false,
        error: 'MCP status check failed',
        details: mcpError instanceof Error ? mcpError.message : String(mcpError),
        mcpIntegration: true,
        services: {
          gmail: { connected: false, error: 'Status check failed' },
          drive: { connected: false, error: 'Status check failed' },
          calendar: { connected: false, error: 'Status check failed' }
        }
      })
    }

  } catch (error) {
    console.error('❌ Google Workspace MCP status error:', error)
    
    return NextResponse.json({
      connected: false,
      error: 'Status service error',
      details: error instanceof Error ? error.message : String(error),
      mcpIntegration: true
    }, { status: 500 })
  }
}