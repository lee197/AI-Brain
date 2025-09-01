/**
 * 增强版中文NLP分析器
 * 集成 jieba 分词、VADER 情感分析和先进的任务识别
 */

// @ts-ignore - jieba 没有完整的类型定义
const nodejieba = require('nodejieba')
// @ts-ignore - vader-sentiment 没有完整的类型定义  
const vader = require('vader-sentiment')
import { SentimentResult, TaskItem, TeamInsights, MeetingThread } from './local-analyzer'

// 增强情感分析结果
export interface EnhancedSentimentResult extends SentimentResult {
  emotionBreakdown: {
    joy: number
    anger: number
    fear: number
    sadness: number
    surprise: number
  }
  contextualFactors: {
    hasNegation: boolean
    intensifiers: string[]
    emoticons: string[]
  }
  confidence: number
}

// 增强任务项
export interface EnhancedTaskItem extends TaskItem {
  taskType: 'action' | 'decision' | 'follow_up' | 'reminder' | 'question'
  urgencyIndicators: string[]
  timeIndicators: string[]
  stakeholders: string[]
  relatedTasks: string[]
  complexity: 'simple' | 'moderate' | 'complex'
}

export class EnhancedChineseNLP {
  private chineseStopWords: Set<string>
  private businessKeywords: Map<string, number>
  private emotionDictionary: Map<string, any>
  private taskPatterns: RegExp[]
  private urgencyPatterns: RegExp[]
  private timePatterns: RegExp[]
  private initialized = false

  constructor() {
    this.initializeAsyncComponents()
  }

