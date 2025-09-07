/**
 * Enhanced AI Chat API v2
 * 支持多用户Token管理、自动刷新和错误重定向
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { loadSlackMessages } from '@/lib/slack/database-storage'
import { GoogleWorkspaceMCPClientV2 } from '@/lib/mcp/google-workspace-client-v2'
import { TokenManager } from '@/lib/oauth/token-manager'
import { TokenError } from '@/lib/mcp/base-mcp-client'
import { createClient } from '@/lib/supabase/server'

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

    console.log(`🤖 Enhanced AI chat v2 request: "${message}"`)

    // 获取当前用户
    const supabase = createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id
    
    // 获取多源上下文
    let slackContext = ''
    let googleWorkspaceContext = ''
    let tokenErrors: TokenError[] = []
    
    if (contextId) {
      // 获取Slack消息上下文 (保持原有逻辑)
      try {
        console.log(`🔍 Loading Slack context for user ${userId} in context ${contextId}`)
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

      // 获取 Google Workspace 上下文 (新的多用户 MCP 集成)
      if (includeGoogleWorkspace) {
        try {
          console.log(`🔍 Loading Google Workspace context for user ${userId} in context ${contextId}`)
          
          const mcpClient = new GoogleWorkspaceMCPClientV2(MCP_SERVER_URL)
          
          // 检查 MCP 服务器连接
          const isConnected = await mcpClient.checkConnection()
          if (!isConnected) {
            console.warn('⚠️ MCP server not available, skipping Google Workspace context')
          } else {
            // 获取 Google Workspace 综合上下文（支持多用户认证）
            const workspaceResult = await mcpClient.getWorkspaceContext(message, userId, contextId)
            
            if ('code' in workspaceResult) {
              // 这是一个TokenError
              tokenErrors.push(workspaceResult as TokenError)
              console.warn('⚠️ Google Workspace token error:', workspaceResult)
            } else {
              // 正常的workspace context
              googleWorkspaceContext = mcpClient.buildContextString(workspaceResult)
              console.log(`📊 Google Workspace context loaded: ${workspaceResult.gmail.length} emails, ${workspaceResult.calendar.length} events, ${workspaceResult.drive.length} files`)
            }
          }
        } catch (mcpError) {
          console.warn('⚠️ Failed to load Google Workspace context via MCP:', mcpError)
          
          // 如果是TokenError，添加到错误列表
          if (mcpError instanceof TokenError) {
            tokenErrors.push(mcpError)
          }
        }
      }
    }

    // 构建增强的提示
    const enhancedMessage = buildEnhancedPrompt(message, slackContext, googleWorkspaceContext)

    // 调用 AI 模型
    let aiResponse: string
    let modelUsed: string

    if (GEMINI_API_KEY) {
      aiResponse = await callGeminiAPI(enhancedMessage)
      modelUsed = 'gemini-pro'
    } else {
      // 使用智能模拟回复
      aiResponse = generateSmartMockResponse(enhancedMessage)
      modelUsed = 'mock-enhanced'
    }

    // 构建响应
    const response = {
      success: true,
      response: aiResponse,
      model: modelUsed,
      timestamp: new Date().toISOString(),
      context: {
        hasSlackContext: !!slackContext,
        hasGoogleWorkspaceContext: !!googleWorkspaceContext,
        slackMessageCount: slackContext ? slackContext.split('\n').length : 0,
        includeGoogleWorkspace,
        userId: userId,
        contextId: contextId
      },
      // 如果有token错误，返回重授权信息
      tokenErrors: tokenErrors.length > 0 ? tokenErrors.map(err => ({
        provider: err.provider,
        code: err.code,
        message: err.message,
        auth_url: err.auth_url
      })) : undefined
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Enhanced AI Chat API v2 Error:', error)
    return NextResponse.json(
      { success: false, error: 'Chat service unavailable' },
      { status: 500 }
    )
  }
}

// 调用Gemini API (保持不变)
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
          maxOutputTokens: 2048,
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

// 智能模拟回复（带Token错误提示）
function generateSmartMockResponse(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('邮件') || lowerMessage.includes('email')) {
    return `📧 **邮件助手回复 (多用户版)**

基于您的个人Gmail上下文，我为您分析了以下内容：

**重要邮件提醒：**
- ✅ 支持多用户Token管理
- ✅ 自动Token刷新机制
- ✅ 安全的数据库存储

**新功能特性：**
- 🔐 每个用户独立的OAuth认证
- 🔄 Token过期自动重新授权
- 👥 多工作空间隔离
- 🛡️ JWT安全传输

*多用户架构已就绪，等待数据库迁移后启用实时数据。*`
  }
  
  if (lowerMessage.includes('日程') || lowerMessage.includes('calendar')) {
    return `📅 **日程助手回复 (企业级)**

基于您的个人Google Calendar：

**多用户支持：**
- 👤 用户级别的Token隔离
- 🏢 工作空间级别的权限控制  
- 🔄 智能Token刷新策略

**技术升级：**
- 🗄️ 数据库Token存储
- 🔐 JWT认证传输
- ⚡ 并发安全处理

**即将启用：**
- 真实的个人日历数据
- 跨工作空间日程同步
- 团队日程智能冲突检测

*企业级架构完成，正在部署中...*`
  }

  if (lowerMessage.includes('文件') || lowerMessage.includes('drive')) {
    return `📁 **文件助手回复 (可扩展架构)**

基于您的个人Google Drive：

**架构优势：**
- 🏗️ 通用MCP客户端基类
- 🔌 可扩展多种MCP服务器
- 🔄 统一的认证管理

**未来支持的MCP服务：**
- 📧 Google Workspace MCP ✅
- 💬 Slack MCP (待开发)
- 📋 Jira MCP (待开发)  
- 🐙 GitHub MCP (待开发)
- 📝 Notion MCP (待开发)

**当前状态：**
- ✅ 多用户Token架构完成
- ✅ 自动刷新机制就绪
- ⏳ 等待数据库表创建

*可扩展MCP架构已实现，支持无限扩展！*`
  }
  
  return `🤖 **AI Brain v2.0 - 企业级多用户架构**

## 🏗️ **架构升级完成：**

### 🔐 **多用户Token管理**
- **数据库存储**: 每个用户独立的OAuth tokens
- **自动刷新**: Token过期自动检测和刷新
- **安全传输**: JWT认证保护MCP通信
- **权限隔离**: 工作空间级别的数据隔离

### 🔌 **可扩展MCP架构**
- **通用基类**: 支持任意MCP服务器集成
- **标准化接口**: 统一的认证和错误处理
- **服务器注册表**: 动态管理多个MCP服务

### 📊 **已实现组件**
1. ✅ **数据库表结构** (oauth_tokens)
2. ✅ **Token管理器** (TokenManager)  
3. ✅ **MCP基类** (BaseMCPClient)
4. ✅ **Google客户端v2** (GoogleWorkspaceMCPClientV2)
5. ✅ **增强聊天APIv2** (支持多用户)

### 🚀 **下一步操作**
1. **运行数据库迁移**: 创建oauth_tokens表
2. **测试多用户认证**: 验证Token隔离功能
3. **扩展更多MCP**: 集成Slack、Jira等服务

## 💡 **立即可用功能**
- 多用户安全认证
- 自动Token刷新  
- 错误智能重定向
- 企业级数据隔离

*准备就绪，等待数据库迁移激活！*`
}

/**
 * 构建包含多源上下文的增强提示 (保持不变)
 */
function buildEnhancedPrompt(userMessage: string, slackContext: string, googleWorkspaceContext: string = ''): string {
  if (!slackContext && !googleWorkspaceContext) {
    return `你是一个智能工作助手，帮助用户处理工作相关的问题和任务。

用户问题: ${userMessage}

请提供有用和准确的回答。`
  }

  const contextSections = []
  
  if (slackContext) {
    contextSections.push(`## 📱 团队对话记录 (Slack)
${slackContext}`)
  }
  
  if (googleWorkspaceContext) {
    contextSections.push(`## 🏢 Google Workspace 工作数据
${googleWorkspaceContext}`)
  }

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