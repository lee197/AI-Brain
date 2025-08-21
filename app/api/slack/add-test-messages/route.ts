import { NextRequest, NextResponse } from 'next/server'
import { addTestSlackMessages } from '@/lib/slack/test-data'

/**
 * 添加测试Slack消息数据
 * 仅用于开发和演示目的
 */
export async function POST(req: NextRequest) {
  try {
    const { contextId } = await req.json()
    
    if (!contextId) {
      return NextResponse.json({
        success: false,
        error: 'Missing contextId parameter'
      }, { status: 400 })
    }

    // 添加测试消息
    addTestSlackMessages(contextId)

    return NextResponse.json({
      success: true,
      message: 'Test messages added successfully'
    })

  } catch (error) {
    console.error('Failed to add test messages:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add test messages'
    }, { status: 500 })
  }
}

// 支持GET请求用于快速测试
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const contextId = searchParams.get('contextId')
  
  if (!contextId) {
    return NextResponse.json({
      success: false,
      error: 'Missing contextId parameter'
    }, { status: 400 })
  }

  try {
    addTestSlackMessages(contextId)
    
    return NextResponse.json({
      success: true,
      message: `Test messages added to context ${contextId}`
    })
  } catch (error) {
    console.error('Failed to add test messages:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add test messages'
    }, { status: 500 })
  }
}