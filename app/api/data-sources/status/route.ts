/**
 * 批量数据源状态检查API
 * 并行检查所有数据源状态，大幅提升性能
 */

import { NextRequest, NextResponse } from 'next/server'
import { statusCache } from '@/lib/status-cache'

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

    // 检查缓存
    const cachedResults = {
      slack: statusCache.get('slack', contextId),
      gmail: statusCache.get('gmail', contextId),
      googleDrive: statusCache.get('google-drive', contextId),
      googleCalendar: statusCache.get('google-calendar', contextId)
    }

    // 如果所有数据都有缓存，直接返回
    const allCached = Object.values(cachedResults).every(result => result !== null)
    if (allCached) {
      console.log(`📊 返回所有缓存的状态数据`)
      return NextResponse.json({
        success: true,
        fromCache: true,
        statuses: cachedResults
      })
    }

    // 需要实际检查的数据源
    const promises: Promise<any>[] = []
    const dataSourceMap: string[] = []

    // Slack状态检查
    if (!cachedResults.slack) {
      promises.push(
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/slack/config?contextId=${contextId}`)
          .then(res => res.json())
          .catch(() => ({ connected: false, error: 'Slack连接失败' }))
      )
      dataSourceMap.push('slack')
    }

    // Gmail状态检查
    if (!cachedResults.gmail) {
      promises.push(
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/gmail/status?context_id=${contextId}`)
          .then(res => res.json())
          .catch(() => ({ connected: false, error: 'Gmail连接失败' }))
      )
      dataSourceMap.push('gmail')
    }

    // Google Drive状态检查
    if (!cachedResults.googleDrive) {
      promises.push(
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/google-drive/status?context_id=${contextId}`)
          .then(res => res.json())
          .catch(() => ({ connected: false, error: 'Google Drive连接失败' }))
      )
      dataSourceMap.push('googleDrive')
    }

    // Google Calendar状态检查
    if (!cachedResults.googleCalendar) {
      promises.push(
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/google-calendar/status?context_id=${contextId}`)
          .then(res => res.json())
          .catch(() => ({ connected: false, error: 'Google Calendar连接失败' }))
      )
      dataSourceMap.push('googleCalendar')
    }

    // 并行执行所有状态检查（设置超时）
    console.log(`🔍 并行检查${promises.length}个数据源状态...`)
    const startTime = Date.now()
    
    const results = await Promise.allSettled(
      promises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Status check timeout')), 5000)
          )
        ])
      )
    )

    const endTime = Date.now()
    console.log(`✅ 状态检查完成，耗时: ${endTime - startTime}ms`)

    // 处理结果并更新缓存
    const finalResults = { ...cachedResults }
    
    results.forEach((result, index) => {
      const dataSource = dataSourceMap[index]
      if (result.status === 'fulfilled') {
        finalResults[dataSource as keyof typeof finalResults] = result.value
        // 缓存成功的结果
        statusCache.set(dataSource, contextId, result.value)
      } else {
        // 失败的结果也缓存，但TTL更短
        const errorResult = { connected: false, error: '连接超时或失败' }
        finalResults[dataSource as keyof typeof finalResults] = errorResult
        statusCache.set(dataSource, contextId, errorResult, 10000) // 10秒缓存
      }
    })

    return NextResponse.json({
      success: true,
      fromCache: false,
      statuses: finalResults,
      timing: {
        duration: endTime - startTime,
        checkedSources: dataSourceMap.length,
        cachedSources: Object.keys(cachedResults).filter(key => cachedResults[key as keyof typeof cachedResults] !== null).length
      }
    })

  } catch (error: any) {
    console.error('批量状态检查失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '批量状态检查失败',
      details: error.message
    }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const contextId = searchParams.get('context_id')
    const dataSource = searchParams.get('data_source')

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    if (dataSource) {
      // 清除特定数据源的缓存
      statusCache.delete(dataSource, contextId)
    } else {
      // 清除所有数据源的缓存
      ['slack', 'gmail', 'google-drive', 'google-calendar'].forEach(ds => {
        statusCache.delete(ds, contextId)
      })
    }

    return NextResponse.json({
      success: true,
      message: '缓存已清除'
    })

  } catch (error: any) {
    console.error('清除缓存失败:', error)
    
    return NextResponse.json({
      success: false,
      error: '清除缓存失败',
      details: error.message
    }, { status: 500 })
  }
}