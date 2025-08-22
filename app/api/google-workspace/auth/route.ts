/**
 * Google Workspace OAuth认证端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { googleAuthClient } from '@/lib/google-workspace/auth-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    
    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    // 生成授权URL，将contextId作为state传递
    const authUrl = googleAuthClient.generateAuthUrl(contextId)

    return NextResponse.json({
      authUrl,
      message: '请访问授权URL完成Google Workspace授权'
    })
  } catch (error) {
    console.error('Google OAuth认证失败:', error)
    return NextResponse.json(
      { error: '授权URL生成失败' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, contextId, refreshToken } = body

    switch (action) {
      case 'refresh':
        if (!refreshToken) {
          return NextResponse.json(
            { error: '缺少refresh_token' },
            { status: 400 }
          )
        }

        const newCredentials = await googleAuthClient.refreshAccessToken(refreshToken)
        if (!newCredentials) {
          return NextResponse.json(
            { error: '刷新token失败' },
            { status: 401 }
          )
        }

        return NextResponse.json({
          success: true,
          credentials: newCredentials
        })

      case 'revoke':
        const { accessToken } = body
        if (!accessToken) {
          return NextResponse.json(
            { error: '缺少access_token' },
            { status: 400 }
          )
        }

        const revokeSuccess = await googleAuthClient.revokeToken(accessToken)
        return NextResponse.json({
          success: revokeSuccess,
          message: revokeSuccess ? 'Token已撤销' : '撤销失败'
        })

      default:
        return NextResponse.json(
          { error: '不支持的操作' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Google OAuth操作失败:', error)
    return NextResponse.json(
      { error: '操作失败' },
      { status: 500 }
    )
  }
}