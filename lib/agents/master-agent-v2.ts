/**
 * Master Agent V2 - 真正的主协调器
 * 统一调度Context Manager, Workflow Engine和各种SubAgent
 */

import { SmartContextManager, ContextRelevance, UserIntent } from '@/lib/context-manager/smart-context-manager'
import { IntentRecognitionWorkflow } from '@/lib/workflow-engine/intent-recognition-workflow'
import { SlackSubAgentSimple } from '@/lib/agents/sub-agents/slack-agent-simple'

// Master Agent的决策结果
export interface MasterAgentDecision {
  strategy: 'direct_response' | 'single_subagent' | 'multi_subagent' | 'complex_workflow'
  assignedSubAgents: string[]
  contextSources: string[]
  processingPlan: string
  estimatedTime: number
}

// Master Agent的执行结果
export interface MasterAgentResult {
  success: boolean
  response: string
  metadata: {
    strategy: string
    intent: UserIntent
    contextRelevance: ContextRelevance
    subAgentsUsed: string[]
    processingTime: number
    confidence: number
  }
  debug?: {
    workflowLogs: string[]
    subAgentResults: Record<string, any>
    decisionReasoning: string
  }
}

/**
 * Master Agent V2 - 企业级AI助手的大脑
 */
export class MasterAgentV2 {
  private contextManager: SmartContextManager
  private workflowEngine: IntentRecognitionWorkflow
  private subAgents: Map<string, any>
  private debugMode: boolean

  constructor(debugMode: boolean = false) {
    this.contextManager = new SmartContextManager()
    this.workflowEngine = new IntentRecognitionWorkflow()
    this.subAgents = new Map()
    this.debugMode = debugMode
    
    this.log('🧠 Master Agent V2 initialized - Ready to coordinate!')
  }

  /**
   * 🎯 核心方法：处理用户请求的统一入口
   */
  async processUserRequest(
    message: string, 
    contextId?: string, 
    userId?: string
  ): Promise<MasterAgentResult> {
    const startTime = Date.now()
    const logs: string[] = []
    
    try {
      this.log(`🚀 Master Agent processing: "${message}" (Context: ${contextId})`)
      logs.push(`Master Agent started processing user request`)

      // 🔍 阶段1: 智能分析和决策制定
      const decision = await this.analyzeAndDecide(message, contextId, logs)
      logs.push(`Decision made: ${decision.strategy} with ${decision.assignedSubAgents.length} SubAgents`)

      // ⚡ 阶段2: 执行决策计划
      const result = await this.executeDecision(decision, message, contextId, logs)
      
      const processingTime = Date.now() - startTime
      logs.push(`Total processing completed in ${processingTime}ms`)

      return {
        success: true,
        response: result.response,
        metadata: {
          strategy: decision.strategy,
          intent: result.intent,
          contextRelevance: result.contextRelevance,
          subAgentsUsed: decision.assignedSubAgents,
          processingTime,
          confidence: result.confidence
        },
        debug: this.debugMode ? {
          workflowLogs: logs,
          subAgentResults: result.subAgentResults,
          decisionReasoning: this.explainDecision(decision, result.intent)
        } : undefined
      }

    } catch (error) {
      this.log(`❌ Master Agent failed: ${(error as Error).message}`)
      
      return {
        success: false,
        response: this.generateFallbackResponse(message),
        metadata: {
          strategy: 'fallback',
          intent: { category: 'unknown', confidence: 0, entities: [] },
          contextRelevance: { 
            isWorkRelated: false, 
            needsContextData: false, 
            relevanceScore: 0, 
            requiredSources: [], 
            responseType: 'casual' 
          },
          subAgentsUsed: [],
          processingTime: Date.now() - startTime,
          confidence: 0.1
        }
      }
    }
  }