  private async initializeAsyncComponents() {
    if (this.initialized) return
    
    try {
      // 初始化jieba分词器
      nodejieba.load()
      
      // 加载中文停用词
      this.chineseStopWords = new Set([
        '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
        '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
        '自己', '这', '还', '把', '想', '他', '它', '她', '们', '吧', '啊', '呢', '吗',
        '来', '过', '对', '从', '那', '些', '个', '与', '或', '但', '而', '及', '以',
        '为', '被', '将', '可以', '能够', '应该', '必须', '需要', '可能', '也许'
      ])
      
      // 商业关键词权重字典
      this.businessKeywords = new Map([
        // 积极词汇
        ['完成', 2], ['成功', 2], ['优秀', 2], ['棒', 1.5], ['好', 1], ['不错', 1],
        ['满意', 1.5], ['赞', 1.5], ['喜欢', 1], ['支持', 1], ['同意', 1], ['可以', 0.5],
        
        // 消极词汇  
        ['问题', -2], ['困难', -1.5], ['错误', -2], ['失败', -2], ['糟糕', -2], ['差', -1.5],
        ['不满', -1.5], ['担心', -1], ['焦虑', -1.5], ['压力', -1], ['累', -1], ['辛苦', -0.5],
        
        // 紧急/重要词汇
        ['紧急', -1], ['急', -1], ['重要', 1], ['关键', 1], ['必须', 0.5], ['立即', -0.5],
        ['马上', -0.5], ['尽快', -0.5], ['ASAP', -1], ['优先', 1]
      ])
      
      // 情感词典
      this.emotionDictionary = new Map([
        // 喜悦情感
        ['开心', { joy: 2, anger: 0, fear: 0, sadness: 0, surprise: 0 }],
        ['高兴', { joy: 2, anger: 0, fear: 0, sadness: 0, surprise: 0 }],
        ['兴奋', { joy: 2, anger: 0, fear: 0, sadness: 0, surprise: 1 }],
        ['满足', { joy: 1, anger: 0, fear: 0, sadness: 0, surprise: 0 }],
        
        // 愤怒情感
        ['生气', { joy: 0, anger: 2, fear: 0, sadness: 0, surprise: 0 }],
        ['愤怒', { joy: 0, anger: 3, fear: 0, sadness: 0, surprise: 0 }],
        ['恼火', { joy: 0, anger: 2, fear: 0, sadness: 0, surprise: 0 }],
        ['不满', { joy: 0, anger: 1, fear: 0, sadness: 0, surprise: 0 }],
        
        // 恐惧情感
        ['担心', { joy: 0, anger: 0, fear: 2, sadness: 1, surprise: 0 }],
        ['害怕', { joy: 0, anger: 0, fear: 3, sadness: 0, surprise: 0 }],
        ['紧张', { joy: 0, anger: 0, fear: 2, sadness: 0, surprise: 0 }],
        ['焦虑', { joy: 0, anger: 0, fear: 2, sadness: 1, surprise: 0 }],
        
        // 悲伤情感  
        ['难过', { joy: 0, anger: 0, fear: 0, sadness: 3, surprise: 0 }],
        ['伤心', { joy: 0, anger: 0, fear: 0, sadness: 3, surprise: 0 }],
        ['失望', { joy: 0, anger: 0, fear: 0, sadness: 2, surprise: 0 }],
        ['沮丧', { joy: 0, anger: 0, fear: 0, sadness: 2, surprise: 0 }]
      ])
      
      // 任务识别模式
      this.taskPatterns = [
        /(?:需要|要|应该|必须|可以)(.{1,50}?)(?:完成|做|处理|解决|实现|开发)/g,
        /(?:请|帮忙|帮助|协助)(.{1,30}?)(?:一下|处理|解决|完成)/g,
        /(?:负责|分配|安排|指派)(.{0,20}?)(.{1,50}?)(?:任务|工作|项目)/g,
        /(?:今天|明天|本周|下周|月底)(.{0,10}?)(?:要|需要|必须)(.{1,40}?)(?:完成|交付|提交)/g,
        /(?:deadline|截止|期限)(.{0,20}?)(?:是|在|为)(.{1,30})/gi
      ]
      
      // 紧急性识别模式
      this.urgencyPatterns = [
        /紧急|急|ASAP|urgent|critical|immediately/gi,
        /马上|立即|立刻|现在|赶快|尽快/g,
        /火烧眉毛|十万火急|燃眉之急/g,
        /高优先级|最高优先级|P0|P1|critical/gi
      ]
      
      // 时间识别模式
      this.timePatterns = [
        /(?:今天|明天|后天|昨天|前天)/g,
        /(?:本周|下周|上周|下个月|上个月)/g,
        /(?:\d{1,2}月\d{1,2}日|\d{1,2}\/\d{1,2}|\d{4}-\d{1,2}-\d{1,2})/g,
        /(?:周[一二三四五六日]|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/gi,
        /(?:\d{1,2}:\d{2}|上午|下午|早上|晚上|中午)/g
      ]
      
      this.initialized = true
      console.log('🧠 Enhanced Chinese NLP initialized successfully')
      
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Chinese NLP:', error)
      throw error
    }
  }

  /**
   * 增强版中文分词
   */
  private segmentChinese(text: string): string[] {
    if (!this.initialized) {
      console.warn('NLP not initialized, using fallback segmentation')
      return text.split('')
    }
    
    try {
      // 使用jieba进行中文分词
      const segments = nodejieba.cut(text)
      
      // 过滤停用词和单字符
      return segments.filter((word: string) => 
        word.length > 1 && 
        !this.chineseStopWords.has(word) &&
        !/^\s+$/.test(word)
      )
    } catch (error) {
      console.error('Segmentation error:', error)
      return text.split(/[\s，。！？；：、]/g).filter(w => w.length > 0)
    }
  }

  /**
   * 增强版情感分析
   */
  async analyzeEnhancedSentiment(text: string): Promise<EnhancedSentimentResult> {
    await this.initializeAsyncComponents()
    
    // 1. 中文分词
    const segments = this.segmentChinese(text)
    
    // 2. VADER 英文情感分析 (处理英文单词和表情符号)
    const vaderResult = vader.SentimentIntensityAnalyzer.polarity_scores(text)
    
    // 3. 中文词汇情感计算
    let chineseScore = 0
    let chineseCount = 0
    const emotions = { joy: 0, anger: 0, fear: 0, sadness: 0, surprise: 0 }
    const contextualFactors = {
      hasNegation: false,
      intensifiers: [] as string[],
      emoticons: [] as string[]
    }
    
    // 检测否定词
    const negationWords = ['不', '没', '未', '非', '无', '别', '勿', '莫']
    contextualFactors.hasNegation = negationWords.some(neg => text.includes(neg))
    
    // 提取表情符号
    const emoticonRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[😀-😿]|[🙀-🙏]/gu
    const foundEmoticons = text.match(emoticonRegex)
    if (foundEmoticons) {
      contextualFactors.emoticons = foundEmoticons
    }
    
    // 分析每个词汇
    for (const word of segments) {
      // 商业关键词权重
      if (this.businessKeywords.has(word)) {
        const weight = this.businessKeywords.get(word)!
        chineseScore += weight
        chineseCount++
      }
      
      // 情感词汇分析
      if (this.emotionDictionary.has(word)) {
        const emotion = this.emotionDictionary.get(word)!
        emotions.joy += emotion.joy
        emotions.anger += emotion.anger
        emotions.fear += emotion.fear
        emotions.sadness += emotion.sadness
        emotions.surprise += emotion.surprise
      }
      
      // 程度副词检测
      if (['很', '非常', '特别', '极其', '相当', '十分'].includes(word)) {
        contextualFactors.intensifiers.push(word)
      }
    }
    
    // 4. 综合评分计算
    const normalizedChineseScore = chineseCount > 0 ? chineseScore / chineseCount : 0
    const combinedScore = (vaderResult.compound * 0.4 + normalizedChineseScore * 0.6)
    
    // 5. 应用上下文修正
    let adjustedScore = combinedScore
    if (contextualFactors.hasNegation) {
      adjustedScore *= -0.5 // 否定词降低情感强度并可能反转
    }
    if (contextualFactors.intensifiers.length > 0) {
      adjustedScore *= (1 + contextualFactors.intensifiers.length * 0.2) // 程度副词增强情感
    }
    if (contextualFactors.emoticons.length > 0) {
      adjustedScore += contextualFactors.emoticons.length * 0.1 // 表情符号略微提升积极情感
    }
    
    // 6. 分类和置信度计算
    let classification: 'positive' | 'neutral' | 'negative'
    let confidence: number
    
    if (adjustedScore > 0.1) {
      classification = 'positive'
      confidence = Math.min(Math.abs(adjustedScore) * 2, 0.95)
    } else if (adjustedScore < -0.1) {
      classification = 'negative'
      confidence = Math.min(Math.abs(adjustedScore) * 2, 0.95)
    } else {
      classification = 'neutral'
      confidence = Math.max(0.6 - Math.abs(adjustedScore) * 2, 0.3)
    }
    
    return {
      score: adjustedScore * 5, // 转换为-5到+5范围
      comparative: adjustedScore,
      positive: segments.filter(w => this.businessKeywords.get(w) > 0),
      negative: segments.filter(w => this.businessKeywords.get(w) < 0),
      classification,
      confidence,
      emotionBreakdown: emotions,
      contextualFactors
    }
  }

  /**
   * 增强版任务识别
   */
  async extractEnhancedTasks(messages: any[]): Promise<EnhancedTaskItem[]> {
    await this.initializeAsyncComponents()
    
    const tasks: EnhancedTaskItem[] = []
    
    for (const message of messages) {
      if (!message.text || message.text.trim().length === 0) continue
      
      const text = message.text
      const segments = this.segmentChinese(text)
      
      // 1. 使用正则模式识别任务
      for (const pattern of this.taskPatterns) {
        const matches = Array.from(text.matchAll(pattern))
        
        for (const match of matches) {
          const taskDescription = this.cleanTaskDescription(match[0])
          
          if (taskDescription.length > 5) { // 过滤太短的匹配
            const taskItem = await this.buildEnhancedTask(
              taskDescription, 
              text, 
              message, 
              segments
            )
            
            if (taskItem.confidence > 0.6) {
              tasks.push(taskItem)
            }
          }
        }
      }
      
      // 2. 基于关键词识别隐含任务
      const implicitTasks = this.identifyImplicitTasks(text, segments, message)
      tasks.push(...implicitTasks)
    }
    
    // 3. 任务去重和合并
    return this.deduplicateAndMergeTasks(tasks)
  }

  private async buildEnhancedTask(
    description: string, 
    fullText: string, 
    message: any, 
    segments: string[]
  ): Promise<EnhancedTaskItem> {
    // 基础任务信息
    const baseTask: TaskItem = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: description.trim(),
      priority: 'medium',
      status: 'mentioned',
      confidence: 0.7,
      sourceMessage: {
        id: message.id || 'unknown',
        user: message.user?.name || 'unknown',
        channel: message.channel?.name || 'unknown',
        timestamp: message.timestamp || new Date().toISOString()
      }
    }
    
    // 增强信息提取
    const enhancement = {
      taskType: this.classifyTaskType(description, segments),
      urgencyIndicators: this.extractUrgencyIndicators(fullText),
      timeIndicators: this.extractTimeIndicators(fullText),
      stakeholders: this.extractStakeholders(fullText, message),
      relatedTasks: [], // 在实际实现中可以通过相似性分析找到
      complexity: this.assessTaskComplexity(description, segments)
    }
    
    // 优先级计算 
    baseTask.priority = this.calculateEnhancedPriority(
      enhancement.urgencyIndicators,
      enhancement.timeIndicators,
      enhancement.taskType
    )
    
    // 置信度计算
    baseTask.confidence = this.calculateTaskConfidence(
      description,
      enhancement,
      fullText
    )
    
    // 分配人识别
    baseTask.assignee = this.extractAssignee(fullText, message)
    
    // 截止时间识别
    baseTask.deadline = this.extractDeadline(fullText, enhancement.timeIndicators)
    
    return {
      ...baseTask,
      ...enhancement
    } as EnhancedTaskItem
  }

