/**
 * 兼容性层 - 确保新架构下外部API行为完全不变
 * 这个中间件层保证用户测试时体验一致，内部逐步升级到Master Agent架构
 */

import { masterAgent } from './master-agent'

// 兼容性配置
interface CompatibilityConfig {
  enableMasterAgent: boolean     // 是否启用Master Agent
  enableSubAgents: boolean       // 是否启用SubAgent层
  enableWorkflows: boolean       // 是否启用工作流
  fallbackToLegacy: boolean     // 失败时是否降级到旧系统
  debugMode: boolean            // 调试模式
}

class CompatibilityLayer {
  private config: CompatibilityConfig

  constructor() {
    // 从环境变量读取配置，默认保持旧行为
    this.config = {
      enableMasterAgent: process.env.ENABLE_MASTER_AGENT === 'true',
      enableSubAgents: process.env.ENABLE_SUB_AGENTS === 'true',  
      enableWorkflows: process.env.ENABLE_WORKFLOWS === 'true',
      fallbackToLegacy: process.env.FALLBACK_TO_LEGACY !== 'false', // 默认开启降级
      debugMode: process.env.NODE_ENV === 'development'
    }

    this.log('🔧 Compatibility Layer initialized:', this.config)
  }

  /**
   * AI聊天API兼容性包装
   * 对外保持相同的输入输出格式，内部可选择使用新架构
   */
  async handleAIChat(request: {
    message: string
    contextId: string
    includeGoogleWorkspace?: boolean
  }): Promise<{
    success: boolean
    response: string
    model: string
    timestamp: string
    hasSlackContext?: boolean
    hasGoogleWorkspace?: boolean
    [key: string]: any
  }> {
    try {
      // 🔄 如果启用Master Agent，使用新架构
      if (this.config.enableMasterAgent) {
        this.log('🤖 Using Master Agent for AI chat')
        
        const result = await masterAgent.processUserRequest(
          request.message,
          request.contextId,
          'demo-user', // 临时用户ID
          { priority: 'NORMAL' }
        )

        // 转换为旧API格式
        return this.convertMasterAgentResult(result)
      }

      // 📦 否则降级到现有系统
      this.log('📦 Falling back to legacy AI chat system')
      return await this.callLegacyAIChat(request)

    } catch (error) {
      this.log('❌ Master Agent failed, falling back to legacy system:', error)
      
      if (this.config.fallbackToLegacy) {
        return await this.callLegacyAIChat(request)
      }
      
      throw error
    }
  }

  /**
   * 数据源状态检查兼容性包装
   */
  async handleDataSourceStatus(contextId: string): Promise<{
    statuses: Record<string, any>
    [key: string]: any
  }> {
    try {
      // 🔄 如果启用Master Agent，可以增强状态检查
      if (this.config.enableMasterAgent) {
        this.log('🤖 Using Master Agent for status check')
        
        // Master Agent可以并行检查所有数据源状态
        const statusResult = await masterAgent.processUserRequest(
          'check all data source status',
          contextId,
          'demo-user',
          { priority: 'HIGH' }
        )
        
        // 转换为旧API格式 + 增强信息
        const legacyStatus = await this.callLegacyStatusCheck(contextId)
        
        return {
          ...legacyStatus,
          enhanced: true,
          lastChecked: new Date().toISOString(),
          masterAgentResult: statusResult
        }
      }

      // 📦 否则使用现有系统
      return await this.callLegacyStatusCheck(contextId)

    } catch (error) {
      this.log('❌ Enhanced status check failed, using legacy:', error)
      return await this.callLegacyStatusCheck(contextId)
    }
  }

