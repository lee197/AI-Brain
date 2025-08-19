import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

/**
 * 测试端点：模拟Slack消息接收
 * 用于开发环境测试Slack实时消息功能
 */
export async function POST(req: NextRequest) {
  try {
    const { contextId, message, author, channel } = await req.json()

    if (!contextId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createClient()
    
    // 创建模拟Slack消息
    const mockSlackMessage = {
      id: crypto.randomUUID(),
      message_id: (Date.now() / 1000).toString(),
      context_id: contextId,
      channel_id: 'C1234567890',
      channel_name: channel || 'general',
      user_id: 'U1234567890',
      user_name: author || 'Test User',
      user_avatar: 'https://ui-avatars.com/api/?name=Test+User&size=72&background=7c3aed&color=ffffff',
      text: message,
      timestamp: new Date().toISOString(),
      metadata: {
        test: true,
        source: 'test-api'
      }
    }

    // 存储到数据库（如果表存在）
    try {
      await supabase
        .from('slack_messages')
        .insert(mockSlackMessage)
    } catch (dbError) {
      console.log('Database insert failed (table may not exist):', dbError)
      // 继续执行，不阻断测试
    }

    // 实时广播给前端 - 使用独立客户端
    const realtimeClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const supabaseChannel = realtimeClient.channel(`context-${contextId}`)
    
    await supabaseChannel.send({
      type: 'broadcast',
      event: 'slack_message_received',
      payload: mockSlackMessage
    })

    console.log('Test Slack message broadcasted:', {
      contextId,
      message: message.substring(0, 50) + '...',
      author
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Test Slack message sent',
      data: mockSlackMessage
    })

  } catch (error) {
    console.error('Test Slack message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 获取测试说明
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/test/slack-message',
    method: 'POST',
    description: 'Send a test Slack message to test real-time functionality',
    body: {
      contextId: 'string (required) - The context ID to send message to',
      message: 'string (required) - The message content',
      author: 'string (optional) - Author name, defaults to "Test User"',
      channel: 'string (optional) - Channel name, defaults to "general"'
    },
    example: {
      contextId: 'your-context-id',
      message: 'Hello from Slack! This is a test message.',
      author: 'John Doe',
      channel: 'development'
    }
  })
}