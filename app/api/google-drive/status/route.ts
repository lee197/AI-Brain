/**
 * Google Drive连接状态检查端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { DriveApiClient } from '@/lib/google-workspace/drive-client'
import { googleAuthClient } from '@/lib/google-workspace/auth-client'
import fs from 'fs/promises'
import path from 'path'

async function loadDriveAuth(contextId: string) {
  try {
    const authFile = path.join(process.cwd(), 'data', 'google-drive', `${contextId}.json`)
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
    const authData = await loadDriveAuth(contextId)
    
    if (!authData) {
      return NextResponse.json({
        connected: false,
        status: 'not_configured',
        message: '未配置Google Drive连接'
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
      const authFile = path.join(process.cwd(), 'data', 'google-drive', `${contextId}.json`)
      await fs.writeFile(authFile, JSON.stringify(authData, null, 2))
    }

    // 验证Drive连接
    const driveClient = new DriveApiClient(validCredentials)
    const isDriveConnected = await driveClient.verifyConnection()

    if (!isDriveConnected) {
      return NextResponse.json({
        connected: false,
        status: 'connection_failed',
        message: 'Google Drive连接验证失败',
        userInfo
      })
    }

    // 获取Drive统计信息
    const driveInfo = await driveClient.getUserInfo()

    return NextResponse.json({
      connected: true,
      status: 'active',
      message: 'Google Drive连接正常',
      userInfo,
      driveStats: {
        user: driveInfo?.user,
        storageQuota: driveInfo?.storageQuota
      },
      lastSync: authData.lastSync,
      connectedAt: authData.connectedAt
    })

  } catch (error: any) {
    console.error('Google Drive状态检查失败:', error)
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

    // 只删除Google Drive的本地认证文件，不撤销token
    // 因为撤销token会影响其他Google服务（Gmail、Calendar）
    const authFile = path.join(process.cwd(), 'data', 'google-drive', `${contextId}.json`)
    try {
      await fs.unlink(authFile)
      console.log('✅ Google Drive本地认证文件已删除')
    } catch (error) {
      console.log('Google Drive认证文件不存在或删除失败')
    }

    return NextResponse.json({
      success: true,
      message: 'Google Drive连接已断开'
    })

  } catch (error: any) {
    console.error('断开Google Drive连接失败:', error)
    return NextResponse.json({
      success: false,
      error: '断开连接失败',
      details: error.message
    }, { status: 500 })
  }
}