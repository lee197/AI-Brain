/**
 * 本地NLP分析器 - 企业级Slack深度分析
 * 基于JavaScript NLP库实现，零外部依赖
 */

// 情感分析结果
export interface SentimentResult {
  score: number // -5 to +5
  comparative: number // normalized score
  positive: string[]
  negative: string[]
  classification: 'positive' | 'neutral' | 'negative'
  confidence: number
}

// 任务提取结果
export interface TaskItem {
  id: string
  description: string
  assignee?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline?: string
  status: 'mentioned' | 'assigned' | 'in_progress' | 'blocked'
  confidence: number
  sourceMessage: {
    id: string
    user: string
    channel: string
    timestamp: string
  }
}

// 会议分析结果
export interface MeetingThread {
  id: string
  topic: string
  participants: string[]
  startTime: string
  duration: number // minutes
  decisions: DecisionPoint[]
  actionItems: ActionItem[]
  sentiment: 'productive' | 'neutral' | 'tense'
}

export interface DecisionPoint {
  description: string
  decisionMaker: string
  confidence: number
  timestamp: string
}

export interface ActionItem {
  description: string
  assignee?: string
  deadline?: string
  priority: 'low' | 'medium' | 'high'
}

// 团队协作洞察
export interface TeamInsights {
  collaborationScore: number // 0-100
  communicationPatterns: {
    responseTime: number // average minutes
    threadDepth: number // average replies per thread
    crossChannelActivity: number
  }
  riskFactors: RiskFactor[]
  recommendations: Recommendation[]
}

export interface RiskFactor {
  type: 'stress' | 'confusion' | 'conflict' | 'workload' | 'deadline'
  severity: 'low' | 'medium' | 'high'
  description: string
  affectedUsers: string[]
  evidence: string[]
}

export interface Recommendation {
  type: 'process' | 'communication' | 'management' | 'technical'
  priority: 'low' | 'medium' | 'high'
  description: string
  actionSteps: string[]
}

export class LocalSlackNLP {
  private chineseBusinessDict: any
  private urgencyPatterns: RegExp[]
  private taskPatterns: RegExp[]
  private meetingPatterns: RegExp[]

  constructor() {
    this.initializeDictionaries()
    this.initializePatterns()
  }

  /**
   * 初始化中文企业词典
   */
  private initializeDictionaries() {
    this.chineseBusinessDict = {
      sentiment: {
        positive: [
          '搞定', '没问题', '可以的', '很好', '不错', '顺利', '完成了', '解决了',
          '赞', '棒', '厉害', '牛', '给力', '靠谱', '稳', '优秀', '满意', '同意'
        ],
        negative: [
          '有问题', '不行', '困难', '延期', '推迟', '来不及', '麻烦', '头疼',
          '卡住了', '搞不定', '报错', '崩了', '挂了', '坏了', '失败', '错误'
        ],
        stress: [
          '加班', '熬夜', '赶工', '来不及', '压力大', '忙死了', '累死了',
          '救命', '崩溃', '受不了', '要疯了', '要命', '紧急', '火烧眉毛'
        ],
        urgency: [
          '紧急', '急', '马上', '立刻', '立即', '赶紧', 'ASAP', '火急',
          '十万火急', '刻不容缓', '迫在眉睫', '分秒必争'
        ]
      },
      tasks: {
        verbs: [
          '完成', '处理', '解决', '跟进', '确认', '检查', '测试', '发布',
          '修复', '优化', '实现', '开发', '设计', '评估', '讨论', '安排'
        ],
        assignmentWords: ['负责', '处理', '跟进', '搞定', '来做', '你来'],
        timeframes: [
          '今天', '明天', '后天', '本周', '下周', '月底', '季末', '年底',
          '周一', '周二', '周三', '周四', '周五', '周末'
        ]
      },
      meetings: {
        indicators: [
          '会议', '讨论', '同步', '对齐', 'review', 'standup', '汇报',
          '碰头', '聊聊', '过一下', '走查', '演示'
        ],
        decisions: [
          '决定', '确定', '商定', '敲定', '定了', '就这样', '同意',
          '通过', '批准', '采用', '选择'
        ]
      }
    }
  }

