/**
 * Google Calendar事件获取端点
 */

import { NextRequest, NextResponse } from 'next/server'
import { CalendarApiClient } from '@/lib/google-workspace/calendar-client'
import fs from 'fs/promises'
import path from 'path'

async function loadCalendarAuth(contextId: string) {
  try {
    const authFile = path.join(process.cwd(), 'data', 'google-calendar', `${contextId}.json`)
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
    const query = searchParams.get('query') || 'upcoming'
    const search = searchParams.get('search')
    const maxResults = parseInt(searchParams.get('max_results') || '50')
    const calendarId = searchParams.get('calendar_id') || 'primary'

    if (!contextId) {
      return NextResponse.json(
        { error: '缺少context_id参数' },
        { status: 400 }
      )
    }

    // 加载认证信息
    const authData = await loadCalendarAuth(contextId)
    
    if (!authData?.credentials) {
      return NextResponse.json({
        success: false,
        error: '未找到Google Calendar认证信息',
        needsAuth: true
      })
    }

    // 创建Calendar客户端
    const calendarClient = new CalendarApiClient(authData.credentials)
    
    // 根据查询类型获取事件
    let events
    if (search) {
      events = await calendarClient.searchEvents(search, calendarId, maxResults)
    } else {
      switch (query) {
        case 'today':
          events = await calendarClient.getTodayEvents(calendarId)
          break
        case 'week':
          events = await calendarClient.getWeekEvents(calendarId)
          break
        case 'upcoming':
          events = await calendarClient.getUpcomingEvents(calendarId, maxResults)
          break
        default:
          events = await calendarClient.getUpcomingEvents(calendarId, maxResults)
      }
    }

    return NextResponse.json({
      success: true,
      events,
      query,
      search,
      calendarId,
      count: events.length,
      userInfo: authData.userInfo
    })

  } catch (error: any) {
    console.error('获取Google Calendar事件失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取事件失败',
      details: error.message
    }, { status: 500 })
  }
}