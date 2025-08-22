/**
 * 获取单个Gmail邮件详情端点 - 优化版本
 * 支持按需加载完整内容
 */

import { NextRequest, NextResponse } from 'next/server'
import { GmailApiClient } from '@/lib/google-workspace/gmail-client'
import { GmailStorageManager } from '@/lib/google-workspace/gmail-storage'
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

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    const emailId = params.id

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    if (!emailId) {
      return NextResponse.json(
        { error: '缺少邮件ID' },
        { status: 400 }
      )
    }

    // 加载认证信息
    const authData = await loadGmailAuth(contextId)
    
    if (!authData?.credentials) {
      return NextResponse.json({
        success: false,
        error: '未找到Gmail认证信息',
        needsAuth: true
      })
    }

    // 创建存储管理器
    const storageManager = new GmailStorageManager(contextId)
    
    // 首先检查是否有缓存的内容
    const cachedContent = await storageManager.getContent(emailId)
    
    if (cachedContent) {
      // 返回缓存的完整内容
      return NextResponse.json({
        success: true,
        email: cachedContent,
        fromCache: true
      })
    }

    // 没有缓存，从Gmail API获取
    const gmailClient = new GmailApiClient(authData.credentials)
    
    // 获取邮件详情
    const emailResult = await gmailClient.getMessage(emailId)
    
    if (!emailResult.success) {
      return NextResponse.json({
        success: false,
        error: '获取邮件详情失败',
        details: emailResult.error
      })
    }

    // 提取完整内容
    const extractFullContent = (payload: any): { text: string, html: string } => {
      let textContent = ''
      let htmlContent = ''

      const extractFromPart = (part: any) => {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          textContent += Buffer.from(part.body.data, 'base64').toString('utf-8')
        } else if (part.mimeType === 'text/html' && part.body?.data) {
          htmlContent += Buffer.from(part.body.data, 'base64').toString('utf-8')
        }
        
        // 递归处理嵌套的parts
        if (part.parts) {
          part.parts.forEach(extractFromPart)
        }
      }

      if (payload.body?.data) {
        // 单一内容
        const content = Buffer.from(payload.body.data, 'base64').toString('utf-8')
        if (payload.mimeType === 'text/html') {
          htmlContent = content
        } else {
          textContent = content
        }
      } else if (payload.parts) {
        payload.parts.forEach(extractFromPart)
      }

      return { text: textContent, html: htmlContent }
    }

    const fullContent = extractFullContent(emailResult.data.payload)
    
    // 获取headers
    const headers = emailResult.data.payload.headers
    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || ''

    // 构建完整的邮件内容对象
    const emailContent = {
      id: emailResult.data.id,
      threadId: emailResult.data.threadId,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      cc: getHeader('Cc'),
      date: getHeader('Date'),
      contentText: fullContent.text,
      contentHtml: fullContent.html,
      contentTextLength: fullContent.text.length,
      contentHtmlLength: fullContent.html.length,
      labels: emailResult.data.labelIds,
      snippet: emailResult.data.snippet,
      internalDate: emailResult.data.internalDate,
      sizeEstimate: emailResult.data.sizeEstimate
    }

    // 异步缓存内容，不阻塞响应
    storageManager.storeContent(emailId, {
      id: emailId,
      contentText: fullContent.text,
      contentHtml: fullContent.html,
      contentTextLength: fullContent.text.length,
      contentHtmlLength: fullContent.html.length
    }).catch(error => {
      console.error('缓存邮件内容失败:', error)
    })

    return NextResponse.json({
      success: true,
      email: emailContent,
      fromCache: false
    })

  } catch (error: any) {
    console.error('获取Gmail邮件详情失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '获取邮件详情失败',
      details: error.message
    }, { status: 500 })
  }
}