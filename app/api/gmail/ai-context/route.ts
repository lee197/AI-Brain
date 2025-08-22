/**
 * Gmail AI上下文端点
 * 用于AI学习和查询Gmail上下文信息
 */

import { NextRequest, NextResponse } from 'next/server'
import { GmailApiClient } from '@/lib/google-workspace/gmail-client'
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
    const action = searchParams.get('action') || 'stats'
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    const aiIndexer = new GmailAIIndexer(contextId)

    switch (action) {
      case 'stats':
        // 获取AI上下文统计信息
        const stats = await aiIndexer.getAIStats()
        return NextResponse.json({
          success: true,
          stats
        })

      case 'search':
        if (!query) {
          return NextResponse.json(
            { error: '搜索模式需要query参数' },
            { status: 400 }
          )
        }
        
        // 搜索相关邮件
        const relevantEmails = await aiIndexer.getRelevantEmailsForAI(query, limit)
        return NextResponse.json({
          success: true,
          emails: relevantEmails,
          query,
          count: relevantEmails.length
        })

      case 'context':
        // 获取完整AI上下文
        const context = await aiIndexer.getAIContext()
        return NextResponse.json({
          success: true,
          context
        })

      default:
        return NextResponse.json(
          { error: '未知的action参数' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('获取Gmail AI上下文失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '获取AI上下文失败',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    const body = await req.json()
    const { action, options = {} } = body

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
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

    const gmailClient = new GmailApiClient(authData.credentials)
    const aiIndexer = new GmailAIIndexer(contextId)

    switch (action) {
      case 'index':
        // 开始索引邮件用于AI学习
        console.log(`开始为上下文 ${contextId} 索引Gmail邮件...`)
        
        const result = await aiIndexer.indexEmailsForAI(gmailClient, {
          maxEmails: options.maxEmails || 50,
          priority: options.priority || 'recent',
          forceRefresh: options.forceRefresh || false
        })
        
        // 获取更新后的统计信息
        const updatedStats = await aiIndexer.getAIStats()
        
        return NextResponse.json({
          success: true,
          result,
          stats: updatedStats,
          message: `成功索引${result.indexed}封邮件，跳过${result.skipped}封，${result.errors}个错误`
        })

      case 'reindex':
        // 重新索引所有邮件
        console.log(`开始重新索引上下文 ${contextId} 的Gmail邮件...`)
        
        const reindexResult = await aiIndexer.indexEmailsForAI(gmailClient, {
          maxEmails: options.maxEmails || 100,
          priority: 'recent',
          forceRefresh: true
        })
        
        const reindexStats = await aiIndexer.getAIStats()
        
        return NextResponse.json({
          success: true,
          result: reindexResult,
          stats: reindexStats,
          message: `重新索引完成：${reindexResult.indexed}封邮件`
        })

      default:
        return NextResponse.json(
          { error: '未知的action参数' },
          { status: 400 }
        )
    }

  } catch (error: any) {
    console.error('处理Gmail AI索引失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '处理AI索引失败',
      details: error.message
    }, { status: 500 })
  }
}