/**
 * Slack SubAgent 简化版本 - 用于初始测试
 * 专注于核心功能，避免复杂依赖
 */

import { loadSlackMessages } from '@/lib/slack/database-storage'

export interface SlackSubAgentResult {
  success: boolean
  data: any
  metadata: {
    agentType: 'SLACK'
    action: string
    processingTime: number
  }
  error?: string
}

export class SlackSubAgentSimple {
  private contextId: string
  private debugMode: boolean

  constructor(contextId: string) {
    this.contextId = contextId
    this.debugMode = process.env.NODE_ENV === 'development'
    
    if (this.debugMode) {
      console.log(`🤖 Slack SubAgent (Simple) initialized for context: ${contextId}`)
    }
  }

  /**
   * 获取最近的Slack消息
   */
  async getRecentMessages(days: number = 7, limit: number = 50): Promise<SlackSubAgentResult> {
    const startTime = Date.now()
    
    try {
      this.log(`📅 Getting recent messages (${days} days, limit: ${limit})`)

      // 从数据库加载消息
      const { messages, totalCount } = await loadSlackMessages(this.contextId, { 
        limit,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      })

      // 生成摘要统计
      const summary = {
        totalMessages: totalCount,
        returnedMessages: messages.length,
        timeframe: `${days} days`,
        uniqueUsers: new Set(messages.map(m => m.user.id)).size,
        uniqueChannels: new Set(messages.map(m => m.channel.id)).size,
        avgMessagesPerDay: Math.round(totalCount / days)
      }

      // 按天分组统计
      const messagesByDay = this.groupMessagesByDay(messages)

      this.log(`✅ Found ${messages.length} messages from ${summary.uniqueChannels} channels`)

      return {
        success: true,
        data: {
          messages: messages.slice(0, limit).map(msg => ({
            id: msg.id,
            text: msg.text,
            user: msg.user.name,
            channel: msg.channel.name,
            timestamp: msg.timestamp,
            formattedTime: new Date(msg.timestamp).toLocaleString('zh-CN')
          })),
          summary,
          dailyBreakdown: messagesByDay
        },
        metadata: {
          agentType: 'SLACK',
          action: 'get_recent_messages',
          processingTime: Date.now() - startTime
        }
      }

    } catch (error: any) {
      this.log(`❌ Failed to get recent messages: ${error.message}`)
      
      return {
        success: false,
        data: null,
        metadata: {
          agentType: 'SLACK',
          action: 'get_recent_messages',
          processingTime: Date.now() - startTime
        },
        error: error.message
      }
    }
  }

