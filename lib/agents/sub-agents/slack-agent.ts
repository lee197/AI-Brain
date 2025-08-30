/**
 * Slack SubAgent - 专业化的Slack处理代理
 * 负责所有Slack相关的操作和智能处理
 */

import { z } from 'zod'
import { SlackWebApi } from '@/lib/slack/api-client'
import { loadSlackMessages, storeSlackMessage } from '@/lib/slack/database-storage'
// 注释掉暂时不需要的导入
// import { SlackEventProcessor } from '@/lib/slack/event-processor'

// SubAgent基础接口
export interface SubAgentResult {
  success: boolean
  data: any
  metadata: {
    agentType: string
    action: string
    processingTime: number
    dataSource: string
  }
  error?: string
}

// Slack特定的操作类型
export type SlackAction = 
  | 'search_messages'
  | 'send_notification' 
  | 'get_recent_messages'
  | 'analyze_conversations'
  | 'process_webhook_message'
  | 'get_channel_activity'
  | 'find_key_discussions'

export class SlackSubAgent {
  private contextId: string
  private slackApi: SlackWebApi | null = null
  // private eventProcessor: SlackEventProcessor
  private debugMode: boolean

  constructor(contextId: string) {
    this.contextId = contextId
    this.debugMode = process.env.NODE_ENV === 'development'
    // this.eventProcessor = new SlackEventProcessor(contextId)
    
    this.log(`🤖 Slack SubAgent initialized for context: ${contextId}`)
  }

  /**
   * 主要方法：处理Slack相关的所有操作
   */
  async execute(action: SlackAction, parameters: Record<string, any> = {}): Promise<SubAgentResult> {
    const startTime = Date.now()
    
    try {
      this.log(`🔄 Executing action: ${action}`, parameters)

      // 确保Slack API客户端已初始化
      await this.ensureSlackConnection()

      let result: any

      switch (action) {
        case 'search_messages':
          result = await this.searchMessages(parameters.query, parameters.limit || 20)
          break
        
        case 'send_notification':
          result = await this.sendNotification(parameters.message, parameters.channel)
          break
          
        case 'get_recent_messages':
          result = await this.getRecentMessages(parameters.days || 7, parameters.limit || 50)
          break
          
        case 'analyze_conversations':
          result = await this.analyzeConversations(parameters.timeframe || 'week')
          break
          
        case 'process_webhook_message':
          result = await this.processWebhookMessage(parameters.webhookData)
          break
          
        case 'get_channel_activity':
          result = await this.getChannelActivity(parameters.hours || 24)
          break
          
        case 'find_key_discussions':
          result = await this.findKeyDiscussions(parameters.keywords, parameters.days || 7)
          break

        default:
          throw new Error(`Unknown Slack action: ${action}`)
      }

      const processingTime = Date.now() - startTime

      return {
        success: true,
        data: result,
        metadata: {
          agentType: 'SLACK',
          action,
          processingTime,
          dataSource: 'slack_api'
        }
      }

    } catch (error: any) {
      const processingTime = Date.now() - startTime
      
      this.log(`❌ Action failed: ${action}`, error.message)

      return {
        success: false,
        data: null,
        metadata: {
          agentType: 'SLACK',
          action,
          processingTime,
          dataSource: 'slack_api'
        },
        error: error.message
      }
    }
  }

  /**
   * 搜索Slack消息
   */
  async searchMessages(query: string, limit: number = 20): Promise<any> {
    this.log(`🔍 Searching messages: "${query}" (limit: ${limit})`)

    // 1. 从本地数据库搜索
    try {
      const { messages } = await loadSlackMessages(this.contextId, { 
        limit,
        search: query 
      })

      if (messages.length > 0) {
        this.log(`📦 Found ${messages.length} messages in local database`)
        return {
          source: 'local_database',
          messages: messages.map(msg => ({
            id: msg.id,
            text: msg.text,
            user: msg.user.name,
            channel: msg.channel.name,
            timestamp: msg.timestamp,
            relevanceScore: this.calculateRelevance(msg.text, query)
          })),
          total: messages.length
        }
      }
    } catch (error) {
      this.log('⚠️ Local search failed, trying Slack API', error)
    }

    // 2. 如果本地没有，使用Slack API搜索
    if (this.slackApi) {
      try {
        const searchResult = await this.slackApi.searchMessages(query, limit)
        
        this.log(`🌐 Found ${searchResult.messages?.length || 0} messages via Slack API`)
        
        return {
          source: 'slack_api',
          messages: searchResult.messages || [],
          total: searchResult.total || 0
        }
      } catch (error) {
        this.log('⚠️ Slack API search failed', error)
      }
    }

    return {
      source: 'none',
      messages: [],
      total: 0,
      message: 'No messages found'
    }
  }