  /**
   * 🔍 阶段1: 智能分析和决策制定
   */
  private async analyzeAndDecide(
    message: string, 
    contextId: string | undefined, 
    logs: string[]
  ): Promise<MasterAgentDecision> {
    
    // 使用工作流引擎进行深度分析
    const workflowResult = await this.workflowEngine.executeWorkflow(message, contextId)
    logs.push(`Workflow analysis completed: ${workflowResult.intent.category}`)

    const intent = workflowResult.intent
    const contextRelevance = workflowResult.contextStrategy

    // 基于分析结果制定执行策略
    let strategy: MasterAgentDecision['strategy']
    let assignedSubAgents: string[] = []

    if (intent.category === 'greeting' || intent.category === 'casual') {
      strategy = 'direct_response'
      assignedSubAgents = []
    } else if (intent.category === 'work_query') {
      strategy = 'single_subagent'
      assignedSubAgents = this.selectSubAgentsForSources(contextRelevance.requiredSources)
    } else if (intent.category === 'complex_analysis') {
      if (contextRelevance.requiredSources.length > 1) {
        strategy = 'multi_subagent'
      } else {
        strategy = 'single_subagent'
      }
      assignedSubAgents = this.selectSubAgentsForSources(contextRelevance.requiredSources)
    } else {
      strategy = 'complex_workflow'
      assignedSubAgents = ['slack'] // 默认使用Slack SubAgent
    }

    return {
      strategy,
      assignedSubAgents,
      contextSources: contextRelevance.requiredSources,
      processingPlan: this.createProcessingPlan(strategy, assignedSubAgents),
      estimatedTime: this.estimateProcessingTime(strategy, assignedSubAgents.length)
    }
  }

  /**
   * ⚡ 阶段2: 执行决策计划
   */
  private async executeDecision(
    decision: MasterAgentDecision,
    message: string,
    contextId: string | undefined,
    logs: string[]
  ) {
    const subAgentResults: Record<string, any> = {}
    
    switch (decision.strategy) {
      case 'direct_response':
        return this.handleDirectResponse(message, logs)
      
      case 'single_subagent':
        return this.handleSingleSubAgent(decision, message, contextId, logs, subAgentResults)
      
      case 'multi_subagent':
        return this.handleMultiSubAgent(decision, message, contextId, logs, subAgentResults)
      
      case 'complex_workflow':
        return this.handleComplexWorkflow(decision, message, contextId, logs, subAgentResults)
      
      default:
        throw new Error(`Unknown strategy: ${decision.strategy}`)
    }
  }

  /**
   * 处理直接响应（问候、日常对话）
   */
  private async handleDirectResponse(message: string, logs: string[]) {
    logs.push('Executing direct response strategy')
    
    const intent = await this.contextManager.analyzeUserIntent(message)
    const contextRelevance = await this.contextManager.calculateContextRelevance(message)
    
    let response = ''
    if (intent.category === 'greeting') {
      response = '你好！我是AI Brain智能助手。很高兴为你服务！有什么可以帮助你的吗？'
    } else if (intent.category === 'casual') {
      response = '我是专门的工作助手，主要帮助处理工作相关的任务。有什么工作上的问题需要帮助吗？'
    }
    
    return {
      response,
      intent,
      contextRelevance,
      confidence: intent.confidence,
      subAgentResults: {}
    }
  }

  /**
   * 处理单SubAgent策略
   */
  private async handleSingleSubAgent(
    decision: MasterAgentDecision,
    message: string,
    contextId: string | undefined,
    logs: string[],
    subAgentResults: Record<string, any>
  ) {
    logs.push(`Executing single SubAgent strategy: ${decision.assignedSubAgents[0]}`)
    
    const subAgentName = decision.assignedSubAgents[0]
    const subAgent = this.getOrCreateSubAgent(subAgentName, contextId)
    
    // 根据SubAgent类型选择调用方法
    let subAgentResult
    if (subAgentName === 'slack') {
      subAgentResult = await this.executeSlackSubAgent(subAgent, message, logs)
    } else {
      throw new Error(`SubAgent ${subAgentName} not implemented yet`)
    }
    
    subAgentResults[subAgentName] = subAgentResult
    
    const intent = await this.contextManager.analyzeUserIntent(message)
    const contextRelevance = await this.contextManager.calculateContextRelevance(message)
    
    return {
      response: this.formatSubAgentResponse(subAgentResult, intent.category),
      intent,
      contextRelevance,
      confidence: subAgentResult.confidence || 0.8,
      subAgentResults
    }
  }

