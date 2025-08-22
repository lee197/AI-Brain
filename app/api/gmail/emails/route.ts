/**
 * Gmail邮件获取端点 - 优化版本
 * 支持分层存储和轻量级获取
 */

import { NextRequest, NextResponse } from 'next/server'
import { GmailApiClient } from '@/lib/google-workspace/gmail-client'
import { GmailStorageManager } from '@/lib/google-workspace/gmail-storage'
import { GmailAIIndexer } from '@/lib/google-workspace/gmail-ai-indexer'
import fs from 'fs/promises'
import path from 'path'

async function loadGmailAuth(contextId: string) {
  try {
    const authFile = path.join(process.cwd(), 'data', 'gmail', `${contextId}.json`)
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
    const query = searchParams.get('query') || 'in:inbox'
    const page = parseInt(searchParams.get('page') || '1')
    const maxResults = parseInt(searchParams.get('max_results') || '20')
    const useCache = searchParams.get('use_cache') !== 'false' // 默认使用缓存

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    // 创建存储管理器
    const storageManager = new GmailStorageManager(contextId)
    
    // 如果使用缓存，先尝试从本地获取
    if (useCache && page === 1 && query === 'in:inbox') {
      const cachedResult = await storageManager.getMetadata(page, maxResults)
      if (cachedResult.emails.length > 0) {
        // 有缓存数据，但仍然在后台更新（不阻塞响应）
        updateEmailsInBackground(contextId, maxResults)
        
        const storageStats = await storageManager.getStorageStats()
        
        return NextResponse.json({
          success: true,
          emails: cachedResult.emails,
          query,
          count: cachedResult.emails.length,
          total: cachedResult.total,
          hasMore: cachedResult.hasMore,
          fromCache: true,
          storageStats
        })
      }
    }

    // 没有缓存或需要实时获取，从Gmail API获取
    const authData = await loadGmailAuth(contextId)
    
    if (!authData?.credentials) {
      return NextResponse.json({
        success: false,
        error: '未找到Gmail认证信息',
        needsAuth: true
      })
    }

    // 创建Gmail客户端
    const gmailClient = new GmailApiClient(authData.credentials)
    
    // 获取邮件（使用轻量级方法）
    let emails
    if (query === 'in:inbox') {
      emails = await gmailClient.getInboxEmailsLight(maxResults)
    } else if (query === 'is:unread') {
      emails = await gmailClient.searchEmails('is:unread', maxResults)
    } else {
      emails = await gmailClient.searchEmails(query, maxResults)
    }

    // 将数据转换为metadata格式并存储
    if (query === 'in:inbox' && emails.length > 0) {
      const metadataList = emails.map(email => ({
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.senderEmail,
        to: email.recipients.join(', '),
        cc: '',
        date: email.timestamp,
        labels: email.labels,
        snippet: email.snippet,
        sizeEstimate: 0,
        hasAttachments: email.attachments.length > 0,
        isRead: email.isRead,
        timestamp: email.timestamp
      }))
      
      // 异步存储，不阻塞响应
      storageManager.storeMetadata(metadataList).catch(error => {
        console.error('存储邮件元数据失败:', error)
      })

      // 自动触发AI索引（如果还没有索引过）
      triggerAutoAIIndexing(contextId, gmailClient).catch(error => {
        console.error('自动AI索引失败:', error)
      })
    }

    const storageStats = await storageManager.getStorageStats()

    return NextResponse.json({
      success: true,
      emails,
      query,
      count: emails.length,
      fromCache: false,
      storageStats,
      userInfo: authData.userInfo
    })

  } catch (error: any) {
    console.error('获取Gmail邮件失败:', error)
    
    // 检查是否是权限范围不足的错误
    if (error.message && (error.message.includes('insufficient authentication scopes') || 
        error.message.includes('Request had insufficient authentication scopes'))) {
      return NextResponse.json({
        success: false,
        error: 'Gmail权限不足，需要重新授权',
        details: error.message,
        needsReauth: true,
        scopeError: true
      })
    }
    
    return NextResponse.json({
      success: false,
      error: '获取邮件失败',
      details: error.message
    }, { status: 500 })
  }
}

/**
 * 后台更新邮件（不阻塞用户请求）
 */
async function updateEmailsInBackground(contextId: string, maxResults: number) {
  try {
    const authData = await loadGmailAuth(contextId)
    if (!authData?.credentials) return
    
    const gmailClient = new GmailApiClient(authData.credentials)
    const storageManager = new GmailStorageManager(contextId)
    
    // 获取最新邮件
    const emails = await gmailClient.getInboxEmailsLight(maxResults)
    
    if (emails.length > 0) {
      const metadataList = emails.map(email => ({
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.senderEmail,
        to: email.recipients.join(', '),
        cc: '',
        date: email.timestamp,
        labels: email.labels,
        snippet: email.snippet,
        sizeEstimate: 0,
        hasAttachments: email.attachments.length > 0,
        isRead: email.isRead,
        timestamp: email.timestamp
      }))
      
      await storageManager.storeMetadata(metadataList)
      console.log(`后台更新了${emails.length}封邮件的元数据`)
    }
  } catch (error) {
    console.error('后台更新邮件失败:', error)
  }
}

/**
 * 自动触发AI索引（如果还没有索引过）
 */
async function triggerAutoAIIndexing(contextId: string, gmailClient: GmailApiClient) {
  try {
    const aiIndexer = new GmailAIIndexer(contextId)
    
    // 检查是否已经有AI索引
    const aiStats = await aiIndexer.getAIStats()
    
    // 如果没有索引过，或者索引数量很少，自动创建索引
    if (aiStats.totalIndexed < 10) {
      console.log(`🤖 自动为上下文 ${contextId} 创建AI索引...`)
      
      const result = await aiIndexer.indexEmailsForAI(gmailClient, {
        maxEmails: 20, // 自动索引20封邮件
        priority: 'recent',
        forceRefresh: false
      })
      
      console.log(`🤖 自动AI索引完成: ${result.indexed}个新增, ${result.skipped}个跳过`)
    }
  } catch (error) {
    console.error('自动AI索引失败:', error)
  }
}