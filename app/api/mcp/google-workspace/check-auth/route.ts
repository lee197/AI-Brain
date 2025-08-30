import { NextRequest, NextResponse } from 'next/server'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'
import { markConnected } from '@/lib/mcp/connection-state'

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

    console.log(`🔍 Checking MCP Google Workspace authentication status for context: ${contextId}`)

    // 初始化 MCP 客户端
    const mcpClient = new GoogleWorkspaceMCPClient()
    
    try {
      // 检查 MCP 服务器连接
      const isConnected = await mcpClient.checkConnection()
      
      if (!isConnected) {
        return NextResponse.json({
          success: false,
          authenticated: false,
          error: 'MCP server not available'
        }, { status: 503 })
      }

      // 尝试调用一个需要认证的 MCP 工具来测试认证状态
      try {
        const testResult = await mcpClient.sendRequest('tools/call', {
          name: 'list_calendars',
          arguments: {}
        })
        
        // 如果调用成功，说明已认证
        if (testResult && !testResult.error) {
          console.log('✅ MCP Google Workspace authentication verified')
          
          // 标记为已连接
          await markConnected(contextId, 'google-workspace-mcp')
          
          return NextResponse.json({
            success: true,
            authenticated: true,
            message: 'Google Workspace MCP authentication successful',
            contextId,
            mcpIntegration: true,
            connectedAt: new Date().toISOString()
          })
        }
      } catch (authError) {
        console.log('❌ MCP authentication test failed:', authError)
      }

      // 认证未完成或失败
      return NextResponse.json({
        success: true,
        authenticated: false,
        message: 'Google Workspace authentication not completed yet',
        contextId,
        mcpIntegration: true
      })

    } catch (mcpError) {
      console.error('❌ MCP auth check error:', mcpError)
      
      return NextResponse.json({
        success: false,
        authenticated: false,
        error: 'MCP authentication check failed',
        details: mcpError instanceof Error ? mcpError.message : String(mcpError)
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Auth check service error:', error)
    
    return NextResponse.json({
      success: false,
      authenticated: false,
      error: 'Authentication check service error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}