  /**
   * 搜索Slack消息
   */
  async searchMessages(query: string, limit: number = 20): Promise<SlackSubAgentResult> {
    const startTime = Date.now()
    
    try {
      this.log(`🔍 Searching messages: "${query}" (limit: ${limit})`)

      // 从数据库搜索
      const { messages } = await loadSlackMessages(this.contextId, { limit: 200 })

      // 简单的文本匹配搜索
      const filteredMessages = messages
        .filter(msg => 
          msg.text.toLowerCase().includes(query.toLowerCase()) ||
          msg.user.name.toLowerCase().includes(query.toLowerCase()) ||
          msg.channel.name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit)
        .map(msg => ({
          id: msg.id,
          text: msg.text,
          user: msg.user.name,
          channel: msg.channel.name,
          timestamp: msg.timestamp,
          formattedTime: new Date(msg.timestamp).toLocaleString('zh-CN'),
          relevanceScore: this.calculateRelevance(msg.text, query)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)

      this.log(`✅ Search found ${filteredMessages.length} matching messages`)

      return {
        success: true,
        data: {
          query,
          messages: filteredMessages,
          totalMatches: filteredMessages.length,
          searchTime: Date.now() - startTime
        },
        metadata: {
          agentType: 'SLACK',
          action: 'search_messages',
          processingTime: Date.now() - startTime
        }
      }

    } catch (error: any) {
      this.log(`❌ Search failed: ${error.message}`)
      
      return {
        success: false,
        data: null,
        metadata: {
          agentType: 'SLACK',
          action: 'search_messages',
          processingTime: Date.now() - startTime
        },
        error: error.message
      }
    }
  }

  /**
   * 分析对话活跃度
   */
  async analyzeActivity(hours: number = 24): Promise<SlackSubAgentResult> {
    const startTime = Date.now()
    
    try {
      this.log(`📊 Analyzing activity for last ${hours} hours`)

      const { messages } = await loadSlackMessages(this.contextId, {
        startDate: new Date(Date.now() - hours * 60 * 60 * 1000),
        limit: 1000
      })

      // 频道活跃度统计
      const channelStats = this.calculateChannelStats(messages)
      
      // 用户活跃度统计
      const userStats = this.calculateUserStats(messages)
      
      // 时间分布统计
      const hourlyStats = this.calculateHourlyStats(messages)

      const analysis = {
        timeframe: `${hours} hours`,
        overview: {
          totalMessages: messages.length,
          activeChannels: channelStats.length,
          activeUsers: userStats.length,
          avgMessagesPerHour: Math.round(messages.length / hours)
        },
        topChannels: channelStats.slice(0, 5),
        topUsers: userStats.slice(0, 5),
        peakHours: hourlyStats.sort((a, b) => b.count - a.count).slice(0, 3),
        insights: this.generateActivityInsights(messages, hours)
      }

      this.log(`✅ Activity analysis completed: ${messages.length} messages analyzed`)

      return {
        success: true,
        data: analysis,
        metadata: {
          agentType: 'SLACK',
          action: 'analyze_activity',
          processingTime: Date.now() - startTime
        }
      }

    } catch (error: any) {
      this.log(`❌ Activity analysis failed: ${error.message}`)
      
      return {
        success: false,
        data: null,
        metadata: {
          agentType: 'SLACK',
          action: 'analyze_activity',
          processingTime: Date.now() - startTime
        },
        error: error.message
      }
    }
  }

  /**
   * 辅助方法：计算文本相关性
   */
  private calculateRelevance(text: string, query: string): number {
    const queryWords = query.toLowerCase().split(' ').filter(w => w.length > 0)
    const textLower = text.toLowerCase()
    
    let score = 0
    for (const word of queryWords) {
      const occurrences = (textLower.match(new RegExp(word, 'g')) || []).length
      score += occurrences * (word.length / 10) // 长词权重更高
    }
    
    return score
  }

  /**
   * 按天分组消息
   */
  private groupMessagesByDay(messages: any[]): Record<string, number> {
    const groups: Record<string, number> = {}
    
    for (const msg of messages) {
      const day = new Date(msg.timestamp).toDateString()
      groups[day] = (groups[day] || 0) + 1
    }
    
    return groups
  }

  /**
   * 计算频道统计
   */
  private calculateChannelStats(messages: any[]): Array<{name: string, count: number, lastActivity: string}> {
    const channelData: Record<string, {count: number, lastActivity: Date}> = {}
    
    for (const msg of messages) {
      const channelName = msg.channel?.name || 'unknown'
      if (!channelData[channelName]) {
        channelData[channelName] = { count: 0, lastActivity: new Date(msg.timestamp) }
      }
      
      channelData[channelName].count++
      if (new Date(msg.timestamp) > channelData[channelName].lastActivity) {
        channelData[channelName].lastActivity = new Date(msg.timestamp)
      }
    }
    
    return Object.entries(channelData)
      .map(([name, data]) => ({
        name,
        count: data.count,
        lastActivity: data.lastActivity.toLocaleString('zh-CN')
      }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * 计算用户统计
   */
  private calculateUserStats(messages: any[]): Array<{name: string, count: number}> {
    const userCounts: Record<string, number> = {}
    
    for (const msg of messages) {
      const userName = msg.user?.name || 'unknown'
      userCounts[userName] = (userCounts[userName] || 0) + 1
    }
    
    return Object.entries(userCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * 计算小时统计
   */
  private calculateHourlyStats(messages: any[]): Array<{hour: number, count: number}> {
    const hourCounts = new Array(24).fill(0)
    
    for (const msg of messages) {
      const hour = new Date(msg.timestamp).getHours()
      hourCounts[hour]++
    }
    
    return hourCounts.map((count, hour) => ({ hour, count }))
  }

  /**
   * 生成活跃度洞察
   */
  private generateActivityInsights(messages: any[], hours: number): string[] {
    const insights = []
    
    if (messages.length === 0) {
      insights.push(`在过去${hours}小时内没有Slack消息记录`)
      return insights
    }

    const avgPerHour = messages.length / hours
    
    if (avgPerHour > 10) {
      insights.push(`团队沟通非常活跃，平均每小时 ${avgPerHour.toFixed(1)} 条消息`)
    } else if (avgPerHour > 3) {
      insights.push(`团队保持正常的沟通频率，平均每小时 ${avgPerHour.toFixed(1)} 条消息`)
    } else {
      insights.push(`团队沟通相对较少，平均每小时 ${avgPerHour.toFixed(1)} 条消息`)
    }

    const uniqueChannels = new Set(messages.map(m => m.channel?.name)).size
    if (uniqueChannels > 5) {
      insights.push(`讨论分散在 ${uniqueChannels} 个频道中，建议关注主要频道`)
    }

    const uniqueUsers = new Set(messages.map(m => m.user?.id)).size
    insights.push(`${uniqueUsers} 位团队成员参与了讨论`)

    return insights
  }

  private log(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(`[SlackSubAgent:${this.contextId}] ${message}`, data || '')
    }
  }
}