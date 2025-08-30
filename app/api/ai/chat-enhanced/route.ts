import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loadSlackMessages } from '@/lib/slack/database-storage'
import { GoogleWorkspaceMCPClient } from '@/lib/mcp/google-workspace-client'

// Gemini API配置
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

// MCP 服务器配置
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:8000/mcp'

// 请求验证
const requestSchema = z.object({
  message: z.string().min(1),
  contextId: z.string().optional(),
  includeGoogleWorkspace: z.boolean().default(true)
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, contextId, includeGoogleWorkspace } = requestSchema.parse(body)

    console.log(`🤖 Enhanced AI chat request: "${message}"`)
    
    // 获取多源上下文
    let slackContext = ''
    let googleWorkspaceContext = ''
    
    if (contextId) {
      // 获取Slack消息上下文 (保持原有逻辑)
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

      // 获取 Google Workspace 上下文 (新的 MCP 集成)
      if (includeGoogleWorkspace) {
        try {
          console.log(`🔍 Loading Google Workspace context via MCP for contextId: ${contextId}`)
          
          const mcpClient = new GoogleWorkspaceMCPClient(MCP_SERVER_URL)
          
          // 检查 MCP 服务器连接
          const isConnected = await mcpClient.checkConnection()
          if (!isConnected) {
            console.warn('⚠️ MCP server not available, skipping Google Workspace context')
          } else {
            // 获取 Google Workspace 综合上下文
            const workspaceContext = await mcpClient.getWorkspaceContext(message)
            
            // 构建上下文字符串
            googleWorkspaceContext = mcpClient.buildContextString(workspaceContext)
            
            console.log(`📊 Google Workspace context loaded: ${workspaceContext.gmail.length} emails, ${workspaceContext.calendar.length} events, ${workspaceContext.drive.length} files`)
          }
        } catch (mcpError) {
          console.warn('⚠️ Failed to load Google Workspace context via MCP:', mcpError)
          // 不阻止请求，继续处理
        }
      }
    }

    // 构建增强的提示
    const enhancedMessage = buildEnhancedPrompt(message, slackContext, googleWorkspaceContext)

    // 调用 AI 模型
    if (GEMINI_API_KEY) {
      const response = await callGeminiAPI(enhancedMessage)
      return NextResponse.json({
        success: true,
        response: response,
        model: 'gemini-pro',
        timestamp: new Date().toISOString(),
        context: {
          hasSlackContext: !!slackContext,
          hasGoogleWorkspaceContext: !!googleWorkspaceContext,
          slackMessageCount: slackContext ? slackContext.split('\n').length : 0,
          includeGoogleWorkspace
        }
      })
    }

    // 否则使用智能模拟回复
    const mockResponse = generateSmartMockResponse(enhancedMessage)
    return NextResponse.json({
      success: true,
      response: mockResponse,
      model: 'mock-enhanced',
      timestamp: new Date().toISOString(),
      context: {
        hasSlackContext: !!slackContext,
        hasGoogleWorkspaceContext: !!googleWorkspaceContext,
        slackMessageCount: slackContext ? slackContext.split('\n').length : 0,
        includeGoogleWorkspace
      }
    })

  } catch (error) {
    console.error('Enhanced AI Chat API Error:', error)
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
            text: `你是AI Brain智能工作助手。基于提供的上下文信息，以专业、友好的方式回复用户的问题。

用户问题：${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048, // 增加输出长度支持更丰富的回复
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
  
  if (lowerMessage.includes('邮件') || lowerMessage.includes('email')) {
    return `📧 **邮件助手回复**

基于您的Gmail上下文，我为您分析了以下内容：

**重要邮件提醒：**
- 您有 3 封未读重要邮件
- 2 封需要今天回复
- 1 封包含重要附件

**建议操作：**
- [查看未读邮件] [回复紧急邮件] [下载附件]

*注意：这是演示模式回复，实际使用时会显示真实的邮件数据。*`
  }
  
  if (lowerMessage.includes('日程') || lowerMessage.includes('calendar')) {
    return `📅 **日程助手回复**

基于您的Google Calendar，我为您整理了今天的安排：

**今日日程：**
- 09:00 - 团队晨会 (会议室A)
- 14:00 - 项目评审 (线上)
- 16:00 - 客户会议 (待确认)

**明日预览：**
- 有 2 个重要会议
- 1 个时间冲突需要解决

**建议：**
- [确认今日会议] [处理冲突] [添加新日程]

*注意：这是演示模式回复，实际使用时会显示真实的日历数据。*`
  }

  if (lowerMessage.includes('文件') || lowerMessage.includes('drive')) {
    return `📁 **文件助手回复**

基于您的Google Drive搜索，找到了以下相关文件：

**最近文件：**
- 📄 项目提案.docx (2小时前修改)
- 📊 数据分析.xlsx (昨天修改) 
- 📋 会议纪要.pdf (3天前创建)

**共享文件：**
- 有 5 个文件被团队成员访问
- 2 个文件需要您的审批

**操作建议：**
- [打开最新文档] [审批待处理文件] [创建新文档]

*注意：这是演示模式回复，实际使用时会显示真实的文件数据。*`
  }
  
  return `🤖 **AI Brain 增强助手**

基于您工作空间的多源数据，我可以帮助您：

## 📊 **可用功能：**
- **📧 邮件管理**: Gmail 智能分析和操作
- **📅 日程安排**: Google Calendar 事件管理  
- **📁 文件协作**: Google Drive 文件操作
- **💬 团队沟通**: Slack 消息整合

## 💡 **智能建议：**
您可以问我：
- "今天有哪些重要邮件？"
- "明天的日程安排是什么？"
- "帮我找一下上周的项目文档"
- "团队最近在讨论什么？"

## 🎯 **多源整合**
我会自动整合您的 Gmail、Calendar、Drive 和 Slack 数据，为您提供全面的工作洞察。

*当前为演示模式，连接 Google OAuth 后将显示真实数据。*`
}

/**
 * 构建包含多源上下文的增强提示
 */
function buildEnhancedPrompt(userMessage: string, slackContext: string, googleWorkspaceContext: string = ''): string {
  if (!slackContext && !googleWorkspaceContext) {
    // 没有上下文时的基础提示
    return `你是一个智能工作助手，帮助用户处理工作相关的问题和任务。

用户问题: ${userMessage}

请提供有用和准确的回答。`
  }

  // 构建多源上下文
  const contextSections = []
  
  if (slackContext) {
    contextSections.push(`## 📱 团队对话记录 (Slack)
${slackContext}`)
  }
  
  if (googleWorkspaceContext) {
    contextSections.push(`## 🏢 Google Workspace 工作数据
${googleWorkspaceContext}`)
  }

  // 有上下文时的增强提示
  return `你是一个智能工作助手，具备以下能力：
1. 分析团队的协作对话（Slack、Jira、GitHub等）
2. 理解邮件沟通和项目相关信息（Gmail）
3. 管理日程安排和会议（Google Calendar）
4. 访问和组织文档（Google Drive、Docs、Sheets）
5. 基于实际工作内容提供insights和建议
6. 综合多个信息源提供全面的回答

以下是相关的工作上下文信息：
---
${contextSections.join('\n\n')}
---

用户问题: ${userMessage}

请基于以上工作上下文和用户问题，提供有价值的回答和分析。

**重要：请严格按照以下Markdown格式回答，确保良好的可读性：**

## 📊 分析结果

### 📋 关键信息
- **重点项目1**：简要描述
- **重点项目2**：简要描述

### ⚠️ 需要关注的事项
- 列出紧急或重要的待处理事项
- 使用**粗体**突出关键信息

### 💡 智能建议
- 基于上下文的具体行动建议
- 优化工作流程的建议

### 📈 总结
**核心洞察：** 用一句话总结分析结果

**格式要求：**
- 必须使用Markdown语法：## ### ** - 等
- 每个部分之间空一行
- 重要信息用**粗体**标注
- 适当使用表情符号增强可读性
- 如果没有相关数据，说明"暂无相关数据"`
}