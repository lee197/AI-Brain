import { NextRequest, NextResponse } from 'next/server'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    const query = searchParams.get('query') || 'in:inbox'  // 默认获取收件箱所有邮件
    const maxResults = parseInt(searchParams.get('max') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Missing context_id' },
        { status: 400 }
      )
    }

    console.log(`📧 Fetching Gmail messages for context: ${contextId}`)

    // Initialize MCP client
    const mcpClient = new GoogleWorkspaceMCPClient()
    
    try {
      // Check connection first
      const isConnected = await mcpClient.checkConnection()
      
      if (!isConnected) {
        return NextResponse.json({
          success: false,
          error: 'MCP server not available',
          messages: []
        }, { status: 503 })
      }

      // Search Gmail messages via MCP with pagination
      const actualLimit = Math.min(limit, 50) // Cap at 50 per page for performance
      const totalResults = Math.max(actualLimit * 10, 100) // Fetch more for accurate pagination
      
      const allMessages = await mcpClient.searchGmail(query, totalResults)
      
      // Apply client-side pagination
      const startIndex = (page - 1) * actualLimit
      const endIndex = startIndex + actualLimit
      const messages = allMessages.slice(startIndex, endIndex)
      const totalCount = allMessages.length
      
      console.log(`📧 Retrieved ${messages.length}/${totalCount} Gmail messages (Page ${page})`)

      return NextResponse.json({
        success: true,
        messages,
        totalCount,
        page,
        limit: actualLimit,
        totalPages: Math.ceil(totalCount / actualLimit),
        query,
        mcpIntegration: true
      })

    } catch (mcpError) {
      console.error('❌ MCP Gmail fetch error:', mcpError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Gmail messages via MCP',
        details: mcpError instanceof Error ? mcpError.message : String(mcpError),
        messages: []
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Gmail MCP endpoint error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Gmail service error',
      details: error instanceof Error ? error.message : String(error),
      messages: []
    }, { status: 500 })
  }
}