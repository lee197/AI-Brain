import { NextRequest, NextResponse } from 'next/server'
import { processSlackEvent } from '@/lib/slack/event-processor'

/**
 * 测试混合存储系统的API端点
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🧪 测试混合存储 - 接收到请求:', JSON.stringify(body, null, 2))
    
    // 模拟Slack事件
    const slackEvent = {
      type: 'message',
      user: body.user || 'U_TEST_USER',
      channel: body.channel || 'C09AHKG46HM',
      ts: body.ts || String(Date.now() / 1000),
      text: body.text || '测试混合存储系统消息'
    }
    
    console.log('📨 处理Slack事件:', slackEvent)
    
    // 调用事件处理器（使用混合存储）
    await processSlackEvent(slackEvent)
    
    console.log('✅ 混合存储测试完成')
    
    return NextResponse.json({ 
      success: true, 
      message: '混合存储测试成功',
      event: slackEvent
    })
    
  } catch (error) {
    console.error('❌ 混合存储测试失败:', error)
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}