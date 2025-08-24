import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loadSlackMessages } from '@/lib/slack/database-storage'
import { GmailAIIndexer } from '@/lib/google-workspace/gmail-ai-indexer'
import { GmailApiClient } from '@/lib/google-workspace/gmail-client'
import fs from 'fs/promises'
import path from 'path'

// Gemini API配置
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

// 请求验证
const requestSchema = z.object({
  message: z.string().min(1),
  contextId: z.string().optional(),
})

// Gmail认证加载函数
async function loadGmailAuth(contextId: string) {
  try {
    const authFile = path.join(process.cwd(), 'data', 'gmail', `${contextId}.json`)
    const authData = JSON.parse(await fs.readFile(authFile, 'utf-8'))
    return authData
  } catch (error) {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, contextId } = requestSchema.parse(body)

    // 获取多源上下文
    let slackContext = ''
    let gmailContext = ''
    
    if (contextId) {
      // 获取Slack消息上下文
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
      }

      // 获取Gmail上下文
      try {
        console.log(`📧 Loading Gmail context for contextId: ${contextId}`)
        const gmailIndexer = new GmailAIIndexer(contextId)
        
        // 首先尝试从AI索引中搜索相关邮件
        let relevantEmails = []
        try {
          relevantEmails = await gmailIndexer.getRelevantEmailsForAI(message, 5)
        } catch (indexError) {
          console.warn('⚠️ AI indexer failed:', indexError)
          // 继续执行，不让索引错误阻止直接获取
        }
        
        // 如果AI索引中没有找到邮件，尝试实时获取最新邮件
        if (relevantEmails.length === 0) {
          console.log('📭 No indexed emails found, trying to get recent emails directly...')
          
          try {
            // 直接使用Gmail客户端获取最新邮件
            const authData = await loadGmailAuth(contextId)
            if (authData?.credentials) {
              const gmailClient = new GmailApiClient(authData.credentials)
              
              // 使用try-catch包装Gmail API调用，避免权限错误导致整个请求失败
              try {
                const recentEmails = await gmailClient.getInboxEmailsLight(10)
                
                if (recentEmails.length > 0) {
                  console.log(`📧 Got ${recentEmails.length} recent emails directly from Gmail API`)
                  
                  // 转换为AI上下文格式
                  gmailContext = recentEmails.slice(0, 5)
                    .map((email: any) => {
                      const time = new Date(email.timestamp).toLocaleString('zh-CN')
                      return `[${time}] 邮件: ${email.subject}\n发件人: ${email.sender || email.senderEmail}\n预览: ${email.snippet}\n状态: ${email.isRead ? '已读' : '未读'}`
                    })
                    .join('\n\n')
                }
              } catch (gmailApiError) {
                console.warn('⚠️ Gmail API call failed (insufficient scopes or other error):', gmailApiError)
                // 继续执行，不让Gmail错误阻止AI回答
              }
            }
          } catch (directFetchError) {
            console.warn('⚠️ Failed to fetch emails directly:', directFetchError)
          }
        } else {
          // 使用AI索引的邮件
          gmailContext = relevantEmails
            .map(email => {
              const time = new Date(email.timestamp).toLocaleString('zh-CN')
              return `[${time}] 邮件: ${email.subject}\n发件人: ${email.from}\n摘要: ${email.summary}\n重要性: ${email.importance}/10\n分类: ${email.category}`
            })
            .join('\n\n')
          
          console.log(`📧 Found ${relevantEmails.length} relevant emails from AI index`)
        }
      } catch (gmailError) {
        console.warn('⚠️ Failed to load Gmail context:', gmailError)
      }
    }

    // 构建增强的提示
    const enhancedMessage = buildEnhancedPrompt(message, slackContext, gmailContext)

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
function buildEnhancedPrompt(userMessage: string, slackContext: string, gmailContext: string = ''): string {
  if (!slackContext && !gmailContext) {
    // 没有上下文时的基础提示
    return `你是一个智能工作助手，帮助用户处理工作相关的问题和任务。

用户问题: ${userMessage}

请提供有用和准确的回答。`
  }

  // 构建多源上下文
  const contextSections = []
  
  if (slackContext) {
    contextSections.push(`## 团队对话记录 (Slack)
${slackContext}`)
  }
  
  if (gmailContext) {
    contextSections.push(`## 相关邮件记录 (Gmail)
${gmailContext}`)
  }

  // 有上下文时的增强提示
  return `你是一个智能工作助手，具备以下能力：
1. 分析团队的协作对话（Slack、Jira、GitHub等）
2. 理解邮件沟通和项目相关信息
3. 基于实际工作内容提供insights
4. 帮助用户了解工作状态和协作情况
5. 综合多个信息源提供全面的回答

以下是相关的工作上下文信息：
---
${contextSections.join('\n\n')}
---

用户问题: ${userMessage}

请基于以上工作上下文和用户问题，提供有价值的回答和分析。

**重要：请严格按照以下Markdown格式回答，确保良好的可读性：**

## 📧 邮件分析结果

### 📋 重要邮件
对于每封重要邮件，使用以下格式：
- **⏰ HH:MM** | **👤 发件人** | **📌 主题**
  💬 简要内容描述（1-2句话）

### ⚠️ 需要关注的事项
- 列出紧急或重要的待处理事项
- 使用**粗体**突出关键信息

### 📝 其他邮件
- 简要列出一般性邮件
- 按重要性排序

### 📊 总结
**今日邮件概况：** 用一句话总结今天的邮件情况

**格式要求：**
- 必须使用Markdown语法：## ### ** - 等
- 时间格式：**⏰ 21:15** 或 **⏰ 下午9:15**
- 每个部分之间空一行
- 重要信息用**粗体**标注
- 适当使用表情符号增强可读性
- 如果没有邮件内容，说明"暂无邮件数据"`
}