  /**
   * 发送通知到Slack
   */
  async sendNotification(message: string, channel?: string): Promise<any> {
    if (!this.slackApi) {
      throw new Error('Slack API not available')
    }

    this.log(`📤 Sending notification: "${message.substring(0, 30)}..."`)

    try {
      const result = await this.slackApi.sendMessage({
        channel: channel || '#general',
        text: message,
        metadata: {
          source: 'ai_brain',
          type: 'notification',
          contextId: this.contextId
        }
      })

      return {
        messageId: result.messageId,
        channel: result.channel,
        timestamp: result.timestamp,
        success: true
      }
    } catch (error) {
      this.log(`❌ Failed to send notification:`, error)
      throw error
    }
  }

  /**
   * 获取最近的消息
   */
  async getRecentMessages(days: number = 7, limit: number = 50): Promise<any> {
    this.log(`📅 Getting recent messages (${days} days, limit: ${limit})`)

    try {
      const { messages } = await loadSlackMessages(this.contextId, { 
        limit,
        since: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      })

      // 按时间分组统计
      const messagesByDay = this.groupMessagesByDay(messages)
      
      return {
        messages: messages.slice(0, limit),
        total: messages.length,
        timeframe: `${days} days`,
        dailyBreakdown: messagesByDay,
        summary: {
          totalMessages: messages.length,
          uniqueUsers: new Set(messages.map(m => m.user.id)).size,
          uniqueChannels: new Set(messages.map(m => m.channel.id)).size,
          avgMessagesPerDay: Math.round(messages.length / days)
        }
      }
    } catch (error) {
      this.log(`❌ Failed to get recent messages:`, error)
      throw error
    }
  }

  /**
   * 分析对话内容
   */
  async analyzeConversations(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    this.log(`📊 Analyzing conversations for timeframe: ${timeframe}`)

    const days = timeframe === 'day' ? 1 : timeframe === 'week' ? 7 : 30
    const recentData = await this.getRecentMessages(days, 200)

    // 智能分析
    const analysis = {
      overview: {
        totalMessages: recentData.total,
        activePeriod: timeframe,
        dataQuality: recentData.total > 10 ? 'good' : 'limited'
      },
      patterns: {
        peakHours: this.findPeakActivityHours(recentData.messages),
        mostActiveChannels: this.findMostActiveChannels(recentData.messages),
        mostActiveUsers: this.findMostActiveUsers(recentData.messages)
      },
      insights: [
        `团队在 ${timeframe} 内共产生了 ${recentData.total} 条消息`,
        `平均每天 ${recentData.summary.avgMessagesPerDay} 条消息`,
        `活跃用户 ${recentData.summary.uniqueUsers} 人`,
        `活跃频道 ${recentData.summary.uniqueChannels} 个`
      ],
      recommendations: this.generateRecommendations(recentData)
    }

    return analysis
  }

