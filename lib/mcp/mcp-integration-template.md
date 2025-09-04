# MCP Integration Template 

## 🎯 MCP (Model Context Protocol) 标准化集成模式

Based on the successful Google Workspace MCP integration, this template provides a standardized approach for integrating any MCP server into AI Brain.

### 📁 File Structure Template

```
lib/mcp/
├── [source]-client.ts           # MCP Client Class
├── mcp-integration-template.md  # This template
└── types.ts                     # MCP protocol types

app/api/ai/
├── chat-enhanced/route.ts       # Enhanced AI endpoint with multi-MCP support
└── chat-[source]/route.ts       # Source-specific AI endpoint (optional)

types/
└── [source].ts                  # Source-specific TypeScript interfaces

.env.local
└── MCP_[SOURCE]_SERVER_URL      # MCP server configuration
```

### 🏗️ MCP Client Template (`lib/mcp/[source]-client.ts`)

```typescript
import { z } from 'zod'

// MCP Protocol Types
interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

// Source-specific context types
interface [Source]Context {
  // Define your data structure
  items: [Source]Item[]
  metadata?: Record<string, any>
}

interface [Source]Item {
  id: string
  title: string
  // Add source-specific fields
  timestamp: string
  author?: string
  content?: string
}

export class [Source]MCPClient {
  private baseUrl: string
  private requestId: number = 1
  private sessionId: string | null = null
  private initialized: boolean = false

  constructor(baseUrl: string = process.env.MCP_[SOURCE]_SERVER_URL || 'http://localhost:8000/mcp') {
    this.baseUrl = baseUrl
  }

  /**
   * Initialize MCP connection with proper session management
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      console.log('🔄 Initializing [Source] MCP connection...')
      
      // Step 1: Get session ID from initialization request
      const initResponse = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: this.requestId++,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'ai-brain',
              version: '1.0.0'
            }
          }
        })
      })

      // Extract session ID from response headers
      this.sessionId = initResponse.headers.get('mcp-session-id')
      
      if (!this.sessionId) {
        throw new Error('No session ID received from MCP server')
      }

      // Step 2: Parse the streaming response
      const responseText = await initResponse.text()
      const lines = responseText.split('\n')
      let jsonData = null
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            jsonData = JSON.parse(line.substring(6))
            break
          } catch (e) {
            // Continue looking for valid JSON
          }
        }
      }

      if (jsonData?.error) {
        throw new Error(`MCP initialization error: ${jsonData.error.message}`)
      }

      // Step 3: Send initialization notification
      await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'mcp-session-id': this.sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        })
      })

      this.initialized = true
      console.log('✅ [Source] MCP connection initialized with session:', this.sessionId)
    } catch (error) {
      console.error('❌ [Source] MCP initialization failed:', error)
      throw error
    }
  }

  /**
   * Send MCP request with session management and streaming response parsing
   */
  private async sendRequest(method: string, params?: any): Promise<any> {
    // Initialize connection if not already done
    if (!this.initialized) {
      await this.initialize()
    }

    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    }

    try {
      console.log(`🔄 Sending [Source] MCP request: ${method}`, params)
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      }

      if (this.sessionId) {
        headers['mcp-session-id'] = this.sessionId
      }
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Parse streaming response (Server-Sent Events format)
      const responseText = await response.text()
      const lines = responseText.split('\n')
      let jsonData = null
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            jsonData = JSON.parse(line.substring(6))
            break
          } catch (e) {
            // Continue looking for valid JSON
          }
        }
      }

      if (!jsonData) {
        // Fallback: try to parse entire response as JSON
        try {
          jsonData = JSON.parse(responseText)
        } catch (e) {
          throw new Error('Invalid MCP response format')
        }
      }
      
      if (jsonData.error) {
        throw new Error(`MCP error: ${jsonData.error.message}`)
      }

      console.log(`✅ [Source] MCP response received for ${method}`)
      return jsonData.result
    } catch (error) {
      console.error(`❌ [Source] MCP request failed for ${method}:`, error)
      throw error
    }
  }

  /**
   * Check MCP server connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      const result = await this.sendRequest('tools/list', {})
      return Array.isArray(result?.tools)
    } catch (error) {
      return false
    }
  }

  /**
   * Get available tools list
   */
  async listTools(): Promise<string[]> {
    try {
      const result = await this.sendRequest('tools/list', {})
      return result?.tools?.map((tool: any) => tool.name) || []
    } catch (error) {
      console.warn('Failed to list [Source] MCP tools:', error)
      return []
    }
  }

  /**
   * Search/Query source data
   * Replace with source-specific search method
   */
  async searchData(query: string, options: any = {}): Promise<[Source]Item[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: '[source]_search', // Replace with actual tool name
        arguments: {
          query,
          ...options
        }
      })

      return this.formatItems(result?.items || [])
    } catch (error) {
      console.warn('[Source] search failed:', error)
      return []
    }
  }

  /**
   * Get comprehensive context for AI
   */
  async getContext(userMessage: string): Promise<[Source]Context> {
    console.log(`🔍 Getting [Source] context for: "${userMessage}"`)

    try {
      // Parallel requests for different data types
      const [searchResults] = await Promise.allSettled([
        this.searchData(userMessage, { limit: 10 })
      ])

      const context: [Source]Context = {
        items: searchResults.status === 'fulfilled' ? searchResults.value : []
      }

      console.log(`📊 [Source] context loaded: ${context.items.length} items`)
      return context
    } catch (error) {
      console.warn('Failed to get [Source] context:', error)
      return { items: [] }
    }
  }

  /**
   * Format items for AI consumption
   */
  private formatItems(items: any[]): [Source]Item[] {
    return items.map(item => ({
      id: item.id || '',
      title: item.title || item.name || 'Untitled',
      timestamp: item.timestamp || new Date().toISOString(),
      author: item.author || item.creator,
      content: item.content || item.description || ''
    }))
  }

  /**
   * Build AI-friendly context string
   */
  buildContextString(context: [Source]Context): string {
    if (context.items.length === 0) {
      return ''
    }

    const contextString = context.items.map(item => {
      const time = new Date(item.timestamp).toLocaleString('zh-CN')
      return `[${time}] ${item.title}\n作者: ${item.author || 'Unknown'}\n内容: ${item.content || 'N/A'}`
    }).join('\n\n')

    return `## 📊 [Source] 数据 (${context.items.length}条)\n${contextString}`
  }
}
```

### 🔗 Integration into Enhanced AI Chat

Add to `app/api/ai/chat-enhanced/route.ts`:

```typescript
import { [Source]MCPClient } from '@/lib/mcp/[source]-client'