  private classifyTaskType(description: string, segments: string[]): EnhancedTaskItem['taskType'] {
    const actionWords = ['做', '完成', '开发', '实现', '处理', '解决', '修复', '优化']
    const decisionWords = ['决定', '选择', '确定', '评估', '审批', '同意', '拒绝']
    const followUpWords = ['跟进', '追踪', '检查', '确认', '验证', '回复']
    const reminderWords = ['提醒', '记住', '注意', '别忘了', '记得']
    const questionWords = ['问', '询问', '咨询', '确认', '了解', '调研']
    
    if (segments.some(w => actionWords.includes(w))) return 'action'
    if (segments.some(w => decisionWords.includes(w))) return 'decision'  
    if (segments.some(w => followUpWords.includes(w))) return 'follow_up'
    if (segments.some(w => reminderWords.includes(w))) return 'reminder'
    if (segments.some(w => questionWords.includes(w))) return 'question'
    
    return 'action' // 默认为行动任务
  }

  private extractUrgencyIndicators(text: string): string[] {
    const indicators: string[] = []
    
    for (const pattern of this.urgencyPatterns) {
      const matches = text.match(pattern)
      if (matches) {
        indicators.push(...matches)
      }
    }
    
    return [...new Set(indicators)] // 去重
  }

  private extractTimeIndicators(text: string): string[] {
    const indicators: string[] = []
    
    for (const pattern of this.timePatterns) {
      const matches = text.match(pattern)
      if (matches) {
        indicators.push(...matches)
      }
    }
    
    return [...new Set(indicators)]
  }

