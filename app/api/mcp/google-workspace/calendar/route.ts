import { NextRequest, NextResponse } from 'next/server'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    const maxResults = parseInt(searchParams.get('max') || '10')
    const timeMin = searchParams.get('time_min') // Don't set default here - let MCP client handle it
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!contextId) {
      return NextResponse.json(
        { success: false, error: 'Missing context_id' },
        { status: 400 }
      )
    }

    console.log(`📅 Fetching Calendar events for context: ${contextId}`)

    // Initialize MCP client
    const mcpClient = new GoogleWorkspaceMCPClient()
    
    try {
      // Check connection first
      const isConnected = await mcpClient.checkConnection()
      
      if (!isConnected) {
        return NextResponse.json({
          success: false,
          error: 'MCP server not available',
          events: []
        }, { status: 503 })
      }

      // Get calendar events via MCP with pagination
      const actualLimit = Math.min(limit, 50) // Cap at 50 per page for performance
      const totalResults = Math.max(actualLimit * 10, 100) // Fetch more for accurate pagination
      const allEvents = await mcpClient.getCalendarEvents(timeMin, totalResults)
      
      // Apply client-side pagination
      const startIndex = (page - 1) * actualLimit
      const endIndex = startIndex + actualLimit
      const events = allEvents.slice(startIndex, endIndex)
      const totalCount = allEvents.length
      
      console.log(`📅 Retrieved ${events.length}/${totalCount} Calendar events (Page ${page})`)

      return NextResponse.json({
        success: true,
        events,
        totalCount,
        page,
        limit: actualLimit,
        totalPages: Math.ceil(totalCount / actualLimit),
        timeMin: timeMin || 'auto-calculated-range',
        mcpIntegration: true
      })

    } catch (mcpError) {
      console.error('❌ MCP Calendar fetch error:', mcpError)
      
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch Calendar events via MCP',
        details: mcpError instanceof Error ? mcpError.message : String(mcpError),
        events: []
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Calendar MCP endpoint error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Calendar service error',
      details: error instanceof Error ? error.message : String(error),
      events: []
    }, { status: 500 })
  }
}