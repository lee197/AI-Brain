import { NextRequest, NextResponse } from 'next/server'
import { markConnected } from '@/lib/mcp/connection-state'

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

    console.log(`✅ Marking MCP Google Workspace as connected for context: ${contextId}`)

    // 标记为已连接
    await markConnected(contextId, 'google-workspace-mcp')

    return NextResponse.json({
      success: true,
      message: 'MCP Google Workspace marked as connected',
      contextId,
      mcpIntegration: true,
      connectedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ MCP Google Workspace connect error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Connect service error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}