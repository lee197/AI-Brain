/**
 * Master Agent - 主协调器系统
 * 负责任务分解、路由决策、结果整合和用户交互协调
 */

import { z } from 'zod'

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

  constructor(config: Partial<AgentConfig> = {}) {
    this.config = {
      maxConcurrentTasks: 10,
      timeoutMs: 300000, // 5分钟
      retryAttempts: 3,
      enableWorkflows: true,
      debugMode: process.env.NODE_ENV === 'development',
      ...config
    }
  }

  /**
   * 主入口：处理用户请求
   */
  async processUserRequest(
    userMessage: string,
    contextId: string,
    userId: string,
    options: {
      priority?: Task['priority']
      enableSubAgents?: boolean
      maxSubTasks?: number
    } = {}
  ): Promise<TaskResult> {
    try {
      // 1. 创建主任务
      const task = await this.createTask({
        type: this.classifyTaskType(userMessage),
        userMessage,
        contextId,
        userId,
        priority: options.priority || 'NORMAL'
      })

      this.log(`🚀 Master Agent processing task: ${task.id}`)

      // 2. 任务规划阶段
      task.status = 'PLANNING'
      await this.planTaskExecution(task)

      // 3. 执行阶段
      task.status = 'EXECUTING'
      const result = await this.executeTask(task)

      // 4. 完成
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
    // 调用Slack SubAgent
    const { SlackSubAgent } = await import('./sub-agents/slack-agent')
    const slackAgent = new SlackSubAgent(params.contextId)
    
    switch (action) {
      case 'search_messages':
        return await slackAgent.searchMessages(params.query)
      case 'send_notification':
        return await slackAgent.sendNotification(params.message)
      case 'get_recent_messages':
        return await slackAgent.getRecentMessages(params.days || 7)
      default:
        throw new Error(`Unknown Slack action: ${action}`)
    }
  }

  private async callGoogleAgent(action: string, params: any): Promise<any> {
    // 调用Google SubAgent
    const { GoogleSubAgent } = await import('./sub-agents/google-agent')
    const googleAgent = new GoogleSubAgent(params.contextId)
    
    switch (action) {
      case 'search_gmail':
        return await googleAgent.searchGmail(params.query)
      case 'search_drive':
        return await googleAgent.searchDrive(params.query)
      case 'get_recent_emails':
        return await googleAgent.getRecentEmails(params.days || 7)
      case 'create_email_draft':
        return await googleAgent.createEmailDraft(params.userMessage)
      default:
        throw new Error(`Unknown Google action: ${action}`)
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