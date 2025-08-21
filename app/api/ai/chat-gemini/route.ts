import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loadSlackMessages } from '@/lib/slack/database-storage'

// Gemini API配置
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

// 请求验证
const requestSchema = z.object({
  message: z.string().min(1),
  contextId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, contextId } = requestSchema.parse(body)

    // 获取Slack消息上下文
    let slackContext = ''
    if (contextId) {
      try {
        console.log(`🔍 Loading Slack context for contextId: ${contextId}`)
        const { messages } = await loadSlackMessages(contextId, { limit: 10 })
        
        if (messages.length > 0) {
          slackContext = messages
            .map(msg => {
              const time = new Date(msg.timestamp).toLocaleString('zh-CN')
              return `[${time}] ${msg.user.name} 在 #${msg.channel.name}: ${msg.text}`
            })
            .join('\n')
          
          console.log(`📋 Found ${messages.length} Slack messages for context`)
        } else {
          console.log('📝 No Slack messages found for this context')
        }
      } catch (contextError) {
        console.warn('⚠️ Failed to load Slack context:', contextError)
        // 继续处理，不因为上下文获取失败而中断
      }
    }

    // 构建增强的提示
    const enhancedMessage = buildEnhancedPrompt(message, slackContext)

    // 如果有Gemini API密钥，使用Gemini
    if (GEMINI_API_KEY) {
      const response = await callGeminiAPI(enhancedMessage)
      return NextResponse.json({
        success: true,
        response: response,
        model: 'gemini-pro',
        timestamp: new Date().toISOString(),
        hasSlackContext: !!slackContext,
        contextMessageCount: slackContext ? slackContext.split('\n').length : 0
      })
    }

    // 否则使用智能模拟回复
    const mockResponse = generateSmartMockResponse(enhancedMessage)
    return NextResponse.json({
      success: true,
      response: mockResponse,
      model: 'mock',
      timestamp: new Date().toISOString(),
      hasSlackContext: !!slackContext,
      contextMessageCount: slackContext ? slackContext.split('\n').length : 0
    })

  } catch (error) {
    console.error('Gemini Chat API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Chat service unavailable' },
      { status: 500 }
    )
  }
}

// 调用Gemini API
async function callGeminiAPI(message: string): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `你是AI Brain智能助手。请以专业、友好的方式回复用户的问题。

用户问题：${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    // 提取Gemini的回复
    const geminiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!geminiResponse) {
      throw new Error('Invalid Gemini response format')
    }

    return geminiResponse
  } catch (error) {
    console.error('Failed to call Gemini API:', error)
    throw error
  }
}

// 智能模拟回复（备用方案）
function generateSmartMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('你好') || lowerMessage.includes('hello')) {
    return '你好！我是AI Brain智能助手。很高兴为您服务！请问有什么可以帮助您的吗？'
  }
  
  if (lowerMessage.includes('任务') || lowerMessage.includes('task')) {
    return `我可以帮您管理任务：
• 创建新任务
• 查看任务列表
• 更新任务状态
• 分配任务给团队成员

请告诉我您具体需要什么帮助？`
  }
  
  if (lowerMessage.includes('数据') || lowerMessage.includes('分析')) {
    return `我可以为您提供数据分析服务：
• 团队绩效分析
• 项目进度报告
• 工作效率统计
• 趋势预测

您想要分析哪方面的数据？`
  }
  
  return `我理解您的需求：${message}

作为AI Brain智能助手，我可以帮助您：
• 📋 任务和项目管理
• 📊 数据分析和报告
• 👥 团队协作
• 🔍 智能搜索

请告诉我您需要哪方面的帮助？`
}

// =============================================================================
// 多源上下文系统 - 支持未来扩展多种消息源
// =============================================================================

/**
 * 上下文源接口 - 统一不同消息源的数据格式
 */
interface ContextSource {
  source: 'slack' | 'jira' | 'github' | 'email' | 'notion'
  messages: ContextMessage[]
  metadata?: Record<string, any>
}

interface ContextMessage {
  id: string
  author: string
  content: string
  timestamp: Date
  source: string
  channel?: string
  metadata?: Record<string, any>
}

/**
 * 多源上下文获取器 - 未来支持多种消息源
 */
async function getMultiSourceContext(contextId: string): Promise<ContextSource[]> {
  const sources: ContextSource[] = []
  
  try {
    // Slack消息源
    const slackMessages = await getSlackContext(contextId)
    if (slackMessages.messages.length > 0) {
      sources.push(slackMessages)
    }
    
    // TODO: 未来添加更多消息源
    // const jiraContext = await getJiraContext(contextId)
    // const githubContext = await getGithubContext(contextId)
    // const emailContext = await getEmailContext(contextId)
    // const notionContext = await getNotionContext(contextId)
    
    console.log(`📊 Loaded context from ${sources.length} sources`)
    return sources
    
  } catch (error) {
    console.warn('⚠️ Error loading multi-source context:', error)
    return []
  }
}

/**
 * Slack上下文获取器
 */
async function getSlackContext(contextId: string): Promise<ContextSource> {
  const { messages } = await loadSlackMessages(contextId, { limit: 10 })
  
  return {
    source: 'slack',
    messages: messages.map(msg => ({
      id: msg.id,
      author: msg.user.name,
      content: msg.text,
      timestamp: msg.timestamp,
      source: 'slack',
      channel: msg.channel.name,
      metadata: { 
        channelId: msg.channel.id,
        userId: msg.user.id,
        threadTs: msg.thread_ts
      }
    })),
    metadata: {
      totalMessages: messages.length
    }
  }
}

/**
 * 构建包含多源上下文的增强提示
 */
function buildEnhancedPrompt(userMessage: string, slackContext: string): string {
  if (!slackContext) {
    // 没有上下文时的基础提示
    return `你是一个智能工作助手，帮助用户处理工作相关的问题和任务。

用户问题: ${userMessage}

请提供有用和准确的回答。`
  }

  // 有上下文时的增强提示
  return `你是一个智能工作助手，具备以下能力：
1. 分析团队的协作对话（Slack、Jira、GitHub等）
2. 理解项目进展和团队动态  
3. 基于实际工作内容提供insights
4. 帮助用户了解工作状态和协作情况

以下是最近的团队对话记录：
---
${slackContext}
---

用户问题: ${userMessage}

请基于以上团队对话内容和用户问题，提供有价值的回答和分析。如果用户问题与对话内容相关，请引用具体的消息内容。`
}