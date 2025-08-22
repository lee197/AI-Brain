/**
 * Gmail API客户端
 * 用于处理Gmail邮件的获取、搜索和处理
 */

import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'
import { 
  GoogleCredentials, 
  GmailMessage, 
  GmailApiResponse, 
  GmailListResponse, 
  GmailSearchQuery,
  ProcessedEmail,
  GmailLabel
} from './types'

export class GmailApiClient {
  private oauth2Client: OAuth2Client
  private gmail: any

  constructor(credentials?: GoogleCredentials) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    if (credentials) {
      this.oauth2Client.setCredentials({
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token,
        scope: credentials.scope,
        token_type: credentials.token_type,
        expiry_date: credentials.expiry_date
      })
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })
  }

  /**
   * 获取Gmail邮件列表
   */
  async getMessages(query: GmailSearchQuery = {}): Promise<GmailApiResponse<GmailListResponse>> {
    try {
      const { 
        q = '', 
        labelIds = ['INBOX'], 
        maxResults = 50, 
        pageToken,
        includeSpamTrash = false 
      } = query

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q,
        labelIds,
        maxResults,
        pageToken,
        includeSpamTrash
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error('Gmail API - 获取邮件列表失败:', error)
      return {
        success: false,
        data: { messages: [], resultSizeEstimate: 0 },
        error: error.message
      }
    }
  }

  /**
   * 获取单个邮件详情
   */
  async getMessage(messageId: string): Promise<GmailApiResponse<GmailMessage>> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error: any) {
      console.error(`Gmail API - 获取邮件详情失败 (${messageId}):`, error)
      return {
        success: false,
        data: {} as GmailMessage,
        error: error.message
      }
    }
  }

  /**
   * 批量获取邮件详情
   */
  async getMessagesBatch(messageIds: string[]): Promise<ProcessedEmail[]> {
    const emails: ProcessedEmail[] = []
    
    for (const messageId of messageIds) {
      const result = await this.getMessage(messageId)
      if (result.success) {
        const processedEmail = this.processGmailMessage(result.data)
        if (processedEmail) {
          emails.push(processedEmail)
        }
      }
      
      // 添加小延迟避免API限制
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return emails
  }

  /**
   * 获取Gmail标签列表
   */
  async getLabels(): Promise<GmailApiResponse<GmailLabel[]>> {
    try {
      const response = await this.gmail.users.labels.list({
        userId: 'me'
      })

      return {
        success: true,
        data: response.data.labels || []
      }
    } catch (error: any) {
      console.error('Gmail API - 获取标签列表失败:', error)
      return {
        success: false,
        data: [],
        error: error.message
      }
    }
  }

  /**
   * 搜索邮件
   */
  async searchEmails(searchQuery: string, maxResults: number = 20): Promise<ProcessedEmail[]> {
    try {
      // 获取邮件ID列表
      const listResult = await this.getMessages({
        q: searchQuery,
        maxResults
      })

      if (!listResult.success || !listResult.data.messages) {
        return []
      }

      // 批量获取邮件详情
      const messageIds = listResult.data.messages.map(msg => msg.id)
      return await this.getMessagesBatch(messageIds)
    } catch (error) {
      console.error('Gmail API - 搜索邮件失败:', error)
      return []
    }
  }

  /**
   * 获取收件箱邮件（轻量级，只获取基本信息）
   */
  async getInboxEmailsLight(maxResults: number = 50): Promise<ProcessedEmail[]> {
    try {
      await this.verifyScopes()
      
      const listResult = await this.gmail.users.messages.list({
        userId: 'me',
        labelIds: ['INBOX'],
        maxResults
      })

      if (!listResult.data.messages || listResult.data.messages.length === 0) {
        return []
      }

      // 批量获取轻量级信息（使用metadata格式）
      const emails: ProcessedEmail[] = []
      
      for (const message of listResult.data.messages) {
        try {
          const response = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',  // 只获取metadata，不获取body
            metadataHeaders: ['Subject', 'From', 'To', 'Cc', 'Date']
          })
          
          const processedEmail = this.processGmailMessageLight(response.data)
          if (processedEmail) {
            emails.push(processedEmail)
          }
          
          // 减少延迟，提高效率
          await new Promise(resolve => setTimeout(resolve, 50))
        } catch (error) {
          console.error(`获取邮件${message.id}元数据失败:`, error)
          continue
        }
      }

      return emails
    } catch (error) {
      console.error('Gmail API - 获取收件箱邮件失败:', error)
      
      if (error instanceof Error && (
        error.message.includes('insufficient authentication scopes') ||
        error.message.includes('Request had insufficient authentication scopes')
      )) {
        throw error
      }
      
      return []
    }
  }

  /**
   * 获取收件箱邮件
   */
  async getInboxEmails(maxResults: number = 50): Promise<ProcessedEmail[]> {
    try {
      // 先验证权限范围
      await this.verifyScopes()
      
      // 使用labelIds而不是q参数来获取收件箱邮件
      const listResult = await this.gmail.users.messages.list({
        userId: 'me',
        labelIds: ['INBOX'],
        maxResults
      })

      if (!listResult.data.messages || listResult.data.messages.length === 0) {
        console.log('Gmail API - 收件箱为空或没有邮件')
        return []
      }

      // 批量获取邮件详情
      const messageIds = listResult.data.messages.map(msg => msg.id!)
      return await this.getMessagesBatch(messageIds)
    } catch (error) {
      console.error('Gmail API - 获取收件箱邮件失败:', error)
      
      // 如果是权限错误，重新抛出以便上层处理
      if (error instanceof Error && (
        error.message.includes('insufficient authentication scopes') ||
        error.message.includes('Request had insufficient authentication scopes')
      )) {
        throw error
      }
      
      return []
    }
  }

  /**
   * 获取未读邮件
   */
  async getUnreadEmails(maxResults: number = 20): Promise<ProcessedEmail[]> {
    return await this.searchEmails('is:unread', maxResults)
  }

  /**
   * 处理Gmail消息数据（轻量级，只处理metadata）
   */
  private processGmailMessageLight(gmailMessage: any): ProcessedEmail | null {
    try {
      const headers = gmailMessage.payload.headers
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

      const subject = getHeader('Subject')
      const from = getHeader('From')
      const to = getHeader('To')
      const cc = getHeader('Cc')
      const date = getHeader('Date')

      // 解析发件人邮箱和姓名
      const senderMatch = from.match(/(.*?)\s*<(.+?)>/) || from.match(/(.+)/)
      const senderName = senderMatch?.[1]?.trim().replace(/"/g, '') || from
      const senderEmail = senderMatch?.[2] || from

      // 解析收件人
      const recipients = [to, cc].filter(Boolean).join(', ').split(',').map(r => r.trim())

      // 检查是否已读
      const isRead = !gmailMessage.labelIds.includes('UNREAD')

      // 转换时间戳
      const timestamp = new Date(parseInt(gmailMessage.internalDate)).toISOString()

      return {
        id: gmailMessage.id,
        threadId: gmailMessage.threadId,
        subject,
        sender: senderName,
        senderEmail,
        recipients,
        content: '', // 轻量级模式不包含内容
        timestamp,
        isRead,
        labels: gmailMessage.labelIds,
        attachments: [], // 轻量级模式不解析附件
        snippet: gmailMessage.snippet
      }
    } catch (error) {
      console.error('处理Gmail消息失败:', error)
      return null
    }
  }

  /**
   * 处理Gmail消息数据，转换为标准格式
   */
  private processGmailMessage(gmailMessage: GmailMessage): ProcessedEmail | null {
    try {
      const headers = gmailMessage.payload.headers
      const getHeader = (name: string) => 
        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || ''

      const subject = getHeader('Subject')
      const from = getHeader('From')
      const to = getHeader('To')
      const cc = getHeader('Cc')
      const date = getHeader('Date')

      // 解析发件人邮箱和姓名
      const senderMatch = from.match(/(.*?)\s*<(.+?)>/) || from.match(/(.+)/)
      const senderName = senderMatch?.[1]?.trim().replace(/"/g, '') || from
      const senderEmail = senderMatch?.[2] || from

      // 解析收件人
      const recipients = [to, cc].filter(Boolean).join(', ').split(',').map(r => r.trim())

      // 提取邮件内容
      const content = this.extractEmailContent(gmailMessage.payload)

      // 检查是否已读
      const isRead = !gmailMessage.labelIds.includes('UNREAD')

      // 处理附件
      const attachments = this.extractAttachments(gmailMessage.payload)

      // 转换时间戳
      const timestamp = new Date(parseInt(gmailMessage.internalDate)).toISOString()

      return {
        id: gmailMessage.id,
        threadId: gmailMessage.threadId,
        subject,
        sender: senderName,
        senderEmail,
        recipients,
        content,
        timestamp,
        isRead,
        labels: gmailMessage.labelIds,
        attachments,
        snippet: gmailMessage.snippet
      }
    } catch (error) {
      console.error('处理Gmail消息失败:', error)
      return null
    }
  }

  /**
   * 提取邮件正文内容
   */
  private extractEmailContent(payload: any): string {
    let textContent = ''
    let htmlContent = ''

    // 递归提取内容的辅助函数
    const extractFromPart = (part: any) => {
      // 处理纯文本
      if (part.mimeType === 'text/plain' && part.body?.data) {
        textContent += Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
      // 处理HTML
      else if (part.mimeType === 'text/html' && part.body?.data) {
        htmlContent += Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
      // 递归处理嵌套的multipart
      else if (part.parts) {
        part.parts.forEach(extractFromPart)
      }
    }

    // 处理单一内容
    if (payload.body?.data) {
      const content = Buffer.from(payload.body.data, 'base64').toString('utf-8')
      if (payload.mimeType === 'text/html') {
        htmlContent = content
      } else {
        textContent = content
      }
    } 
    // 处理多部分内容
    else if (payload.parts) {
      payload.parts.forEach(extractFromPart)
    }

    // 优先返回纯文本，如果没有则清理HTML
    if (textContent) {
      // 保留完整的纯文本内容，只做基本的空白字符清理
      return textContent.trim()
    } else if (htmlContent) {
      // 改进的HTML清理，保留换行
      return htmlContent
        .replace(/<br\s*\/?>/gi, '\n')  // 保留换行
        .replace(/<\/p>/gi, '\n\n')      // 段落转换为双换行
        .replace(/<\/div>/gi, '\n')      // div转换为换行
        .replace(/<[^>]*>/g, '')         // 移除其他HTML标签
        .replace(/&nbsp;/g, ' ')         // 替换HTML空格
        .replace(/&amp;/g, '&')          // 替换&符号
        .replace(/&lt;/g, '<')           // 替换小于号
        .replace(/&gt;/g, '>')           // 替换大于号
        .replace(/&quot;/g, '"')         // 替换引号
        .replace(/&#39;/g, "'")          // 替换单引号
        .replace(/\n{3,}/g, '\n\n')     // 限制连续换行
        .trim()
    }
    
    return ''
  }

  /**
   * 提取附件信息
   */
  private extractAttachments(payload: any): Array<{
    filename: string
    mimeType: string
    size: number
    attachmentId: string
  }> {
    const attachments: any[] = []

    const extractFromPart = (part: any) => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId
        })
      }

      if (part.parts) {
        part.parts.forEach(extractFromPart)
      }
    }

    if (payload.parts) {
      payload.parts.forEach(extractFromPart)
    }

    return attachments
  }

  /**
   * 验证权限范围
   */
  async verifyScopes(): Promise<void> {
    try {
      // 尝试调用一个需要Gmail读取权限的简单API
      await this.gmail.users.getProfile({
        userId: 'me'
      })
    } catch (error: any) {
      console.error('Gmail API - 权限验证失败:', error)
      if (error.message && (
        error.message.includes('insufficient authentication scopes') ||
        error.message.includes('Request had insufficient authentication scopes')
      )) {
        throw new Error(`insufficient authentication scopes: 需要重新授权Gmail以获取邮件访问权限。当前权限范围不足。`)
      }
      throw error
    }
  }

  /**
   * 验证连接状态
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      })
      return !!response.data.emailAddress
    } catch (error) {
      console.error('Gmail API - 连接验证失败:', error)
      return false
    }
  }

  /**
   * 获取用户邮箱信息
   */
  async getUserProfile(): Promise<{ emailAddress: string; messagesTotal: number; threadsTotal: number } | null> {
    try {
      const response = await this.gmail.users.getProfile({
        userId: 'me'
      })
      return {
        emailAddress: response.data.emailAddress,
        messagesTotal: response.data.messagesTotal,
        threadsTotal: response.data.threadsTotal
      }
    } catch (error) {
      console.error('Gmail API - 获取用户信息失败:', error)
      return null
    }
  }
}