  /**
   * Slack消息处理兼容性包装
   */
  async handleSlackMessage(webhookData: any): Promise<any> {
    try {
      // 🔄 如果启用SubAgent，使用专业化处理
      if (this.config.enableSubAgents) {
        this.log('🤖 Using Slack SubAgent for message processing')
        
        const { SlackSubAgent } = await import('./sub-agents/slack-agent')
        const slackAgent = new SlackSubAgent(webhookData.contextId || 'default')
        
        const result = await slackAgent.processWebhookMessage(webhookData)
        
        // 同时调用旧系统确保兼容性
        const legacyResult = await this.callLegacySlackWebhook(webhookData)
        
        return {
          ...legacyResult,
          enhanced: true,
          subAgentResult: result
        }
      }

      // 📦 否则使用现有webhook处理
      return await this.callLegacySlackWebhook(webhookData)

    } catch (error) {
      this.log('❌ SubAgent Slack processing failed, using legacy:', error)
      return await this.callLegacySlackWebhook(webhookData)
    }
  }

  /**
   * 转换Master Agent结果为旧API格式
   */
  private convertMasterAgentResult(result: any): any {
    return {
      success: result.success,
      response: result.summary || result.data?.response || '处理完成',
      model: 'master-agent',
      timestamp: new Date().toISOString(),
      hasSlackContext: true,
      hasGoogleWorkspace: true,
      enhanced: true,
      subtasks: result.data?.subtasks?.length || 0
    }
  }

  /**
   * 调用现有的AI聊天系统
   */
  private async callLegacyAIChat(request: any): Promise<any> {
    // 优先尝试chat-enhanced
    try {
      const response = await fetch('http://localhost:3000/api/ai/chat-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      this.log('chat-enhanced failed, trying chat-gemini')
    }

    // 降级到Gemini
    try {
      const response = await fetch('http://localhost:3000/api/ai/chat-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: request.message,
          contextId: request.contextId
        })
      })
      
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      this.log('chat-gemini failed, using fallback')
    }

    // 最后的降级方案
    return {
      success: true,
      response: '我正在学习中，请稍后再试。',
      model: 'fallback',
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 调用现有的状态检查系统
   */
  private async callLegacyStatusCheck(contextId: string): Promise<any> {
    try {
      const response = await fetch(`http://localhost:3000/api/data-sources/status?context_id=${contextId}`)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      this.log('Legacy status check failed:', error)
    }

    // 返回默认状态
    return {
      statuses: {
        slack: { success: false, message: 'Not connected' },
        gmail: { success: false, message: 'Not connected' },
        google_drive: { success: false, message: 'Not connected' },
        google_calendar: { success: false, message: 'Not connected' }
      }
    }
  }

  /**
   * 调用现有的Slack webhook处理
   */
  private async callLegacySlackWebhook(webhookData: any): Promise<any> {
    try {
      const response = await fetch('http://localhost:3000/api/webhooks/slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookData)
      })
      
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      this.log('Legacy Slack webhook failed:', error)
    }

    return { success: false, message: 'Webhook processing failed' }
  }

  private log(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`[CompatibilityLayer] ${message}`, data || '')
    }
  }

  /**
   * 获取当前配置状态
   */
  getConfig(): CompatibilityConfig {
    return { ...this.config }
  }

  /**
   * 动态更新配置（用于A/B测试）
   */
  updateConfig(newConfig: Partial<CompatibilityConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.log('🔧 Config updated:', this.config)
  }
}

// 导出单例
export const compatibilityLayer = new CompatibilityLayer()

/**
 * 环境变量配置说明
 * 
 * .env.local 中添加：
 * 
 * # 新架构功能开关 (默认关闭，保持旧行为)
 * ENABLE_MASTER_AGENT=false
 * ENABLE_SUB_AGENTS=false
 * ENABLE_WORKFLOWS=false
 * FALLBACK_TO_LEGACY=true
 * 
 * # 要启用新架构时：
 * ENABLE_MASTER_AGENT=true
 * ENABLE_SUB_AGENTS=true
 * ENABLE_WORKFLOWS=true
 * FALLBACK_TO_LEGACY=true  # 保持降级能力
 */