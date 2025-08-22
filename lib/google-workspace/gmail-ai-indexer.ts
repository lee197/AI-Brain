/**
 * Gmail AI上下文索引器
 * 专门为AI学习和分析设计的邮件内容批量处理系统
 */

import { GmailApiClient } from './gmail-client'
import { GmailStorageManager } from './gmail-storage'
import fs from 'fs/promises'
import path from 'path'

interface EmailSummary {
  id: string
  subject: string
  from: string
  to: string
  date: string
  summary: string  // AI生成的摘要
  keywords: string[]  // 关键词提取
  sentiment: 'positive' | 'negative' | 'neutral'  // 情感分析
  category: string  // 邮件分类
  importance: number  // 重要性评分 1-10
  contentLength: number
  hasAttachments: boolean
  timestamp: string
}

interface AIContext {
  emails: EmailSummary[]
  totalEmails: number
  timeRange: {
    from: string
    to: string
  }
  categories: Record<string, number>
  lastUpdated: string
}

export class GmailAIIndexer {
  private contextId: string
  private basePath: string
  private aiContextPath: string

  constructor(contextId: string) {
    this.contextId = contextId
    this.basePath = path.join(process.cwd(), 'data', 'gmail', contextId)
    this.aiContextPath = path.join(this.basePath, 'ai-context')
  }

  /**
   * 确保AI上下文目录存在
   */
  private async ensureDirectories() {
    await fs.mkdir(this.aiContextPath, { recursive: true })
  }

