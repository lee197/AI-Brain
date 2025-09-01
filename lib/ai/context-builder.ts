import { loadSlackMessages } from '@/lib/slack/database-storage'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'
import { Message } from 'ai'

// 上下文构建器接口
export interface ContextData {
  slack: {
    messages: any[]
    contextString: string
  }
  googleWorkspace: {
    emails: any[]
    calendar: any[]
    drive: any[]
    contextString: string
  }
  summary: string
}

// MCP 服务器配置
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000/mcp'

/**
 * 构建增强的上下文消息，集成多个数据源
 */
export async function buildEnhancedContext(
  userMessage: string, 
  contextId?: string
): Promise<ContextData> {
  const result: ContextData = {
    slack: {
      messages: [],
      contextString: ''
    },
    googleWorkspace: {
      emails: [],
      calendar: [],
      drive: [],
      contextString: ''
    },
    summary: ''
  }

  if (!contextId) {
    return result
  }

  // 1. 获取 Slack 上下文
  try {
    console.log(`🔍 Loading Slack context for contextId: ${contextId}`)
    const { messages } = await loadSlackMessages(contextId, { limit: 10 })
    
    if (messages.length > 0) {
      result.slack.messages = messages
      result.slack.contextString = messages
        .map(msg => {
          const time = new Date(msg.timestamp).toLocaleString('zh-CN')
          return `[${time}] ${msg.user.name} 在 #${msg.channel.name}: ${msg.text}`
        })
        .join('\n')
      
      console.log(`📋 Found ${messages.length} Slack messages for context`)
    }
  } catch (error) {
    console.warn('⚠️ Failed to load Slack context:', error)
  }

  // 2. 获取 Google Workspace 上下文 (MCP)
  try {
    console.log(`🔍 Loading Google Workspace context via MCP for contextId: ${contextId}`)
    
    const mcpClient = new GoogleWorkspaceMCPClient(MCP_SERVER_URL)
    
    // 检查 MCP 服务器连接
    const isConnected = await mcpClient.checkConnection()
    if (!isConnected) {
      console.warn('⚠️ MCP server not available, skipping Google Workspace context')
    } else {
      // 获取 Google Workspace 综合上下文
      const workspaceContext = await mcpClient.getWorkspaceContext(userMessage)
      
      result.googleWorkspace = {
        emails: workspaceContext.gmail,
        calendar: workspaceContext.calendar,
        drive: workspaceContext.drive,
        contextString: mcpClient.buildContextString(workspaceContext)
      }
      
      console.log(`📊 Google Workspace context loaded: ${workspaceContext.gmail.length} emails, ${workspaceContext.calendar.length} events, ${workspaceContext.drive.length} files`)
    }
  } catch (error) {
    console.warn('⚠️ Failed to load Google Workspace context via MCP:', error)
  }

  // 3. 构建总结
  const contextSections = []
  
  if (result.slack.contextString) {
    contextSections.push(`**Slack团队对话 (最近10条)**:\n${result.slack.contextString}`)
  }
  
  if (result.googleWorkspace.contextString) {
    contextSections.push(`**Google Workspace上下文**:\n${result.googleWorkspace.contextString}`)
  }
  
  result.summary = contextSections.join('\n\n')
  
  return result
}

/**
 * 将上下文数据转换为 SDK 消息格式
 */
export function convertContextToMessages(contextData: ContextData, userMessage: string): Message[] {
  const messages: Message[] = []

  // 如果有上下文，添加系统消息
  if (contextData.summary) {
    messages.push({
      id: 'system-context',
      role: 'system',
      content: `你是AI Brain智能助手。以下是与用户查询相关的上下文信息：

${contextData.summary}

请基于这些上下文信息，用专业、友好的方式回复用户的问题。如果上下文信息与用户问题相关，请充分利用这些信息提供精确、有用的回复。`
    })
  }

  // 添加用户消息
  messages.push({
    id: 'user-query',
    role: 'user',
    content: userMessage
  })

  return messages
}

/**
 * 获取上下文统计信息
 */
export function getContextStats(contextData: ContextData) {
  return {
    slackMessagesCount: contextData.slack.messages.length,
    emailsCount: contextData.googleWorkspace.emails.length,
    calendarEventsCount: contextData.googleWorkspace.calendar.length,
    driveFilesCount: contextData.googleWorkspace.drive.length,
    hasContext: !!(contextData.slack.contextString || contextData.googleWorkspace.contextString)
  }
}