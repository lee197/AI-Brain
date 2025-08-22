/**
 * Gmail邮件获取API端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { GmailApiClient } from '@/lib/google-workspace/gmail-client'
import fs from 'fs/promises'
import path from 'path'

async function loadGoogleCredentials(contextId: string) {
  try {
    const authFile = path.join(process.cwd(), 'data', 'google-workspace', `${contextId}.json`)
    const authData = JSON.parse(await fs.readFile(authFile, 'utf-8'))
    return authData.credentials
  } catch (error) {
    console.error('加载Google认证信息失败:', error)
    return null
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    const query = searchParams.get('q') || ''
    const maxResults = parseInt(searchParams.get('max_results') || '20')
    const type = searchParams.get('type') || 'inbox' // inbox, unread, search

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    // 加载认证信息
    const credentials = await loadGoogleCredentials(contextId)
    if (!credentials) {
      return NextResponse.json(
        { error: '未找到Google Workspace认证信息，请先完成授权' },
        { status: 401 }
      )
    }

    // 创建Gmail客户端
    const gmailClient = new GmailApiClient(credentials)

    // 验证连接
    const isConnected = await gmailClient.verifyConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Gmail连接验证失败，请重新授权' },
        { status: 401 }
      )
    }

    let emails = []

    // 根据类型获取邮件
    switch (type) {
      case 'inbox':
        emails = await gmailClient.getInboxEmails(maxResults)
        break
      case 'unread':
        emails = await gmailClient.getUnreadEmails(maxResults)
        break
      case 'search':
        if (query) {
          emails = await gmailClient.searchEmails(query, maxResults)
        }
        break
      default:
        emails = await gmailClient.getInboxEmails(maxResults)
    }

    // 获取用户信息和统计
    const userProfile = await gmailClient.getUserProfile()
    const labels = await gmailClient.getLabels()

    return NextResponse.json({
      success: true,
      emails,
      stats: {
        totalEmails: emails.length,
        unreadEmails: emails.filter(e => !e.isRead).length,
        userProfile: userProfile,
        totalLabels: labels.success ? labels.data.length : 0
      },
      type,
      query: query || null,
      contextId
    })

  } catch (error: any) {
    console.error('Gmail API获取邮件失败:', error)
    return NextResponse.json(
      { 
        error: '获取邮件失败',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contextId, action, messageIds } = body

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少contextId' },
        { status: 400 }
      )
    }

    // 加载认证信息
    const credentials = await loadGoogleCredentials(contextId)
    if (!credentials) {
      return NextResponse.json(
        { error: '未找到Google Workspace认证信息' },
        { status: 401 }
      )
    }

    const gmailClient = new GmailApiClient(credentials)

    switch (action) {
      case 'sync':
        // 同步最新邮件
        const latestEmails = await gmailClient.getInboxEmails(50)
        
        // 这里应该保存到数据库，目前先返回数据
        return NextResponse.json({
          success: true,
          message: '邮件同步完成',
          emailCount: latestEmails.length,
          emails: latestEmails
        })

      case 'get_batch':
        if (!messageIds || !Array.isArray(messageIds)) {
          return NextResponse.json(
            { error: '缺少messageIds数组' },
            { status: 400 }
          )
        }

        const batchEmails = await gmailClient.getMessagesBatch(messageIds)
        return NextResponse.json({
          success: true,
          emails: batchEmails
        })

      default:
        return NextResponse.json(
          { error: '不支持的操作' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('Gmail API操作失败:', error)
    return NextResponse.json(
      { 
        error: '操作失败',
        details: error.message 
      },
      { status: 500 }
    )
  }
}