import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { MasterAgentV2 } from '@/lib/agents/master-agent-v2'

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

    console.log(`🧠 Master Agent processing: "${message}" for context: ${contextId}`)

    // 使用Master Agent V2统一协调处理
    const masterAgent = new MasterAgentV2(true) // 开启debug模式
    const result = await masterAgent.processUserRequest(message, contextId)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        response: result.response,
        model: 'master-agent-fallback',
        timestamp: new Date().toISOString(),
        error: 'Master Agent processing failed'
      })
    }

    // Master Agent处理成功，准备最终响应
    let finalResponse = result.response

    // 如果有Gemini API密钥且需要AI生成，使用Gemini进一步增强回复
    if (GEMINI_API_KEY && result.metadata.strategy !== 'direct_response') {
      try {
        const enhancedPrompt = `基于以下分析结果，生成更好的回复：

用户问题: ${message}
AI分析结果: ${result.response}
意图类型: ${result.metadata.intent.category}
置信度: ${result.metadata.confidence}

请生成一个简洁、有用的最终回复：`

        const geminiResponse = await callGeminiAPI(enhancedPrompt)
        finalResponse = geminiResponse
      } catch (geminiError) {
        console.warn('Gemini enhancement failed, using Master Agent response:', geminiError)
      }
    }

    return NextResponse.json({
      success: true,
      response: finalResponse,
      model: GEMINI_API_KEY ? 'master-agent-gemini' : 'master-agent',
      timestamp: new Date().toISOString(),
      intent: result.metadata.intent.category,
      strategy: result.metadata.strategy,
      subAgentsUsed: result.metadata.subAgentsUsed,
      processingTime: result.metadata.processingTime,
      confidence: result.metadata.confidence,
      debug: result.debug
    })

  } catch (error) {
    console.error('Master Agent API Error:', error)
    return NextResponse.json(
      { success: false, error: 'AI service unavailable' },
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



