/**
 * 智能Context Manager - 解决AI回复不当问题
 * 架构化方式管理上下文和意图识别
 */

import { BrowserSafeNLP } from '@/lib/nlp/browser-safe-analyzer'

// Context相关性评分接口
export interface ContextRelevance {
  isWorkRelated: boolean
  needsContextData: boolean
  relevanceScore: number
  requiredSources: ('slack' | 'gmail' | 'jira' | 'github')[]
  responseType: 'casual' | 'simple_work' | 'detailed_analysis'
}

// 用户意图分类
export interface UserIntent {
  category: 'greeting' | 'casual' | 'work_query' | 'complex_analysis' | 'unknown'
  confidence: number
  entities: string[]
  timeframe?: string
  scope?: 'personal' | 'team' | 'project' | 'organization'
}

// 统一上下文数据结构
export interface UnifiedContext {
  contextId: string
  relevantData: {
    slack?: any[]
    gmail?: any[]
    jira?: any[]
    github?: any[]
  }
  summary: string
  totalItems: number
  relevanceScore: number
}

/**
 * 智能Context Manager
 * 职责：智能判断用户意图，动态决定上下文加载策略
 */
export class SmartContextManager {
  private nlpAnalyzer: BrowserSafeNLP

  constructor() {
    this.nlpAnalyzer = new BrowserSafeNLP()
  }

  /**
   * 核心方法：智能分析用户意图和上下文需求
   */
  async analyzeUserIntent(message: string): Promise<UserIntent> {
    const lowerMessage = message.toLowerCase().trim()
    
    // 1. 问候和日常对话检测
    if (this.isCasualConversation(lowerMessage)) {
      return {
        category: 'casual',
        confidence: 0.95,
        entities: [],
        scope: 'personal'
      }
    }

    // 2. 简单工作查询检测
    if (this.isSimpleWorkQuery(lowerMessage)) {
      return {
        category: 'work_query',
        confidence: 0.8,
        entities: this.extractWorkEntities(lowerMessage),
        timeframe: this.extractTimeframe(lowerMessage),
        scope: this.inferScope(lowerMessage)
      }
    }

    // 3. 复杂分析请求检测
    if (this.isComplexAnalysisRequest(lowerMessage)) {
      return {
        category: 'complex_analysis',
        confidence: 0.9,
        entities: this.extractWorkEntities(lowerMessage),
        timeframe: this.extractTimeframe(lowerMessage),
        scope: this.inferScope(lowerMessage)
      }
    }

    // 4. 问候语检测
    if (this.isGreeting(lowerMessage)) {
      return {
        category: 'greeting',
        confidence: 0.9,
        entities: [],
        scope: 'personal'
      }
    }

    return {
      category: 'unknown',
      confidence: 0.3,
      entities: []
    }
  }

  /**
   * 计算上下文相关性，决定是否加载工作数据
   */
  async calculateContextRelevance(message: string, contextId?: string): Promise<ContextRelevance> {
    const intent = await this.analyzeUserIntent(message)
    
    // 基于意图决定上下文策略
    switch (intent.category) {
      case 'greeting':
      case 'casual':
        return {
          isWorkRelated: false,
          needsContextData: false,
          relevanceScore: 0,
          requiredSources: [],
          responseType: 'casual'
        }
      
      case 'work_query':
        return {
          isWorkRelated: true,
          needsContextData: true,
          relevanceScore: 0.7,
          requiredSources: this.determineRequiredSources(intent),
          responseType: 'simple_work'
        }
      
      case 'complex_analysis':
        return {
          isWorkRelated: true,
          needsContextData: true,
          relevanceScore: 0.9,
          requiredSources: ['slack', 'gmail', 'jira'],
          responseType: 'detailed_analysis'
        }
      
      default:
        return {
          isWorkRelated: false,
          needsContextData: false,
          relevanceScore: 0.1,
          requiredSources: [],
          responseType: 'casual'
        }
    }
  }