  /**
   * 处理Webhook消息 (增强版)
   */
  async processWebhookMessage(webhookData: any): Promise<any> {
    this.log(`📨 Processing webhook message`)

    try {
      // 1. 基础消息处理
      const processed = {
        messageId: webhookData.event?.ts || Date.now().toString(),
        channelId: webhookData.event?.channel || 'unknown',
        userId: webhookData.event?.user || 'unknown', 
        text: webhookData.event?.text || '',
        timestamp: parseFloat(webhookData.event?.ts || Date.now().toString()) * 1000,
        type: webhookData.event?.type || 'message'
      }

      // 2. SubAgent增强处理
      const enhanced = await this.enhanceWebhookProcessing(processed)

      // 3. 存储到数据库 
      if (enhanced.shouldStore) {
        await storeSlackMessage(this.contextId, {
          id: enhanced.messageId,
          channel: { id: enhanced.channelId, name: enhanced.channelName || 'unknown' },
          user: { 
            id: enhanced.userId, 
            name: enhanced.userName || 'unknown',
            real_name: enhanced.userName || 'unknown',
            avatar: enhanced.userAvatar || ''
          },
          text: enhanced.text,
          timestamp: new Date(enhanced.timestamp),
          thread_ts: enhanced.thread_ts,
          metadata: enhanced.metadata || {}
        })
      }

      return {
        processed: true,
        messageId: enhanced.messageId,
        enhanced: enhanced.enhancements,
        stored: enhanced.shouldStore
      }

    } catch (error) {
      this.log(`❌ Webhook processing failed:`, error)
      throw error
    }
  }

  /**
   * 获取频道活跃度
   */
  async getChannelActivity(hours: number = 24): Promise<any> {
    this.log(`📈 Getting channel activity for last ${hours} hours`)

    const { messages } = await loadSlackMessages(this.contextId, {
      since: new Date(Date.now() - hours * 60 * 60 * 1000),
      limit: 1000
    })

    const channelStats = messages.reduce((stats, msg) => {
      const channelId = msg.channel.id
      if (!stats[channelId]) {
        stats[channelId] = {
          channelName: msg.channel.name,
          messageCount: 0,
          uniqueUsers: new Set(),
          lastActivity: msg.timestamp
        }
      }
      
      stats[channelId].messageCount++
      stats[channelId].uniqueUsers.add(msg.user.id)
      
      if (msg.timestamp > stats[channelId].lastActivity) {
        stats[channelId].lastActivity = msg.timestamp
      }
      
      return stats
    }, {} as Record<string, any>)

    // 转换为数组并排序
    const sortedChannels = Object.entries(channelStats)
      .map(([channelId, stats]: [string, any]) => ({
        channelId,
        channelName: stats.channelName,
        messageCount: stats.messageCount,
        uniqueUsers: stats.uniqueUsers.size,
        lastActivity: stats.lastActivity,
        activityScore: stats.messageCount * stats.uniqueUsers.size
      }))
      .sort((a, b) => b.activityScore - a.activityScore)

    return {
      timeframe: `${hours} hours`,
      totalChannels: sortedChannels.length,
      totalMessages: messages.length,
      channels: sortedChannels.slice(0, 10), // Top 10最活跃频道
      summary: {
        mostActiveChannel: sortedChannels[0]?.channelName || 'None',
        totalActivity: messages.length,
        peakHour: this.findPeakHour(messages)
      }
    }
  }

  /**
   * 查找关键讨论
   */
  async findKeyDiscussions(keywords: string[], days: number = 7): Promise<any> {
    this.log(`🔍 Finding key discussions with keywords: [${keywords.join(', ')}]`)

    const { messages } = await loadSlackMessages(this.contextId, {
      since: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      limit: 500
    })

    // 关键词匹配和评分
    const keyDiscussions = messages
      .map(msg => ({
        ...msg,
        relevanceScore: this.calculateKeywordRelevance(msg.text, keywords),
        keywordMatches: this.findKeywordMatches(msg.text, keywords)
      }))
      .filter(msg => msg.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20)

    return {
      keywords,
      timeframe: `${days} days`,
      totalDiscussions: keyDiscussions.length,
      discussions: keyDiscussions.map(disc => ({
        messageId: disc.id,
        channel: disc.channel.name,
        user: disc.user.name,
        text: disc.text.substring(0, 200) + (disc.text.length > 200 ? '...' : ''),
        timestamp: disc.timestamp,
        relevanceScore: disc.relevanceScore,
        matchedKeywords: disc.keywordMatches
      })),
      insights: this.generateDiscussionInsights(keyDiscussions, keywords)
    }
  }

