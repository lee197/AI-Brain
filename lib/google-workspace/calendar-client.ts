/**
 * Google Calendar API客户端
 * 处理Calendar事件操作
 */

import { google } from 'googleapis'
import { GoogleCredentials } from './types'

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  location?: string
  creator?: {
    email: string
    displayName?: string
  }
  organizer?: {
    email: string
    displayName?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus: string
  }>
  status: string
  htmlLink: string
  created: string
  updated: string
  recurring: boolean
  allDay: boolean
}

export interface CalendarInfo {
  id: string
  summary: string
  description?: string
  timeZone: string
  colorId?: string
  backgroundColor?: string
  foregroundColor?: string
  primary?: boolean
  accessRole: string
}

export class CalendarApiClient {
  private credentials: GoogleCredentials

  constructor(credentials: GoogleCredentials) {
    this.credentials = credentials
  }

  /**
   * 创建认证的Calendar客户端
   */
  private createCalendarClient() {
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: this.credentials.access_token
    })

    return google.calendar({ version: 'v3', auth: oauth2Client })
  }

  /**
   * 验证Calendar连接
   */
  async verifyConnection(): Promise<boolean> {
    try {
      const calendar = this.createCalendarClient()
      await calendar.calendarList.list({ maxResults: 1 })
      return true
    } catch (error) {
      console.error('Calendar连接验证失败:', error)
      return false
    }
  }

  /**
   * 获取用户的日历列表
   */
  async getCalendars(): Promise<CalendarInfo[]> {
    try {
      const calendar = this.createCalendarClient()
      const response = await calendar.calendarList.list()

      const calendars = response.data.items || []
      
      return calendars.map(cal => ({
        id: cal.id!,
        summary: cal.summary!,
        description: cal.description,
        timeZone: cal.timeZone!,
        colorId: cal.colorId,
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
        primary: cal.primary,
        accessRole: cal.accessRole!
      }))
    } catch (error) {
      console.error('获取日历列表失败:', error)
      return []
    }
  }

  /**
   * 获取事件列表
   */
  async getEvents(options: {
    calendarId?: string
    timeMin?: string
    timeMax?: string
    maxResults?: number
    singleEvents?: boolean
    orderBy?: string
    q?: string
  } = {}): Promise<CalendarEvent[]> {
    try {
      const calendar = this.createCalendarClient()
      const {
        calendarId = 'primary',
        timeMin,
        timeMax,
        maxResults = 50,
        singleEvents = true,
        orderBy = 'startTime',
        q
      } = options

      const response = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents,
        orderBy,
        q
      })

      const events = response.data.items || []
      
      return events.map(event => ({
        id: event.id!,
        summary: event.summary || '(无标题)',
        description: event.description,
        start: {
          dateTime: event.start?.dateTime,
          date: event.start?.date,
          timeZone: event.start?.timeZone
        },
        end: {
          dateTime: event.end?.dateTime,
          date: event.end?.date,
          timeZone: event.end?.timeZone
        },
        location: event.location,
        creator: event.creator ? {
          email: event.creator.email!,
          displayName: event.creator.displayName
        } : undefined,
        organizer: event.organizer ? {
          email: event.organizer.email!,
          displayName: event.organizer.displayName
        } : undefined,
        attendees: event.attendees?.map(attendee => ({
          email: attendee.email!,
          displayName: attendee.displayName,
          responseStatus: attendee.responseStatus!
        })),
        status: event.status!,
        htmlLink: event.htmlLink!,
        created: event.created!,
        updated: event.updated!,
        recurring: !!event.recurrence,
        allDay: !!event.start?.date
      }))
    } catch (error) {
      console.error('获取Calendar事件失败:', error)
      return []
    }
  }

  /**
   * 获取今天的事件
   */
  async getTodayEvents(calendarId: string = 'primary'): Promise<CalendarEvent[]> {
    const today = new Date()
    const timeMin = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
    const timeMax = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString()

    return this.getEvents({ calendarId, timeMin, timeMax })
  }

  /**
   * 获取本周的事件
   */
  async getWeekEvents(calendarId: string = 'primary'): Promise<CalendarEvent[]> {
    const today = new Date()
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const endOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 7)

    return this.getEvents({
      calendarId,
      timeMin: startOfWeek.toISOString(),
      timeMax: endOfWeek.toISOString()
    })
  }

  /**
   * 搜索事件
   */
  async searchEvents(query: string, calendarId: string = 'primary', maxResults: number = 50): Promise<CalendarEvent[]> {
    return this.getEvents({ calendarId, q: query, maxResults })
  }

  /**
   * 获取即将到来的事件
   */
  async getUpcomingEvents(calendarId: string = 'primary', maxResults: number = 10): Promise<CalendarEvent[]> {
    const now = new Date().toISOString()
    
    return this.getEvents({
      calendarId,
      timeMin: now,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    })
  }

  /**
   * 格式化事件时间
   */
  formatEventTime(event: CalendarEvent, language: 'zh' | 'en' = 'zh'): string {
    if (event.allDay) {
      return language === 'zh' ? '全天' : 'All day'
    }

    const startTime = event.start.dateTime
    const endTime = event.end.dateTime

    if (!startTime || !endTime) {
      return language === 'zh' ? '时间未知' : 'Time unknown'
    }

    const start = new Date(startTime)
    const end = new Date(endTime)
    
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: language === 'en'
      })
    }

    const startDate = start.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')
    const endDate = end.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')

    if (startDate === endDate) {
      return `${formatTime(start)} - ${formatTime(end)}`
    } else {
      return `${startDate} ${formatTime(start)} - ${endDate} ${formatTime(end)}`
    }
  }

  /**
   * 获取事件状态显示文本
   */
  getEventStatusText(status: string, language: 'zh' | 'en' = 'zh'): string {
    const statusMap = {
      confirmed: language === 'zh' ? '已确认' : 'Confirmed',
      tentative: language === 'zh' ? '待定' : 'Tentative',
      cancelled: language === 'zh' ? '已取消' : 'Cancelled'
    }

    return statusMap[status as keyof typeof statusMap] || status
  }

  /**
   * 获取参与者状态文本
   */
  getAttendeeStatusText(responseStatus: string, language: 'zh' | 'en' = 'zh'): string {
    const statusMap = {
      accepted: language === 'zh' ? '已接受' : 'Accepted',
      declined: language === 'zh' ? '已拒绝' : 'Declined',
      tentative: language === 'zh' ? '待定' : 'Tentative',
      needsAction: language === 'zh' ? '待回复' : 'Needs Action'
    }

    return statusMap[responseStatus as keyof typeof statusMap] || responseStatus
  }

  /**
   * 计算事件持续时间
   */
  getEventDuration(event: CalendarEvent, language: 'zh' | 'en' = 'zh'): string {
    if (event.allDay) {
      return language === 'zh' ? '全天' : 'All day'
    }

    const startTime = event.start.dateTime
    const endTime = event.end.dateTime

    if (!startTime || !endTime) {
      return language === 'zh' ? '未知' : 'Unknown'
    }

    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    const durationMinutes = Math.floor(durationMs / (1000 * 60))

    if (durationMinutes < 60) {
      return `${durationMinutes} ${language === 'zh' ? '分钟' : 'minutes'}`
    } else {
      const hours = Math.floor(durationMinutes / 60)
      const minutes = durationMinutes % 60
      
      if (minutes === 0) {
        return `${hours} ${language === 'zh' ? '小时' : 'hours'}`
      } else {
        return language === 'zh' 
          ? `${hours}小时${minutes}分钟`
          : `${hours}h ${minutes}m`
      }
    }
  }
}