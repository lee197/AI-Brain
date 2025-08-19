import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

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

    // 如果有Gemini API密钥，使用Gemini
    if (GEMINI_API_KEY) {
      const response = await callGeminiAPI(message)
      return NextResponse.json({
        success: true,
        response: response,
        model: 'gemini-pro',
        timestamp: new Date().toISOString()
      })
    }

    // 否则使用智能模拟回复
    const mockResponse = generateSmartMockResponse(message)
    return NextResponse.json({
      success: true,
      response: mockResponse,
      model: 'mock',
      timestamp: new Date().toISOString()
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