  /**
   * 初始化正则表达式模式
   */
  private initializePatterns() {
    // 紧急度检测模式
    this.urgencyPatterns = [
      /紧急|急|马上|立刻|ASAP|火急/gi,
      /今天.*?(?:必须|一定要|务必)/gi,
      /(?:老板|领导).*?要/gi
    ]

    // 任务检测模式  
    this.taskPatterns = [
      /需要.*?(?:完成|处理|解决|跟进)/gi,
      /@\w+.*?(?:负责|处理|搞定)/gi,
      /(?:今天|明天|本周|下周).*?(?:完成|交付|上线)/gi,
      /(?:记得|别忘了|要).*?(?:做|处理|确认)/gi
    ]

    // 会议检测模式
    this.meetingPatterns = [
      /(?:会议|讨论|同步).*?(?:时间|安排)/gi,
      /(?:今天|明天|下周).*?(?:会议|讨论|碰头)/gi,
      /(?:我们|大家).*?(?:聊聊|过一下|讨论)/gi
    ]
  }

  /**
   * 综合深度分析 - 主入口
   */
  async performDeepAnalysis(messages: any[], analysisOptions: {
    includeSentiment?: boolean
    includeTasks?: boolean
    includeMeetings?: boolean
    includeTeamInsights?: boolean
    timeframeDays?: number
  } = {}): Promise<{
    sentiment?: SentimentResult
    tasks?: TaskItem[]
    meetings?: MeetingThread[]
    teamInsights?: TeamInsights
    summary: string
    processingTime: number
  }> {
    const startTime = Date.now()
    const results: any = {}

    try {
      console.log(`🧠 Starting deep analysis for ${messages.length} messages`)

      // 并行执行各种分析
      const analysisPromises = []

      if (analysisOptions.includeSentiment !== false) {
        analysisPromises.push(
          this.analyzeSentiment(messages).then(result => { results.sentiment = result })
        )
      }

      if (analysisOptions.includeTasks !== false) {
        analysisPromises.push(
          this.extractTasks(messages).then(result => { results.tasks = result })
        )
      }

      if (analysisOptions.includeMeetings !== false) {
        analysisPromises.push(
          this.analyzeMeetings(messages).then(result => { results.meetings = result })
        )
      }

      if (analysisOptions.includeTeamInsights !== false) {
        analysisPromises.push(
          this.generateTeamInsights(messages).then(result => { results.teamInsights = result })
        )
      }

      // 等待所有分析完成
      await Promise.all(analysisPromises)

      // 生成综合摘要
      const summary = this.generateAnalysisSummary(results)

      return {
        ...results,
        summary,
        processingTime: Date.now() - startTime
      }

    } catch (error: any) {
      console.error('Deep analysis failed:', error)
      throw error
    }
  }

  /**
   * 情感分析 - 团队氛围和压力检测
   */
  async analyzeSentiment(messages: any[]): Promise<SentimentResult> {
    let totalScore = 0
    let messageCount = 0
    const positiveWords: string[] = []
    const negativeWords: string[] = []
    const stressIndicators: string[] = []

    for (const msg of messages) {
      if (!msg.text) continue

      const text = msg.text.toLowerCase()
      let messageScore = 0

      // 检测积极词汇
      for (const word of this.chineseBusinessDict.sentiment.positive) {
        if (text.includes(word)) {
          messageScore += 1
          if (!positiveWords.includes(word)) positiveWords.push(word)
        }
      }

      // 检测消极词汇
      for (const word of this.chineseBusinessDict.sentiment.negative) {
        if (text.includes(word)) {
          messageScore -= 1
          if (!negativeWords.includes(word)) negativeWords.push(word)
        }
      }

      // 检测压力指标
      for (const word of this.chineseBusinessDict.sentiment.stress) {
        if (text.includes(word)) {
          messageScore -= 2
          if (!stressIndicators.includes(word)) stressIndicators.push(word)
        }
      }

      // 检测紧急度
      for (const pattern of this.urgencyPatterns) {
        if (pattern.test(text)) {
          messageScore -= 1
        }
      }

      totalScore += messageScore
      messageCount++
    }

    const averageScore = messageCount > 0 ? totalScore / messageCount : 0
    
    let classification: 'positive' | 'neutral' | 'negative'
    if (averageScore > 0.5) classification = 'positive'
    else if (averageScore < -0.5) classification = 'negative'
    else classification = 'neutral'

    return {
      score: Math.round(totalScore * 10) / 10,
      comparative: Math.round(averageScore * 100) / 100,
      positive: positiveWords,
      negative: negativeWords.concat(stressIndicators),
      classification,
      confidence: Math.min(0.95, Math.max(0.6, messageCount / 50)) // 基于样本数计算置信度
    }
  }

