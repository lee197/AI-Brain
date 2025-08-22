/**
 * Gmail权限范围检查端点
 */

import { NextRequest, NextResponse } from 'next/server'
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

    const scopes = authData.credentials.scope || ''
    const scopeArray = scopes.split(' ')

    // 检查必需的Gmail权限
    const requiredScopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send'
    ]

    const missingScopes = requiredScopes.filter(scope => !scopeArray.includes(scope))
    const hasGmailScopes = missingScopes.length === 0

    return NextResponse.json({
      success: true,
      hasGmailScopes,
      currentScopes: scopeArray,
      requiredScopes,
      missingScopes,
      scopeString: scopes,
      analysis: {
        hasProfileAccess: scopeArray.includes('https://www.googleapis.com/auth/userinfo.profile'),
        hasEmailAccess: scopeArray.includes('https://www.googleapis.com/auth/userinfo.email'),
        hasGmailReadAccess: scopeArray.includes('https://www.googleapis.com/auth/gmail.readonly'),
        hasGmailSendAccess: scopeArray.includes('https://www.googleapis.com/auth/gmail.send'),
      }
    })

  } catch (error: any) {
    console.error('检查Gmail权限范围失败:', error)
    return NextResponse.json({
      success: false,
      error: '检查权限失败',
      details: error.message
    }, { status: 500 })
  }
}