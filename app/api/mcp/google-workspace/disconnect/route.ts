import { NextRequest, NextResponse } from 'next/server'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'
import { markDisconnected } from '@/lib/mcp/connection-state'

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Missing context_id' },
        { status: 400 }
      )
    }

    console.log(`🔌 Disconnecting MCP Google Workspace for context: ${contextId}`)

    // Initialize MCP client to gracefully close session
    const mcpClient = new GoogleWorkspaceMCPClient()
    
    try {
      // Check if there's an active connection first
      const isConnected = await mcpClient.checkConnection()
      
      if (isConnected) {
        console.log('🔄 Gracefully closing MCP session...')
        // Note: Most MCP servers handle session cleanup automatically
        // when client disconnects, but we can attempt graceful closure
        
        // For now, we'll just mark as disconnected in our system
        // Future enhancement: implement proper session termination
        console.log('✅ MCP session marked for cleanup')
      }

      // 重要：在应用层标记为已断开
      await markDisconnected(contextId, 'google-workspace-mcp')

      return NextResponse.json({
        success: true,
        message: 'MCP Google Workspace disconnected successfully',
        contextId,
        mcpIntegration: true,
        previouslyConnected: isConnected,
        disconnectedAt: new Date().toISOString()
      })

    } catch (mcpError) {
      console.warn('⚠️ MCP cleanup warning:', mcpError)
      // Even if MCP cleanup fails, we still consider the disconnect successful
      // from the UI perspective
      
      // 仍然标记为已断开，即使 MCP 清理失败
      await markDisconnected(contextId, 'google-workspace-mcp')
      
      return NextResponse.json({
        success: true,
        message: 'MCP Google Workspace disconnected (with cleanup warning)',
        contextId,
        mcpIntegration: true,
        warning: 'MCP server cleanup failed but disconnection completed',
        disconnectedAt: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ MCP Google Workspace disconnect error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Disconnect service error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}