// Inside POST function:
let [source]Context = ''

if (include[Source]) {
  try {
    console.log(`🔍 Loading [Source] context via MCP for contextId: ${contextId}`)
    
    const mcpClient = new [Source]MCPClient()
    
    // Check MCP server connection
    const isConnected = await mcpClient.checkConnection()
    if (!isConnected) {
      console.warn('⚠️ [Source] MCP server not available, skipping context')
    } else {
      // Get comprehensive context
      const context = await mcpClient.getContext(message)
      [source]Context = mcpClient.buildContextString(context)
      
      console.log(`📊 [Source] context loaded: ${context.items.length} items`)
    }
  } catch (mcpError) {
    console.warn('⚠️ Failed to load [Source] context via MCP:', mcpError)
  }
}

// Update buildEnhancedPrompt to include [source]Context
const enhancedMessage = buildEnhancedPrompt(message, slackContext, googleWorkspaceContext, [source]Context)
```

### 🔧 Environment Configuration

Add to `.env.local`:

```env
# [Source] MCP Configuration
MCP_[SOURCE]_SERVER_URL=http://localhost:8000/mcp
ENABLE_MCP_[SOURCE]=true
```

### 🖥️ MCP Server Setup

1. **Install MCP Server**:
   ```bash
   # Method 1: Using uvx (Python)
   uvx [source-mcp-package] --tools [tool1] [tool2] --transport streamable-http

   # Method 2: Using npm (Node.js)
   npm install -g @[source]/mcp-server
   [source]-mcp-server --port 8000

   # Method 3: Using Docker
   docker run -p 8000:8000 [source-mcp-image]
   ```

2. **Test Server Connection**:
   ```bash
   curl -X POST http://localhost:8000/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "test", "version": "1.0.0"}}}'
   ```

### 🧪 Testing Checklist

- [ ] MCP server starts successfully
- [ ] Client can initialize connection and get session ID
- [ ] Client can send `notifications/initialized`
- [ ] Client can list available tools
- [ ] Client can call tools with proper parameters
- [ ] Enhanced AI chat endpoint integrates successfully
- [ ] Context is properly formatted for AI consumption
- [ ] Error handling works (server down, invalid requests, etc.)

### 🔒 Security Considerations

1. **Session Management**: Each client gets unique session ID
2. **Authentication**: Implement proper OAuth/API key validation
3. **Rate Limiting**: Implement request throttling
4. **Input Validation**: Validate all parameters with Zod schemas
5. **Error Handling**: Never expose internal errors to client

### 📊 Performance Best Practices

1. **Connection Pooling**: Reuse initialized sessions
2. **Parallel Requests**: Use Promise.allSettled for multiple API calls
3. **Caching**: Cache tool lists and metadata
4. **Timeouts**: Set appropriate request timeouts
5. **Graceful Degradation**: Continue if MCP server is unavailable

### 🔄 Common MCP Methods

```typescript
// Standard MCP protocol methods
'initialize'                    // Initialize connection
'notifications/initialized'     // Complete initialization
'tools/list'                   // List available tools
'tools/call'                   // Execute tool with parameters
'resources/list'               // List available resources  
'resources/read'               // Read resource content
'prompts/list'                 // List available prompts
'prompts/get'                  // Get specific prompt
```

### 🎯 Implementation Priority

1. **Phase 1**: Basic MCP client with session management
2. **Phase 2**: Tool listing and basic tool calling
3. **Phase 3**: Context building and AI integration
4. **Phase 4**: Error handling and edge cases
5. **Phase 5**: Performance optimization and caching
6. **Phase 6**: Production deployment and monitoring

### 📝 Example MCP Server Implementations

- **Google Workspace**: `uvx google-workspace-mcp --tools gmail drive calendar --transport streamable-http`
- **Slack**: Custom implementation using Slack Web API
- **Jira**: Custom implementation using Jira REST API
- **GitHub**: Custom implementation using GitHub API
- **Notion**: Custom implementation using Notion API

This template ensures consistent, maintainable, and scalable MCP integrations across all data sources in AI Brain.