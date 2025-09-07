/**
 * 通用MCP客户端基类
 * 为AI Brain支持多种MCP服务器提供统一的接口和认证机制
 * 支持未来扩展：Slack MCP、Jira MCP、GitHub MCP、Notion MCP等
 */

import { z } from 'zod'
import { TokenManager } from '@/lib/oauth/token-manager'
import { OAuthProvider, TokenError } from '@/types/oauth-tokens'

// MCP协议标准接口定义
export interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}

export interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: {
    code: number
    message: string
    data?: any
  }
}

export interface MCPServerInfo {
  name: string
  version: string
  description?: string
  capabilities?: string[]
}

export interface MCPTool {
  name: string
  description?: string
  inputSchema?: any
}

// MCP服务器配置
export interface MCPServerConfig {
  name: string
  baseUrl: string
  provider: OAuthProvider
  capabilities: string[]
  description: string
  version: string
}

/**
 * 抽象MCP客户端基类
 * 所有具体的MCP客户端都继承自这个基类
 */
export abstract class BaseMCPClient {
  protected baseUrl: string
  protected serverConfig: MCPServerConfig
  protected tokenManager: TokenManager
  protected requestId: number = 1
  protected sessionId: string | null = null
  protected initialized: boolean = false

  constructor(config: MCPServerConfig) {
    this.baseUrl = config.baseUrl
    this.serverConfig = config
    this.tokenManager = new TokenManager()
  }

  /**
   * 抽象方法：子类必须实现特定的上下文获取逻辑
   */
  abstract getServiceContext(userMessage: string, userId: string, contextId: string): Promise<any>

  /**
   * 抽象方法：子类必须实现特定的上下文格式化逻辑
   */
  abstract buildContextString(context: any): string

  /**
   * 标准MCP初始化流程
   */
  protected async initialize(userId: string, contextId: string): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      console.log(`🔄 Initializing ${this.serverConfig.name} MCP connection...`)
      
      // 生成认证token
      const authToken = this.tokenManager.generateMCPAuthToken(
        userId, 
        contextId, 
        this.serverConfig.provider
      )