  /**
   * 处理多SubAgent策略
   */
  private async handleMultiSubAgent(
    decision: MasterAgentDecision,
    message: string,
    contextId: string | undefined,
    logs: string[],
    subAgentResults: Record<string, any>
  ) {
    logs.push(`Executing multi SubAgent strategy: ${decision.assignedSubAgents.join(', ')}`)
    
    // 并行执行多个SubAgent
    const subAgentPromises = decision.assignedSubAgents.map(async (subAgentName) => {
      const subAgent = this.getOrCreateSubAgent(subAgentName, contextId)
      
      if (subAgentName === 'slack') {
        return this.executeSlackSubAgent(subAgent, message, logs)
      } else {
        logs.push(`⚠️ SubAgent ${subAgentName} not implemented, skipping`)
        return { success: false, data: null, error: `${subAgentName} not implemented` }
      }
    })
    
    const results = await Promise.all(subAgentPromises)
    
    // 聚合结果
    decision.assignedSubAgents.forEach((name, index) => {
      subAgentResults[name] = results[index]
    })
    
    const intent = await this.contextManager.analyzeUserIntent(message)
    const contextRelevance = await this.contextManager.calculateContextRelevance(message)
    
    return {
      response: this.aggregateMultiSubAgentResults(subAgentResults, intent.category),
      intent,
      contextRelevance,
      confidence: 0.9,
      subAgentResults
    }
  }

  /**
   * 处理复杂工作流策略
   */
  private async handleComplexWorkflow(
    decision: MasterAgentDecision,
    message: string,
    contextId: string | undefined,
    logs: string[],
    subAgentResults: Record<string, any>
  ) {
    logs.push('Executing complex workflow strategy')
    
    // 复杂工作流暂时回退到单SubAgent处理
    return this.handleSingleSubAgent(
      { ...decision, strategy: 'single_subagent', assignedSubAgents: ['slack'] },
      message,
      contextId,
      logs,
      subAgentResults
    )
  }

  /**
   * 执行Slack SubAgent
   */
  private async executeSlackSubAgent(subAgent: SlackSubAgentSimple, message: string, logs: string[]) {
    logs.push('Executing Slack SubAgent')
    
    // 根据消息内容决定调用哪个SubAgent方法
    if (message.includes('分析') || message.includes('analysis')) {
      return await subAgent.performDeepAnalysis({ days: 7, includeSentiment: true, includeTasks: true })
    } else if (message.includes('搜索') || message.includes('search')) {
      return await subAgent.searchMessages(message, 10)
    } else {
      return await subAgent.getRecentMessages(7, 20)
    }
  }

  // =============================================================================
  // 辅助方法
  // =============================================================================

  private selectSubAgentsForSources(sources: string[]): string[] {
    const agentMap: Record<string, string> = {
      'slack': 'slack',
      // gmail, jira, github 未实现，暂时都使用 slack SubAgent
      'gmail': 'slack',
      'jira': 'slack',
      'github': 'slack'
    }
    
    return sources.map(source => agentMap[source]).filter(Boolean)
  }

  private getOrCreateSubAgent(subAgentName: string, contextId?: string): any {
    const key = `${subAgentName}_${contextId || 'default'}`
    
    if (!this.subAgents.has(key)) {
      switch (subAgentName) {
        case 'slack':
          this.subAgents.set(key, new SlackSubAgentSimple(contextId || 'default'))
          break
        default:
          throw new Error(`Unknown SubAgent: ${subAgentName}`)
      }
    }
    
    return this.subAgents.get(key)
  }

