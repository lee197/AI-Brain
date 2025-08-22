/**
 * Google Calendar日历列表获取端点
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
    
    // 获取日历列表
    const calendars = await calendarClient.getCalendars()

    return NextResponse.json({
      success: true,
      calendars,
      count: calendars.length,
      userInfo: authData.userInfo
    })

  } catch (error: any) {
    console.error('获取Google Calendar日历列表失败:', error)
    return NextResponse.json({
      success: false,
      error: '获取日历列表失败',
      details: error.message
    }, { status: 500 })
  }
}