  /**
   * 确保Slack连接可用
   */
  private async ensureSlackConnection(): Promise<void> {
    if (this.slackApi) return

    try {
      // 尝试加载Slack配置
      const fs = await import('fs/promises')
      const path = await import('path')
      
      const configPath = path.join(process.cwd(), 'data', 'slack', `${this.contextId}.json`)
      const configData = JSON.parse(await fs.readFile(configPath, 'utf-8'))
      
      if (configData.access_token) {
        this.slackApi = new SlackWebApi(configData.access_token)
        this.log('✅ Slack API connection established')
      }
    } catch (error) {
      this.log('⚠️ Slack API not available for this context:', error)
      // SubAgent仍然可以处理本地数据
    }
  }

  /**
   * 增强Webhook处理
   */
  private async enhanceWebhookProcessing(processed: any): Promise<any> {
    // SubAgent可以添加智能增强功能
    const enhancements = []

    // 1. 检测重要消息
    if (this.isImportantMessage(processed.text)) {
      enhancements.push('important_message_detected')
    }

    // 2. 检测问题/Bug报告
    if (this.isBugReport(processed.text)) {
      enhancements.push('bug_report_detected')
    }

    // 3. 检测任务分配
    if (this.isTaskAssignment(processed.text)) {
      enhancements.push('task_assignment_detected')
    }

    // 4. 情感分析
    const sentiment = this.analyzeSentiment(processed.text)
    if (sentiment !== 'neutral') {
      enhancements.push(`sentiment_${sentiment}`)
    }

    return {
      ...processed,
      enhancements,
      shouldStore: true, // SubAgent决定是否需要存储
      enhancedMetadata: {
        importance: this.calculateMessageImportance(processed.text),
        category: this.categorizeMessage(processed.text),
        actionItems: this.extractActionItems(processed.text)
      }
    }
  }

  /**
   * 辅助方法：智能分析函数
   */
  private calculateRelevance(text: string, query: string): number {
    const queryWords = query.toLowerCase().split(' ')
    const textWords = text.toLowerCase().split(' ')
    
    let matches = 0
    for (const word of queryWords) {
      if (textWords.some(textWord => textWord.includes(word))) {
        matches++
      }
    }
    
    return matches / queryWords.length
  }

  private calculateKeywordRelevance(text: string, keywords: string[]): number {
    const textLower = text.toLowerCase()
    let score = 0
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()
      const occurrences = (textLower.match(new RegExp(keywordLower, 'g')) || []).length
      score += occurrences * (keyword.length / 10) // 更长的关键词权重更高
    }
    
