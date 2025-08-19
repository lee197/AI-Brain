import { NextRequest, NextResponse } from 'next/server'
import { verifySlackSignature } from '@/lib/slack/signature-verification'
import { processSlackEvent } from '@/lib/slack/event-processor'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get('x-slack-signature')
    const timestamp = req.headers.get('x-slack-request-timestamp')

    const event = JSON.parse(body)
    console.log('Received Slack event:', event.type)

    // 1. 处理URL验证挑战（在签名验证之前）
    if (event.type === 'url_verification') {
      console.log('✅ URL verification challenge received:', event.challenge)
      return NextResponse.json({ challenge: event.challenge })
    }

    // 2. 对于其他事件，验证Slack请求签名
    if (!signature || !timestamp) {
      console.error('Missing Slack signature or timestamp')
      return NextResponse.json({ error: 'Missing signature or timestamp' }, { status: 401 })
    }

    if (!verifySlackSignature(body, signature, timestamp)) {
      console.error('Invalid Slack signature')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. 处理实际事件
    if (event.type === 'event_callback') {
      console.log('Processing event:', event.event.type)
      await processSlackEvent(event.event)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Slack webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 支持GET请求用于健康检查
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    endpoint: 'slack-webhook',
    timestamp: new Date().toISOString()
  })
}