/**
 * Google Workspace MCP Client v2
 * 基于通用MCP客户端基类的实现
 * 支持多用户Token管理和自动刷新
 */

import { BaseMCPClient, MCPServerRegistry, TokenError } from './base-mcp-client'
import { OAuthProvider } from '@/types/oauth-tokens'

// Google Workspace 上下文类型（保持向后兼容）
export interface GoogleWorkspaceContext {
  gmail: GmailMessage[]
  calendar: CalendarEvent[]
  drive: DriveFile[]
}

export interface GmailMessage {
  id: string
  subject: string
  from: string
  to: string
  date: string
  snippet: string
  isRead: boolean
  isImportant: boolean
  labels: string[]
}

export interface CalendarEvent {
  id: string
  summary: string
  start: string
  end: string
  attendees: string[]
  location?: string
  description?: string
}

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  modifiedTime: string
  webViewLink: string
  ownedByMe: boolean
}

/**
 * Google Workspace MCP 客户端 v2
 * 继承通用基类，专门处理Google Workspace集成
 */
export class GoogleWorkspaceMCPClientV2 extends BaseMCPClient {
  constructor(baseUrl: string = 'http://localhost:8000/mcp') {
    // 注册Google Workspace MCP服务器配置
    const config = {
      name: 'google-workspace',
      baseUrl,
      provider: 'google' as OAuthProvider,
      capabilities: ['gmail', 'calendar', 'drive', 'docs', 'sheets', 'slides'],
      description: 'Google Workspace integration via MCP',
      version: '2.0.0'
    }
    
    MCPServerRegistry.register(config)
    super(config)
  }

  /**
   * 实现抽象方法：获取Google Workspace上下文
   */
  async getServiceContext(
    userMessage: string,
    userId: string,
    contextId: string
  ): Promise<GoogleWorkspaceContext> {
    console.log(`🔍 Getting Google Workspace context for user ${userId} in context ${contextId}`)

    // 并行获取所有数据源，使用新的认证机制
    const [gmail, calendar, drive] = await Promise.allSettled([
      this.getImportantGmail(userId, contextId, 7),
      this.getCalendarEvents(userId, contextId),
      this.searchDrive(userMessage, userId, contextId, 5)
    ])

    const context: GoogleWorkspaceContext = {
      gmail: gmail.status === 'fulfilled' ? gmail.value : [],
      calendar: calendar.status === 'fulfilled' ? calendar.value : [],
      drive: drive.status === 'fulfilled' ? drive.value : []
    }

    console.log(`📊 Workspace context loaded: ${context.gmail.length} emails, ${context.calendar.length} events, ${context.drive.length} files`)
    return context
  }

  /**
   * 实现抽象方法：构建上下文字符串
   */
  buildContextString(context: GoogleWorkspaceContext): string {
    const sections = []

    // Gmail 上下文
    if (context.gmail.length > 0) {
      const gmailContext = context.gmail.map(email => {
        const time = new Date(email.date).toLocaleString('zh-CN')
        const priority = email.isImportant ? '⭐ ' : ''
        const status = email.isRead ? '已读' : '❗ 未读'
        
        return `[${time}] ${priority}${email.subject}\n发件人: ${email.from}\n状态: ${status}\n预览: ${email.snippet}`
      }).join('\n\n')

      sections.push(`## 📧 重要邮件 (${context.gmail.length}封)\n${gmailContext}`)
    }

    // Calendar 上下文
    if (context.calendar.length > 0) {
      const calendarContext = context.calendar.map(event => {
        const start = new Date(event.start).toLocaleString('zh-CN')
        const attendeeCount = event.attendees.length
        
        return `[${start}] ${event.summary}\n参与者: ${attendeeCount}人\n地点: ${event.location || '无'}`
      }).join('\n\n')

      sections.push(`## 📅 即将到来的日程 (${context.calendar.length}个)\n${calendarContext}`)
    }

    // Drive 上下文
    if (context.drive.length > 0) {
      const driveContext = context.drive.map(file => {
        const modified = new Date(file.modifiedTime).toLocaleString('zh-CN')
        const size = this.formatFileSize(file.size)
        
        return `📄 ${file.name}\n修改时间: ${modified}\n大小: ${size}`
      }).join('\n\n')

      sections.push(`## 📁 相关文件 (${context.drive.length}个)\n${driveContext}`)
    }

    return sections.join('\n\n')
  }