      // Step 1: Initialize MCP connection with auth
      const initResponse = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${authToken}`, // 传递认证token
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
        throw new Error(`No session ID received from ${this.serverConfig.name} MCP server`)
      }

      // Step 2: Parse the streaming response
      const responseText = await initResponse.text()
      const jsonData = this.parseStreamingResponse(responseText)

      if (jsonData?.error) {
        throw new Error(`${this.serverConfig.name} MCP initialization error: ${jsonData.error.message}`)
      }

      // Step 3: Send initialization notification
      await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'Authorization': `Bearer ${authToken}`,
          'mcp-session-id': this.sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized'
        })
      })

      this.initialized = true
      console.log(`✅ ${this.serverConfig.name} MCP connection initialized with session:`, this.sessionId)
    } catch (error) {
      console.error(`❌ ${this.serverConfig.name} MCP initialization failed:`, error)
      throw error
    }
  }

  /**
   * 发送带认证的MCP请求
   */
  protected async sendRequest(
    method: string, 
    params: any,
    userId: string,
    contextId: string
  ): Promise<any> {
    // Initialize connection if not already done
    if (!this.initialized) {
      await this.initialize(userId, contextId)
    }

    const request: MCPRequest = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    }

    try {
      console.log(`🔄 Sending ${this.serverConfig.name} MCP request: ${method}`)
      
      // 生成认证token
      const authToken = this.tokenManager.generateMCPAuthToken(
        userId, 
        contextId, 
        this.serverConfig.provider
      )

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${authToken}`, // 每个请求都带认证
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
        // 检查是否是认证错误
        if (response.status === 401 || response.status === 403) {
          throw new TokenError('token_invalid', `${this.serverConfig.name} authentication failed`, this.serverConfig.provider)
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Parse streaming response
      const responseText = await response.text()
      const jsonData = this.parseStreamingResponse(responseText)
      
      if (jsonData?.error) {
        // 检查是否是token相关错误
        if (jsonData.error.message?.includes('token') || jsonData.error.message?.includes('auth')) {
          throw new TokenError('token_expired', jsonData.error.message, this.serverConfig.provider)
        }
        throw new Error(`${this.serverConfig.name} MCP error: ${jsonData.error.message}`)
      }

      console.log(`✅ ${this.serverConfig.name} MCP response received for ${method}`)
      return jsonData?.result
    } catch (error) {
      console.error(`❌ ${this.serverConfig.name} MCP request failed for ${method}:`, error)
      throw error
    }
  }

  /**
   * 解析Server-Sent Events格式的响应
   */
  private parseStreamingResponse(responseText: string): any {
    const lines = responseText.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          return JSON.parse(line.substring(6))
        } catch (e) {
          continue
        }
      }
    }

    // Fallback: try to parse entire response as JSON
    try {
      return JSON.parse(responseText)
    } catch (e) {
      throw new Error(`Invalid ${this.serverConfig.name} MCP response format`)
    }
  }

  /**
   * 检查MCP服务器连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'ai-brain-check',
              version: '1.0.0'
            }
          }
        }),
        signal: AbortSignal.timeout(5000) // 5秒超时
      })
      
      if (!response.ok) {
        return false
      }

      const responseText = await response.text()
      const jsonData = this.parseStreamingResponse(responseText)
      
      return !!(jsonData?.result?.serverInfo)
    } catch (error) {
      return false
    }
  }

  /**
   * 获取可用工具列表
   */
  async listTools(userId: string, contextId: string): Promise<MCPTool[]> {
    try {
      const result = await this.sendRequest('tools/list', {}, userId, contextId)
      return result?.tools || []
    } catch (error) {
      console.warn(`Failed to list ${this.serverConfig.name} MCP tools:`, error)
      return []
    }
  }

  /**
   * 调用MCP工具
   */
  async invokeTool(
    toolName: string, 
    arguments_: any,
    userId: string,
    contextId: string
  ): Promise<any> {
    return this.sendRequest('tools/call', {
      name: toolName,
      arguments: arguments_
    }, userId, contextId)
  }

  /**
   * 获取服务器信息
   */
  getServerInfo(): MCPServerConfig {
    return this.serverConfig
  }

  /**
   * 处理Token错误的通用方法
   */
  protected async handleTokenError(
    error: TokenError,
    userId: string,
    contextId: string
  ): Promise<never> {
    // 生成重新授权URL
    const authUrl = `/api/${this.serverConfig.provider}/oauth/authorize?userId=${userId}&contextId=${contextId}`
    
    throw {
      ...error,
      auth_url: authUrl
    } as TokenError
  }

  /**
   * 安全的上下文获取（带错误处理）
   */
  async getSafeContext(
    userMessage: string,
    userId: string,
    contextId: string
  ): Promise<{
    context: any
    error?: TokenError
  }> {
    try {
      // 检查连接状态
      const isConnected = await this.checkConnection()
      if (!isConnected) {
        return { 
          context: null, 
          error: {
            code: 'token_invalid',
            message: `${this.serverConfig.name} MCP server not available`,
            provider: this.serverConfig.provider
          }
        }
      }

      // 获取服务上下文
      const context = await this.getServiceContext(userMessage, userId, contextId)
      return { context }
    } catch (error) {
      if (error instanceof TokenError) {
        return { context: null, error }
      }
      
      return {
        context: null,
        error: {
          code: 'token_invalid',
          message: `${this.serverConfig.name} service error: ${error}`,
          provider: this.serverConfig.provider
        }
      }
    }
  }
}

/**
 * MCP服务器注册表
 * 管理所有可用的MCP服务器配置
 */
export class MCPServerRegistry {
  private static servers: Map<string, MCPServerConfig> = new Map()

  static register(config: MCPServerConfig) {
    this.servers.set(config.name, config)
    console.log(`📝 Registered ${config.name} MCP server`)
  }

  static get(name: string): MCPServerConfig | undefined {
    return this.servers.get(name)
  }

  static getAll(): MCPServerConfig[] {
    return Array.from(this.servers.values())
  }

  static getByProvider(provider: OAuthProvider): MCPServerConfig[] {
    return Array.from(this.servers.values()).filter(s => s.provider === provider)
  }
}

/**
 * TokenError类定义
 */
export class TokenError extends Error {
  constructor(
    public code: 'token_expired' | 'token_invalid' | 'token_revoked' | 'insufficient_scope',
    message: string,
    public provider: OAuthProvider,
    public auth_url?: string
  ) {
    super(message)
    this.name = 'TokenError'
  }
}