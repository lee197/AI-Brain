import { NextRequest, NextResponse } from 'next/server'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'

/**
 * 检查Google Workspace MCP服务器状态
 */
export async function GET(req: NextRequest) {
  try {
    const mcpClient = new GoogleWorkspaceMCPClient()
    
    // 检查MCP服务器连接
    const isConnected = await mcpClient.checkConnection()
    
    if (isConnected) {
      // 获取可用工具列表
      const tools = await mcpClient.listTools()
      
      return NextResponse.json({
        status: 'connected',
        server: 'http://localhost:8000/mcp',
        toolsAvailable: tools.length,
        tools: tools.slice(0, 10), // 只返回前10个工具名称
        message: 'Google Workspace MCP server is running and responsive'
      })
    } else {
      return NextResponse.json({
        status: 'disconnected',
        server: 'http://localhost:8000/mcp',
        error: 'MCP server is not accessible',
        fallback: 'Using direct Gmail API integration',
        message: 'MCP server offline - system will use fallback methods'
      })
    }
  } catch (error) {
    console.error('MCP status check error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: 'Using direct Gmail API integration',
      message: 'MCP server check failed - system will use fallback methods'
    }, { status: 500 })
  }
}