    return score
  }

  private findKeywordMatches(text: string, keywords: string[]): string[] {
    const textLower = text.toLowerCase()
    return keywords.filter(keyword => 
      textLower.includes(keyword.toLowerCase())
    )
  }

  private groupMessagesByDay(messages: any[]): Record<string, number> {
    const groups: Record<string, number> = {}
    
    for (const msg of messages) {
      const day = new Date(msg.timestamp).toDateString()
      groups[day] = (groups[day] || 0) + 1
    }
    
    return groups
  }

  private findPeakActivityHours(messages: any[]): number[] {
    const hourCounts = new Array(24).fill(0)
    
    for (const msg of messages) {
      const hour = new Date(msg.timestamp).getHours()
      hourCounts[hour]++
    }
    
    return hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(item => item.hour)
  }

  private findMostActiveChannels(messages: any[]): Array<{name: string, count: number}> {
    const channelCounts: Record<string, number> = {}
    
    for (const msg of messages) {
      const channelName = msg.channel?.name || 'unknown'
      channelCounts[channelName] = (channelCounts[channelName] || 0) + 1
    }
    
    return Object.entries(channelCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private findMostActiveUsers(messages: any[]): Array<{name: string, count: number}> {
    const userCounts: Record<string, number> = {}
    
    for (const msg of messages) {
      const userName = msg.user?.name || 'unknown'
      userCounts[userName] = (userCounts[userName] || 0) + 1
    }
    
    return Object.entries(userCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private findPeakHour(messages: any[]): number {
    const hourCounts = new Array(24).fill(0)
    
    for (const msg of messages) {
      const hour = new Date(msg.timestamp).getHours()
      hourCounts[hour]++
    }
    
    return hourCounts.indexOf(Math.max(...hourCounts))
  }

  /**
   * 消息智能分析
   */
  private isImportantMessage(text: string): boolean {
    const importantKeywords = ['urgent', '紧急', 'critical', '重要', 'deadline', '截止', 'asap']
    return importantKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  private isBugReport(text: string): boolean {
    const bugKeywords = ['bug', 'error', '错误', 'issue', '问题', 'broken', '坏了', 'crash', '崩溃']
    return bugKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  private isTaskAssignment(text: string): boolean {
    const taskKeywords = ['assign', '分配', 'todo', '待办', 'task', '任务', '@']
    return taskKeywords.some(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    )
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', '好', 'great', '棒', 'excellent', '优秀', 'thanks', '谢谢']
    const negativeWords = ['bad', '坏', 'terrible', '糟糕', 'problem', '问题', 'wrong', '错误']
    
    const positiveScore = positiveWords.reduce((score, word) => 
      score + (text.toLowerCase().includes(word) ? 1 : 0), 0)
    const negativeScore = negativeWords.reduce((score, word) => 
      score + (text.toLowerCase().includes(word) ? 1 : 0), 0)
    
    if (positiveScore > negativeScore) return 'positive'
    if (negativeScore > positiveScore) return 'negative'
    return 'neutral'
  }

  private calculateMessageImportance(text: string): number {
    let score = 0
    
    if (this.isImportantMessage(text)) score += 3
    if (this.isBugReport(text)) score += 2
    if (this.isTaskAssignment(text)) score += 2
    if (text.length > 100) score += 1  // 长消息通常更重要
    if (text.includes('@')) score += 1  // 包含@提及
    
    return Math.min(score, 5) // 最高5分
  }

  private categorizeMessage(text: string): string {
    if (this.isBugReport(text)) return 'bug_report'
    if (this.isTaskAssignment(text)) return 'task_assignment'
    if (this.isImportantMessage(text)) return 'important_announcement'
    if (text.includes('?') || text.includes('？')) return 'question'
    return 'general_discussion'
  }

  private extractActionItems(text: string): string[] {
    const actionItems = []
    
    // 简单的action item提取
    if (text.includes('TODO') || text.includes('待办')) {
      actionItems.push('has_todo_item')
    }
    
    if (text.includes('@') && (text.includes('请') || text.includes('please'))) {
      actionItems.push('has_request')
    }
    
    if (text.includes('deadline') || text.includes('截止')) {
      actionItems.push('has_deadline')
    }
    
    return actionItems
  }

  private generateRecommendations(data: any): string[] {
    const recommendations = []
    
    if (data.summary.avgMessagesPerDay < 5) {
      recommendations.push('团队沟通频率较低，建议增加日常standup')
    }
    
    if (data.summary.uniqueChannels > 10) {
      recommendations.push('频道较多，建议整理和归档不活跃频道')
    }
    
    if (data.summary.uniqueUsers < 3) {
      recommendations.push('参与人数较少，建议邀请更多团队成员参与讨论')
    }
    
    return recommendations
  }

  private generateDiscussionInsights(discussions: any[], keywords: string[]): string[] {
    const insights = []
    
    if (discussions.length > 0) {
      insights.push(`关键词"${keywords.join(', ')}"在团队讨论中出现 ${discussions.length} 次`)
      
      const channels = new Set(discussions.map(d => d.channel.name))
      insights.push(`讨论分布在 ${channels.size} 个频道中`)
      
      const avgScore = discussions.reduce((sum, d) => sum + d.relevanceScore, 0) / discussions.length
      insights.push(`平均相关性评分: ${avgScore.toFixed(2)}/5.0`)
    }
    
    return insights
  }

  private log(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(`[SlackSubAgent:${this.contextId}] ${message}`, data || '')
    }
  }
}

// 导出便捷函数
export async function createSlackSubAgent(contextId: string): Promise<SlackSubAgent> {
  return new SlackSubAgent(contextId)
}