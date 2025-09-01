/**
 * Slack SubAgent 简化版本 - 用于初始测试
 * 专注于核心功能，避免复杂依赖
 */

import { loadSlackMessages } from '@/lib/slack/database-storage'
import { LocalSlackNLP, SentimentResult, TaskItem, MeetingThread, TeamInsights } from '@/lib/nlp/local-analyzer'
import { BrowserSafeNLP, BrowserSafeAnalysisResult } from '@/lib/nlp/browser-safe-analyzer'

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
  private nlpAnalyzer: LocalSlackNLP
  private enhancedNLP: BrowserSafeNLP

  constructor(contextId: string) {
    this.contextId = contextId
    this.debugMode = process.env.NODE_ENV === 'development'
    this.nlpAnalyzer = new LocalSlackNLP()
    this.enhancedNLP = new BrowserSafeNLP()
    
    if (this.debugMode) {
      console.log(`🤖 Slack SubAgent (Simple) initialized for context: ${contextId}`)
      console.log(`🧠 Enhanced Multilingual NLP Analyzer ready for deep analysis`)
      console.log(`🎯 Features: Chinese segmentation, advanced sentiment, task extraction`)
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

  /**
   * 🧠 深度分析 - 综合智能分析
   */
  async performDeepAnalysis(options: {
    days?: number
    includeSentiment?: boolean
    includeTasks?: boolean
    includeMeetings?: boolean
    includeTeamInsights?: boolean
  } = {}): Promise<SlackSubAgentResult> {
    const startTime = Date.now()
    const { days = 7, ...analysisOptions } = options
    
    try {
      this.log(`🧠 Starting deep analysis (${days} days)`, analysisOptions)

      // 获取分析数据
      const { messages } = await loadSlackMessages(this.contextId, {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        limit: 500 // 增加样本量用于深度分析
      })

      if (messages.length === 0) {
        return {
          success: true,
          data: {
            message: '没有找到可分析的Slack消息',
            timeframe: `${days} days`,
            summary: '无数据可分析'
          },
          metadata: {
            agentType: 'SLACK',
            action: 'deep_analysis',
            processingTime: Date.now() - startTime
          }
        }
      }

      // 执行增强的深度分析
      this.log(`🔧 Using enhanced multilingual NLP for deep analysis`)
      
      // 合并消息文本进行批量分析
      const combinedText = messages.map(m => m.text).filter(Boolean).join(' ')
      const enhancedAnalysis = await this.enhancedNLP.analyzeComprehensive(combinedText)
      
      // 执行传统深度分析
      const deepAnalysisResult = await this.nlpAnalyzer.performDeepAnalysis(messages, {
        includeSentiment: analysisOptions.includeSentiment,
        includeTasks: analysisOptions.includeTasks,
        includeMeetings: analysisOptions.includeMeetings,
        includeTeamInsights: analysisOptions.includeTeamInsights,
        timeframeDays: days
      })
      
      // 融合增强分析结果
      if (enhancedAnalysis) {
        // 增强情感分析
        if (deepAnalysisResult.sentiment && enhancedAnalysis.sentiment) {
          deepAnalysisResult.sentiment.enhancedEmotions = enhancedAnalysis.sentiment.emotions
          deepAnalysisResult.sentiment.contextFactors = enhancedAnalysis.sentiment.contextFactors
          deepAnalysisResult.sentiment.confidence = Math.max(
            deepAnalysisResult.sentiment.confidence, 
            enhancedAnalysis.sentiment.confidence
          )
        }
        
        // 增强任务识别
        if (deepAnalysisResult.tasks && enhancedAnalysis.tasks) {
          // 合并高置信度任务
          const highConfidenceTasks = enhancedAnalysis.tasks.filter(t => t.confidence > 0.7)
          deepAnalysisResult.tasks.push(...highConfidenceTasks.map(t => ({
            id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: t.title,
            description: t.description,
            assignee: t.assignee || null,
            priority: t.priority as 'urgent' | 'high' | 'medium' | 'low',
            confidence: t.confidence,
            deadline: t.deadline,
            source: 'enhanced_nlp'
          })))
        }
        
        // 添加语言检测信息
        deepAnalysisResult.languageInfo = {
          detectedLanguages: enhancedAnalysis.languageInfo.detectedLanguages,
          primaryLanguage: enhancedAnalysis.languageInfo.primaryLanguage,
          mixedLanguage: enhancedAnalysis.languageInfo.mixedLanguage
        }
        
        // 添加实体识别
        if (enhancedAnalysis.entities && enhancedAnalysis.entities.length > 0) {
          deepAnalysisResult.entities = enhancedAnalysis.entities
        }
      }

      this.log(`✅ Deep analysis completed: ${deepAnalysisResult.summary}`)

      return {
        success: true,
        data: {
          timeframe: `${days} days`,
          messageCount: messages.length,
          analysis: deepAnalysisResult,
          insights: this.formatInsights(deepAnalysisResult),
          recommendations: this.formatRecommendations(deepAnalysisResult)
        },
        metadata: {
          agentType: 'SLACK',
          action: 'deep_analysis',
          processingTime: Date.now() - startTime
        }
      }

    } catch (error: any) {
      this.log(`❌ Deep analysis failed: ${error.message}`)
      
      return {
        success: false,
        data: null,
        metadata: {
          agentType: 'SLACK',
          action: 'deep_analysis',
          processingTime: Date.now() - startTime
        },
        error: error.message
      }
    }
  }

  /**
   * 🎯 情感分析专项
   */
  async analyzeSentiment(days: number = 7): Promise<SlackSubAgentResult> {
    const startTime = Date.now()
    
    try {
      this.log(`😊 Analyzing team sentiment (${days} days)`)

      const { messages } = await loadSlackMessages(this.contextId, {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        limit: 300
      })

      // 使用增强的情感分析
      this.log(`🔧 Using enhanced sentiment analysis`)
      const combinedText = messages.map(m => m.text).filter(Boolean).join(' ')
      const enhancedSentiment = await this.enhancedNLP.analyzeComprehensive(combinedText)
      
      // 传统情感分析作为备份
      const sentimentResult = await this.nlpAnalyzer.analyzeSentiment(messages)
      
      // 融合分析结果
      if (enhancedSentiment?.sentiment) {
        sentimentResult.enhancedEmotions = enhancedSentiment.sentiment.emotions
        sentimentResult.contextFactors = enhancedSentiment.sentiment.contextFactors
        sentimentResult.confidence = Math.max(sentimentResult.confidence, enhancedSentiment.sentiment.confidence)
        
        this.log(`✨ Enhanced sentiment: ${enhancedSentiment.sentiment.primaryEmotion} (${enhancedSentiment.sentiment.confidence})`)
      }
      
      const moodTrend = this.calculateMoodTrend(messages)
      const riskAlerts = this.generateRiskAlerts(sentimentResult, messages)

      return {
        success: true,
        data: {
          sentiment: sentimentResult,
          moodTrend,
          riskAlerts,
          teamMoodSummary: this.generateMoodSummary(sentimentResult, moodTrend)
        },
        metadata: {
          agentType: 'SLACK',
          action: 'analyze_sentiment',
          processingTime: Date.now() - startTime
        }
      }

    } catch (error: any) {
      this.log(`❌ Sentiment analysis failed: ${error.message}`)
      
      return {
        success: false,
        data: null,
        metadata: {
          agentType: 'SLACK',
          action: 'analyze_sentiment',
          processingTime: Date.now() - startTime
        },
        error: error.message
      }
    }
  }

  /**
   * 📋 任务提取专项
   */
  async extractTasks(days: number = 7): Promise<SlackSubAgentResult> {
    const startTime = Date.now()
    
    try {
      this.log(`📋 Extracting tasks from conversations (${days} days)`)

      const { messages } = await loadSlackMessages(this.contextId, {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        limit: 400
      })

      // 使用增强的任务提取
      this.log(`🔧 Using enhanced task extraction`)
      const combinedText = messages.map(m => m.text).filter(Boolean).join(' ')
      const enhancedAnalysis = await this.enhancedNLP.analyzeComprehensive(combinedText)
      
      // 传统任务提取
      const tasks = await this.nlpAnalyzer.extractTasks(messages)
      
      // 合并增强的任务识别结果
      if (enhancedAnalysis?.tasks) {
        const highConfidenceTasks = enhancedAnalysis.tasks.filter(t => t.confidence > 0.6)
        const enhancedTasks = highConfidenceTasks.map(t => ({
          id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: t.title,
          description: t.description,
          assignee: t.assignee || null,
          priority: t.priority as 'urgent' | 'high' | 'medium' | 'low',
          confidence: t.confidence,
          deadline: t.deadline,
          source: 'enhanced_nlp'
        }))
        
        tasks.push(...enhancedTasks)
        this.log(`✨ Enhanced task extraction: +${enhancedTasks.length} high-confidence tasks`)
      }
      
      const taskSummary = this.generateTaskSummary(tasks)
      const priorityDistribution = this.calculatePriorityDistribution(tasks)

      return {
        success: true,
        data: {
          tasks,
          summary: taskSummary,
          priorityDistribution,
          totalTasks: tasks.length,
          urgentTasks: tasks.filter(t => t.priority === 'urgent').length,
          unassignedTasks: tasks.filter(t => !t.assignee).length
        },
        metadata: {
          agentType: 'SLACK',
          action: 'extract_tasks',
          processingTime: Date.now() - startTime
        }
      }

    } catch (error: any) {
      this.log(`❌ Task extraction failed: ${error.message}`)
      
      return {
        success: false,
        data: null,
        metadata: {
          agentType: 'SLACK',
          action: 'extract_tasks',
          processingTime: Date.now() - startTime
        },
        error: error.message
      }
    }
  }

  /**
   * 🎯 会议分析专项
   */
  async analyzeMeetings(days: number = 7): Promise<SlackSubAgentResult> {
    const startTime = Date.now()
    
    try {
      this.log(`🎯 Analyzing meeting threads (${days} days)`)

      const { messages } = await loadSlackMessages(this.contextId, {
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        limit: 300
      })

      const meetings = await this.nlpAnalyzer.analyzeMeetings(messages)
      const meetingSummary = this.generateMeetingSummary(meetings)

      return {
        success: true,
        data: {
          meetings,
          summary: meetingSummary,
          totalMeetings: meetings.length,
          avgDuration: this.calculateAvgMeetingDuration(meetings),
          productiveMeetings: meetings.filter(m => m.sentiment === 'productive').length,
          decisionsCount: meetings.reduce((sum, m) => sum + m.decisions.length, 0)
        },
        metadata: {
          agentType: 'SLACK',
          action: 'analyze_meetings',
          processingTime: Date.now() - startTime
        }
      }

    } catch (error: any) {
      this.log(`❌ Meeting analysis failed: ${error.message}`)
      
      return {
        success: false,
        data: null,
        metadata: {
          agentType: 'SLACK',
          action: 'analyze_meetings',
          processingTime: Date.now() - startTime
        },
        error: error.message
      }
    }
  }

  /**
   * 格式化洞察输出 (供Master Agent使用)
   */
  private formatInsights(analysis: any): string {
    const insights = []

    if (analysis.sentiment) {
      const { classification, score } = analysis.sentiment
      insights.push(`团队情感: ${classification} (${score > 0 ? '+' : ''}${score})`)
    }

    if (analysis.tasks) {
      const urgentCount = analysis.tasks.filter((t: TaskItem) => t.priority === 'urgent').length
      insights.push(`识别任务: ${analysis.tasks.length}个 (${urgentCount}个紧急)`)
    }

    if (analysis.meetings) {
      const productiveCount = analysis.meetings.filter((m: MeetingThread) => m.sentiment === 'productive').length
      insights.push(`会议效率: ${productiveCount}/${analysis.meetings.length}个高效`)
    }

    if (analysis.teamInsights) {
      insights.push(`协作评分: ${analysis.teamInsights.collaborationScore}/100`)
    }

    return insights.join(' | ')
  }

  /**
   * 格式化建议输出 (供Master Agent决策)
   */
  private formatRecommendations(analysis: any): string[] {
    const recommendations = []

    if (analysis.teamInsights?.recommendations) {
      for (const rec of analysis.teamInsights.recommendations) {
        recommendations.push(`${rec.priority.toUpperCase()}: ${rec.description}`)
      }
    }

    // 基于任务分析的建议
    if (analysis.tasks) {
      const urgentTasks = analysis.tasks.filter((t: TaskItem) => t.priority === 'urgent')
      if (urgentTasks.length > 3) {
        recommendations.push('HIGH: 紧急任务过多，建议重新评估优先级')
      }

      const unassignedTasks = analysis.tasks.filter((t: TaskItem) => !t.assignee)
      if (unassignedTasks.length > 5) {
        recommendations.push('MEDIUM: 多个任务未明确分配，建议明确责任人')
      }
    }

    // 基于情感分析的建议
    if (analysis.sentiment?.classification === 'negative') {
      recommendations.push('HIGH: 团队情绪偏消极，建议关注成员状态')
    }

    return recommendations
  }

  /**
   * 计算情绪趋势
   */
  private calculateMoodTrend(messages: any[]): string {
    if (messages.length < 10) return '数据不足'

    const half = Math.floor(messages.length / 2)
    const earlierMessages = messages.slice(0, half)
    const laterMessages = messages.slice(half)

    // 这里简化为同步调用，实际应该异步
    const earlierScore = this.quickSentimentScore(earlierMessages)
    const laterScore = this.quickSentimentScore(laterMessages)

    const diff = laterScore - earlierScore
    
    if (diff > 0.5) return '↗️ 情绪改善'
    else if (diff < -0.5) return '↘️ 情绪下降'
    else return '➡️ 情绪稳定'
  }

  /**
   * 快速情感评分 (同步版本)
   */
  private quickSentimentScore(messages: any[]): number {
    let score = 0
    
    for (const msg of messages) {
      if (!msg.text) continue
      const text = msg.text.toLowerCase()
      
      // 简单的关键词计分
      if (text.includes('好') || text.includes('棒') || text.includes('赞')) score += 1
      if (text.includes('问题') || text.includes('错误') || text.includes('困难')) score -= 1
      if (text.includes('紧急') || text.includes('急')) score -= 0.5
    }
    
    return messages.length > 0 ? score / messages.length : 0
  }

  /**
   * 生成风险预警
   */
  private generateRiskAlerts(sentiment: SentimentResult, messages: any[]): string[] {
    const alerts = []

    if (sentiment.classification === 'negative' && sentiment.confidence > 0.7) {
      alerts.push('⚠️ 团队情绪偏消极，建议关注成员状态')
    }

    const urgentCount = messages.filter(msg => 
      msg.text?.includes('紧急') || msg.text?.includes('急')
    ).length
    
    if (urgentCount > messages.length * 0.1) {
      alerts.push('🚨 紧急事件频发，可能存在流程问题')
    }

    const stressCount = messages.filter(msg =>
      msg.text?.includes('加班') || msg.text?.includes('压力') || msg.text?.includes('累')
    ).length
    
    if (stressCount > messages.length * 0.05) {
      alerts.push('😰 团队压力较大，建议关注工作负荷')
    }

    return alerts
  }

  /**
   * 生成情绪摘要
   */
  private generateMoodSummary(sentiment: SentimentResult, trend: string): string {
    const moodDesc = {
      positive: '积极乐观',
      neutral: '平稳正常', 
      negative: '需要关注'
    }[sentiment.classification]

    return `团队当前情绪${moodDesc} (评分: ${sentiment.score})，${trend}。置信度: ${Math.round(sentiment.confidence * 100)}%`
  }

  /**
   * 生成任务摘要
   */
  private generateTaskSummary(tasks: TaskItem[]): string {
    if (tasks.length === 0) return '未识别到明确的任务安排'

    const urgentCount = tasks.filter(t => t.priority === 'urgent').length
    const assignedCount = tasks.filter(t => t.assignee).length
    const withDeadline = tasks.filter(t => t.deadline).length

    return `识别到 ${tasks.length} 个任务：${urgentCount} 个紧急，${assignedCount} 个已分配，${withDeadline} 个有明确截止时间`
  }

  /**
   * 计算优先级分布
   */
  private calculatePriorityDistribution(tasks: TaskItem[]): Record<string, number> {
    const distribution = { urgent: 0, high: 0, medium: 0, low: 0 }
    
    for (const task of tasks) {
      distribution[task.priority]++
    }
    
    return distribution
  }

  /**
   * 生成会议摘要
   */
  private generateMeetingSummary(meetings: MeetingThread[]): string {
    if (meetings.length === 0) return '未检测到明显的会议讨论线程'

    const productiveCount = meetings.filter(m => m.sentiment === 'productive').length
    const totalDecisions = meetings.reduce((sum, m) => sum + m.decisions.length, 0)
    const totalActions = meetings.reduce((sum, m) => sum + m.actionItems.length, 0)

    return `检测到 ${meetings.length} 个会议讨论：${productiveCount} 个高效会议，产生 ${totalDecisions} 个决策和 ${totalActions} 个行动项`
  }

  /**
   * 计算平均会议时长
   */
  private calculateAvgMeetingDuration(meetings: MeetingThread[]): number {
    if (meetings.length === 0) return 0
    
    const totalDuration = meetings.reduce((sum, m) => sum + m.duration, 0)
    return Math.round(totalDuration / meetings.length)
  }

  private log(message: string, data?: any): void {
    if (this.debugMode) {
      console.log(`[SlackSubAgent:${this.contextId}] ${message}`, data || '')
    }
  }
}