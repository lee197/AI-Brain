/**
 * Google Workspace MCP Client
 * 通过 MCP 协议与 Google Workspace 服务器通信
 */

import { z } from 'zod'

// MCP Client 接口定义
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

// Google Workspace 上下文类型
interface GoogleWorkspaceContext {
  gmail: GmailMessage[]
  calendar: CalendarEvent[]
  drive: DriveFile[]
}

interface GmailMessage {
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

interface CalendarEvent {
  id: string
  summary: string
  start: string
  end: string
  attendees: string[]
  location?: string
  description?: string
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  modifiedTime: string
  webViewLink: string
  ownedByMe: boolean
}

export class GoogleWorkspaceMCPClient {
  private baseUrl: string
  private requestId: number = 1
  private sessionId: string | null = null
  private initialized: boolean = false

  constructor(baseUrl: string = 'http://localhost:8000/mcp') {
    this.baseUrl = baseUrl
  }

  /**
   * 初始化 MCP 连接
   */
  private async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      console.log('🔄 Initializing MCP connection...')
      
      // Step 1: Get session ID from a simple request
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
      console.log('✅ MCP connection initialized with session:', this.sessionId)
    } catch (error) {
      console.error('❌ MCP initialization failed:', error)
      throw error
    }
  }

  /**
   * 发送 MCP 请求
   */
  async sendRequest(method: string, params?: any): Promise<any> {
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
      console.log(`🔄 Sending MCP request: ${method}`, params)
      
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

      // Parse streaming response
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

      console.log(`✅ MCP response received for ${method}`)
      return jsonData.result
    } catch (error) {
      console.error(`❌ MCP request failed for ${method}:`, error)
      throw error
    }
  }

  /**
   * 检查 MCP 服务器连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      const result = await this.sendRequest('tools/list')
      return Array.isArray(result?.tools)
    } catch (error) {
      return false
    }
  }

  /**
   * 获取可用工具列表
   */
  async listTools(): Promise<string[]> {
    try {
      const result = await this.sendRequest('tools/list')
      return result?.tools?.map((tool: any) => tool.name) || []
    } catch (error) {
      console.warn('Failed to list MCP tools:', error)
      return []
    }
  }

  /**
   * 搜索 Gmail 邮件
   */
  async searchGmail(query: string, maxResults: number = 10): Promise<GmailMessage[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'search_gmail_messages',
        arguments: {
          query,
          user_google_email: 'leeqii197@gmail.com'
        }
      })

      // Parse the text response from MCP to extract message data
      let messages: GmailMessage[] = []
      if (result?.content?.[0]?.text) {
        messages = await this.parseGmailSearchResult(result.content[0].text)
      }
      
      return messages
    } catch (error) {
      console.warn('Gmail search failed:', error)
      return []
    }
  }

  /**
   * 获取重要邮件
   */
  async getImportantGmail(days: number = 7): Promise<GmailMessage[]> {
    const query = `is:important newer_than:${days}d`
    return this.searchGmail(query, 10)
  }

  /**
   * 获取未读邮件
   */
  async getUnreadGmail(maxResults: number = 10): Promise<GmailMessage[]> {
    return this.searchGmail('is:unread', maxResults)
  }

  /**
   * 获取日历列表
   */
  async listCalendars(): Promise<any[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'list_calendars',
        arguments: {
          user_google_email: 'leeqii197@gmail.com'
        }
      })

      console.log('📅 Calendar list result:', result)
      return result?.calendars || []
    } catch (error) {
      console.warn('Calendar list fetch failed:', error)
      return []
    }
  }

  /**
   * 获取日历事件
   */
  async getCalendarEvents(timeMin?: string, maxResults: number = 10): Promise<CalendarEvent[]> {
    try {
      const params: any = {
        user_google_email: 'leeqii197@gmail.com'
      }

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
      })

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
      console.warn('Calendar events fetch failed:', error)
      return []
    }
  }

  /**
   * 搜索 Google Drive 文件
   */
  async searchDrive(query: string, maxResults: number = 10): Promise<DriveFile[]> {
    try {
      const result = await this.sendRequest('tools/call', {
        name: 'search_drive_files',
        arguments: {
          query,
          user_google_email: 'leeqii197@gmail.com'
        }
      })

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
      console.warn('Drive search failed:', error)
      return []
    }
  }

  /**
   * 获取最近修改的文件
   */
  async getRecentDriveFiles(maxResults: number = 10): Promise<DriveFile[]> {
    return this.searchDrive('', maxResults)
  }

  /**
   * 获取综合的 Google Workspace 上下文
   */
  async getWorkspaceContext(userMessage: string): Promise<GoogleWorkspaceContext> {
    console.log(`🔍 Getting Google Workspace context for: "${userMessage}"`)

    // 并行获取所有数据源
    const [gmail, calendar, drive] = await Promise.allSettled([
      this.getImportantGmail(7),
      this.getCalendarEvents(),
      this.searchDrive(userMessage, 5)
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
   * 格式化 Gmail 消息
   */
  private formatGmailMessages(messages: any[]): GmailMessage[] {
    return messages.map(msg => ({
      id: msg.id || '',
      subject: msg.subject || 'No Subject',
      from: msg.from || 'Unknown Sender',
      to: msg.to || '',
      date: msg.date || new Date().toISOString(),
      snippet: msg.snippet || msg.body_preview || '',
      isRead: !msg.unread,
      isImportant: msg.important || false,
      labels: msg.labels || []
    }))
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
   * 格式化 Drive 文件
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

  /**
   * 构建用于 AI 的上下文字符串
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
  private async parseGmailSearchResult(text: string): Promise<GmailMessage[]> {
    const messages: GmailMessage[] = []
    
    // 匹配消息ID的正则表达式
    const messageMatches = text.match(/Message ID: ([a-f0-9]+)/g)
    
    if (messageMatches) {
      // 提取所有Message ID
      const messageIds = messageMatches.map(match => match.replace('Message ID: ', ''))
      
      // 批量获取消息详细内容
      try {
        const detailedMessages = await this.getGmailMessagesContent(messageIds)
        return detailedMessages
      } catch (error) {
        console.warn('Failed to get Gmail message details:', error)
        
        // 如果获取详细内容失败，返回基本信息
        messageIds.forEach((messageId, index) => {
          messages.push({
            id: messageId,
            subject: `Gmail Message ${index + 1}`,
            from: 'sender@example.com',
            to: 'leeqii197@gmail.com',
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
   * 批量获取Gmail消息详细内容
   */
  private async getGmailMessagesContent(messageIds: string[]): Promise<GmailMessage[]> {
    const result = await this.sendRequest('tools/call', {
      name: 'get_gmail_messages_content_batch',
      arguments: {
        message_ids: messageIds,
        user_google_email: 'leeqii197@gmail.com'
      }
    })

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
          to: 'leeqii197@gmail.com',
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
}