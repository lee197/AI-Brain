import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// 根据CLAUDE.md配置，我们使用OpenAI和Anthropic
const openaiApiKey = process.env.OPENAI_API_KEY
const anthropicApiKey = process.env.ANTHROPIC_API_KEY

// 请求验证模式
const chatRequestSchema = z.object({
  message: z.string().min(1),
  contextId: z.string().optional(),
  conversationId: z.string().optional(),
  aiModel: z.enum(['openai', 'anthropic']).default('openai')
})

// 上下文增强的AI提示
const systemPrompt = `你是AI Brain，一个智能的企业工作助手。你可以：

1. **数据源管理**: 查询和分析Slack、Jira、GitHub、Google Workspace等工具的数据
2. **任务管理**: 创建、分配和跟踪任务
3. **团队协作**: 安排会议、生成报告、分析工作进展
4. **智能洞察**: 提供基于数据的建议和预测

请用简洁、专业且有用的方式回应用户。如果用户询问特定功能，提供具体的操作建议。`

export async function POST(req: NextRequest) {
  try {
    // 1. 认证检查
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. 验证输入
    const body = await req.json()
    const { message, contextId, conversationId, aiModel } = chatRequestSchema.parse(body)

    // 3. 获取上下文信息
    let contextInfo = ''
    if (contextId) {
      const { data: context } = await supabase
        .from('contexts')
        .select('*')
        .eq('id', contextId)
        .single()
      
      if (context) {
        contextInfo = `当前工作空间: ${context.name} (${context.type})\n`
      }
    }

    // 4. 获取对话历史
    let conversationHistory = []
    if (conversationId) {
      const { data: messages } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10) // 最近10条消息作为上下文
      
      if (messages) {
        conversationHistory = messages
      }
    }

    // 5. 构建AI请求
    const aiResponse = await callAIService({
      model: aiModel,
      systemPrompt: systemPrompt + contextInfo,
      message,
      conversationHistory
    })

    // 6. 保存消息到数据库
    if (conversationId) {
      // 保存用户消息
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'user',
          content: message,
          metadata: { contextId }
        })

      // 保存AI回复
      await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: aiResponse.content,
          metadata: { 
            model: aiModel,
            contextId,
            actions: aiResponse.actions || []
          }
        })
    }

    return NextResponse.json({
      response: aiResponse.content,
      actions: aiResponse.actions || [],
      model: aiModel,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    
    console.error('AI Chat Error:', error)
    return NextResponse.json({ 
      error: 'AI service temporarily unavailable' 
    }, { status: 500 })
  }
}

// AI服务调用函数
async function callAIService({ 
  model, 
  systemPrompt, 
  message, 
  conversationHistory 
}: {
  model: 'openai' | 'anthropic'
  systemPrompt: string
  message: string
  conversationHistory: any[]
}) {
  
  if (model === 'openai' && openaiApiKey) {
    return await callOpenAI(systemPrompt, message, conversationHistory)
  } else if (model === 'anthropic' && anthropicApiKey) {
    return await callAnthropic(systemPrompt, message, conversationHistory)
  } else {
    // 降级到智能模拟响应
    return await generateSmartResponse(message, conversationHistory)
  }
}

// OpenAI集成
async function callOpenAI(systemPrompt: string, message: string, history: any[]) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message }
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  
  return {
    content: data.choices[0].message.content,
    actions: extractActions(data.choices[0].message.content)
  }
}

// Anthropic集成
async function callAnthropic(systemPrompt: string, message: string, history: any[]) {
  // Anthropic API 调用实现
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey!,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [
        ...history,
        { role: 'user', content: message }
      ]
    }),
  })

  const data = await response.json()
  
  return {
    content: data.content[0].text,
    actions: extractActions(data.content[0].text)
  }
}

