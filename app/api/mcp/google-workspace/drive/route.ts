import { NextRequest, NextResponse } from 'next/server'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    const query = searchParams.get('query') || ''
    const maxResults = parseInt(searchParams.get('max') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Missing context_id' },
        { status: 400 }
      )
    }

    console.log(`📁 Fetching Drive files for context: ${contextId}`)

    // Initialize MCP client
    const mcpClient = new GoogleWorkspaceMCPClient()
    
    try {
      // Check connection first
      const isConnected = await mcpClient.checkConnection()
      
      if (!isConnected) {
        return NextResponse.json({
          success: false,
          error: 'MCP server not available',
          files: []
        }, { status: 503 })
      }

      // Search Drive files via MCP with pagination
      const actualLimit = Math.min(limit, 50) // Cap at 50 per page for performance
      const totalResults = Math.max(actualLimit * 10, 100) // Fetch more for accurate pagination
      
      let allFiles
      if (query.trim()) {
        allFiles = await mcpClient.searchDrive(query, totalResults)
      } else {
        // Get recent files if no query
        allFiles = await mcpClient.getRecentDriveFiles(totalResults)
      }
      
      // Apply client-side pagination
      const startIndex = (page - 1) * actualLimit
      const endIndex = startIndex + actualLimit
      const files = allFiles.slice(startIndex, endIndex)
      const totalCount = allFiles.length
      
      console.log(`📁 Retrieved ${files.length}/${totalCount} Drive files (Page ${page})`)

      return NextResponse.json({
        success: true,
        files,
        totalCount,
        page,
        limit: actualLimit,
        totalPages: Math.ceil(totalCount / actualLimit),
        query,
        mcpIntegration: true
      })

    } catch (mcpError) {
      console.error('❌ MCP Drive fetch error:', mcpError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Drive files via MCP',
        details: mcpError instanceof Error ? mcpError.message : String(mcpError),
        files: []
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Drive MCP endpoint error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Drive service error',
      details: error instanceof Error ? error.message : String(error),
      files: []
    }, { status: 500 })
  }
}