  /**
   * 智能构建提示词，基于上下文相关性
   */
  buildSmartPrompt(message: string, contextRelevance: ContextRelevance, contextData?: any): string {
    switch (contextRelevance.responseType) {
      case 'casual':
        return `你是一个友好的AI助手。用户正在进行日常对话。

用户说: ${message}

请简洁友好地回应，就像和朋友聊天一样。不需要提及工作内容或数据分析。`

      case 'simple_work':
        const simpleContext = contextData ? this.formatSimpleContext(contextData) : ''
        return `你是一个智能工作助手。用户询问简单的工作相关问题。

用户问题: ${message}

${simpleContext ? `相关信息:\n${simpleContext}\n` : ''}

请提供简洁有用的回答，重点回应用户的具体问题。`

      case 'detailed_analysis':
        const detailedContext = contextData ? this.formatDetailedContext(contextData) : ''
        return `你是一个智能工作助手，专门提供深度工作分析。

用户请求: ${message}

${detailedContext ? `详细工作上下文:\n${detailedContext}\n` : ''}

请提供深入的分析和insights，包括趋势、建议和行动项。使用清晰的格式展示。`

      default:
        return `你是一个智能工作助手。

用户问题: ${message}

请提供有用的回答。`
    }
  }

  // =============================================================================
  // 私有辅助方法 - 意图识别逻辑
  // =============================================================================

  private isCasualConversation(message: string): boolean {
    const casualPatterns = [
      /\b(weather|天气)\b/,
      /\b(time|几点|什么时候)\b/,
      /\b(how are you|你好吗|你怎么样)\b/,
      /\b(thank you|thanks|谢谢)\b/,
      /\b(bye|再见|goodbye)\b/,
      /\b(joke|笑话|funny)\b/,
      /\b(music|音乐|song)\b/,
      /\b(movie|电影|film)\b/
    ]
    
    return casualPatterns.some(pattern => pattern.test(message))
  }

  private isGreeting(message: string): boolean {
    const greetingPatterns = [
      /^(hi|hello|hey|哈喽|你好|嗨)!?$/,
      /^(good morning|早上好|good afternoon|下午好|good evening|晚上好)!?$/,
      /^(在吗|在不在|are you there)[\?？]?$/
    ]
    
    return greetingPatterns.some(pattern => pattern.test(message))
  }

  private isSimpleWorkQuery(message: string): boolean {
    // 中文不需要词边界，直接匹配
    const chineseWorkPatterns = [
      /(今天|昨天|最近)\s*(有|的)?\s*(什么)?\s*(重要)?\s*(邮件|任务|会议|工作|项目)/,
      /(有什么|什么)\s*(重要|新)?\s*(邮件|任务|会议|工作|项目|消息)/,
      /(邮件|任务|会议|工作|项目)\s*(吗|呢|？|\?|怎么样|如何)/,
      /(谁|哪个人)\s*(发了|发送|sent)\s*(邮件|消息)/,
      /(工作|项目|任务)\s*(安排|状态|进度|情况)/
    ]
    
    // 英文需要词边界
    const englishWorkPatterns = [
      /\b(today|yesterday|recent)\s*(any|what)?\s*(important)?\s*(email|task|meeting|work|project)\b/,
      /\bwhat\s*(important)?\s*(email|task|meeting|work|project)\b/,
      /\b(email|task|meeting|work|project)\s*(today|yesterday)?\b/,
      /\bwho\s*sent\s*(email|message)\b/
    ]
    
    const hasChineseWork = chineseWorkPatterns.some(pattern => pattern.test(message))
    const hasEnglishWork = englishWorkPatterns.some(pattern => pattern.test(message))
    
    return hasChineseWork || hasEnglishWork
  }

  private isComplexAnalysisRequest(message: string): boolean {
    // 中文复杂分析模式
    const chineseComplexPatterns = [
      /(分析|总结|概述|报告)\s*(团队|项目|工作|最近|今天|昨天)/,
      /(团队|项目)\s*(分析|总结|概述|表现|状态|情况|进度)/,
      /(最近|今天|昨天|这周|本月)\s*(的)?\s*(工作|项目|团队)\s*(分析|总结|概述|情况)/,
      /(趋势|统计|数据)\s*(分析|报告)/,
      /(协作|合作|沟通)\s*(情况|状态|分析)/
    ]
    
    // 英文复杂分析模式
    const englishComplexPatterns = [
      /\b(analyze|analysis|report|summary|overview)\s*(team|project|work|recent)\b/,
      /\b(team|project)\s*(analyze|analysis|performance|status|progress)\b/,
      /\b(recent|today|yesterday|this week|this month)\s*(work|project|team)\s*(analysis|summary)\b/,
      /\b(trend|statistics|data)\s*(analysis|report)\b/,
      /\b(collaboration|communication)\s*(analysis|status)\b/
    ]
    
    const hasChineseComplex = chineseComplexPatterns.some(pattern => pattern.test(message))
    const hasEnglishComplex = englishComplexPatterns.some(pattern => pattern.test(message))
    
    return hasChineseComplex || hasEnglishComplex
  }

