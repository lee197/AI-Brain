/**
 * Gmail邮件存储优化策略
 * 分层存储：metadata + content分离
 */

import fs from 'fs/promises'
import path from 'path'

export interface GmailMetadata {
  id: string
  threadId: string
  subject: string
  from: string
  to: string
  cc?: string
  date: string
  labels: string[]
  snippet: string
  sizeEstimate: number
  hasAttachments: boolean
  isRead: boolean
  timestamp: string
}

export interface GmailContent {
  id: string
  contentText: string
  contentHtml: string
  contentTextLength: number
  contentHtmlLength: number
}

export class GmailStorageManager {
  private contextId: string
  private basePath: string

  constructor(contextId: string) {
    this.contextId = contextId
    this.basePath = path.join(process.cwd(), 'data', 'gmail', contextId)
  }

  /**
   * 确保存储目录存在
   */
  private async ensureDirectories() {
    await fs.mkdir(path.join(this.basePath, 'metadata'), { recursive: true })
    await fs.mkdir(path.join(this.basePath, 'content'), { recursive: true })
  }

  /**
   * 存储邮件元数据（轻量级，快速检索）
   */
  async storeMetadata(emails: GmailMetadata[]): Promise<void> {
    await this.ensureDirectories()
    
    const metadataFile = path.join(this.basePath, 'metadata', 'emails.json')
    
    // 读取现有数据
    let existingData: GmailMetadata[] = []
    try {
      const content = await fs.readFile(metadataFile, 'utf-8')
      existingData = JSON.parse(content)
    } catch (error) {
      // 文件不存在，使用空数组
    }

    // 合并新数据（去重）
    const emailMap = new Map<string, GmailMetadata>()
    
    // 先添加现有数据
    existingData.forEach(email => emailMap.set(email.id, email))
    
    // 添加新数据（覆盖重复的）
    emails.forEach(email => emailMap.set(email.id, email))
    
    // 按时间戳排序（最新在前）
    const sortedEmails = Array.from(emailMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    // 限制存储数量（保留最新的1000封）
    const limitedEmails = sortedEmails.slice(0, 1000)
    
    await fs.writeFile(metadataFile, JSON.stringify(limitedEmails, null, 2))
  }

  /**
   * 获取邮件元数据列表
   */
  async getMetadata(page: number = 1, limit: number = 20): Promise<{
    emails: GmailMetadata[]
    total: number
    hasMore: boolean
  }> {
    try {
      const metadataFile = path.join(this.basePath, 'metadata', 'emails.json')
      const content = await fs.readFile(metadataFile, 'utf-8')
      const allEmails: GmailMetadata[] = JSON.parse(content)
      
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const emails = allEmails.slice(startIndex, endIndex)
      
      return {
        emails,
        total: allEmails.length,
        hasMore: endIndex < allEmails.length
      }
    } catch (error) {
      return { emails: [], total: 0, hasMore: false }
    }
  }

  /**
   * 按需存储邮件内容（仅在需要时）
   */
  async storeContent(emailId: string, content: GmailContent): Promise<void> {
    await this.ensureDirectories()
    
    const contentFile = path.join(this.basePath, 'content', `${emailId}.json`)
    await fs.writeFile(contentFile, JSON.stringify(content, null, 2))
  }

  /**
   * 获取邮件内容（按需加载）
   */
  async getContent(emailId: string): Promise<GmailContent | null> {
    try {
      const contentFile = path.join(this.basePath, 'content', `${emailId}.json`)
      const content = await fs.readFile(contentFile, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      return null
    }
  }

  /**
   * 检查邮件内容是否已缓存
   */
  async hasContent(emailId: string): Promise<boolean> {
    try {
      const contentFile = path.join(this.basePath, 'content', `${emailId}.json`)
      await fs.access(contentFile)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 清理过期内容（保留最近30天）
   */
  async cleanupOldContent(): Promise<void> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    try {
      const metadata = await this.getMetadata(1, 1000)
      const oldEmailIds = metadata.emails
        .filter(email => new Date(email.timestamp) < thirtyDaysAgo)
        .map(email => email.id)
      
      const contentDir = path.join(this.basePath, 'content')
      
      for (const emailId of oldEmailIds) {
        const contentFile = path.join(contentDir, `${emailId}.json`)
        try {
          await fs.unlink(contentFile)
        } catch (error) {
          // 文件可能已经不存在
        }
      }
    } catch (error) {
      console.error('清理过期内容失败:', error)
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    metadataCount: number
    contentCount: number
    totalSize: string
  }> {
    try {
      const metadataFile = path.join(this.basePath, 'metadata', 'emails.json')
      const contentDir = path.join(this.basePath, 'content')
      
      // 元数据计数
      let metadataCount = 0
      try {
        const content = await fs.readFile(metadataFile, 'utf-8')
        const emails = JSON.parse(content)
        metadataCount = emails.length
      } catch (error) {
        // 文件不存在
      }
      
      // 内容文件计数
      let contentCount = 0
      let totalSize = 0
      try {
        const files = await fs.readdir(contentDir)
        contentCount = files.filter(f => f.endsWith('.json')).length
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(contentDir, file)
            const stats = await fs.stat(filePath)
            totalSize += stats.size
          }
        }
      } catch (error) {
        // 目录不存在
      }
      
      const formatSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
      }
      
      return {
        metadataCount,
        contentCount,
        totalSize: formatSize(totalSize)
      }
    } catch (error) {
      return {
        metadataCount: 0,
        contentCount: 0,
        totalSize: '0 B'
      }
    }
  }
}