  /**
   * 搜索 Gmail 邮件（带认证）
   */
  async searchGmail(
    query: string, 
    userId: string,
    contextId: string,
    maxResults: number = 10
  ): Promise<GmailMessage[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'query_gmail_emails',
        arguments: {
          query,
          max_results: maxResults
        }
      }, userId, contextId)

      // Parse the text response from MCP to extract message data
      let messages: GmailMessage[] = []
      if (result?.content?.[0]?.text) {
        messages = await this.parseGmailSearchResult(result.content[0].text, userId, contextId)
      }
      
      return messages
    } catch (error) {
      if (error instanceof TokenError) {
        throw error // 让上层处理token错误
      }
      console.warn('Gmail search failed:', error)
      return []
    }
  }

  /**
   * 获取重要邮件（带认证）
   */
  async getImportantGmail(
    userId: string,
    contextId: string,
    days: number = 7
  ): Promise<GmailMessage[]> {
    const query = `is:important newer_than:${days}d`
    return this.searchGmail(query, userId, contextId, 10)
  }

  /**
   * 获取未读邮件（带认证）
   */
  async getUnreadGmail(
    userId: string,
    contextId: string,
    maxResults: number = 10
  ): Promise<GmailMessage[]> {
    return this.searchGmail('is:unread', userId, contextId, maxResults)
  }

  /**
   * 获取日历事件（带认证）
   */
  async getCalendarEvents(
    userId: string,
    contextId: string,
    timeMin?: string,
    maxResults: number = 10
  ): Promise<CalendarEvent[]> {
    try {
      const params: any = {}

      if (timeMin) {
        params.time_min = timeMin
      } else {
        // 获取过去7天到未来30天的事件
        const pastWeek = new Date()
        pastWeek.setDate(pastWeek.getDate() - 7)
        params.time_min = pastWeek.toISOString()
        
        const future30Days = new Date()
        future30Days.setDate(future30Days.getDate() + 30)
        params.time_max = future30Days.toISOString()
      }

      const result = await this.sendRequest('tools/call', {
        name: 'get_events',
        arguments: params
      }, userId, contextId)

      console.log('📅 MCP Calendar raw result:', JSON.stringify(result, null, 2))
      
      // Try to parse events from different possible structures
      let events = []
      if (result?.events) {
        events = result.events
      } else if (result?.content?.[0]?.text) {
        // Parse from text content format
        const textContent = result.content[0].text
        console.log('📅 Calendar text content:', textContent)
        events = this.parseCalendarTextResponse(textContent)
      } else if (Array.isArray(result)) {
        events = result
      }

      return this.formatCalendarEvents(events)
    } catch (error) {
      if (error instanceof TokenError) {
        throw error
      }
      console.warn('Calendar events fetch failed:', error)
      return []
    }
  }

  /**
   * 搜索 Google Drive 文件（带认证）
   */
  async searchDrive(
    query: string,
    userId: string,
    contextId: string,
    maxResults: number = 10
  ): Promise<DriveFile[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'search_drive_files',
        arguments: {
          query
        }
      }, userId, contextId)

      console.log('📁 MCP Drive raw result:', JSON.stringify(result, null, 2))
      
      // Try to parse files from different possible structures
      let files = []
      if (result?.files) {
        files = result.files
      } else if (result?.content?.[0]?.text) {
        // Parse from text content format
        const textContent = result.content[0].text
        console.log('📁 Drive text content:', textContent)
        files = this.parseDriveTextResponse(textContent)
      } else if (Array.isArray(result)) {
        files = result
      }

      return this.formatDriveFiles(files)
    } catch (error) {
      if (error instanceof TokenError) {
        throw error
      }
      console.warn('Drive search failed:', error)
      return []
    }
  }

  /**
   * 获取最近修改的文件（带认证）
   */
  async getRecentDriveFiles(
    userId: string,
    contextId: string,
    maxResults: number = 10
  ): Promise<DriveFile[]> {
    return this.searchDrive('', userId, contextId, maxResults)
  }

  /**
   * 获取综合的Google Workspace上下文（新版本，支持用户认证）
   */
  async getWorkspaceContext(
    userMessage: string,
    userId: string,
    contextId: string
  ): Promise<GoogleWorkspaceContext | TokenError> {
    const { context, error } = await this.getSafeContext(userMessage, userId, contextId)
    
    if (error) {
      return error
    }
    
    return context as GoogleWorkspaceContext
  }

  // ============= 私有辅助方法 =============

  /**
   * 格式化文件大小
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  /**
   * 解析MCP Gmail搜索结果文本，并获取详细内容
   */
  private async parseGmailSearchResult(
    text: string,
    userId: string,
    contextId: string
  ): Promise<GmailMessage[]> {
    const messages: GmailMessage[] = []
    
    // 匹配消息ID的正则表达式
    const messageMatches = text.match(/Message ID: ([a-f0-9]+)/g)
    
    if (messageMatches) {
      // 提取所有Message ID
      const messageIds = messageMatches.map(match => match.replace('Message ID: ', ''))
      
      // 批量获取消息详细内容
      try {
        const detailedMessages = await this.getGmailMessagesContent(messageIds, userId, contextId)
        return detailedMessages
      } catch (error) {
        console.warn('Failed to get Gmail message details:', error)
        
        // 如果获取详细内容失败，返回基本信息
        messageIds.forEach((messageId, index) => {
          messages.push({
            id: messageId,
            subject: `Gmail Message ${index + 1}`,
            from: 'sender@example.com',
            to: 'user@example.com',
            date: new Date().toISOString(),
            snippet: `Message ID: ${messageId}`,
            isRead: true,
            isImportant: false,
            labels: ['INBOX']
          })
        })
      }
    }
    
    return messages
  }

  /**
   * 批量获取Gmail消息详细内容（带认证）
   */
  private async getGmailMessagesContent(
    messageIds: string[],
    userId: string,
    contextId: string
  ): Promise<GmailMessage[]> {
    const result = await this.sendRequest('tools/call', {
      name: 'get_gmail_messages_content_batch',
      arguments: {
        message_ids: messageIds
      }
    }, userId, contextId)

    // 解析详细消息内容
    return this.parseDetailedGmailMessages(result, messageIds)
  }

  /**
   * 解析详细的Gmail消息内容
   */
  private parseDetailedGmailMessages(result: any, messageIds: string[]): GmailMessage[] {
    const messages: GmailMessage[] = []

    if (result?.content?.[0]?.text) {
      const content = result.content[0].text
      
      // 尝试解析每条消息的详细信息
      messageIds.forEach((messageId, index) => {
        // 查找这条消息的详细信息
        const messageMatch = content.match(new RegExp(`Message ID: ${messageId}[\\s\\S]*?(?=Message ID:|$)`, 'i'))
        
        let subject = `Gmail Message ${index + 1}`
        let from = 'sender@example.com'
        let snippet = `Message ID: ${messageId}`
        let date = new Date().toISOString()
        let isRead = true
        let isImportant = false
        
        if (messageMatch) {
          const messageText = messageMatch[0]
          
          // 提取主题
          const subjectMatch = messageText.match(/Subject:\s*(.+)/i)
          if (subjectMatch) {
            subject = subjectMatch[1].trim()
          }
          
          // 提取发件人
          const fromMatch = messageText.match(/From:\s*(.+)/i)
          if (fromMatch) {
            from = fromMatch[1].trim()
          }
          
          // 提取预览内容
          const snippetMatch = messageText.match(/Snippet:\s*(.+)/i)
          if (snippetMatch) {
            snippet = snippetMatch[1].trim()
          }
          
          // 提取日期
          const dateMatch = messageText.match(/Date:\s*(.+)/i)
          if (dateMatch) {
            date = new Date(dateMatch[1].trim()).toISOString()
          }
          
          // 检查是否已读
          isRead = !messageText.toLowerCase().includes('unread')
          
          // 检查是否重要
          isImportant = messageText.toLowerCase().includes('important')
        }
        
        messages.push({
          id: messageId,
          subject,
          from,
          to: 'user@example.com',
          date,
          snippet,
          isRead,
          isImportant,
          labels: ['INBOX']
        })
      })
    }
    
    return messages
  }

  /**
   * 解析MCP Calendar文本响应
   */
  private parseCalendarTextResponse(text: string): any[] {
    const events: any[] = []
    
    // 匹配每个事件的正则表达式
    // Format: - "Event Title" (Starts: datetime, Ends: datetime) ID: eventId | Link: url
    const eventPattern = /- "([^"]+)" \(Starts: ([^,]+), Ends: ([^)]+)\) ID: (\w+)/g
    
    let match
    while ((match = eventPattern.exec(text)) !== null) {
      const [, title, startTime, endTime, eventId] = match
      
      events.push({
        id: eventId,
        summary: title,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        attendees: [],
        location: null,
        description: null
      })
    }
    
    console.log(`📅 Parsed ${events.length} calendar events from text response`)
    return events
  }

  /**
   * 解析MCP Drive文本响应
   */
  private parseDriveTextResponse(text: string): any[] {
    const files: any[] = []
    
    // 如果文本说没有找到文件
    if (text.includes('No files found') || text.includes('没有找到文件')) {
      return files
    }
    
    // 匹配每个文件的正则表达式
    // Format: - Name: "filename" (ID: fileId, Type: mimeType, Size: bytes, Modified: datetime) Link: url
    const filePattern = /- Name: "([^"]+)" \(ID: ([^,]+), Type: ([^,]+), Size: (\d+), Modified: ([^)]+)\) Link: (.+)/g
    
    let match
    while ((match = filePattern.exec(text)) !== null) {
      const [, name, fileId, mimeType, size, modifiedTime, webViewLink] = match
      
      files.push({
        id: fileId,
        name: name,
        mimeType: mimeType,
        size: parseInt(size),
        modifiedTime: modifiedTime,
        webViewLink: webViewLink,
        ownedByMe: true // 假设从用户Drive中获取的都是自己的文件
      })
    }
    
    console.log(`📁 Parsed ${files.length} drive files from text response`)
    return files
  }

  /**
   * 格式化日历事件
   */
  private formatCalendarEvents(events: any[]): CalendarEvent[] {
    return events.map(event => ({
      id: event.id || '',
      summary: event.summary || 'No Title',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      attendees: event.attendees?.map((a: any) => a.email) || [],
      location: event.location,
      description: event.description
    }))
  }

  /**
   * 格式化Drive文件
   */
  private formatDriveFiles(files: any[]): DriveFile[] {
    return files.map(file => ({
      id: file.id || '',
      name: file.name || 'Untitled',
      mimeType: file.mimeType || 'application/octet-stream',
      size: parseInt(file.size) || 0,
      modifiedTime: file.modifiedTime || '',
      webViewLink: file.webViewLink || '',
      ownedByMe: file.ownedByMe || false
    }))
  }
}