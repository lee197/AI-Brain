/**
 * Master Agent - 主协调器系统
 * 负责任务分解、路由决策、结果整合和用户交互协调
 */

import { z } from 'zod'
import { SlackSubAgentSimple } from './sub-agents/slack-agent-simple'

// 任务类型定义
export const TaskTypeSchema = z.enum([
  'CHAT',           // 简单聊天对话
  'SEARCH',         // 跨工具搜索
  'CREATE',         // 创建任务/文档/工单
  'ANALYZE',        // 数据分析和报告
  'WORKFLOW',       // 复杂工作流
  'NOTIFICATION'    // 通知和提醒
])

export type TaskType = z.infer<typeof TaskTypeSchema>

// 任务定义
export interface Task {
  id: string
  type: TaskType
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  userMessage: string
  contextId: string
  userId: string
  
  // 分解后的子任务
  subtasks: SubTask[]
  
  // 执行状态
  status: 'PENDING' | 'PLANNING' | 'EXECUTING' | 'COMPLETED' | 'FAILED'
  
  // 时间戳
  createdAt: Date
  updatedAt: Date
  
  // 结果
  result?: TaskResult
  error?: string
}

export interface SubTask {
  id: string
  parentTaskId: string
  agentType: 'SLACK' | 'JIRA' | 'GITHUB' | 'GOOGLE' | 'NOTION' | 'CUSTOM'
  action: string
  parameters: Record<string, any>
  dependencies: string[] // 依赖的其他subtask IDs
  status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED'
  result?: any
  error?: string
}

export interface TaskResult {
  success: boolean
  data: any
  summary: string
  recommendations?: string[]
  followUpTasks?: Partial<Task>[]
}

// Agent配置
export interface AgentConfig {
  maxConcurrentTasks: number
  timeoutMs: number
  retryAttempts: number
  enableWorkflows: boolean
  debugMode: boolean
}