  /**
   * 批量索引邮件内容用于AI学习
   * 策略：优先索引重要邮件，分批处理
   */
  async indexEmailsForAI(gmailClient: GmailApiClient, options: {
    maxEmails?: number
    priority?: 'recent' | 'important' | 'unread'
    forceRefresh?: boolean
  } = {}): Promise<{ indexed: number, skipped: number, errors: number }> {
    const { maxEmails = 100, priority = 'recent', forceRefresh = false } = options
    
    await this.ensureDirectories()
    
    // 获取现有的AI上下文
    const existingContext = await this.getAIContext()
    const indexedIds = new Set(existingContext.emails.map(e => e.id))
    
    let indexed = 0
    let skipped = 0
    let errors = 0

    try {
      // 根据优先级获取邮件列表
      let emails: any[] = []
      
      switch (priority) {
        case 'recent':
          emails = await gmailClient.getInboxEmails(maxEmails)
          break
        case 'important':
          emails = await gmailClient.searchEmails('is:important', maxEmails)
          break
        case 'unread':
          emails = await gmailClient.searchEmails('is:unread', maxEmails)
          break
      }

      console.log(`开始索引${emails.length}封邮件用于AI学习...`)

      // 分批处理邮件（每批5封，避免API限制）
      const batchSize = 5
      for (let i = 0; i < emails.length; i += batchSize) {
        const batch = emails.slice(i, i + batchSize)
        
        for (const email of batch) {
          try {
            // 跳过已索引的邮件（除非强制刷新）
            if (!forceRefresh && indexedIds.has(email.id)) {
              skipped++
              continue
            }

            // 处理单封邮件
            const summary = await this.processEmailForAI(email)
            if (summary) {
              await this.updateAIContext(summary)
              indexed++
              console.log(`✅ 已索引: ${summary.subject.substring(0, 50)}...`)
            }
            
          } catch (error) {
            console.error(`❌ 索引邮件失败 (${email.id}):`, error)
            errors++
          }
        }
        
        // 批次间延迟，避免API限制
        if (i + batchSize < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

      console.log(`📊 AI索引完成: ${indexed}个新增, ${skipped}个跳过, ${errors}个错误`)
      
    } catch (error) {
      console.error('批量索引失败:', error)
    }

    return { indexed, skipped, errors }
  }

  /**
   * 处理单封邮件生成AI友好的摘要
   */
  private async processEmailForAI(email: any): Promise<EmailSummary | null> {
    try {
      // 提取关键信息
      const content = email.content || ''
      const subject = email.subject || ''
      
      // 简单的关键词提取（实际应用中可以用更高级的NLP）
      const keywords = this.extractKeywords(content + ' ' + subject)
      
      // 简单的情感分析
      const sentiment = this.analyzeSentiment(content)
      
      // 邮件分类
      const category = this.categorizeEmail(subject, content, email.labels)
      
      // 重要性评分
      const importance = this.calculateImportance(email)
      
      // 生成摘要
      const summary = this.generateSummary(content)

      return {
        id: email.id,
        subject,
        from: email.senderEmail || email.sender,
        to: email.recipients?.join(', ') || '',
        date: email.timestamp,
        summary,
        keywords,
        sentiment,
        category,
        importance,
        contentLength: content.length,
        hasAttachments: email.attachments?.length > 0,
        timestamp: email.timestamp
      }
      
    } catch (error) {
      console.error('处理邮件失败:', error)
      return null
    }
  }

  /**
   * 简单关键词提取
   */
  private extractKeywords(text: string): string[] {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      '的', '了', '在', '是', '我', '你', '他', '她', '它', '们', '这', '那', '有', '没', '不', '也', '都', '很', '更', '最'
    ])
    
    const words = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word))
    
    // 统计词频
    const frequency: Record<string, number> = {}
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1
    })
    
    // 返回频率最高的前10个词
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * 简单情感分析
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect', 'love', 'like', 'happy', 'pleased', '好', '棒', '优秀', '完美', '喜欢', '高兴']
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'upset', 'problem', 'issue', 'error', '坏', '糟糕', '讨厌', '生气', '问题', '错误']
    
    const lowerText = text.toLowerCase()
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  /**
   * 邮件分类
   */
  private categorizeEmail(subject: string, content: string, labels: string[]): string {
    const text = (subject + ' ' + content).toLowerCase()
    
    // 基于标签的分类
    if (labels?.includes('CATEGORY_PROMOTIONS')) return 'marketing'
    if (labels?.includes('CATEGORY_SOCIAL')) return 'social'
    if (labels?.includes('CATEGORY_UPDATES')) return 'updates'
    if (labels?.includes('CATEGORY_FORUMS')) return 'forums'
    
    // 基于内容的分类
    if (text.includes('meeting') || text.includes('schedule') || text.includes('calendar') || text.includes('会议') || text.includes('日程')) return 'meetings'
    if (text.includes('invoice') || text.includes('payment') || text.includes('bill') || text.includes('发票') || text.includes('付款')) return 'finance'
    if (text.includes('project') || text.includes('task') || text.includes('deadline') || text.includes('项目') || text.includes('任务')) return 'project'
    if (text.includes('urgent') || text.includes('asap') || text.includes('important') || text.includes('紧急') || text.includes('重要')) return 'urgent'
    
    return 'general'
  }

  /**
   * 计算邮件重要性
   */
  private calculateImportance(email: any): number {
    let score = 5 // 基础分数
    
    // 基于标签
    if (email.labels?.includes('IMPORTANT')) score += 3
    if (email.labels?.includes('STARRED')) score += 2
    if (email.labels?.includes('UNREAD')) score += 1
    
    // 基于发件人域名
    const domain = email.senderEmail?.split('@')[1]
    if (domain?.includes('company.com') || domain?.includes('work.com')) score += 2
    
    // 基于内容长度
    if (email.content?.length > 1000) score += 1
    
    // 基于附件
    if (email.attachments?.length > 0) score += 1
    
    return Math.min(10, Math.max(1, score))
  }

  /**
   * 生成摘要
   */
  private generateSummary(content: string): string {
    if (!content || content.length < 50) return content
    
    // 简单摘要：取前200个字符，在句号处截断
    let summary = content.substring(0, 200)
    const lastPeriod = summary.lastIndexOf('.')
    const lastQuestion = summary.lastIndexOf('?')
    const lastExclamation = summary.lastIndexOf('!')
    
    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation)
    
    if (lastSentenceEnd > 50) {
      summary = summary.substring(0, lastSentenceEnd + 1)
    }
    
    return summary.trim() + (content.length > summary.length ? '...' : '')
  }

  /**
   * 更新AI上下文
   */
  private async updateAIContext(emailSummary: EmailSummary): Promise<void> {
    const contextFile = path.join(this.aiContextPath, 'ai-context.json')
    
    let context: AIContext
    try {
      const content = await fs.readFile(contextFile, 'utf-8')
      context = JSON.parse(content)
    } catch (error) {
      // 初始化新的上下文
      context = {
        emails: [],
        totalEmails: 0,
        timeRange: { from: emailSummary.timestamp, to: emailSummary.timestamp },
        categories: {},
        lastUpdated: new Date().toISOString()
      }
    }

    // 添加或更新邮件
    const existingIndex = context.emails.findIndex(e => e.id === emailSummary.id)
    if (existingIndex >= 0) {
      context.emails[existingIndex] = emailSummary
    } else {
      context.emails.push(emailSummary)
    }

    // 按时间排序，保留最新的500封
    context.emails.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    context.emails = context.emails.slice(0, 500)

    // 更新统计信息
    context.totalEmails = context.emails.length
    context.lastUpdated = new Date().toISOString()
    
    // 更新时间范围
    if (context.emails.length > 0) {
      context.timeRange.from = context.emails[context.emails.length - 1].timestamp
      context.timeRange.to = context.emails[0].timestamp
    }
    
    // 更新分类统计
    context.categories = {}
    context.emails.forEach(email => {
      context.categories[email.category] = (context.categories[email.category] || 0) + 1
    })

    await fs.writeFile(contextFile, JSON.stringify(context, null, 2))
  }

  /**
   * 获取AI上下文
   */
  async getAIContext(): Promise<AIContext> {
    try {
      const contextFile = path.join(this.aiContextPath, 'ai-context.json')
      const content = await fs.readFile(contextFile, 'utf-8')
      return JSON.parse(content)
    } catch (error) {
      return {
        emails: [],
        totalEmails: 0,
        timeRange: { from: '', to: '' },
        categories: {},
        lastUpdated: ''
      }
    }
  }

  /**
   * 获取特定查询的相关邮件（供AI使用）
   */
  async getRelevantEmailsForAI(query: string, limit: number = 10): Promise<EmailSummary[]> {
    const context = await this.getAIContext()
    const queryLower = query.toLowerCase()
    
    // 简单的相关性评分
    const scoredEmails = context.emails.map(email => {
      let score = 0
      
      // 主题匹配
      if (email.subject.toLowerCase().includes(queryLower)) score += 5
      
      // 摘要匹配
      if (email.summary.toLowerCase().includes(queryLower)) score += 3
      
      // 关键词匹配
      const matchingKeywords = email.keywords.filter(keyword => 
        queryLower.includes(keyword) || keyword.includes(queryLower)
      )
      score += matchingKeywords.length * 2
      
      // 分类匹配
      if (email.category.toLowerCase().includes(queryLower)) score += 2
      
      // 重要性加成
      score += email.importance * 0.5
      
      // 时间新近性加成
      const daysSinceEmail = (Date.now() - new Date(email.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      score += Math.max(0, 10 - daysSinceEmail) * 0.1

      return { email, score }
    })
    
    // 返回评分最高的邮件
    return scoredEmails
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.email)
  }

  /**
   * 获取AI上下文统计
   */
  async getAIStats(): Promise<{
    totalIndexed: number
    categories: Record<string, number>
    averageImportance: number
    lastUpdated: string
    storageSize: string
  }> {
    const context = await this.getAIContext()
    
    const averageImportance = context.emails.length > 0
      ? context.emails.reduce((sum, email) => sum + email.importance, 0) / context.emails.length
      : 0

    // 计算存储大小
    let storageSize = '0 KB'
    try {
      const contextFile = path.join(this.aiContextPath, 'ai-context.json')
      const stats = await fs.stat(contextFile)
      const sizeInKB = (stats.size / 1024).toFixed(1)
      storageSize = `${sizeInKB} KB`
    } catch (error) {
      // 文件不存在
    }

    return {
      totalIndexed: context.totalEmails,
      categories: context.categories,
      averageImportance: Math.round(averageImportance * 10) / 10,
      lastUpdated: context.lastUpdated,
      storageSize
    }
  }
}