import { NextRequest, NextResponse } from 'next/server'

/**
 * 测试端点：模拟Slack断开连接状态
 * 用于测试一键安装按钮的显示
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'disconnected',
    error: 'No Slack configuration found',
    message: '点击"添加到Slack"按钮开始连接',
    timestamp: new Date().toISOString(),
    test: true
  })
}