  private createProcessingPlan(strategy: string, subAgents: string[]): string {
    switch (strategy) {
      case 'direct_response':
        return 'Generate direct response without SubAgent involvement'
      case 'single_subagent':
        return `Execute ${subAgents[0]} SubAgent for specialized processing`
      case 'multi_subagent':
        return `Coordinate ${subAgents.length} SubAgents: ${subAgents.join(', ')}`
      case 'complex_workflow':
        return 'Execute complex multi-step workflow with human-in-the-loop'
      default:
        return 'Unknown processing plan'
    }
  }

  private estimateProcessingTime(strategy: string, subAgentCount: number): number {
    const baseTime = 500 // ms
    const perSubAgentTime = 1000 // ms
    
    switch (strategy) {
      case 'direct_response': return baseTime
      case 'single_subagent': return baseTime + perSubAgentTime
      case 'multi_subagent': return baseTime + (perSubAgentTime * subAgentCount)
      case 'complex_workflow': return baseTime + (perSubAgentTime * 2)
      default: return baseTime
    }
  }

  private formatSubAgentResponse(subAgentResult: any, intentCategory: string): string {
    if (!subAgentResult.success) {
      return '抱歉，我暂时无法获取相关信息。请稍后再试。'
    }
    
    // 根据SubAgent结果和意图类型格式化响应
    if (subAgentResult.data?.analysis) {
      return this.formatAnalysisResponse(subAgentResult.data.analysis)
    } else if (subAgentResult.data?.messages) {
      return this.formatMessagesResponse(subAgentResult.data.messages)
    } else {
      return '我已经处理了你的请求，但没有找到相关信息。'
    }
  }

  private formatAnalysisResponse(analysis: any): string {
    const parts = []
    
    if (analysis.sentiment) {
      parts.push(`**团队情感状态**: ${analysis.sentiment.classification} (评分: ${analysis.sentiment.score})`)
    }
    
    if (analysis.tasks && analysis.tasks.length > 0) {
      parts.push(`**识别到的任务**: ${analysis.tasks.length}个，其中${analysis.tasks.filter((t: any) => t.priority === 'urgent').length}个紧急`)
    }
    
    if (analysis.summary) {
      parts.push(`**分析摘要**: ${analysis.summary}`)
    }
    
    return parts.length > 0 ? parts.join('\n\n') : '分析完成，一切看起来正常。'
  }

  private formatMessagesResponse(messages: any[]): string {
    if (!messages || messages.length === 0) {
      return '最近没有新的团队消息。'
    }
    
    const recent = messages.slice(0, 3)
    const formatted = recent.map(msg => 
      `• **${msg.user}** 在 #${msg.channel}: ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}`
    ).join('\n')
    
    return `**最近的团队消息**:\n${formatted}\n\n共找到 ${messages.length} 条相关消息。`
  }

  private aggregateMultiSubAgentResults(subAgentResults: Record<string, any>, intentCategory: string): string {
    const parts = []
    
    Object.entries(subAgentResults).forEach(([subAgent, result]) => {
      if (result.success) {
        parts.push(`**${subAgent.toUpperCase()}数据**: ${this.formatSubAgentResponse(result, intentCategory)}`)
      }
    })
    
    return parts.length > 0 ? parts.join('\n\n---\n\n') : '抱歉，无法获取相关数据。'
  }

  private explainDecision(decision: MasterAgentDecision, intent: UserIntent): string {
    return `Based on intent '${intent.category}' with confidence ${intent.confidence}, decided to use '${decision.strategy}' strategy with ${decision.assignedSubAgents.length} SubAgent(s): ${decision.assignedSubAgents.join(', ')}`
  }

  private generateFallbackResponse(message: string): string {
    return `抱歉，我在处理您的请求时遇到了问题。作为AI Brain智能助手，我可以帮助您：

• 📧 查看和分析邮件
• 💬 理解团队对话
• 📋 跟踪任务进度
• 📊 提供工作分析

请尝试重新描述您的需求，我会尽力帮助您。`
  }

  private log(message: string): void {
    if (this.debugMode) {
      console.log(`[MasterAgent V2] ${message}`)
    }
  }
}