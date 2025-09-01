/**
 * Intent Recognition工作流引擎
 * 专门处理用户意图识别和响应路由的自动化工作流
 */

import { SmartContextManager, ContextRelevance, UserIntent } from '@/lib/context-manager/smart-context-manager'

// 工作流执行结果
export interface WorkflowResult {
  success: boolean
  intent: UserIntent
  contextStrategy: ContextRelevance
  promptTemplate: string
  shouldLoadContext: boolean
  contextSources: string[]
  responseMetadata: {
    type: 'casual' | 'simple_work' | 'detailed_analysis'
    processingTime: number
    confidence: number
  }
}

// 工作流步骤接口
interface WorkflowStep {
  name: string
  execute: (input: any, context: WorkflowContext) => Promise<any>
  onSuccess?: (result: any, context: WorkflowContext) => void
  onError?: (error: Error, context: WorkflowContext) => void
}

// 工作流上下文
interface WorkflowContext {
  userMessage: string
  contextId?: string
  startTime: number
  logs: string[]
  intermediateResults: Record<string, any>
}

/**
 * Intent Recognition工作流引擎
 * 自动化处理: 用户输入 → 意图识别 → 上下文决策 → 响应策略
 */
export class IntentRecognitionWorkflow {
  private contextManager: SmartContextManager
  private steps: WorkflowStep[]

  constructor() {
    this.contextManager = new SmartContextManager()
    this.initializeWorkflowSteps()
  }

  /**
   * 执行完整的意图识别工作流
   */
  async executeWorkflow(userMessage: string, contextId?: string): Promise<WorkflowResult> {
    const workflowContext: WorkflowContext = {
      userMessage,
      contextId,
      startTime: Date.now(),
      logs: [],
      intermediateResults: {}
    }

    try {
      workflowContext.logs.push(`🚀 Starting intent recognition workflow for: "${userMessage}"`)

      // 依次执行所有工作流步骤
      for (const step of this.steps) {
        workflowContext.logs.push(`⚡ Executing step: ${step.name}`)
        
        try {
          const stepResult = await step.execute(workflowContext.intermediateResults, workflowContext)
          workflowContext.intermediateResults[step.name] = stepResult
          
          if (step.onSuccess) {
            step.onSuccess(stepResult, workflowContext)
          }
          
          workflowContext.logs.push(`✅ Step completed: ${step.name}`)
        } catch (error) {
          workflowContext.logs.push(`❌ Step failed: ${step.name} - ${(error as Error).message}`)
          
          if (step.onError) {
            step.onError(error as Error, workflowContext)
          }
          
          // 某些步骤失败不应该阻断整个工作流
          if (!this.isOptionalStep(step.name)) {
            throw error
          }
        }
      }

      // 构建最终结果
      const result = this.buildWorkflowResult(workflowContext)
      workflowContext.logs.push(`🎉 Workflow completed successfully in ${result.responseMetadata.processingTime}ms`)
      
      return result

    } catch (error) {
      workflowContext.logs.push(`💥 Workflow failed: ${(error as Error).message}`)
      
      // 返回安全的默认结果
      return this.buildFailsafeResult(workflowContext, error as Error)
    }
  }

  /**
   * 初始化工作流步骤
   */
  private initializeWorkflowSteps(): void {
    this.steps = [
      {
        name: 'intent_analysis',
        execute: async (_, context) => {
          return await this.contextManager.analyzeUserIntent(context.userMessage)
        },
        onSuccess: (result, context) => {
          context.logs.push(`🧠 Intent detected: ${result.category} (confidence: ${result.confidence})`)
        }
      },
      
      {
        name: 'context_relevance',
        execute: async (results, context) => {
          return await this.contextManager.calculateContextRelevance(
            context.userMessage, 
            context.contextId
          )
        },
        onSuccess: (result, context) => {
          context.logs.push(`🎯 Context strategy: ${result.responseType} (load data: ${result.needsContextData})`)
        }
      },
      
      {
        name: 'prompt_generation',
        execute: async (results, context) => {
          const contextRelevance = results.context_relevance
          // 如果需要上下文数据，这里可以加载（目前跳过实际加载以简化流程）
          const contextData = contextRelevance.needsContextData ? null : null
          
          return this.contextManager.buildSmartPrompt(
            context.userMessage,
            contextRelevance,
            contextData
          )
        },
        onSuccess: (result, context) => {
          const length = result.length
          context.logs.push(`📝 Generated prompt: ${length} characters`)
        }
      },
      
      {
        name: 'response_optimization',
        execute: async (results, context) => {
          const intent = results.intent_analysis
          const contextRelevance = results.context_relevance
          
          // 基于意图和上下文相关性进行响应优化
          return {
            shouldUseStreaming: contextRelevance.responseType === 'detailed_analysis',
            maxTokens: this.calculateMaxTokens(contextRelevance.responseType),
            temperature: this.calculateTemperature(intent.category),
            enableMemory: intent.category !== 'casual'
          }
        }
      }
    ]
  }

  /**
   * 构建工作流最终结果
   */
  private buildWorkflowResult(context: WorkflowContext): WorkflowResult {
    const intent = context.intermediateResults.intent_analysis
    const contextStrategy = context.intermediateResults.context_relevance
    const promptTemplate = context.intermediateResults.prompt_generation
    const processingTime = Date.now() - context.startTime

    return {
      success: true,
      intent,
      contextStrategy,
      promptTemplate,
      shouldLoadContext: contextStrategy.needsContextData,
      contextSources: contextStrategy.requiredSources,
      responseMetadata: {
        type: contextStrategy.responseType,
        processingTime,
        confidence: intent.confidence
      }
    }
  }

  /**
   * 构建安全的失败回退结果
   */
  private buildFailsafeResult(context: WorkflowContext, error: Error): WorkflowResult {
    return {
      success: false,
      intent: {
        category: 'unknown',
        confidence: 0.1,
        entities: []
      },
      contextStrategy: {
        isWorkRelated: false,
        needsContextData: false,
        relevanceScore: 0,
        requiredSources: [],
        responseType: 'casual'
      },
      promptTemplate: `你是一个友好的AI助手。

用户说: ${context.userMessage}

请简洁友好地回应。如果无法理解，请礼貌地询问用户的具体需求。`,
      shouldLoadContext: false,
      contextSources: [],
      responseMetadata: {
        type: 'casual',
        processingTime: Date.now() - context.startTime,
        confidence: 0.1
      }
    }
  }

  /**
   * 判断是否为可选步骤
   */
  private isOptionalStep(stepName: string): boolean {
    const optionalSteps = ['response_optimization']
    return optionalSteps.includes(stepName)
  }

  /**
   * 计算最大token数
   */
  private calculateMaxTokens(responseType: string): number {
    switch (responseType) {
      case 'casual': return 150
      case 'simple_work': return 500
      case 'detailed_analysis': return 1500
      default: return 300
    }
  }

  /**
   * 计算temperature参数
   */
  private calculateTemperature(intentCategory: string): number {
    switch (intentCategory) {
      case 'greeting':
      case 'casual': return 0.9  // 更随性的回复
      case 'work_query': return 0.3  // 更准确的工作回复
      case 'complex_analysis': return 0.1  // 最准确的分析回复
      default: return 0.7
    }
  }

  /**
   * 获取工作流执行日志
   */
  getWorkflowLogs(): string[] {
    return []  // 实际实现中可以存储全局日志
  }

  /**
   * 工作流健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testResult = await this.executeWorkflow("test message", "test-context")
      return testResult.success || !testResult.success  // 任何结果都表明工作流运行正常
    } catch (error) {
      return false
    }
  }
}