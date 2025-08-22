/**
 * Google Drive文件获取端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { DriveApiClient } from '@/lib/google-workspace/drive-client'
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
    const query = searchParams.get('query') || 'recent'
    const search = searchParams.get('search')
    const maxResults = parseInt(searchParams.get('max_results') || '50')

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    // 加载认证信息
    const authData = await loadDriveAuth(contextId)
    
    if (!authData?.credentials) {
      return NextResponse.json({
        success: false,
        error: '未找到Google Drive认证信息',
        needsAuth: true
      })
    }

    // 创建Drive客户端
    const driveClient = new DriveApiClient(authData.credentials)
    
    // 根据查询类型获取文件
    let files
    if (search) {
      files = await driveClient.searchFiles(search, maxResults)
    } else {
      switch (query) {
        case 'recent':
          files = await driveClient.getRecentFiles(maxResults)
          break
        case 'shared':
          files = await driveClient.getSharedFiles(maxResults)
          break
        case 'docs':
          files = await driveClient.getDocs(maxResults)
          break
        case 'sheets':
          files = await driveClient.getSheets(maxResults)
          break
        case 'slides':
          files = await driveClient.getSlides(maxResults)
          break
        case 'folders':
          files = await driveClient.getFolders(maxResults)
          break
        default:
          files = await driveClient.getRecentFiles(maxResults)
      }
    }

    return NextResponse.json({
      success: true,
      files,
      query,
      search,
      count: files.length,
      userInfo: authData.userInfo
    })

  } catch (error: any) {
    console.error('获取Google Drive文件失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取文件失败',
      details: error.message
    }, { status: 500 })
  }
}