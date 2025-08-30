'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/i18n/language-context'
import { 
  ArrowLeft,
  BrainCircuit,
  Mail,
  Calendar,
  FolderOpen,
  Search,
  RefreshCw,
  Loader2,
  Clock,
  User,
  FileText,
  ExternalLink,
  TrendingUp,
  Zap,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react'

// Type definitions for MCP data
interface GmailMessage {
  id: string
  subject: string
  from: string
  to: string
  date: string
  snippet: string
  isRead: boolean
  isImportant: boolean
  labels: string[]
}

interface CalendarEvent {
  id: string
  summary: string
  start: string
  end: string
  attendees: string[]
  location?: string
  description?: string
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size: number
  modifiedTime: string
  webViewLink: string
  ownedByMe: boolean
}

interface GoogleWorkspaceData {
  gmail: GmailMessage[]
  calendar: CalendarEvent[]
  drive: DriveFile[]
  counts: {
    gmail: number
    calendar: number
    drive: number
  }
  status: {
    connected: boolean
    mcpServer: {
      status: string
      toolsAvailable: number
      authenticationStatus: string
    }
    totalTools: number
  }
}

export default function GoogleWorkspaceMCPMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const contextId = params.id as string
  const [data, setData] = useState<GoogleWorkspaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<'gmail' | 'calendar' | 'drive'>('gmail')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10) // 限制每页显示数量
  const [totalPages, setTotalPages] = useState(1)
  const [countsLoaded, setCountsLoaded] = useState(false)

  useEffect(() => {
    if (!countsLoaded) {
      loadInitialCounts()
    } else {
      loadTabData()
    }
  }, [contextId, selectedTab, currentPage, searchQuery])

  useEffect(() => {
    if (countsLoaded) {
      loadTabData()
    }
  }, [selectedTab, currentPage, searchQuery, countsLoaded])

  // 初始加载：获取所有数据源的计数信息
  const loadInitialCounts = async () => {
    try {
      setLoading(true)
      console.log('📊 Loading Google Workspace MCP initial counts...')
      
      // First check status
      const statusResponse = await fetch(`/api/mcp/google-workspace/status?context_id=${contextId}`)
      const statusData = await statusResponse.json()
      
      if (!statusData.connected) {
        setData({
          gmail: [],
          calendar: [],
          drive: [],
          counts: { gmail: 0, calendar: 0, drive: 0 },
          status: statusData
        })
        setLoading(false)
        setCountsLoaded(true)
        return
      }

      // 并行获取所有数据源的总计数（不获取具体数据，只获取计数）
      const [gmailResponse, calendarResponse, driveResponse] = await Promise.allSettled([
        fetch(`/api/mcp/google-workspace/gmail?context_id=${contextId}&query=in:inbox&page=1&limit=1`).then(r => r.json()),
        fetch(`/api/mcp/google-workspace/calendar?context_id=${contextId}&page=1&limit=1`).then(r => r.json()),
        fetch(`/api/mcp/google-workspace/drive?context_id=${contextId}&query=&page=1&limit=1`).then(r => r.json())
      ])

      const counts = {
        gmail: gmailResponse.status === 'fulfilled' ? (gmailResponse.value.totalCount || 0) : 0,
        calendar: calendarResponse.status === 'fulfilled' ? (calendarResponse.value.totalCount || 0) : 0,
        drive: driveResponse.status === 'fulfilled' ? (driveResponse.value.totalCount || 0) : 0,
      }

      setData({
        gmail: [],
        calendar: [],
        drive: [],
        counts,
        status: statusData
      })

      console.log(`📊 Counts loaded: ${counts.gmail} emails, ${counts.calendar} events, ${counts.drive} files`)
      setCountsLoaded(true)
    } catch (error) {
      console.error('❌ Failed to load initial counts:', error)
      setData({
        gmail: [],
        calendar: [],
        drive: [],
        counts: { gmail: 0, calendar: 0, drive: 0 },
        status: {
          connected: false,
          mcpServer: { status: 'error', toolsAvailable: 0, authenticationStatus: 'error' },
          totalTools: 0
        }
      })
      setCountsLoaded(true)
    } finally {
      setLoading(false)
    }
  }

  // 按需加载：根据选中的tab加载具体数据
  const loadTabData = async () => {
    if (!data) return
    
    try {
      console.log(`📊 Loading ${selectedTab} data...`)
      
      // 构建搜索查询
      const searchParam = searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ''
      const pageParam = `&page=${currentPage}&limit=${itemsPerPage}`
      
      let apiResponse
      if (selectedTab === 'gmail') {
        const baseQuery = searchQuery || 'in:inbox'
        apiResponse = await fetch(`/api/mcp/google-workspace/gmail?context_id=${contextId}&query=${encodeURIComponent(baseQuery)}${pageParam}`).then(r => r.json())
      } else if (selectedTab === 'calendar') {
        apiResponse = await fetch(`/api/mcp/google-workspace/calendar?context_id=${contextId}${searchParam}${pageParam}`).then(r => r.json())
      } else { // drive
        apiResponse = await fetch(`/api/mcp/google-workspace/drive?context_id=${contextId}${searchParam}${pageParam}`).then(r => r.json())
      }

      // 更新数据，保持counts不变
      const updatedData = { ...data }
      
      if (selectedTab === 'gmail') {
        updatedData.gmail = apiResponse.messages || []
      } else if (selectedTab === 'calendar') {
        updatedData.calendar = apiResponse.events || []
      } else {
        updatedData.drive = apiResponse.files || []
      }

      // 更新分页信息
      const totalCount = apiResponse.totalCount || 0
      const calculatedTotalPages = Math.ceil(totalCount / itemsPerPage) || 1
      setTotalPages(calculatedTotalPages)

      setData(updatedData)
      console.log(`📊 ${selectedTab} data loaded: ${totalCount} items (Page ${currentPage}/${calculatedTotalPages})`)
    } catch (error) {
      console.error(`❌ Failed to load ${selectedTab} data:`, error)
    }
  }


  const handleRefresh = async () => {
    setRefreshing(true)
    setCountsLoaded(false) // 重新加载计数
    await loadInitialCounts()
    setRefreshing(false)
  }

  const handleSearch = () => {
    setCurrentPage(1) // 搜索时重置到第一页
    // loadTabData 会通过 useEffect 自动调用
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  const handleTabChange = (tab: 'gmail' | 'calendar' | 'drive') => {
    setSelectedTab(tab)
    setCurrentPage(1) // 切换标签时重置到第一页
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')
  }

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'zh' ? '正在加载 Google Workspace 数据...' : 'Loading Google Workspace data...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/contexts/${contextId}/settings`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'zh' ? '返回设置' : 'Back to Settings'}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <BrainCircuit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Google Workspace (MCP)
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? 'MCP协议实时数据' : 'Real-time MCP Data'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {data?.status.connected ? (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {language === 'zh' ? '已连接' : 'Connected'}
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {language === 'zh' ? '未连接' : 'Disconnected'}
                </Badge>
              )}
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {language === 'zh' ? '刷新' : 'Refresh'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {language === 'zh' ? 'MCP工具' : 'MCP Tools'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.status.totalTools || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gmail</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.counts.gmail || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {language === 'zh' ? '日历' : 'Calendar'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.counts.calendar || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Drive</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {data?.counts.drive || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder={language === 'zh' ? '搜索内容...' : 'Search content...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              <Search className="w-4 h-4 mr-1" />
              {language === 'zh' ? '搜索' : 'Search'}
            </Button>
          </div>

          <div className="flex gap-2">
            {[
              { id: 'gmail', label: 'Gmail', icon: Mail, count: data?.counts.gmail },
              { id: 'calendar', label: language === 'zh' ? '日历' : 'Calendar', icon: Calendar, count: data?.counts.calendar },
              { id: 'drive', label: 'Drive', icon: FolderOpen, count: data?.counts.drive }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={selectedTab === tab.id ? 'default' : 'outline'}
                onClick={() => setSelectedTab(tab.id as any)}
                className="flex items-center gap-2"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <Badge variant="secondary" className="ml-1">
                  {tab.count || 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        {!data?.status.connected ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {language === 'zh' ? 'MCP服务器未连接' : 'MCP Server Not Connected'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {language === 'zh' 
                  ? '请返回设置页面重新连接 Google Workspace MCP 集成'
                  : 'Please return to settings to reconnect Google Workspace MCP integration'}
              </p>
              <Button onClick={() => router.push(`/contexts/${contextId}/settings`)}>
                {language === 'zh' ? '返回设置' : 'Back to Settings'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Gmail Tab */}
            {selectedTab === 'gmail' && (
              <>
                {data.gmail.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchQuery 
                          ? (language === 'zh' ? '没有找到匹配的邮件' : 'No matching emails found')
                          : (language === 'zh' ? '暂无邮件数据' : 'No email data available')}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        {language === 'zh' 
                          ? '尝试搜索其他关键词，或检查您的 Gmail 连接状态'
                          : 'Try searching for different keywords, or check your Gmail connection'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  data.gmail.map((email) => (
                    <Card key={email.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2 mb-1">
                              {email.subject}
                              {email.isImportant && <span className="text-yellow-500">⭐</span>}
                              {!email.isRead && <Badge variant="secondary">未读</Badge>}
                            </CardTitle>
                            <CardDescription>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {email.from}
                                <Clock className="w-4 h-4 ml-2" />
                                {formatDate(email.date)}
                              </div>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 dark:text-gray-400">{email.snippet}</p>
                        {email.labels.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {email.labels.map((label, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}

            {/* Calendar Tab */}
            {selectedTab === 'calendar' && (
              <>
                {data.calendar.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {language === 'zh' ? '暂无即将到来的日程' : 'No upcoming events'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  data.calendar.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <CardTitle>{event.summary}</CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {formatDate(event.start)} - {formatDate(event.end)}
                          </div>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {event.location && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            📍 {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {event.description}
                          </p>
                        )}
                        {event.attendees.length > 0 && (
                          <div className="flex gap-1">
                            <span className="text-sm font-medium">
                              {language === 'zh' ? '参与者:' : 'Attendees:'}
                            </span>
                            <Badge variant="secondary">
                              {event.attendees.length} {language === 'zh' ? '人' : 'people'}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}

            {/* Drive Tab */}
            {selectedTab === 'drive' && (
              <>
                {data.drive.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {language === 'zh' ? '暂无相关文件' : 'No relevant files found'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  data.drive.map((file) => (
                    <Card key={file.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(file.modifiedTime)} • {formatFileSize(file.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {file.ownedByMe && (
                              <Badge variant="secondary">
                                {language === 'zh' ? '我的' : 'Mine'}
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(file.webViewLink, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              {language === 'zh' ? '打开' : 'Open'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {data?.status.connected && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {language === 'zh' ? '上一页' : 'Previous'}
            </Button>

            <div className="flex items-center gap-1">
              {/* Show page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage > totalPages - 3) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}

              {/* Show more pages indicator */}
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    className="w-8 h-8 p-0"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              {language === 'zh' ? '下一页' : 'Next'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Page Info */}
        {data?.status.connected && totalPages > 1 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'zh' 
                ? `第 ${currentPage} 页，共 ${totalPages} 页` 
                : `Page ${currentPage} of ${totalPages}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}