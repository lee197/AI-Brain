import { NextRequest } from 'next/server'
import { streamText, convertToCoreMessages } from 'ai'
import { z } from 'zod'
import type { Message } from 'ai'
import { AI_MODELS, getDefaultModel, AIModelType } from '@/lib/ai/models'
import { MasterAgentV2 } from '@/lib/agents/master-agent-v2'
import { createClient } from '@/lib/supabase/server'
import { buildEnhancedContext, convertContextToMessages, getContextStats } from '@/lib/ai/context-builder'

// 请求验证 - 支持两种格式：传统单消息和新的消息数组
const requestSchema = z.object({
  // 新格式：消息数组（符合 Vercel AI SDK 标准）
  messages: z.array(z.object({
    id: z.string().optional(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().optional().default(''),
    parts: z.array(z.object({
      type: z.string().optional(),
      text: z.string().optional(),
    })).optional(),
  })).optional(),
  
  // 传统格式：单消息（向后兼容）
  message: z.string().optional(),
  
  // 通用参数
  contextId: z.string().optional(),
  conversationId: z.string().optional(), // 保持向后兼容
  model: z.string().optional(),
  aiModel: z.enum(['openai', 'anthropic', 'gemini']).optional(), // 向后兼容
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(8192).optional(),
}).refine(data => data.messages || data.message, {
  message: "Either 'messages' or 'message' is required"
})

export async function POST(req: NextRequest) {
  try {
    // 1. 认证检查
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      console.error('Auth check error:', error?.message || 'No user found')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please login first' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. 验证和解析请求
    const body = await req.json()
    const { 
      messages, 
      message, 
      contextId, 
      model, 
      aiModel, 
      temperature = 0.7, 
      maxTokens = 1024 
    } = requestSchema.parse(body)

    // 3. 统一消息格式处理
    let processedMessages: Message[]
    let userMessage: string

    if (messages) {
      // 新格式：使用消息数组，处理content或parts格式
      processedMessages = messages
        .map(msg => {
          // 提取内容：优先使用content，否则从parts中提取
          let content = msg.content || ''
          if (!content && msg.parts && msg.parts.length > 0) {
            content = msg.parts
              .filter(part => part.type === 'text' && part.text)
              .map(part => part.text)
              .join('')
          }
          return {
            ...msg,
            id: msg.id || `msg-${Date.now()}`,
            content,
          }
        })
        .filter(msg => msg.content && msg.content.trim()) // 过滤空消息
      
      userMessage = processedMessages
        .filter(m => m.role === 'user')
        .pop()?.content || ''
    } else {
      // 传统格式：转换单消息为数组
      processedMessages = [
        { id: 'user-msg', role: 'user', content: message! }
      ]
      userMessage = message!
    }
    
    // 检查是否有有效的用户消息
    if (!userMessage || !userMessage.trim()) {
      return new Response(
        JSON.stringify({ error: 'No valid user message found' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    console.log(`🧠 AI Chat (SDK) processing: "${userMessage}" for context: ${contextId}`)

    // 4. 构建增强上下文（MCP + Slack集成）
    console.log(`🔍 Building enhanced context for message: "${userMessage}"`)
    const contextData = await buildEnhancedContext(userMessage, contextId)
    const contextStats = getContextStats(contextData)

    // 5. Master Agent 处理（如果需要）
    let agentResult: any = null
    if (contextId) {
      try {
        const masterAgent = new MasterAgentV2(true)
        agentResult = await masterAgent.processUserRequest(userMessage, contextId)
      } catch (error) {
        console.warn('⚠️ Master Agent processing failed:', error)
        // 继续处理，但不使用 Master Agent 结果
      }
    }

    // 6. 构建增强的消息列表
    let enhancedMessages: Message[]

    if (contextStats.hasContext) {
      // 使用 MCP 上下文构建消息
      enhancedMessages = convertContextToMessages(contextData, userMessage)
      console.log(`✅ Using enhanced context: ${contextStats.slackMessagesCount} Slack messages, ${contextStats.emailsCount} emails, ${contextStats.calendarEventsCount} events`)
    } else if (agentResult?.success && agentResult?.metadata?.strategy !== 'direct_response') {
      // 降级到 Master Agent 上下文
      enhancedMessages = [
        {
          id: 'system-agent-context',
          role: 'system',
          content: `你是AI Brain智能助手。以下是Master Agent提供的上下文信息：

🎯 **用户意图**: ${agentResult?.metadata?.intent?.category || '未知'}
📊 **置信度**: ${agentResult?.metadata?.confidence || 0}
🔧 **子代理**: ${agentResult?.metadata?.subAgentsUsed?.join(', ') || '无'}

请基于这些信息，用专业、友好的方式回复用户的问题。`,
        },
        ...processedMessages
      ]
    } else {
      // 基本系统提示
      enhancedMessages = [
        {
          id: 'system-base',
          role: 'system',
          content: `你是AI Brain，一个智能的企业工作助手。你可以：

1. **数据源管理**: 查询和分析Slack、Jira、GitHub、Google Workspace等工具的数据
2. **任务管理**: 创建、分配和跟踪任务
3. **团队协作**: 安排会议、生成报告、分析工作进展
4. **智能洞察**: 提供基于数据的建议和预测

请用简洁、专业且有用的方式回应用户。`,
        },
        ...processedMessages
      ]
    }

    // 6. 模型选择（优先 SDK 格式，向后兼容传统格式）
    let selectedModel: AIModelType = getDefaultModel()
    
    if (model && model in AI_MODELS) {
      selectedModel = model as AIModelType
    } else if (aiModel) {
      // 向后兼容：映射传统模型名称
      const modelMapping: Record<string, AIModelType> = {
        'openai': 'gpt-3.5-turbo',
        'anthropic': 'claude-3-haiku',
        'gemini': 'gemini-flash'
      }
      selectedModel = modelMapping[aiModel] || getDefaultModel()
    }

    const aiModelInstance = AI_MODELS[selectedModel]

    if (!aiModelInstance) {
      throw new Error(`Model ${selectedModel} not available`)
    }

    // 7. 高置信度直接响应优化 - 使用流式响应保持与 Vercel AI SDK 兼容
    if (agentResult?.success && 
        agentResult.metadata.strategy === 'direct_response' && 
        agentResult.metadata.confidence > 0.8) {
      
      // 使用 streamText 来返回直接响应，保持流式格式兼容性
      const result = await streamText({
        model: aiModelInstance,
        messages: [
          {
            role: 'system',
            content: '你是AI Brain智能助手。直接返回准备好的响应，无需额外处理。'
          },
          {
            role: 'user',
            content: '请返回以下回复：' + agentResult.response
          }
        ],
        temperature: 0,
        maxTokens: 2000,
      })

      return result.toTextStreamResponse()
    }

    // 8. AI SDK 流式生成
    // 安全检查：确保 enhancedMessages 存在
    if (!enhancedMessages || !Array.isArray(enhancedMessages)) {
      enhancedMessages = [
        {
          id: 'system-fallback',
          role: 'system',
          content: '你是AI Brain智能助手，请用简洁、专业且有用的方式回应用户。'
        },
        ...processedMessages
      ]
    }


    const result = await streamText({
      model: aiModelInstance,
      messages: enhancedMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      })),
      temperature,
      maxTokens,
      system: agentResult?.success ? 
        `上下文增强信息：
- 用户意图类型：${agentResult?.metadata?.intent?.category || '未知'}
- 使用的子代理：${agentResult?.metadata?.subAgentsUsed?.join(', ') || '无'}
- 处理策略：${agentResult?.metadata?.strategy || '未知'}
- 处理时间：${agentResult?.metadata?.processingTime || 0}ms

请充分利用这些信息提供精确、有用的回复。` : undefined,
    })

    // 9. 返回文本流响应
    return result.toTextStreamResponse()

  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format', details: error.errors }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    console.error('AI Chat (SDK) Error:', error)
    
    // 降级到传统响应格式（向后兼容）
    return new Response(
      JSON.stringify({ 
        response: 'AI服务暂时不可用，请稍后再试。',
        error: 'AI service temporarily unavailable',
        model: 'fallback',
        timestamp: new Date().toISOString(),
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// GET 请求：获取可用模型（新增功能）
export async function GET() {
  try {
    const { getAvailableModels, MODEL_METADATA } = await import('@/lib/ai/models')
    
    const available = getAvailableModels()
    const availableModels = Object.entries(available)
      .filter(([_, isAvailable]) => isAvailable)
      .map(([model]) => ({
        id: model,
        ...MODEL_METADATA[model as AIModelType],
      }))

    return new Response(JSON.stringify({
      success: true,
      models: availableModels,
      default: getDefaultModel(),
      capabilities: {
        streaming: true,
        masterAgent: true,
        contextIntegration: true,
        mcpSupport: true,
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to get available models' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}