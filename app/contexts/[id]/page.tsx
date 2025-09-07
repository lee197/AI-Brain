'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/i18n/language-context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { UserMenu } from '@/components/user-menu'
import { useAuth } from '@/hooks/use-auth'
import { Context } from '@/types/context'
import { getContextTypeInfo } from '@/lib/context-utils'
import { createClient } from '@/lib/supabase/client'
import { AddToSlackButton } from '@/components/slack/add-to-slack-button'
import { SlackSuccessToast } from '@/components/slack/slack-success-toast'
import { SlackConnectionToggle } from '@/components/slack/slack-connection-toggle'
import { SlackSendMessage } from '@/components/slack/slack-send-message'
import { 
  MessageSquare,
  BarChart3,
  FileText,
  Zap,
  Plus,
  Send,
  Settings,
  Github,
  Slack,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  MoreHorizontal,
  Share,
  Copy,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { EnhancedChat } from '@/components/chat/enhanced-chat'

export default function ContextDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user, loading } = useAuth()
  const [context, setContext] = useState<Context | null>(null)
  const [loadingContext, setLoadingContext] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [slackConnected, setSlackConnected] = useState(false)
  const [showSlackSend, setShowSlackSend] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  } | null>(null)
  const [slackStatus, setSlackStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [isDemo, setIsDemo] = useState(false)

  const contextId = params.id as string

  // 动态数据源状态
  const [googleWorkspaceStatus, setGoogleWorkspaceStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading')

  // 检查Google Workspace MCP状态
  const checkGoogleWorkspaceStatus = async () => {
    try {
      const { GoogleWorkspaceMCPClient } = await import('@/lib/mcp/google-workspace-client')
      const mcpClient = new GoogleWorkspaceMCPClient()
      const isConnected = await mcpClient.checkConnection()
      setGoogleWorkspaceStatus(isConnected ? 'connected' : 'disconnected')
    } catch (error) {
      setGoogleWorkspaceStatus('disconnected')
    }
  }

  const dataSources = [
    { 
      name: 'Slack', 
      icon: Slack, 
      status: slackStatus === 'connected' ? 'connected' : 
              slackStatus === 'loading' ? 'syncing' : 'disconnected',
      color: slackStatus === 'connected' ? 'text-green-500' : 
             slackStatus === 'loading' ? 'text-yellow-500' : 'text-gray-400'
    },
    { 
      name: 'Google Workspace', 
      icon: FileText, 
      status: googleWorkspaceStatus === 'connected' ? 'connected' : 
              googleWorkspaceStatus === 'loading' ? 'syncing' : 'disconnected',
      color: googleWorkspaceStatus === 'connected' ? 'text-green-500' : 
             googleWorkspaceStatus === 'loading' ? 'text-yellow-500' : 'text-gray-400',
      description: 'Gmail + Calendar + Drive (MCP)'
    },
    { name: 'Jira', icon: FileText, status: 'syncing', color: 'text-yellow-500' },
    { name: 'GitHub', icon: Github, status: 'connected', color: 'text-green-500' },
  ]


  // 分享消息到Slack
  const shareToSlack = (message: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }) => {
    setSelectedMessage(message)
    setShowSlackSend(true)
  }


  // 检查Slack连接状态
  const checkSlackStatus = async (isDemo = false) => {
    try {
      const url = isDemo ? '/api/slack/status?demo=true' : '/api/slack/status'
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.status === 'connected') {
        setSlackStatus('connected')
        setSlackConnected(true)
        console.log('✅ Slack已连接:', data.connection?.team || 'Unknown team')
      } else {
        setSlackStatus('disconnected')
        setSlackConnected(false)
        console.log('❌ Slack未连接:', data.message)
      }
    } catch (error) {
      console.error('Error checking Slack status:', error)
      setSlackStatus('disconnected')
      setSlackConnected(false)
    }
  }



  // 检查认证状态
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 加载Context信息
  useEffect(() => {
    const loadContext = async () => {
      if (!contextId) return
      
      try {
        const response = await fetch(`/api/contexts/${contextId}`)
        if (response.ok) {
          const data = await response.json()
          setContext(data.context || data) // Handle both formats
        } else {
          // Context不存在，返回列表页
          router.push('/contexts')
        }
      } catch (error) {
        console.error('加载Context失败:', error)
        router.push('/contexts')
      } finally {
        setLoadingContext(false)
      }
    }

    if (user) {
      loadContext()
    }
  }, [contextId, user, router])

  // Slack实时消息订阅保留在这里，但需要传递给EnhancedChat组件
  // TODO: 将此逻辑移到EnhancedChat组件内或通过props传递消息

  // 检查Slack连接状态
  useEffect(() => {
    if (contextId) {
      checkSlackStatus()
      checkGoogleWorkspaceStatus()
    }
  }, [contextId])

  // 处理URL参数（安装成功/失败）
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('slack_success') === 'true') {
      const isDemoMode = urlParams.get('demo') === 'true'
      
      // 设置状态
      setIsDemo(isDemoMode)
      setShowSuccessToast(true)
      
      // Slack安装成功，重新检查状态
      setTimeout(() => {
        checkSlackStatus(isDemoMode)
        // 清除URL参数
        window.history.replaceState({}, '', window.location.pathname)
      }, 1000)
    }
  }, [])

  if (loading || loadingContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || !context) {
    return null
  }

  const contextTypeInfo = getContextTypeInfo(context.type, language)

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* 左侧边栏 */}
      <div className={`${isCollapsed ? 'w-16' : 'w-80'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
        {/* 侧边栏头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-xl">
                  {contextTypeInfo.icon}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white text-sm">{context?.name || 'Loading...'}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{context?.description || contextTypeInfo.title}</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 h-auto"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* 侧边栏内容 */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* 数据源管理 */}
              <div>
                <div className="mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t.chat.sidebar.dataSourceStatus}</h3>
                </div>
                <div className="space-y-2">
                  {dataSources.map((source, index) => {
                    const Icon = source.icon
                    const statusIcon = source.status === 'connected' ? CheckCircle : 
                                     source.status === 'syncing' ? Clock : 
                                     source.status === 'disconnected' ? AlertCircle : AlertCircle
                    const StatusIcon = statusIcon
                    
                    return (
                      <div 
                        key={index} 
                        className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:dark:bg-blue-900/20 transition-colors">
                            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{source.name}</p>
                              <div className="flex items-center gap-1">
                                <StatusIcon className={`w-4 h-4 ${source.color}`} />
                                <span className={`text-xs font-medium ${
                                  source.status === 'connected' ? 'text-green-600 dark:text-green-400' :
                                  source.status === 'syncing' ? 'text-yellow-600 dark:text-yellow-400' :
                                  'text-gray-500 dark:text-gray-400'
                                }`}>
                                  {source.status === 'connected' ? 
                                    (language === 'zh' ? '已连接' : 'Connected') :
                                    source.status === 'syncing' ? 
                                    (language === 'zh' ? '同步中' : 'Syncing') :
                                    (language === 'zh' ? '未连接' : 'Disconnected')
                                  }
                                </span>
                              </div>
                            </div>
                            
                            {/* 连接状态的详细信息 - 仅显示状态 */}
                            {source.name === 'Slack' && source.status === 'connected' && (
                              <div className="space-y-1.5 mt-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span>{language === 'zh' ? '工作区: AI Brain Team' : 'Workspace: AI Brain Team'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <span>{language === 'zh' ? '已同步 12 个频道' : '12 channels synced'}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* GitHub连接状态信息 */}
                            {source.name === 'GitHub' && source.status === 'connected' && (
                              <div className="space-y-1.5 mt-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span>{language === 'zh' ? '仓库: ai-brain/main' : 'Repository: ai-brain/main'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <span>{language === 'zh' ? '监控 3 个分支' : '3 branches monitored'}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Jira同步状态信息 */}
                            {source.name === 'Jira' && source.status === 'syncing' && (
                              <div className="space-y-1.5 mt-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                                  <span>{language === 'zh' ? '正在同步项目数据...' : 'Syncing project data...'}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Google Workspace连接状态信息 */}
                            {source.name === 'Google Workspace' && source.status === 'connected' && (
                              <div className="space-y-1.5 mt-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                  <span>{language === 'zh' ? 'MCP服务器运行中' : 'MCP server running'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <span>{language === 'zh' ? '25+ 工具可用' : '25+ tools available'}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Google Workspace离线状态信息 */}
                            {source.name === 'Google Workspace' && source.status === 'disconnected' && (
                              <div className="space-y-1.5 mt-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                  <span>{language === 'zh' ? 'MCP服务器离线' : 'MCP server offline'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                  <span>{language === 'zh' ? '使用备用Gmail API' : 'Using fallback Gmail API'}</span>
                                </div>
                              </div>
                            )}
                            
                            {/* Google Drive错误状态信息 */}
                            {source.name === 'Google Drive' && source.status === 'error' && (
                              <div className="space-y-1.5 mt-1">
                                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                                  <span>{language === 'zh' ? '认证已过期' : 'Authentication expired'}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {/* 管理数据源按钮 - 显眼位置 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/contexts/${contextId}/settings?tab=overview`)}
                  className="w-full mt-3 text-sm font-medium border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '管理数据源' : 'Manage Data Sources'}
                </Button>
              </div>

            </div>
          </div>
        )}

        {/* 侧边栏底部 */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {user?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="p-1.5 h-auto">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 主对话区域 - 使用增强聊天组件 */}
      <div className="flex-1 flex flex-col">
        <EnhancedChat
          contextId={contextId}
          user={user}
          slackConnected={slackConnected}
          onShareToSlack={shareToSlack}
        />
      </div>

      {/* Slack成功提示 */}
      {showSuccessToast && (
        <SlackSuccessToast 
          isDemo={isDemo}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      {/* Slack发送消息对话框 */}
      <SlackSendMessage
        isOpen={showSlackSend}
        onClose={() => {
          setShowSlackSend(false)
          setSelectedMessage(null)
        }}
        contextId={contextId}
        defaultMessage={selectedMessage?.content || ''}
        onMessageSent={(result) => {
          console.log('消息已发送到Slack:', result)
        }}
      />
    </div>
  )
}