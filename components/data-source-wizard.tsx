'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/language-context'
import { 
  MessageSquare, 
  Database, 
  Github, 
  Mail, 
  FolderOpen, 
  Calendar,
  Users, 
  BrainCircuit, 
  FolderSync, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Star, 
  Hash, 
  AtSign, 
  Search, 
  MessageCircle,
  ClipboardList,
  CalendarDays,
  GitBranch,
  Code,
  FileText,
  Loader2,
  Settings,
  XCircle,
  Zap,
  BarChart3,
  TrendingUp,
  Monitor,
  Share,
  LinkIcon,
  Phone,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
// import SlackIntegrationManager from '@/components/slack/slack-integration-manager'

// 定义连接状态的类型
interface ConnectionStatus {
  connected: boolean
  username?: string
  teamName?: string
  lastSync?: string
  connectedAt?: string
}

export default function DataSourceWizard() {
  const params = useParams()
  const contextId = params.id as string
  const { t, language } = useLanguage()
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [showConnectionToast, setShowConnectionToast] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [connectedSources, setConnectedSources] = useState<string[]>([])
  const [showSlackManager, setShowSlackManager] = useState(false)
  const [slackConnected, setSlackConnected] = useState(false)
  const [slackConnectionStatus, setSlackConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [slackChannelStats, setSlackChannelStats] = useState<{
    configuredChannels: number
    totalChannels: number
  } | null>(null)
  const [isLoadingConnections, setIsLoadingConnections] = useState(true) // 添加全局加载状态
  const [isRefreshing, setIsRefreshing] = useState(false) // 手动刷新状态
  const [loadingButtons, setLoadingButtons] = useState<Set<string>>(new Set()) // 按钮级别的加载状态

  // 检查各个数据源的连接状态
  useEffect(() => {
    checkAllConnectionStatuses()
  }, [contextId])

  const checkAllConnectionStatuses = async () => {
    // 设置所有按钮的加载状态
    const dataSourceIds = ['slack', 'gmail', 'google-drive', 'google-calendar', 'jira']
    setLoadingButtons(new Set(dataSourceIds.filter(id => !connectedSources.includes(id))))
    setIsLoadingConnections(true) // 开始加载
    const connected: string[] = []
    
    try {
      console.log('🚀 使用批量状态检查API...')
      const startTime = Date.now()
      
      // 使用新的批量状态检查API
      const response = await fetch(`/api/data-sources/status?context_id=${contextId}`)
      
      if (response.ok) {
        const data = await response.json()
        const endTime = Date.now()
        
        console.log(`✅ 批量状态检查完成，耗时: ${endTime - startTime}ms`)
        console.log('📊 状态检查结果:', data)
        
        if (data.success && data.statuses) {
          // 处理Slack状态
          if (data.statuses.slack && data.statuses.slack.connected) {
            connected.push('slack')
            setSlackConnected(true)
            setSlackConnectionStatus(data.statuses.slack)
          }
          
          // 处理Gmail状态
          if (data.statuses.gmail && data.statuses.gmail.connected) {
            connected.push('gmail')
          }
          
          // 处理Google Drive状态
          if (data.statuses.googleDrive && data.statuses.googleDrive.connected) {
            connected.push('google-drive')
          }
          
          // 处理Google Calendar状态
          if (data.statuses.googleCalendar && data.statuses.googleCalendar.connected) {
            connected.push('google-calendar')
          }
          
          // 显示性能信息
          if (data.timing) {
            console.log(`📈 性能统计: 总耗时${data.timing.duration}ms, 检查${data.timing.checkedSources}个, 缓存${data.timing.cachedSources}个`)
          }
        }
      } else {
        console.error('批量状态检查API失败，回退到单独检查')
        // 如果批量API失败，回退到原来的单独检查方式
        await checkIndividualStatuses(connected)
      }
    } catch (error) {
      console.error('批量状态检查失败，回退到单独检查:', error)
      // API失败时回退到原来的方式
      await checkIndividualStatuses(connected)
    }

    setConnectedSources(connected)
    setLoadingButtons(new Set()) // 清除所有按钮加载状态
    setIsLoadingConnections(false) // 加载完成
  }

  // 回退方案：单独检查各个数据源状态
  const checkIndividualStatuses = async (connected: string[]) => {
    // 检查Slack连接状态
    try {
      const slackResponse = await fetch(`/api/slack/config?contextId=${contextId}`)
      if (slackResponse.ok) {
        const slackData = await slackResponse.json()
        if (slackData.config && slackData.config.isConnected) {
          connected.push('slack')
          setSlackConnected(true)
          setSlackConnectionStatus(slackData.config)
        }
      }
    } catch (error) {
      console.error('检查Slack连接状态失败:', error)
    }

    // 检查Gmail连接状态
    try {
      const gmailResponse = await fetch(`/api/gmail/status?context_id=${contextId}`)
      if (gmailResponse.ok) {
        const gmailData = await gmailResponse.json()
        if (gmailData.connected) {
          connected.push('gmail')
        }
      }
    } catch (error) {
      console.error('检查Gmail连接状态失败:', error)
    }

    // 检查Google Drive连接状态
    try {
      const driveResponse = await fetch(`/api/google-drive/status?context_id=${contextId}`)
      if (driveResponse.ok) {
        const driveData = await driveResponse.json()
        if (driveData.connected) {
          connected.push('google-drive')
        }
      }
    } catch (error) {
      console.error('检查Google Drive连接状态失败:', error)
    }

    // 检查Google Calendar连接状态
    try {
      const calendarResponse = await fetch(`/api/google-calendar/status?context_id=${contextId}`)
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json()
        if (calendarData.connected) {
          connected.push('google-calendar')
        }
      }
    } catch (error) {
      console.error('检查Google Calendar连接状态失败:', error)
    }
  }

  // 手动刷新状态（清除缓存）
  const handleRefreshStatus = async () => {
    setIsRefreshing(true)
    
    try {
      // 首先清除缓存
      await fetch(`/api/data-sources/status?context_id=${contextId}`, { method: 'DELETE' })
      console.log('🗑️ 已清除状态缓存，正在重新检查...')
      
      // 然后重新检查状态
      await checkAllConnectionStatuses()
    } catch (error) {
      console.error('刷新状态失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 检查Slack频道配置
  useEffect(() => {
    if (slackConnected) {
      checkSlackChannelConfig()
    }
  }, [slackConnected, contextId])

  const checkSlackChannelConfig = async () => {
    try {
      const response = await fetch(`/api/slack/channel-config?contextId=${contextId}`)
      if (response.ok) {
        const data = await response.json()
        setSlackChannelStats({
          configuredChannels: data.configuredChannels || 0,
          totalChannels: data.totalAvailableChannels || 0
        })
      }
    } catch (error) {
      console.error('检查Slack频道配置失败:', error)
    }
  }

  const dataSources = [
    {
      id: 'slack',
      name: 'Slack',
      icon: MessageSquare,
      priority: 1,
      difficulty: 'easy',
      setupTime: '2分钟',
      badge: language === 'zh' ? '即时通讯' : 'Messaging',
      badgeColor: 'bg-purple-600',
      title: 'Slack',
      description: language === 'zh'
        ? '团队协作平台 - 实时消息、频道对话、文件共享'
        : 'Team Collaboration Platform - Real-time messages, channel conversations, file sharing',
      benefits: [
        {
          icon: MessageCircle,
          text: language === 'zh' ? '实时消息' : 'Real-time messages'
        },
        {
          icon: Hash,
          text: language === 'zh' ? '频道对话' : 'Channel conversations'
        },
        {
          icon: AtSign,
          text: language === 'zh' ? '@提及追踪' : '@Mention tracking'
        }
      ],
      stats: {
        messages: '12.5k+',
        channels: 45,
        users: 128
      },
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'jira',
      name: 'Jira',
      icon: ClipboardList,
      priority: 2,
      difficulty: 'medium',
      setupTime: '5分钟',
      badge: language === 'zh' ? '项目管理' : 'Project',
      badgeColor: 'bg-blue-600',
      title: 'Jira',
      description: language === 'zh'
        ? '项目管理工具 - 任务跟踪、冲刺计划、问题管理'
        : 'Project Management Tool - Task tracking, sprint planning, issue management',
      benefits: [
        {
          icon: ClipboardList,
          text: language === 'zh' ? '任务追踪' : 'Task tracking'
        },
        {
          icon: Users,
          text: language === 'zh' ? '团队协作' : 'Team collaboration'
        },
        {
          icon: CalendarDays,
          text: language === 'zh' ? '冲刺管理' : 'Sprint management'
        }
      ],
      stats: {
        projects: 12,
        issues: 456,
        sprints: 8
      },
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: Mail,
      priority: 3,
      difficulty: 'easy',
      setupTime: '2分钟',
      badge: language === 'zh' ? '邮件' : 'Email',
      badgeColor: 'bg-red-600',
      title: 'Gmail',
      description: language === 'zh'
        ? 'Google邮件服务 - 同步邮件、搜索内容、管理收件箱'
        : 'Google Email Service - Sync emails, search content, manage inbox',
      benefits: [
        {
          icon: Mail,
          text: language === 'zh' ? '邮件同步' : 'Email sync'
        },
        {
          icon: Search,
          text: language === 'zh' ? '内容搜索' : 'Content search'
        },
        {
          icon: FolderSync,
          text: language === 'zh' ? '标签管理' : 'Label management'
        }
      ],
      stats: {
        emails: '5.2k',
        unread: 23,
        labels: 15
      },
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      icon: FolderOpen,
      priority: 4,
      difficulty: 'easy',
      setupTime: '2分钟',
      badge: language === 'zh' ? '云盘' : 'Storage',
      badgeColor: 'bg-blue-600',
      title: 'Google Drive',
      description: language === 'zh'
        ? 'Google云端硬盘 - 访问文档、表格、演示文稿和文件'
        : 'Google Cloud Storage - Access docs, sheets, presentations and files',
      benefits: [
        {
          icon: FolderOpen,
          text: language === 'zh' ? '文件访问' : 'File access'
        },
        {
          icon: FileText,
          text: language === 'zh' ? '文档搜索' : 'Document search'
        },
        {
          icon: Share,
          text: language === 'zh' ? '共享管理' : 'Share management'
        }
      ],
      stats: {
        files: 892,
        folders: 67,
        shared: 134
      },
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'google-calendar',
      name: 'Google Calendar',
      icon: Calendar,
      priority: 5,
      difficulty: 'easy',
      setupTime: '2分钟',
      badge: language === 'zh' ? '日历' : 'Calendar',
      badgeColor: 'bg-green-600',
      title: 'Google Calendar',
      description: language === 'zh'
        ? 'Google日历服务 - 管理日程、会议和提醒事项'
        : 'Google Calendar Service - Manage schedules, meetings and reminders',
      benefits: [
        {
          icon: Calendar,
          text: language === 'zh' ? '日程管理' : 'Schedule management'
        },
        {
          icon: Users,
          text: language === 'zh' ? '会议安排' : 'Meeting scheduling'
        },
        {
          icon: Clock,
          text: language === 'zh' ? '提醒通知' : 'Reminders'
        }
      ],
      stats: {
        events: 234,
        upcoming: 12,
        calendars: 5
      },
      color: 'from-green-500 to-green-600'
    }
  ]

  const handleConnect = async (sourceId: string) => {
    setSelectedSource(sourceId)
    
    if (sourceId === 'slack') {
      setShowSlackManager(true)
      return
    }

    if (sourceId === 'gmail') {
      setIsConnecting(true)
      setConnectionError(null)
      
      try {
        const response = await fetch(`/api/gmail/auth?context_id=${contextId}`)
        const data = await response.json()
        
        if (data.success && data.authUrl) {
          window.location.href = data.authUrl
        } else {
          throw new Error(data.error || 'Failed to generate auth URL')
        }
      } catch (error) {
        console.error('Gmail connection error:', error)
        setConnectionError(language === 'zh' ? 'Gmail连接失败' : 'Gmail connection failed')
        setIsConnecting(false)
      }
      return
    }

    if (sourceId === 'google-drive') {
      setIsConnecting(true)
      setConnectionError(null)
      
      try {
        const response = await fetch(`/api/google-drive/auth?context_id=${contextId}`)
        const data = await response.json()
        
        if (data.success && data.authUrl) {
          window.location.href = data.authUrl
        } else {
          throw new Error(data.error || 'Failed to generate auth URL')
        }
      } catch (error) {
        console.error('Google Drive connection error:', error)
        setConnectionError(language === 'zh' ? 'Google Drive连接失败' : 'Google Drive connection failed')
        setIsConnecting(false)
      }
      return
    }

    if (sourceId === 'google-calendar') {
      setIsConnecting(true)
      setConnectionError(null)
      
      try {
        const response = await fetch(`/api/google-calendar/auth?context_id=${contextId}`)
        const data = await response.json()
        
        if (data.success && data.authUrl) {
          window.location.href = data.authUrl
        } else {
          throw new Error(data.error || 'Failed to generate auth URL')
        }
      } catch (error) {
        console.error('Google Calendar connection error:', error)
        setConnectionError(language === 'zh' ? 'Google Calendar连接失败' : 'Google Calendar connection failed')
        setIsConnecting(false)
      }
      return
    }

    // 其他数据源暂时显示提示
    setShowSuccess(true)
    setTimeout(() => {
      setConnectedSources([...connectedSources, sourceId])
      setShowSuccess(false)
      setIsConnecting(false)
    }, 2000)
  }

  const handleDisconnect = async (sourceId: string) => {
    if (sourceId === 'gmail') {
      try {
        await fetch(`/api/gmail/status?context_id=${contextId}`, { method: 'DELETE' })
        setConnectedSources(connectedSources.filter(id => id !== 'gmail'))
      } catch (error) {
        console.error('Disconnect Gmail failed:', error)
      }
    } else if (sourceId === 'google-drive') {
      try {
        await fetch(`/api/google-drive/status?context_id=${contextId}`, { method: 'DELETE' })
        setConnectedSources(connectedSources.filter(id => id !== 'google-drive'))
      } catch (error) {
        console.error('Disconnect Google Drive failed:', error)
      }
    } else if (sourceId === 'google-calendar') {
      try {
        await fetch(`/api/google-calendar/status?context_id=${contextId}`, { method: 'DELETE' })
        setConnectedSources(connectedSources.filter(id => id !== 'google-calendar'))
      } catch (error) {
        console.error('Disconnect Google Calendar failed:', error)
      }
    }
  }

  // 对数据源进行排序：已连接的放在前面
  const sortedDataSources = [...dataSources].sort((a, b) => {
    const aConnected = connectedSources.includes(a.id)
    const bConnected = connectedSources.includes(b.id)
    
    if (aConnected && !bConnected) return -1
    if (!aConnected && bConnected) return 1
    
    return a.priority - b.priority
  })

  return (
    <div className="space-y-6 relative">
      {/* 状态刷新按钮 */}
      <div className="flex justify-between items-center">
        <div></div>
        <Button
          onClick={handleRefreshStatus}
          disabled={isRefreshing || isLoadingConnections}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {language === 'zh' 
            ? (isRefreshing ? '刷新中...' : '刷新状态') 
            : (isRefreshing ? 'Refreshing...' : 'Refresh Status')}
        </Button>
      </div>
      {/* 移除全局加载遮罩，改为按钮级别的加载状态 */}

      {/* 成功提示 */}
      {showSuccess && (
        <div className="text-center text-green-600 dark:text-green-400 py-2">
          {language === 'zh' 
            ? '✅ 连接成功，正在同步数据...'
            : '✅ Connected successfully, syncing data...'}
        </div>
      )}

      {/* 已连接的数据源 */}
      {connectedSources.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            {language === 'zh' ? '已连接的数据源' : 'Connected Data Sources'}
          </h3>
          <div className="pl-6 border-l-2 border-green-200 dark:border-green-800 space-y-4">
            {sortedDataSources.filter(s => connectedSources.includes(s.id)).map(source => {
              const Icon = source.icon
              
              return (
                <Card 
                  key={source.id}
                  className="relative overflow-hidden transition-all duration-300 border-green-500 bg-green-50/50 dark:bg-green-950/10"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${source.color} flex items-center justify-center text-white shadow-lg`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {source.title}
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {source.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-6">
                        {source.benefits.map((benefit, i) => {
                          const BenefitIcon = benefit.icon
                          return (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <BenefitIcon className="w-4 h-4 text-gray-400" />
                              <span>{benefit.text}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => {
                            // Navigate to real-time messages page for the data source
                            const routeMap: { [key: string]: string } = {
                              'slack': `/contexts/${contextId}/slack/messages`,
                              'gmail': `/contexts/${contextId}/gmail/messages`,
                              'google-drive': `/contexts/${contextId}/google-drive/messages`,
                              'google-calendar': `/contexts/${contextId}/google-calendar/messages`,
                              'jira': `/contexts/${contextId}/jira/messages`,
                              'github': `/contexts/${contextId}/github/messages`,
                              'notion': `/contexts/${contextId}/notion/messages`
                            }
                            if (routeMap[source.id]) {
                              window.location.href = routeMap[source.id]
                            }
                          }}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                        >
                          <Monitor className="w-4 h-4 mr-1" />
                          {language === 'zh' ? '查看实时状态' : 'View Real-time'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDisconnect(source.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {language === 'zh' ? '断开' : 'Disconnect'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 可用的数据源 */}
      {sortedDataSources.filter(s => !connectedSources.includes(s.id)).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-blue-600" />
            {language === 'zh' ? '可用的数据源' : 'Available Data Sources'}
            {loadingButtons.size > 0 && (
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
            )}
          </h3>
          <div className="space-y-4">
            {sortedDataSources.filter(s => !connectedSources.includes(s.id)).map((source, index) => {
              const Icon = source.icon
              const isCurrentlyConnecting = selectedSource === source.id && isConnecting
              const isCheckingStatus = loadingButtons.has(source.id)
              const firstUnconnected = sortedDataSources.filter(s => !connectedSources.includes(s.id))[0]?.id === source.id
              
              return (
                <Card 
                  key={source.id}
                  className="relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                >
                  {firstUnconnected && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-green-400 text-white px-4 py-1 rounded-bl-lg text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {language === 'zh' ? '建议首选' : 'Start Here'}
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${source.color} flex items-center justify-center text-white shadow-lg`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <div>
                          <CardTitle>{source.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {source.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {source.setupTime}
                        </Badge>
                        <Badge className={`${source.badgeColor} text-white`}>
                          {source.badge}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-6">
                        {source.benefits.map((benefit, i) => {
                          const BenefitIcon = benefit.icon
                          return (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <BenefitIcon className="w-4 h-4 text-gray-400" />
                              <span>{benefit.text}</span>
                            </div>
                          )
                        })}
                      </div>
                      <Button
                        onClick={() => handleConnect(source.id)}
                        disabled={isCurrentlyConnecting || isCheckingStatus}
                        className="min-w-[140px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        {isCurrentlyConnecting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {language === 'zh' ? '连接中...' : 'Connecting...'}
                          </>
                        ) : isCheckingStatus ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {language === 'zh' ? '检查状态中...' : 'Checking Status...'}
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            {language === 'zh' ? '一键连接' : 'Quick Connect'}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* 底部提示 */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <AlertCircle className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <strong>{language === 'zh' ? '💡 小贴士：' : '💡 Pro Tip: '}</strong>
          {language === 'zh' 
            ? '连接更多数据源，AI Brain 将提供更准确、更有价值的洞察。建议至少连接2个数据源以获得最佳体验。'
            : 'Connect more data sources to get more accurate and valuable insights from AI Brain. We recommend connecting at least 2 sources for the best experience.'}
        </AlertDescription>
      </Alert>

      {/* Slack集成管理器 */}
      {/* {showSlackManager && (
        <SlackIntegrationManager 
          contextId={contextId}
          onClose={() => {
            setShowSlackManager(false)
            checkAllConnectionStatuses()
          }}
        />
      )} */}
    </div>
  )
}