  /**
   * 任务提取 - 识别待办事项和分配
   */
  async extractTasks(messages: any[]): Promise<TaskItem[]> {
    const tasks: TaskItem[] = []

    for (const msg of messages) {
      if (!msg.text) continue

      const text = msg.text
      const matches = []

      // 检测任务模式
      for (const pattern of this.taskPatterns) {
        const found = text.match(pattern)
        if (found) matches.push(...found)
      }

      for (const match of matches) {
        const task = this.parseTaskFromMatch(match, msg)
        if (task) {
          tasks.push({
            id: `task_${msg.id}_${tasks.length}`,
            ...task,
            sourceMessage: {
              id: msg.id,
              user: msg.user?.name || 'unknown',
              channel: msg.channel?.name || 'unknown',
              timestamp: msg.timestamp
            }
          })
        }
      }
    }

    // 去重和优先级排序
    return this.deduplicateAndSortTasks(tasks)
  }

  /**
   * 会议分析 - 识别讨论线程和决策
   */
  async analyzeMeetings(messages: any[]): Promise<MeetingThread[]> {
    const meetings: MeetingThread[] = []
    
    // 按时间和频道分组消息
    const messageGroups = this.groupMessagesByContext(messages)
    
    for (const group of messageGroups) {
      if (this.isMeetingThread(group)) {
        const meeting = this.extractMeetingFromThread(group)
        if (meeting) meetings.push(meeting)
      }
    }

    return meetings
  }

  /**
   * 团队洞察生成 - 协作模式和风险识别
   */
  async generateTeamInsights(messages: any[]): Promise<TeamInsights> {
    const collaborationScore = this.calculateCollaborationScore(messages)
    const communicationPatterns = this.analyzeCommunicationPatterns(messages)
    const riskFactors = this.identifyRiskFactors(messages)
    const recommendations = this.generateRecommendations(riskFactors, communicationPatterns)

    return {
      collaborationScore,
      communicationPatterns,
      riskFactors,
      recommendations
    }
  }

  /**
   * 从匹配文本解析任务信息
   */
  private parseTaskFromMatch(match: string, sourceMsg: any): Partial<TaskItem> | null {
    const text = match.toLowerCase()
    
    // 提取任务描述
    const description = match.replace(/^(需要|要|记得|别忘了)/, '').trim()
    if (description.length < 3) return null

    // 判断优先级
    let priority: TaskItem['priority'] = 'medium'
    if (this.urgencyPatterns.some(p => p.test(match))) {
      priority = 'urgent'
    } else if (text.includes('重要') || text.includes('关键')) {
      priority = 'high'
    }

    // 提取负责人
    const assigneeMatch = match.match(/@(\w+)/)?.[1]
    
    // 提取截止时间
    const deadlineMatch = this.extractDeadline(match)

    return {
      description,
      assignee: assigneeMatch,
      priority,
      deadline: deadlineMatch,
      status: assigneeMatch ? 'assigned' : 'mentioned',
      confidence: this.calculateTaskConfidence(match)
    }
  }

