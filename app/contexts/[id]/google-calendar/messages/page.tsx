'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  Calendar,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Clock,
  User,
  MapPin,
  Users,
  Settings,
  Loader2,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Video,
  Phone,
  Link,
  CalendarDays,
  CalendarClock
} from 'lucide-react'

interface CalendarEvent {
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

interface CalendarInfo {
  id: string
  summary: string
  description?: string
  timeZone: string
  primary?: boolean
  accessRole: string
}

interface CalendarStats {
  totalCalendars?: number
  upcomingEvents?: number
  primaryCalendar?: string
}

interface UserInfo {
  email?: string
  name?: string
  picture?: string
}

export default function GoogleCalendarMessagesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const contextId = params.id as string

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [calendars, setCalendars] = useState<CalendarInfo[]>([])
  const [selectedCalendar, setSelectedCalendar] = useState('primary')
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFilter, setCurrentFilter] = useState('upcoming')
  const [isSearching, setIsSearching] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    status: string
    message: string
    userInfo?: UserInfo
    calendarStats?: CalendarStats
  } | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [error, setError] = useState<string | null>(null)

  // 检测URL参数中的成功状态和倒计时
  useEffect(() => {
    const success = searchParams.get('calendar_success')
    if (success === 'true') {
      setShowSuccess(true)
      setCountdown(5)
      
      // 倒计时
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            setShowSuccess(false)
            // 跳转回数据源设置页面
            window.location.href = `/contexts/${contextId}/settings?tab=data-sources`
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(countdownInterval)
    }
  }, [searchParams, contextId])

  // 加载连接状态和事件
  useEffect(() => {
    loadConnectionStatus()
  }, [contextId])

  useEffect(() => {
    if (connectionStatus?.connected) {
      loadCalendars()
      loadEvents()
    }
  }, [connectionStatus, currentFilter, selectedCalendar])

  const loadConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/google-calendar/status?context_id=${contextId}`)
      const result = await response.json()
      setConnectionStatus(result)
      
      if (!result.connected) {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('检查Google Calendar连接状态失败:', error)
      setError('无法检查连接状态')
      setIsLoading(false)
    }
  }

  const loadCalendars = async () => {
    try {
      const response = await fetch(`/api/google-calendar/calendars?context_id=${contextId}`)
      const result = await response.json()
      
      if (result.success) {
        setCalendars(result.calendars || [])
      }
    } catch (error) {
      console.error('加载日历列表失败:', error)
    }
  }

  const loadEvents = async (query?: string) => {
    try {
      setIsSearching(true)
      setError(null)
      
      const params = new URLSearchParams({
        context_id: contextId,
        max_results: '50',
        calendar_id: selectedCalendar
      })
      
      if (query) {
        params.append('search', query)
      } else {
        params.append('query', currentFilter)
      }
      
      const response = await fetch(`/api/google-calendar/events?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setEvents(result.events || [])
      } else {
        setError(result.error || '获取事件失败')
      }
    } catch (error) {
      console.error('加载Google Calendar事件失败:', error)
      setError('加载事件失败')
    } finally {
      setIsSearching(false)
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadEvents(searchQuery)
    } else {
      loadEvents()
    }
  }

  const handleQuickFilter = (filter: string) => {
    setCurrentFilter(filter)
    setSearchQuery('')
  }

  const handleConnect = async () => {
    try {
      const response = await fetch(`/api/google-calendar/auth?context_id=${contextId}`)
      const result = await response.json()
      
      if (result.success && result.authUrl) {
        window.location.href = result.authUrl
      } else {
        setError(result.error || 'Failed to get auth URL')
      }
    } catch (error) {
      console.error('Google Calendar连接失败:', error)
      setError('连接失败')
    }
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch(`/api/google-calendar/status?context_id=${contextId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConnectionStatus({ connected: false, status: 'disconnected', message: '已断开连接' })
        setEvents([])
        setCalendars([])
      }
    } catch (error) {
      console.error('断开连接失败:', error)
      setError('断开连接失败')
    }
  }

  const formatEventTime = (event: CalendarEvent) => {
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

  const getEventStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'tentative': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAttendeeStatusColor = (responseStatus: string) => {
    switch (responseStatus) {
      case 'accepted': return 'text-green-600'
      case 'declined': return 'text-red-600'
      case 'tentative': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  // 检测URL参数中的成功状态和倒计时
  useEffect(() => {
    const success = searchParams.get('calendar_success')
    if (success === 'true') {
      setShowSuccess(true)
      setCountdown(5)
      // 连接成功后立即重新加载连接状态
      loadConnectionStatus()
      
      // 倒计时
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            setShowSuccess(false)
            // 跳转回数据源设置页面
            window.location.href = `/contexts/${contextId}/settings?tab=data-sources`
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(countdownInterval)
    }
  }, [searchParams, contextId])

  // 加载连接状态
  useEffect(() => {
    loadConnectionStatus()
  }, [contextId])

  // 当连接状态改变时加载日历和事件
  useEffect(() => {
    if (connectionStatus?.connected) {
      loadCalendars()
      loadEvents()
    }
  }, [connectionStatus, currentFilter, selectedCalendar])

  // 如果没有连接
  if (!connectionStatus?.connected) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Google Calendar</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' ? 'Google日历服务集成' : 'Google Calendar Service Integration'}
              </p>
            </div>
          </div>
        </div>

        {showSuccess && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 mb-6">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {language === 'zh' 
                ? `🎉 Google Calendar连接成功！${countdown}秒后自动返回数据源列表...`
                : `🎉 Google Calendar connected successfully! Redirecting to data sources in ${countdown} seconds...`}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              {language === 'zh' ? '连接Google Calendar' : 'Connect Google Calendar'}
            </CardTitle>
            <CardDescription>
              {language === 'zh' 
                ? '连接您的Google Calendar账户以访问日程、会议和提醒事项'
                : 'Connect your Google Calendar account to access schedules, meetings and reminders'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {connectionStatus?.status === 'token_expired' && (
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  {language === 'zh' 
                    ? '⚠️ 授权已过期，请重新连接Google Calendar'
                    : '⚠️ Authorization expired, please reconnect Google Calendar'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '连接后您可以：' : 'After connecting you can:'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-green-600" />
                  {language === 'zh' ? '查看日程' : 'View events'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Search className="w-4 h-4 text-blue-600" />
                  {language === 'zh' ? '搜索事件' : 'Search events'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-purple-600" />
                  {language === 'zh' ? '会议提醒' : 'Meeting reminders'}
                </div>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === 'zh' ? '连接Google Calendar' : 'Connect Google Calendar'}
            </Button>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              <Shield className="w-3 h-3 inline mr-1" />
              {language === 'zh' 
                ? '我们只读取您的日历事件，不会创建或修改任何内容'
                : 'We only read your calendar events and never create or modify anything'}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          onClick={() => window.history.back()}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'zh' ? '返回' : 'Back'}
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Google Calendar</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {connectionStatus.userInfo?.email && (
                  <span className="text-green-600 font-medium">
                    {connectionStatus.userInfo.email}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => loadEvents()}
              variant="outline"
              size="sm"
              disabled={isSearching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSearching ? 'animate-spin' : ''}`} />
              {language === 'zh' ? '刷新' : 'Refresh'}
            </Button>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              {language === 'zh' ? '断开连接' : 'Disconnect'}
            </Button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 mb-6">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {language === 'zh' 
              ? `🎉 Google Calendar连接成功！${countdown}秒后自动返回数据源列表...`
              : `🎉 Google Calendar connected successfully! Redirecting to data sources in ${countdown} seconds...`}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 mb-6">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      {connectionStatus.calendarStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{connectionStatus.calendarStats.totalCalendars || '0'}</div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '日历' : 'Calendars'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{connectionStatus.calendarStats.upcomingEvents || '0'}</div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '即将到来' : 'Upcoming'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{events.length}</div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '当前显示' : 'Currently Shown'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和过滤 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={language === 'zh' ? '搜索事件...' : 'Search events...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Select value={selectedCalendar} onValueChange={setSelectedCalendar}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">
                    {language === 'zh' ? '主日历' : 'Primary Calendar'}
                  </SelectItem>
                  {calendars.map((calendar) => (
                    <SelectItem key={calendar.id} value={calendar.id}>
                      {calendar.summary}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'upcoming', label: language === 'zh' ? '即将到来' : 'Upcoming' },
              { key: 'today', label: language === 'zh' ? '今天' : 'Today' },
              { key: 'week', label: language === 'zh' ? '本周' : 'This Week' }
            ].map((filter) => (
              <Button
                key={filter.key}
                onClick={() => handleQuickFilter(filter.key)}
                variant={currentFilter === filter.key ? "default" : "outline"}
                size="sm"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 事件列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">{language === 'zh' ? '加载中...' : 'Loading...'}</span>
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {language === 'zh' ? '没有找到事件' : 'No events found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {language === 'zh' ? '尝试调整搜索条件或检查日历设置' : 'Try adjusting search criteria or check calendar settings'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className="transition-all hover:shadow-md">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                        {event.summary}
                      </h3>
                      <Badge className={getEventStatusColor(event.status)}>
                        {event.status === 'confirmed' ? (language === 'zh' ? '已确认' : 'Confirmed') :
                         event.status === 'tentative' ? (language === 'zh' ? '待定' : 'Tentative') :
                         event.status === 'cancelled' ? (language === 'zh' ? '已取消' : 'Cancelled') : event.status}
                      </Badge>
                      {event.recurring && (
                        <Badge variant="outline" className="text-xs">
                          {language === 'zh' ? '重复' : 'Recurring'}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatEventTime(event)}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </span>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {event.description}
                      </p>
                    )}

                    {event.attendees && event.attendees.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Users className="w-3 h-3" />
                          {language === 'zh' ? '参与者' : 'Attendees'} ({event.attendees.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {event.attendees.slice(0, 3).map((attendee, index) => (
                            <span
                              key={index}
                              className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${getAttendeeStatusColor(attendee.responseStatus)}`}
                            >
                              {attendee.displayName || attendee.email}
                            </span>
                          ))}
                          {event.attendees.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{event.attendees.length - 3} {language === 'zh' ? '更多' : 'more'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {event.organizer && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        {language === 'zh' ? '组织者：' : 'Organizer: '}
                        {event.organizer.displayName || event.organizer.email}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => window.open(event.htmlLink, '_blank')}
                      variant="ghost"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}