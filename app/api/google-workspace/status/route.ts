/**
 * Google Workspace连接状态检查端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { GmailApiClient } from '@/lib/google-workspace/gmail-client'
import { googleAuthClient } from '@/lib/google-workspace/auth-client'
import fs from 'fs/promises'
import path from 'path'

async function loadGoogleAuth(contextId: string) {
  try {
    const authFile = path.join(process.cwd(), 'data', 'google-workspace', `${contextId}.json`)
    const authData = JSON.parse(await fs.readFile(authFile, 'utf-8'))
    return authData
  } catch (error) {
    return null
  }
}

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

    // 加载认证信息
    const authData = await loadGoogleAuth(contextId)
    
    if (!authData) {
      return NextResponse.json({
        connected: false,
        status: 'not_configured',
        message: '未配置Google Workspace连接'
      })
    }

    const { credentials, userInfo } = authData

    // 检查token是否需要刷新
    const validCredentials = await googleAuthClient.ensureValidToken(credentials)
    
    if (!validCredentials) {
      return NextResponse.json({
        connected: false,
        status: 'token_expired',
        message: 'Token已过期，需要重新授权',
        userInfo
      })
    }

    // 如果token被刷新了，保存新的credentials
    if (validCredentials !== credentials) {
      authData.credentials = validCredentials
      const authFile = path.join(process.cwd(), 'data', 'google-workspace', `${contextId}.json`)
      await fs.writeFile(authFile, JSON.stringify(authData, null, 2))
    }

    // 验证Gmail连接
    const gmailClient = new GmailApiClient(validCredentials)
    const isGmailConnected = await gmailClient.verifyConnection()

    if (!isGmailConnected) {
      return NextResponse.json({
        connected: false,
        status: 'connection_failed',
        message: 'Gmail连接验证失败',
        userInfo
      })
    }

    // 获取Gmail统计信息
    const userProfile = await gmailClient.getUserProfile()
    const labels = await gmailClient.getLabels()

    return NextResponse.json({
      connected: true,
      status: 'active',
      message: 'Google Workspace连接正常',
      userInfo,
      gmailStats: {
        emailAddress: userProfile?.emailAddress,
        totalMessages: userProfile?.messagesTotal || 0,
        totalThreads: userProfile?.threadsTotal || 0,
        totalLabels: labels.success ? labels.data.length : 0
      },
      lastSync: authData.lastSync,
      connectedAt: authData.connectedAt
    })

  } catch (error: any) {
    console.error('Google Workspace状态检查失败:', error)
    return NextResponse.json({
      connected: false,
      status: 'error',
      message: '状态检查失败',
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    // 加载认证信息
    const authData = await loadGoogleAuth(contextId)
    
    if (authData?.credentials?.access_token) {
      // 撤销token
      await googleAuthClient.revokeToken(authData.credentials.access_token)
    }

    // 删除本地认证文件
    const authFile = path.join(process.cwd(), 'data', 'google-workspace', `${contextId}.json`)
    try {
      await fs.unlink(authFile)
    } catch (error) {
      // 文件可能不存在，忽略错误
    }

    return NextResponse.json({
      success: true,
      message: 'Google Workspace连接已断开'
    })

  } catch (error: any) {
    console.error('断开Google Workspace连接失败:', error)
    return NextResponse.json({
      success: false,
      error: '断开连接失败',
      details: error.message
    }, { status: 500 })
  }
}