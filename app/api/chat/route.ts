import { NextRequest, NextResponse } from 'next/server'

// 重定向到正确的 AI Chat 端点
export async function POST(request: NextRequest) {
  // 获取请求体
  const body = await request.json()
  
  // 转发到正确的 AI Chat 端点
  const response = await fetch(new URL('/api/ai/chat', request.url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  })
  
  // 如果是流式响应，直接转发
  if (response.headers.get('content-type')?.includes('text/plain')) {
    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    })
  }
  
  // 否则转换为JSON
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function GET(request: NextRequest) {
  // 转发GET请求到正确端点
  const response = await fetch(new URL('/api/ai/chat', request.url))
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}