  private extractWorkEntities(message: string): string[] {
    const entities = []
    
    // 提取人名
    const namePattern = /@(\w+)|(\w+)\s*(说|sent|发送)/g
    let match
    while ((match = namePattern.exec(message)) !== null) {
      entities.push(match[1] || match[2])
    }
    
    // 提取项目关键词
    const projectPattern = /\b(项目|project)\s*([^\s，。！？,!?]+)/gi
    while ((match = projectPattern.exec(message)) !== null) {
      entities.push(match[2])
    }
    
    return entities
  }

  private extractTimeframe(message: string): string | undefined {
    const timePatterns = [
      { pattern: /\b(今天|today)\b/, value: 'today' },
      { pattern: /\b(昨天|yesterday)\b/, value: 'yesterday' },
      { pattern: /\b(最近|recent|this week|这周)\b/, value: 'this_week' },
      { pattern: /\b(本月|this month)\b/, value: 'this_month' }
    ]
    
    for (const { pattern, value } of timePatterns) {
      if (pattern.test(message)) {
        return value
      }
    }
    
    return undefined
  }

  private inferScope(message: string): 'personal' | 'team' | 'project' | 'organization' {
    if (/\b(我的|my|个人|personal)\b/.test(message)) return 'personal'
    if (/\b(团队|team|我们的|our)\b/.test(message)) return 'team'  
    if (/\b(项目|project|产品|product)\b/.test(message)) return 'project'
    if (/\b(公司|company|组织|organization)\b/.test(message)) return 'organization'
    
    return 'team' // 默认团队范围
  }

  private determineRequiredSources(intent: UserIntent): ('slack' | 'gmail' | 'jira' | 'github')[] {
    const sources: ('slack' | 'gmail' | 'jira' | 'github')[] = []
    
    if (intent.entities.some(e => e.includes('邮件') || e.includes('email'))) {
      sources.push('gmail')
    }
    
    if (intent.entities.some(e => e.includes('任务') || e.includes('task') || e.includes('bug'))) {
      sources.push('jira')
    }
    
    if (intent.entities.some(e => e.includes('代码') || e.includes('code') || e.includes('PR'))) {
      sources.push('github')
    }
    
    // 默认包含Slack（团队沟通）
    if (sources.length === 0 || intent.scope === 'team') {
      sources.push('slack')
    }
    
    return sources
  }

  private formatSimpleContext(contextData: any): string {
    // 格式化简单上下文，只显示核心信息
    if (!contextData) return ''
    
    const items = []
    if (contextData.slack?.length > 0) {
      items.push(`最近团队讨论: ${contextData.slack.length}条消息`)
    }
    if (contextData.gmail?.length > 0) {
      items.push(`相关邮件: ${contextData.gmail.length}封`)
    }
    
    return items.join(' | ')
  }

  private formatDetailedContext(contextData: any): string {
    // 格式化详细上下文，用于复杂分析
    if (!contextData) return '暂无相关工作数据'
    
    const sections = []
    
    if (contextData.slack?.length > 0) {
      sections.push(`## 团队对话 (${contextData.slack.length}条)`)
      sections.push(contextData.slack.slice(0, 5).map((msg: any) => 
        `- [${new Date(msg.timestamp).toLocaleString()}] ${msg.user?.name}: ${msg.text.substring(0, 100)}`
      ).join('\n'))
    }
    
    if (contextData.gmail?.length > 0) {
      sections.push(`\n## 相关邮件 (${contextData.gmail.length}封)`)
      sections.push(contextData.gmail.slice(0, 3).map((email: any) => 
        `- [${new Date(email.timestamp).toLocaleString()}] ${email.sender}: ${email.subject}`
      ).join('\n'))
    }
    
    return sections.join('\n')
  }
}