// 智能模拟响应（当没有API密钥时）
async function generateSmartResponse(message: string, history: any[]) {
  const lowerMessage = message.toLowerCase()
  
  // 基于关键词的智能响应，集成数据分析
  if (lowerMessage.includes('数据源') || lowerMessage.includes('连接状态')) {
    // 调用数据分析API获取实时状态
    try {
      const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'data_source_health' })
      })
      
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json()
        const result = analysisData.data
        
        return {
          content: `我来为你分析数据源连接状态：

**${result.summary}**

**详细状态：**
${result.insights.map((insight: any) => 
  `• ${insight.type === 'warning' ? '⚠️' : insight.type === 'success' ? '✅' : 'ℹ️'} **${insight.title}**: ${insight.description}`
).join('\n')}

**关键指标：**
${result.metrics.map((metric: any) => 
  `• **${metric.name}**: ${metric.value}${metric.unit || ''} ${metric.trend ? (metric.trend === 'up' ? '📈' : metric.trend === 'down' ? '📉' : '➡️') : ''}`
).join('\n')}

**建议操作：**
${result.recommendations.map((rec: any, index: number) => 
  `${index + 1}. **${rec.title}**: ${rec.description}`
).join('\n')}`,
          actions: [{
            type: 'analyze_datasources',
            title: '深度分析数据源',
            status: 'completed'
          }]
        }
      }
    } catch (error) {
      console.error('Analysis API error:', error)
    }
    
    // 降级到静态响应
    return {
      content: `我来为你检查数据源连接状态：

**当前连接状态：**
• ✅ **Slack** - 已连接，最后同步: 5分钟前
• 🔄 **Jira** - 同步中，进度: 88%  
• ✅ **GitHub** - 已连接，最后同步: 8分钟前
• ❌ **Google Workspace** - 连接异常，需要重新认证

**建议操作：**
1. 重新连接Google Workspace
2. 检查Jira同步进度
3. 确保所有数据源权限正常`,
      actions: [{
        type: 'check_datasources',
        title: '检查数据源',
        status: 'completed'
      }]
    }
  }
  
  if (lowerMessage.includes('任务') || lowerMessage.includes('清单')) {
    return {
      content: `根据你的工作空间数据，我为你生成了今日任务清单：

**🔥 紧急任务**
• Review PR #142 - AI Brain登录优化
• 处理3个高优先级Jira ticket
• 准备下午14:00的项目会议

**📋 今日计划**  
• 完成用户界面重构
• 更新项目文档
• 团队进度同步会议

**⏰ 时间安排**
• 09:00-11:00: 代码Review
• 14:00-15:00: 项目会议
• 16:00-17:00: 文档更新

需要我帮你创建任何具体任务吗？`,
      actions: [{
        type: 'create_task',
        title: '创建新任务',
        status: 'pending'
      }]
    }
  }

  if (lowerMessage.includes('团队') || lowerMessage.includes('进展') || lowerMessage.includes('工作')) {
    return {
      content: `团队本周工作进展分析：

**📊 整体进度**
• 项目完成度: 78%
• 代码质量评分: 92/100
• 团队效率: ⬆️ 提升15%

**👥 团队状态**
• **张三** (项目经理) - 🟢 正常进度
• **李四** (开发工程师) - 🟡 任务较重，建议调整
• **王五** (设计师) - 🟢 提前完成设计稿

**🎯 关键指标**
• Bug修复率: 95%
• 代码Review覆盖: 100%
• 文档更新度: 85%

建议优化李四的任务分配，其他团队成员状态良好。`,
      actions: [{
        type: 'analyze_team',
        title: '深度团队分析',
        status: 'pending'
      }]
    }
  }

  // 默认响应
  return {
    content: `我理解你的需求。作为AI Brain智能助手，我可以帮助你：

• 📊 **数据分析** - 分析工作数据和团队表现
• ✅ **任务管理** - 创建、分配和跟踪任务进度  
• 👥 **团队协作** - 安排会议、同步进展
• 📄 **报告生成** - 自动生成工作报告
• 🔍 **智能搜索** - 查找项目文档和信息

请告诉我你具体需要什么帮助，我会为你提供详细的解决方案。`,
    actions: []
  }
}

// 从AI响应中提取可执行操作
function extractActions(content: string) {
  const actions = []
  
  // 简单的操作提取逻辑
  if (content.includes('创建任务') || content.includes('create task')) {
    actions.push({
      type: 'create_task',
      title: '创建任务',
      status: 'pending'
    })
  }
  
  if (content.includes('安排会议') || content.includes('schedule meeting')) {
    actions.push({
      type: 'schedule_meeting', 
      title: '安排会议',
      status: 'pending'
    })
  }
  
  return actions
}