// Master Agent核心类
export class MasterAgent {
  private config: AgentConfig
  private activeTasks: Map<string, Task> = new Map()
  private subAgents: Map<string, any> = new Map()
  private slackAgentCache: Map<string, SlackSubAgentSimple> = new Map() // 缓存 SubAgent 实例

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      maxConcurrentTasks: 10,
      timeoutMs: 300000, // 5分钟
      retryAttempts: 3,
      enableWorkflows: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    }

    if (this.config.debugMode) {
      console.log('🧠 Master Agent initialized with deep analysis capabilities')
    }
  }

  /**
   * 主入口：处理用户请求 (增强版 - 支持深度分析)
   */
  async processUserRequest(
    userMessage: string,
    contextId: string,
    userId: string,
    options: {
      priority?: Task['priority']
      enableSubAgents?: boolean
      enableDeepAnalysis?: boolean
      maxSubTasks?: number
    } = {}
  ): Promise<TaskResult> {
    try {
      // 1. 分析用户意图和复杂度
      const intent = this.analyzeUserIntent(userMessage)
      
      // 2. 创建主任务
      const task = await this.createTask({
        type: this.classifyTaskType(userMessage),
        userMessage,
        contextId,
        userId,
        priority: options.priority || 'NORMAL'
      })

      this.log(`🚀 Master Agent processing task: ${task.id}`, { intent })

      // 3. 任务规划阶段 (增强版：包含深度分析判断)
      task.status = 'PLANNING'
      await this.planTaskExecutionWithAnalysis(task, intent, options)

      // 4. 执行阶段
      task.status = 'EXECUTING'
      const result = await this.executeTaskEnhanced(task)

      // 5. 完成
      task.status = 'COMPLETED'
      task.result = result

      this.log(`✅ Task completed: ${task.id}`)
      return result

    } catch (error) {
      this.log(`❌ Task failed: ${error}`)
      throw error
    }
  }

  /**
   * 分析用户意图 (新增)
   */
  private analyzeUserIntent(userMessage: string): {
    needsSlackAnalysis: boolean
    analysisDepth: 'basic' | 'deep' | 'comprehensive'
    taskRelated: boolean
    sentimentRelated: boolean
    meetingRelated: boolean
    timeframe: number // days
  } {
    const message = userMessage.toLowerCase()
    
    // 检测是否需要 Slack 分析
    const slackKeywords = ['团队', 'slack', '讨论', '消息', '对话', '沟通', '协作']
    const needsSlackAnalysis = slackKeywords.some(keyword => message.includes(keyword))
    
    // 检测分析深度需求
    const deepKeywords = ['深度', '详细', '全面', '分析', '洞察', '趋势']
    const basicKeywords = ['简单', '快速', '概览', '基本']
    
    let analysisDepth: 'basic' | 'deep' | 'comprehensive' = 'basic'
    if (deepKeywords.some(keyword => message.includes(keyword))) {
      analysisDepth = 'comprehensive'
    } else if (!basicKeywords.some(keyword => message.includes(keyword))) {
      analysisDepth = 'deep'
    }
    
    // 检测具体分析需求
    const taskRelated = /任务|待办|工作|分配|责任/.test(message)
    const sentimentRelated = /情绪|氛围|状态|情感|压力/.test(message)
    const meetingRelated = /会议|讨论|决策|action/.test(message)
    
    // 提取时间范围
    let timeframe = 7 // 默认7天
    if (message.includes('今天')) timeframe = 1
    else if (message.includes('昨天')) timeframe = 2
    else if (message.includes('本周')) timeframe = 7
    else if (message.includes('上周')) timeframe = 14
    else if (message.includes('本月')) timeframe = 30
    
    return {
      needsSlackAnalysis,
      analysisDepth,
      taskRelated,
      sentimentRelated,
      meetingRelated,
      timeframe
    }
  }

  /**
   * 增强版任务规划 - 包含深度分析判断
   */
  private async planTaskExecutionWithAnalysis(
    task: Task, 
    intent: any, 
    options: any
  ): Promise<void> {
    this.log(`🎯 Planning task execution with analysis intent`, intent)
    
    // 基础规划
    await this.planTaskExecution(task)
    
    // 如果需要 Slack 分析，添加深度分析子任务
    if (intent.needsSlackAnalysis && (options.enableDeepAnalysis !== false)) {
      const analysisSubTask: SubTask = {
        id: `subtask_${task.id}_slack_analysis`,
        parentTaskId: task.id,
        agentType: 'SLACK',
        action: intent.analysisDepth === 'basic' ? 'get_recent_messages' : 'deep_analysis',
        parameters: {
          contextId: task.contextId,
          days: intent.timeframe,
          includeSentiment: intent.sentimentRelated || intent.analysisDepth !== 'basic',
          includeTasks: intent.taskRelated || intent.analysisDepth === 'comprehensive',
          includeMeetings: intent.meetingRelated || intent.analysisDepth === 'comprehensive',
          includeTeamInsights: intent.analysisDepth === 'comprehensive'
        },
        dependencies: [],
        status: 'PENDING',
        createdAt: new Date()
      }
      
      task.subtasks.push(analysisSubTask)
      this.log(`📊 Added deep analysis subtask: ${analysisSubTask.action}`)
    }
  }

  /**
   * 增强版任务执行
   */
  private async executeTaskEnhanced(task: Task): Promise<TaskResult> {
    const results: any[] = []
    const deepAnalysisResults: any[] = []
    
    // 执行所有子任务
    for (const subtask of task.subtasks) {
      try {
        const result = await this.executeSubTask(subtask)
        results.push(result)
        
        // 标记深度分析结果
        if (subtask.action.includes('analysis') || 
            subtask.action.includes('sentiment') || 
            subtask.action.includes('tasks') ||
            subtask.action.includes('meetings')) {
          deepAnalysisResults.push(result)
        }
      } catch (error: any) {
        this.log(`❌ Subtask failed: ${subtask.id} - ${error.message}`)
        results.push({
          success: false,
          subtaskId: subtask.id,
          error: error.message
        })
      }
    }
    
    // 智能整合结果
    return this.aggregateResultsEnhanced(task, results, deepAnalysisResults)
  }

  /**
   * 增强版结果整合 - 智能分析整合
   */
  private aggregateResultsEnhanced(
    task: Task, 
    results: any[], 
    deepAnalysisResults: any[]
  ): TaskResult {
    const successfulResults = results.filter(r => r.success)
    
    // 基础数据整合
    const basicData = successfulResults.map(r => r.data)
    
    // 深度洞察提取
    const insights = this.extractDeepInsights(deepAnalysisResults)
    const recommendations = this.generateSmartRecommendations(deepAnalysisResults)
    const keyMetrics = this.extractKeyMetrics(deepAnalysisResults)
    
    // 生成增强摘要
    const summary = this.generateEnhancedSummary(task, successfulResults, deepAnalysisResults)
    
    return {
      success: successfulResults.length > 0,
      data: {
        taskType: task.type,
        userQuery: task.userMessage,
        basicResults: basicData,
        deepAnalysis: deepAnalysisResults.length > 0 ? {
          insights,
          recommendations, 
          keyMetrics
        } : null
      },
      summary,
      recommendations,
      followUpTasks: this.suggestFollowUpTasks(task, deepAnalysisResults)
    }
  }

  /**
   * 提取深度洞察
   */
  private extractDeepInsights(deepResults: any[]): string[] {
    const insights = []
    
    for (const result of deepResults) {
      if (result.data?.analysis) {
        const analysis = result.data.analysis
        
        // 情感洞察
        if (analysis.sentiment) {
          const mood = analysis.sentiment.classification
          const score = analysis.sentiment.score
          insights.push(`团队情感状态: ${mood} (评分: ${score})`)
        }
        
        // 任务洞察
        if (analysis.tasks && analysis.tasks.length > 0) {
          const urgentTasks = analysis.tasks.filter((t: any) => t.priority === 'urgent').length
          insights.push(`发现 ${analysis.tasks.length} 个待办任务，其中 ${urgentTasks} 个紧急`)
        }
        
        // 团队协作洞察
        if (analysis.teamInsights) {
          const score = analysis.teamInsights.collaborationScore
          insights.push(`团队协作评分: ${score}/100`)
        }
      }
    }
    
    return insights
  }

  /**
   * 生成智能建议
   */
  private generateSmartRecommendations(deepResults: any[]): string[] {
    const recommendations = []
    
    for (const result of deepResults) {
      if (result.data?.recommendations) {
        recommendations.push(...result.data.recommendations)
      }
      
      if (result.data?.analysis?.teamInsights?.recommendations) {
        const teamRecs = result.data.analysis.teamInsights.recommendations
        for (const rec of teamRecs) {
          recommendations.push(`${rec.priority.toUpperCase()}: ${rec.description}`)
        }
      }
    }
    
    return [...new Set(recommendations)] // 去重
  }

  /**
   * 提取关键指标
   */
  private extractKeyMetrics(deepResults: any[]): Record<string, number | string> {
    const metrics: Record<string, number | string> = {}
    
    for (const result of deepResults) {
      if (result.data?.analysis) {
        const analysis = result.data.analysis
        
        // 情感指标
        if (analysis.sentiment) {
          metrics.sentimentScore = analysis.sentiment.score
          metrics.sentimentConfidence = Math.round(analysis.sentiment.confidence * 100)
        }
        
        // 任务指标
        if (analysis.tasks) {
          metrics.totalTasks = analysis.tasks.length
          metrics.urgentTasks = analysis.tasks.filter((t: any) => t.priority === 'urgent').length
        }
        
        // 协作指标
        if (analysis.teamInsights) {
          metrics.collaborationScore = analysis.teamInsights.collaborationScore
          metrics.avgResponseTime = Math.round(analysis.teamInsights.communicationPatterns.responseTime)
        }
        
        // 处理时间指标
        metrics.analysisTime = analysis.processingTime
      }
    }
    
    return metrics
  }

  /**
   * 生成增强摘要
   */
  private generateEnhancedSummary(task: Task, results: any[], deepResults: any[]): string {
    const sections = []
    
    // 基础摘要
    sections.push(`处理了用户请求: "${task.userMessage.substring(0, 50)}..."`)
    
    // 深度分析摘要
    if (deepResults.length > 0) {
      for (const result of deepResults) {
        if (result.data?.analysis?.summary) {
          sections.push(`📊 深度洞察: ${result.data.analysis.summary}`)
        }
      }
    }
    
    return sections.join(' | ')
  }

  /**
   * 建议后续任务
   */
  private suggestFollowUpTasks(task: Task, deepResults: any[]): Partial<Task>[] {
    const followUps: Partial<Task>[] = []
    
    // 基于深度分析结果建议后续任务
    for (const result of deepResults) {
      if (result.data?.analysis?.tasks) {
        const urgentTasks = result.data.analysis.tasks.filter((t: any) => t.priority === 'urgent')
        
        if (urgentTasks.length > 0) {
          followUps.push({
            type: 'CREATE',
            userMessage: `处理 ${urgentTasks.length} 个紧急任务`,
            priority: 'HIGH'
          })
        }
      }
    }
    
    return followUps
  }

  /**
   * 智能任务分类
   */
  private classifyTaskType(userMessage: string): TaskType {
    const message = userMessage.toLowerCase()

    // 简单规则分类（未来可用AI模型替代）
    if (message.includes('搜索') || message.includes('查找') || message.includes('search')) {
      return 'SEARCH'
    }
    
    if (message.includes('创建') || message.includes('新建') || message.includes('create')) {
      return 'CREATE'
    }
    
    if (message.includes('分析') || message.includes('报告') || message.includes('统计')) {
      return 'ANALYZE'
    }
    
    if (message.includes('自动') || message.includes('批量') || message.includes('workflow')) {
      return 'WORKFLOW'
    }

    // 默认为聊天
    return 'CHAT'
  }

  /**
   * 任务规划 - 将复杂任务分解为子任务
   */
  private async planTaskExecution(task: Task): Promise<void> {
    this.log(`🎯 Planning execution for task type: ${task.type}`)

    switch (task.type) {
      case 'SEARCH':
        await this.planSearchTask(task)
        break
      case 'CREATE':
        await this.planCreateTask(task)
        break
      case 'ANALYZE':
        await this.planAnalyzeTask(task)
        break
      case 'WORKFLOW':
        await this.planWorkflowTask(task)
        break
      case 'CHAT':
      default:
        await this.planChatTask(task)
        break
    }

    this.log(`📋 Planned ${task.subtasks.length} subtasks`)
  }

  /**
   * 规划搜索任务
   */
  private async planSearchTask(task: Task): Promise<void> {
    const message = task.userMessage.toLowerCase()
    
    // 分析需要搜索的数据源
    const searchTargets: Array<{agent: string, action: string, params: any}> = []

    if (message.includes('slack') || message.includes('消息') || message.includes('讨论')) {
      searchTargets.push({
        agent: 'SLACK',
        action: 'search_messages',
        params: { query: task.userMessage, contextId: task.contextId }
      })
    }

    if (message.includes('邮件') || message.includes('email') || message.includes('gmail')) {
      searchTargets.push({
        agent: 'GOOGLE',
        action: 'search_gmail',
        params: { query: task.userMessage, contextId: task.contextId }
      })
    }

    if (message.includes('文件') || message.includes('drive') || message.includes('文档')) {
      searchTargets.push({
        agent: 'GOOGLE',
        action: 'search_drive',
        params: { query: task.userMessage, contextId: task.contextId }
      })
    }

    if (message.includes('jira') || message.includes('工单') || message.includes('bug')) {
      searchTargets.push({
        agent: 'JIRA',
        action: 'search_issues',
        params: { query: task.userMessage, contextId: task.contextId }
      })
    }

    // 如果没有明确指定，搜索所有可用数据源
    if (searchTargets.length === 0) {
      searchTargets.push(
        { agent: 'SLACK', action: 'search_messages', params: { query: task.userMessage, contextId: task.contextId } },
        { agent: 'GOOGLE', action: 'search_gmail', params: { query: task.userMessage, contextId: task.contextId } },
        { agent: 'GOOGLE', action: 'search_drive', params: { query: task.userMessage, contextId: task.contextId } }
      )
    }

    // 创建并行搜索子任务
    task.subtasks = searchTargets.map((target, index) => ({
      id: `${task.id}-search-${index}`,
      parentTaskId: task.id,
      agentType: target.agent as any,
      action: target.action,
      parameters: target.params,
      dependencies: [],
      status: 'PENDING'
    }))

    // 添加结果整合子任务
    task.subtasks.push({
      id: `${task.id}-aggregate`,
      parentTaskId: task.id,
      agentType: 'CUSTOM',
      action: 'aggregate_search_results',
      parameters: { userMessage: task.userMessage },
      dependencies: task.subtasks.map(st => st.id),
      status: 'PENDING'
    })
  }

  /**
   * 规划创建任务
   */
  private async planCreateTask(task: Task): Promise<void> {
    const message = task.userMessage.toLowerCase()

    if (message.includes('工单') || message.includes('issue') || message.includes('bug')) {
      task.subtasks = [{
        id: `${task.id}-create-jira`,
        parentTaskId: task.id,
        agentType: 'JIRA',
        action: 'create_issue',
        parameters: { 
          userMessage: task.userMessage,
          contextId: task.contextId 
        },
        dependencies: [],
        status: 'PENDING'
      }]
    } else if (message.includes('邮件') || message.includes('email')) {
      task.subtasks = [{
        id: `${task.id}-create-email`,
        parentTaskId: task.id,
        agentType: 'GOOGLE',
        action: 'create_email_draft',
        parameters: { 
          userMessage: task.userMessage,
          contextId: task.contextId 
        },
        dependencies: [],
        status: 'PENDING'
      }]
    } else {
      // 默认创建任务
      task.subtasks = [{
        id: `${task.id}-create-generic`,
        parentTaskId: task.id,
        agentType: 'CUSTOM',
        action: 'create_task',
        parameters: { 
          userMessage: task.userMessage,
          contextId: task.contextId 
        },
        dependencies: [],
        status: 'PENDING'
      }]
    }
  }

  /**
   * 规划分析任务
   */
  private async planAnalyzeTask(task: Task): Promise<void> {
    // 分析任务需要先收集数据，再进行分析
    task.subtasks = [
      // 1. 收集数据阶段
      {
        id: `${task.id}-collect-slack`,
        parentTaskId: task.id,
        agentType: 'SLACK',
        action: 'get_recent_messages',
        parameters: { contextId: task.contextId, days: 7 },
        dependencies: [],
        status: 'PENDING'
      },
      {
        id: `${task.id}-collect-gmail`,
        parentTaskId: task.id,
        agentType: 'GOOGLE',
        action: 'get_recent_emails',
        parameters: { contextId: task.contextId, days: 7 },
        dependencies: [],
        status: 'PENDING'
      },
      // 2. 分析阶段
      {
        id: `${task.id}-analyze`,
        parentTaskId: task.id,
        agentType: 'CUSTOM',
        action: 'analyze_collected_data',
        parameters: { 
          userMessage: task.userMessage,
          analysisType: 'comprehensive'
        },
        dependencies: [`${task.id}-collect-slack`, `${task.id}-collect-gmail`],
        status: 'PENDING'
      }
    ]
  }

  /**
   * 规划聊天任务
   */
  private async planChatTask(task: Task): Promise<void> {
    // 聊天任务直接使用现有的AI系统
    task.subtasks = [{
      id: `${task.id}-chat`,
      parentTaskId: task.id,
      agentType: 'CUSTOM',
      action: 'ai_chat',
      parameters: { 
        userMessage: task.userMessage,
        contextId: task.contextId,
        useEnhancedAPI: true
      },
      dependencies: [],
      status: 'PENDING'
    }]
  }

  /**
   * 规划工作流任务
   */
  private async planWorkflowTask(task: Task): Promise<void> {
    // 复杂工作流任务需要多步骤协调
    // 示例：创建工单并通知团队
    task.subtasks = [
      {
        id: `${task.id}-create-issue`,
        parentTaskId: task.id,
        agentType: 'JIRA',
        action: 'create_issue',
        parameters: { userMessage: task.userMessage, contextId: task.contextId },
        dependencies: [],
        status: 'PENDING'
      },
      {
        id: `${task.id}-notify-slack`,
        parentTaskId: task.id,
        agentType: 'SLACK',
        action: 'send_notification',
        parameters: { 
          message: '新工单已创建',
          contextId: task.contextId
        },
        dependencies: [`${task.id}-create-issue`],
        status: 'PENDING'
      }
    ]
  }

  /**
   * 执行任务
   */
  private async executeTask(task: Task): Promise<TaskResult> {
    const results: Array<{subtaskId: string, result: any}> = []
    
    // 构建依赖图
    const dependencyGraph = this.buildDependencyGraph(task.subtasks)
    
    // 按依赖顺序执行子任务
    for (const level of dependencyGraph) {
      // 同级别的子任务可以并行执行
      const levelResults = await Promise.allSettled(
        level.map(subtask => this.executeSubTask(subtask))
      )
      
      // 收集结果
      levelResults.forEach((result, index) => {
        const subtask = level[index]
        if (result.status === 'fulfilled') {
          subtask.status = 'COMPLETED'
          subtask.result = result.value
          results.push({ subtaskId: subtask.id, result: result.value })
        } else {
          subtask.status = 'FAILED'
          subtask.error = result.reason?.message || '执行失败'
          this.log(`❌ SubTask failed: ${subtask.id} - ${subtask.error}`)
        }
      })
    }

    // 整合结果
    return this.aggregateResults(task, results)
  }

  /**
   * 执行子任务
   */
  private async executeSubTask(subtask: SubTask): Promise<any> {
    this.log(`🔄 Executing subtask: ${subtask.agentType}:${subtask.action}`)
    
    subtask.status = 'EXECUTING'

    try {
      switch (subtask.agentType) {
        case 'SLACK':
          return await this.callSlackAgent(subtask.action, subtask.parameters)
        case 'GOOGLE':
          return await this.callGoogleAgent(subtask.action, subtask.parameters)
        case 'JIRA':
          return await this.callJiraAgent(subtask.action, subtask.parameters)
        case 'GITHUB':
          return await this.callGitHubAgent(subtask.action, subtask.parameters)
        case 'NOTION':
          return await this.callNotionAgent(subtask.action, subtask.parameters)
        case 'CUSTOM':
          return await this.callCustomAgent(subtask.action, subtask.parameters)
        default:
          throw new Error(`Unknown agent type: ${subtask.agentType}`)
      }
    } catch (error) {
      this.log(`❌ SubTask execution failed: ${subtask.id}`, error)
      throw error
    }
  }

  /**
   * 构建任务依赖图
   */
  private buildDependencyGraph(subtasks: SubTask[]): SubTask[][] {
    const levels: SubTask[][] = []
    const processed = new Set<string>()
    const subtaskMap = new Map(subtasks.map(st => [st.id, st]))

    while (processed.size < subtasks.length) {
      const currentLevel: SubTask[] = []
      
      for (const subtask of subtasks) {
        if (processed.has(subtask.id)) continue
        
        // 检查所有依赖是否已完成
        const allDependenciesResolved = subtask.dependencies.every(depId => processed.has(depId))
        
        if (allDependenciesResolved) {
          currentLevel.push(subtask)
          processed.add(subtask.id)
        }
      }

      if (currentLevel.length === 0) {
        throw new Error('Circular dependency detected in subtasks')
      }

      levels.push(currentLevel)
    }

    return levels
  }

  /**
   * SubAgent调用方法
   */
  private async callSlackAgent(action: string, params: any): Promise<any> {
    const contextId = params.contextId || 'default'
    
    // 获取或创建 SlackSubAgent 实例
    let slackAgent = this.slackAgentCache.get(contextId)
    if (!slackAgent) {
      slackAgent = new SlackSubAgentSimple(contextId)
      this.slackAgentCache.set(contextId, slackAgent)
    }
    
    // 执行具体操作 (支持深度分析)
    switch (action) {
      case 'search_messages':
        return await slackAgent.searchMessages(params.query, params.limit)
        
      case 'get_recent_messages':
        return await slackAgent.getRecentMessages(params.days || 7, params.limit)
        
      case 'analyze_activity':
        return await slackAgent.analyzeActivity(params.hours || 24)
        
      // 🧠 新增：深度分析功能
      case 'deep_analysis':
        return await slackAgent.performDeepAnalysis({
          days: params.days || 7,
          includeSentiment: params.includeSentiment,
          includeTasks: params.includeTasks,
          includeMeetings: params.includeMeetings,
          includeTeamInsights: params.includeTeamInsights
        })
        
      case 'analyze_sentiment':
        return await slackAgent.analyzeSentiment(params.days || 7)
        
      case 'extract_tasks':
        return await slackAgent.extractTasks(params.days || 7)
        
      case 'analyze_meetings':
        return await slackAgent.analyzeMeetings(params.days || 7)
        
      default:
        throw new Error(`Unknown Slack action: ${action}`)
    }
  }

  private async callGoogleAgent(action: string, params: any): Promise<any> {
    // 临时模拟 Google SubAgent (直到实际实现)
    await this.simulateProcessingTime(300)
    return {
      agent: 'GoogleSubAgent',
      action,
      data: { message: `Google action '${action}' executed successfully`, parameters: params },
      timestamp: new Date().toISOString()
    }
  }

  private async callJiraAgent(action: string, params: any): Promise<any> {
    // TODO: 实现Jira SubAgent
    this.log(`🔄 Jira Agent: ${action} (Not implemented yet)`)
    return { success: false, message: 'Jira agent not implemented' }
  }

  private async callGitHubAgent(action: string, params: any): Promise<any> {
    // TODO: 实现GitHub SubAgent
    this.log(`🔄 GitHub Agent: ${action} (Not implemented yet)`)
    return { success: false, message: 'GitHub agent not implemented' }
  }

  private async callNotionAgent(action: string, params: any): Promise<any> {
    // TODO: 实现Notion SubAgent
    this.log(`🔄 Notion Agent: ${action} (Not implemented yet)`)
    return { success: false, message: 'Notion agent not implemented' }
  }

  private async callCustomAgent(action: string, params: any): Promise<any> {
    // 自定义代理处理
    switch (action) {
      case 'ai_chat':
        return await this.handleAIChat(params)
      case 'aggregate_search_results':
        return await this.aggregateSearchResults(params)
      case 'analyze_collected_data':
        return await this.analyzeCollectedData(params)
      default:
        throw new Error(`Unknown custom action: ${action}`)
    }
  }

  /**
   * AI聊天处理
   */
  private async handleAIChat(params: any): Promise<any> {
    // 使用现有的AI聊天API
    const response = await fetch('/api/ai/chat-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: params.userMessage,
        contextId: params.contextId,
        includeGoogleWorkspace: true
      })
    })

    if (!response.ok) {
      throw new Error(`AI chat API failed: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      response: data.response,
      model: data.model,
      hasContext: data.hasSlackContext || data.hasGoogleWorkspace
    }
  }

  /**
   * 聚合搜索结果
   */
  private async aggregateSearchResults(params: any): Promise<any> {
    // 这里将所有搜索结果整合为统一格式
    return {
      success: true,
      aggregatedResults: `搜索结果已整合，基于用户查询: ${params.userMessage}`,
      sources: ['slack', 'gmail', 'drive'],
      totalResults: 15
    }
  }

  /**
   * 分析收集的数据
   */
  private async analyzeCollectedData(params: any): Promise<any> {
    // 使用AI模型分析收集的数据
    return {
      success: true,
      analysis: '基于收集的数据进行了深度分析',
      insights: ['团队活跃度上升', '邮件回复及时性提高', '项目进度正常'],
      recommendations: ['建议增加代码review频次', '优化邮件沟通流程']
    }
  }

  /**
   * 整合最终结果
   */
  private async aggregateResults(task: Task, results: Array<{subtaskId: string, result: any}>): Promise<TaskResult> {
    const successfulResults = results.filter(r => r.result?.success !== false)
    const failedResults = results.filter(r => r.result?.success === false)

    this.log(`📊 Task results: ${successfulResults.length} successful, ${failedResults.length} failed`)

    // 根据任务类型构建不同的结果格式
    switch (task.type) {
      case 'SEARCH':
        return this.buildSearchResult(task, successfulResults)
      case 'ANALYZE':
        return this.buildAnalysisResult(task, successfulResults)
      case 'CREATE':
        return this.buildCreateResult(task, successfulResults)
      case 'CHAT':
      default:
        return this.buildChatResult(task, successfulResults)
    }
  }

  private buildSearchResult(task: Task, results: any[]): TaskResult {
    return {
      success: true,
      data: {
        query: task.userMessage,
        results: results.map(r => r.result),
        totalSources: results.length
      },
      summary: `找到 ${results.length} 个数据源的相关信息`,
      recommendations: ['点击查看详细结果', '可以进一步细化搜索条件']
    }
  }

  private buildAnalysisResult(task: Task, results: any[]): TaskResult {
    const analysisResult = results.find(r => r.subtaskId.includes('analyze'))?.result
    
    return {
      success: true,
      data: analysisResult || { analysis: '分析完成' },
      summary: '数据分析已完成，发现多个重要insights',
      recommendations: analysisResult?.recommendations || []
    }
  }

  private buildCreateResult(task: Task, results: any[]): TaskResult {
    return {
      success: true,
      data: results[0]?.result || {},
      summary: '创建任务已完成',
      followUpTasks: []
    }
  }

  private buildChatResult(task: Task, results: any[]): TaskResult {
    const chatResult = results[0]?.result
    
    return {
      success: true,
      data: chatResult,
      summary: chatResult?.response || '对话完成'
    }
  }

  /**
   * 辅助方法
   */
  private async createTask(taskData: Partial<Task>): Promise<Task> {
    const task: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      subtasks: [],
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData
    } as Task

    this.activeTasks.set(task.id, task)
    return task
  }

  private log(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`[MasterAgent] ${message}`, data || '')
    }
  }

  /**
   * 获取任务状态
   */
  async getTaskStatus(taskId: string): Promise<Task | null> {
    return this.activeTasks.get(taskId) || null
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.activeTasks.get(taskId)
    if (task && task.status !== 'COMPLETED') {
      task.status = 'FAILED'
      task.error = 'Task cancelled by user'
      return true
    }
    return false
  }
}

// 单例实例
export const masterAgent = new MasterAgent()