  /**
   * 提取截止时间
   */
  private extractDeadline(text: string): string | undefined {
    const timeframes = this.chineseBusinessDict.tasks.timeframes
    
    for (const timeframe of timeframes) {
      if (text.includes(timeframe)) {
        return this.normalizeTimeframe(timeframe)
      }
    }
    
    // 检测具体日期模式
    const datePatterns = [
      /(\d{1,2})月(\d{1,2})日/,
      /(\d{1,2})\/(\d{1,2})/,
      /下周([一二三四五])/, 
    ]
    
    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        return this.parseRelativeDate(match[0])
      }
    }

    return undefined
  }

  /**
   * 标准化时间框架
   */
  private normalizeTimeframe(timeframe: string): string {
    const now = new Date()
    
    switch (timeframe) {
      case '今天':
        return now.toISOString().split('T')[0]
      case '明天':
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
      case '本周':
        const thisWeek = new Date(now)
        thisWeek.setDate(thisWeek.getDate() + (7 - thisWeek.getDay()))
        return thisWeek.toISOString().split('T')[0]
      case '下周':
        const nextWeek = new Date(now)
        nextWeek.setDate(nextWeek.getDate() + (14 - nextWeek.getDay()))
        return nextWeek.toISOString().split('T')[0]
      default:
        return timeframe
    }
  }

  /**
   * 解析相对日期
   */
  private parseRelativeDate(dateStr: string): string {
    // 简化实现，返回估算日期
    const now = new Date()
    
    if (dateStr.includes('下周')) {
      const nextWeek = new Date(now)
      nextWeek.setDate(nextWeek.getDate() + 7)
      return nextWeek.toISOString().split('T')[0]
    }
    
    return now.toISOString().split('T')[0]
  }

  /**
   * 计算任务置信度
   */
  private calculateTaskConfidence(match: string): number {
    let confidence = 0.6 // 基础置信度

    // 包含明确动词 +0.2
    if (this.chineseBusinessDict.tasks.verbs.some(verb => match.includes(verb))) {
      confidence += 0.2
    }

    // 包含时间框架 +0.15
    if (this.chineseBusinessDict.tasks.timeframes.some(time => match.includes(time))) {
      confidence += 0.15
    }

    // 包含负责人 +0.15
    if (match.includes('@')) {
      confidence += 0.15
    }

    // 包含紧急词汇 +0.1
    if (this.urgencyPatterns.some(p => p.test(match))) {
      confidence += 0.1
    }

    return Math.min(0.95, confidence)
  }

  /**
   * 任务去重和排序
   */
  private deduplicateAndSortTasks(tasks: TaskItem[]): TaskItem[] {
    // 简单去重：基于描述相似度
    const uniqueTasks = tasks.filter((task, index, arr) => {
      return !arr.slice(0, index).some(prev => 
        this.calculateSimilarity(task.description, prev.description) > 0.8
      )
    })

    // 按优先级和置信度排序
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
    
    return uniqueTasks.sort((a, b) => {
      const aPriority = priorityOrder[a.priority]
      const bPriority = priorityOrder[b.priority]
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return b.confidence - a.confidence
    })
  }

  /**
   * 计算文本相似度
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * 按上下文分组消息
   */
  private groupMessagesByContext(messages: any[]): any[][] {
    const groups: any[][] = []
    const timeThreshold = 30 * 60 * 1000 // 30分钟
    
    let currentGroup: any[] = []
    let lastTimestamp = 0
    
    for (const msg of messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())) {
      const timestamp = new Date(msg.timestamp).getTime()
      
      if (timestamp - lastTimestamp > timeThreshold && currentGroup.length > 0) {
        groups.push([...currentGroup])
        currentGroup = []
      }
      
      currentGroup.push(msg)
      lastTimestamp = timestamp
    }
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }
    
    return groups
  }

  /**
   * 判断是否为会议讨论线程
   */
  private isMeetingThread(messages: any[]): boolean {
    if (messages.length < 3) return false
    
    const text = messages.map(m => m.text).join(' ').toLowerCase()
    
    // 检查是否包含会议指标词
    const hasMeetingIndicators = this.chineseBusinessDict.meetings.indicators.some(
      indicator => text.includes(indicator)
    )
    
    // 检查参与者数量 (至少2人)
    const participantCount = new Set(messages.map(m => m.user?.id)).size
    
    // 检查消息密度 (30分钟内至少5条消息)
    const timespan = new Date(messages[messages.length - 1].timestamp).getTime() - 
                     new Date(messages[0].timestamp).getTime()
    const density = messages.length / (timespan / (1000 * 60 * 60)) // messages per hour
    
    return hasMeetingIndicators && participantCount >= 2 && density > 10
  }

  /**
   * 从讨论线程提取会议信息
   */
  private extractMeetingFromThread(messages: any[]): MeetingThread | null {
    if (messages.length === 0) return null

    const participants = [...new Set(messages.map(m => m.user?.name).filter(Boolean))]
    const startTime = messages[0].timestamp
    const endTime = messages[messages.length - 1].timestamp
    const duration = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (1000 * 60))

    // 提取主题
    const topic = this.extractMeetingTopic(messages)
    
    // 识别决策点
    const decisions = this.extractDecisions(messages)
    
    // 提取行动项目
    const actionItems = this.extractActionItems(messages)
    
    // 分析会议情感
    const sentiment = this.analyzeMeetingSentiment(messages)

    return {
      id: `meeting_${messages[0].id}`,
      topic,
      participants,
      startTime,
      duration,
      decisions,
      actionItems,
      sentiment
    }
  }

  /**
   * 提取会议主题
   */
  private extractMeetingTopic(messages: any[]): string {
    // 寻找频繁出现的关键词作为主题
    const wordFreq: Record<string, number> = {}
    
    for (const msg of messages.slice(0, 5)) { // 只看前5条消息
      const words = msg.text.split(/\s+/).filter((w: string) => w.length > 2)
      for (const word of words) {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      }
    }
    
    const topWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word)
    
    return topWords.join(' ') || '团队讨论'
  }

  /**
   * 提取决策点
   */
  private extractDecisions(messages: any[]): DecisionPoint[] {
    const decisions: DecisionPoint[] = []
    
    for (const msg of messages) {
      if (!msg.text) continue
      
      const text = msg.text
      const hasDecisionWords = this.chineseBusinessDict.meetings.decisions.some(
        word => text.includes(word)
      )
      
      if (hasDecisionWords) {
        decisions.push({
          description: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          decisionMaker: msg.user?.name || 'unknown',
          confidence: 0.8,
          timestamp: msg.timestamp
        })
      }
    }
    
    return decisions
  }

  /**
   * 提取行动项目
   */
  private extractActionItems(messages: any[]): ActionItem[] {
    const actions: ActionItem[] = []
    
    for (const msg of messages) {
      const taskMatches = this.taskPatterns.map(pattern => msg.text.match(pattern)).flat().filter(Boolean)
      
      for (const match of taskMatches) {
        if (match) {
          const task = this.parseTaskFromMatch(match, msg)
          if (task) {
            actions.push({
              description: task.description,
              assignee: task.assignee,
              deadline: task.deadline,
              priority: task.priority
            })
          }
        }
      }
    }
    
    return actions
  }

  /**
   * 分析会议情感
   */
  private analyzeMeetingSentiment(messages: any[]): 'productive' | 'neutral' | 'tense' {
    const sentimentResult = this.analyzeSentiment(messages)
    
    if (sentimentResult.then) {
      // Handle async case
      return 'neutral'
    }
    
    const { classification, negative } = sentimentResult as any
    
    // 检查是否有冲突迹象
    const conflictWords = ['不同意', '反对', '有问题', '不行', '争议']
    const hasConflict = negative.some((word: string) => conflictWords.includes(word))
    
    if (hasConflict || classification === 'negative') {
      return 'tense'
    } else if (classification === 'positive') {
      return 'productive'
    } else {
      return 'neutral'
    }
  }

  /**
   * 计算协作分数
   */
  private calculateCollaborationScore(messages: any[]): number {
    let score = 50 // 基础分数

    const participantCount = new Set(messages.map(m => m.user?.id)).size
    const avgResponseTime = this.calculateAvgResponseTime(messages)
    const threadDepth = this.calculateAvgThreadDepth(messages)
    const crossChannelActivity = this.calculateCrossChannelActivity(messages)

    // 参与度加分 (更多人参与 = 更好协作)
    score += Math.min(20, participantCount * 2)
    
    // 响应时间加分 (快速响应 = 良好沟通)
    if (avgResponseTime < 60) score += 15
    else if (avgResponseTime < 180) score += 10
    else if (avgResponseTime < 360) score += 5

    // 讨论深度加分
    if (threadDepth > 3) score += 10
    else if (threadDepth > 2) score += 5

    return Math.min(100, Math.max(0, score))
  }

  /**
   * 分析沟通模式
   */
  private analyzeCommunicationPatterns(messages: any[]) {
    return {
      responseTime: this.calculateAvgResponseTime(messages),
      threadDepth: this.calculateAvgThreadDepth(messages), 
      crossChannelActivity: this.calculateCrossChannelActivity(messages)
    }
  }

  private calculateAvgResponseTime(messages: any[]): number {
    // 简化实现：计算消息间平均时间间隔
    if (messages.length < 2) return 0
    
    const intervals = []
    for (let i = 1; i < messages.length; i++) {
      const prev = new Date(messages[i-1].timestamp).getTime()
      const curr = new Date(messages[i].timestamp).getTime()
      intervals.push((curr - prev) / (1000 * 60)) // minutes
    }
    
    return intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
  }

  private calculateAvgThreadDepth(messages: any[]): number {
    // 按频道分组计算平均对话深度
    const channelGroups: Record<string, number> = {}
    
    for (const msg of messages) {
      const channelId = msg.channel?.id || 'default'
      channelGroups[channelId] = (channelGroups[channelId] || 0) + 1
    }
    
    const depths = Object.values(channelGroups)
    return depths.reduce((sum, depth) => sum + depth, 0) / depths.length
  }

  private calculateCrossChannelActivity(messages: any[]): number {
    return new Set(messages.map(m => m.channel?.id)).size
  }

  /**
   * 识别风险因素
   */
  private identifyRiskFactors(messages: any[]): RiskFactor[] {
    const risks: RiskFactor[] = []
    
    // 压力风险检测
    const stressMessages = messages.filter(msg => 
      this.chineseBusinessDict.sentiment.stress.some(word => 
        msg.text?.toLowerCase().includes(word)
      )
    )
    
    if (stressMessages.length > messages.length * 0.15) { // 超过15%包含压力词汇
      risks.push({
        type: 'stress',
        severity: stressMessages.length > messages.length * 0.3 ? 'high' : 'medium',
        description: '团队显示出较高的工作压力',
        affectedUsers: [...new Set(stressMessages.map(m => m.user?.name))],
        evidence: stressMessages.slice(0, 3).map(m => m.text.substring(0, 50))
      })
    }

    // 截止日期风险
    const urgentMessages = messages.filter(msg => 
      this.urgencyPatterns.some(pattern => pattern.test(msg.text || ''))
    )
    
    if (urgentMessages.length > 3) {
      risks.push({
        type: 'deadline',
        severity: urgentMessages.length > 8 ? 'high' : 'medium', 
        description: '存在多个紧急截止日期',
        affectedUsers: [...new Set(urgentMessages.map(m => m.user?.name))],
        evidence: urgentMessages.slice(0, 2).map(m => m.text.substring(0, 50))
      })
    }

    return risks
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(risks: RiskFactor[], patterns: any): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // 基于风险生成建议
    for (const risk of risks) {
      switch (risk.type) {
        case 'stress':
          recommendations.push({
            type: 'management',
            priority: risk.severity === 'high' ? 'high' : 'medium',
            description: '考虑重新评估工作负荷分配',
            actionSteps: [
              '与团队成员一对一沟通压力来源',
              '评估是否需要调整项目时间线',
              '考虑增加人力资源或外包支持'
            ]
          })
          break
          
        case 'deadline':
          recommendations.push({
            type: 'process',
            priority: 'high',
            description: '优化项目时间管理',
            actionSteps: [
              '建立更清晰的优先级体系',
              '提前识别和沟通潜在延期风险',
              '考虑使用项目管理工具跟踪进度'
            ]
          })
          break
      }
    }

    // 基于沟通模式生成建议
    if (patterns.responseTime > 240) { // 超过4小时响应
      recommendations.push({
        type: 'communication',
        priority: 'medium',
        description: '改善团队响应时效',
        actionSteps: [
          '设立响应时间期望 (如2小时内确认收到)',
          '建立紧急联系渠道',
          '定期检查消息通知设置'
        ]
      })
    }

    return recommendations
  }

  /**
   * 生成分析摘要
   */
  private generateAnalysisSummary(results: any): string {
    const sections = []

    if (results.sentiment) {
      const mood = results.sentiment.classification === 'positive' ? '积极' :
                   results.sentiment.classification === 'negative' ? '需要关注' : '正常'
      sections.push(`团队情感状态: ${mood} (${results.sentiment.score > 0 ? '+' : ''}${results.sentiment.score})`)
    }

    if (results.tasks) {
      const urgentTasks = results.tasks.filter((t: TaskItem) => t.priority === 'urgent').length
      const totalTasks = results.tasks.length
      sections.push(`识别任务: ${totalTasks}个 (${urgentTasks}个紧急)`)
    }

    if (results.meetings) {
      sections.push(`会议讨论: ${results.meetings.length}个线程`)
    }

    if (results.teamInsights) {
      sections.push(`协作评分: ${results.teamInsights.collaborationScore}/100`)
    }

    return sections.join(' | ')
  }
}