  private extractStakeholders(text: string, message: any): string[] {
    const stakeholders: string[] = []
    
    // 提及的用户 (@username)
    const mentions = text.match(/@([a-zA-Z0-9_]+)/g)
    if (mentions) {
      stakeholders.push(...mentions.map(m => m.substring(1)))
    }
    
    // 消息发送者
    if (message.user?.name) {
      stakeholders.push(message.user.name)
    }
    
    // 常见角色词汇
    const roleWords = ['经理', '主管', '负责人', '开发', '设计师', '产品', '测试', '运营']
    const segments = this.segmentChinese(text)
    
    for (const segment of segments) {
      if (roleWords.some(role => segment.includes(role))) {
        stakeholders.push(segment)
      }
    }
    
    return [...new Set(stakeholders)]
  }

  private assessTaskComplexity(description: string, segments: string[]): EnhancedTaskItem['complexity'] {
    // 复杂性指标
    const complexityIndicators = {
      simple: ['检查', '确认', '发送', '回复', '更新', '记录'],
      moderate: ['分析', '设计', '开发', '测试', '优化', '调研'],
      complex: ['架构', '重构', '迁移', '集成', '规划', '战略']
    }
    
    const descLength = description.length
    const segmentCount = segments.length
    
    // 基于关键词判断
    if (segments.some(w => complexityIndicators.complex.includes(w))) {
      return 'complex'
    } else if (segments.some(w => complexityIndicators.moderate.includes(w))) {
      return 'moderate'  
    } else if (segments.some(w => complexityIndicators.simple.includes(w))) {
      return 'simple'
    }
    
    // 基于长度和词汇量判断
    if (descLength > 100 || segmentCount > 20) {
      return 'complex'
    } else if (descLength > 50 || segmentCount > 10) {
      return 'moderate'
    } else {
      return 'simple'
    }
  }

  private calculateEnhancedPriority(
    urgencyIndicators: string[],
    timeIndicators: string[], 
    taskType: string
  ): TaskItem['priority'] {
    let priorityScore = 2 // 默认medium (0-低, 1-中低, 2-中, 3-中高, 4-高)
    
    // 紧急性指标影响
    if (urgencyIndicators.length > 0) {
      priorityScore += urgencyIndicators.length
      
      // 特定紧急词汇额外加权
      if (urgencyIndicators.some(u => /紧急|critical|P0/i.test(u))) {
        priorityScore += 2
      }
    }
    
    // 时间指标影响
    if (timeIndicators.some(t => /今天|马上|立即|现在/.test(t))) {
      priorityScore += 2
    } else if (timeIndicators.some(t => /明天|tomorrow/.test(t))) {
      priorityScore += 1
    }
    
    // 任务类型影响
    if (taskType === 'decision') {
      priorityScore += 1 // 决策任务通常重要
    }
    
    // 转换为枚举值
    if (priorityScore >= 5) return 'urgent'
    else if (priorityScore >= 4) return 'high'  
    else if (priorityScore >= 2) return 'medium'
    else return 'low'
  }

  private calculateTaskConfidence(
    description: string,
    enhancement: any,
    fullText: string
  ): number {
    let confidence = 0.5 // 基础置信度
    
    // 任务描述质量
    if (description.length > 10 && description.length < 200) {
      confidence += 0.2
    }
    
    // 有明确的动作词汇
    if (/(?:需要|要|应该|必须|完成|做|处理)/.test(description)) {
      confidence += 0.2
    }
    
    // 有具体的对象或目标
    if (enhancement.stakeholders.length > 0) {
      confidence += 0.1
    }
    
    // 有时间指标
    if (enhancement.timeIndicators.length > 0) {
      confidence += 0.1
    }
    
    // 有紧急性指标
    if (enhancement.urgencyIndicators.length > 0) {
      confidence += 0.1  
    }
    
    return Math.min(confidence, 0.95) // 最高95%置信度
  }

  private extractAssignee(text: string, message: any): string | undefined {
    // @用户名提及
    const mentions = text.match(/@([a-zA-Z0-9_]+)/g)
    if (mentions && mentions.length === 1) {
      return mentions[0].substring(1)
    }
    
    // "请XXX负责/处理/完成"模式
    const assignmentPattern = /请\s*([^，。！？\s]{2,8})\s*(?:负责|处理|完成|跟进)/g
    const assignmentMatch = assignmentPattern.exec(text)
    if (assignmentMatch) {
      return assignmentMatch[1]
    }
    
    return undefined
  }

  private extractDeadline(text: string, timeIndicators: string[]): string | undefined {
    if (timeIndicators.length === 0) return undefined
    
    // 选择最具体的时间指标
    const specificTimes = timeIndicators.filter(t => 
      /\d{4}-\d{1,2}-\d{1,2}|\d{1,2}月\d{1,2}日|\d{1,2}\/\d{1,2}/.test(t)
    )
    
    if (specificTimes.length > 0) {
      return specificTimes[0]
    }
    
    // 相对时间转换为具体日期
    const today = new Date()
    for (const indicator of timeIndicators) {
      if (indicator.includes('今天')) {
        return today.toISOString().split('T')[0]
      } else if (indicator.includes('明天')) {
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
      } else if (indicator.includes('本周')) {
        const endOfWeek = new Date(today)
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()))
        return endOfWeek.toISOString().split('T')[0]
      }
    }
    
    return undefined
  }

  private identifyImplicitTasks(text: string, segments: string[], message: any): EnhancedTaskItem[] {
    // 这里可以实现基于语义的隐含任务识别
    // 目前返回空数组，后续可以扩展
    return []
  }

  private deduplicateAndMergeTasks(tasks: EnhancedTaskItem[]): EnhancedTaskItem[] {
    // 简单的去重逻辑 - 基于描述相似性
    const uniqueTasks: EnhancedTaskItem[] = []
    
    for (const task of tasks) {
      const isDuplicate = uniqueTasks.some(existing => 
        this.calculateSimilarity(task.description, existing.description) > 0.8
      )
      
      if (!isDuplicate) {
        uniqueTasks.push(task)
      }
    }
    
    return uniqueTasks.sort((a, b) => {
      // 按优先级和置信度排序
      const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 }
      const scoreA = priorityWeight[a.priority] * a.confidence
      const scoreB = priorityWeight[b.priority] * b.confidence
      return scoreB - scoreA
    })
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // 简单的字符级相似性计算
    const minLength = Math.min(text1.length, text2.length)
    const maxLength = Math.max(text1.length, text2.length)
    
    if (maxLength === 0) return 0
    
    let commonChars = 0
    for (let i = 0; i < minLength; i++) {
      if (text1[i] === text2[i]) {
        commonChars++
      }
    }
    
    return commonChars / maxLength
  }

  private cleanTaskDescription(rawDescription: string): string {
    return rawDescription
      .replace(/[。！？；：，、]/g, '') // 移除标点
      .replace(/\s+/g, ' ') // 合并空格
      .trim()
  }
}