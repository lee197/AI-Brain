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

export default function ContextDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user, loading } = useAuth()
  const [context, setContext] = useState<Context | null>(null)
  const [loadingContext, setLoadingContext] = useState(true)
  const [message, setMessage] = useState('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [messages, setMessages] = useState<Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    source?: 'ai' | 'slack' | 'user'
    author?: {
      name: string
      avatar?: string
    }
    channel?: string
    metadata?: {
      channelId?: string
      messageId?: string
    }
  }>>([])
  const [isSending, setIsSending] = useState(false)
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const contextId = params.id as string

  // 动态数据源状态
  const dataSources = [
    { 
      name: 'Slack', 
      icon: Slack, 
      status: slackStatus === 'connected' ? 'connected' : 
              slackStatus === 'loading' ? 'syncing' : 'disconnected',
      color: slackStatus === 'connected' ? 'text-green-500' : 
             slackStatus === 'loading' ? 'text-yellow-500' : 'text-gray-400'
    },
    { name: 'Jira', icon: FileText, status: 'syncing', color: 'text-yellow-500' },
    { name: 'GitHub', icon: Github, status: 'connected', color: 'text-green-500' },
    { name: 'Google Drive', icon: FileText, status: 'error', color: 'text-red-500' },
  ]

  // Quick prompt suggestions
  const quickPrompts = [
    { title: t.chat.quickPrompts.todaySchedule, prompt: t.chat.quickPrompts.todaySchedulePrompt, icon: Clock },
    { title: t.chat.quickPrompts.createTask, prompt: t.chat.quickPrompts.createTaskPrompt, icon: Plus },
    { title: t.chat.quickPrompts.projectStatus, prompt: t.chat.quickPrompts.projectStatusPrompt, icon: BarChart3 },
    { title: t.chat.quickPrompts.teamCollaboration, prompt: t.chat.quickPrompts.teamCollaborationPrompt, icon: MessageSquare },
    { title: t.chat.quickPrompts.codeReview, prompt: t.chat.quickPrompts.codeReviewPrompt, icon: Github },
    { title: t.chat.quickPrompts.dataAnalysis, prompt: t.chat.quickPrompts.dataAnalysisPrompt, icon: BarChart3 },
  ]

  // 发送消息功能
  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: message.trim(),
      timestamp: new Date()
    }

    // 添加用户消息
    setMessages(prev => [...prev, userMessage])
    const messageContent = message.trim()
    setMessage('')
    setIsSending(true)

    try {
      // 优先尝试Gemini API，如果失败则使用原有的API
      let response = await fetch('/api/ai/chat-gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          contextId: contextId,
        }),
      })
      
      // 如果Gemini API失败，降级到原有API
      if (!response.ok) {
        response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageContent,
            contextId: contextId,
            aiModel: 'openai'
          }),
        })
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.response || '抱歉，我暂时无法回复您的消息。',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])
      setIsSending(false)
    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 添加错误消息
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: '抱歉，我遇到了一些技术问题，请稍后再试。您也可以尝试重新发送您的消息。',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
      setIsSending(false)
    }
  }

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 填充快速提示词
  const handleQuickPrompt = (prompt: string) => {
    setMessage(prompt)
  }

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

  // 复制消息内容
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
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


  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 当消息更新时自动滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages, isSending])

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

  // Slack实时消息订阅
  useEffect(() => {
    if (!contextId) return

    const supabase = createClient()
    
    // 订阅Slack消息广播
    const channel = supabase
      .channel(`context-${contextId}`)
      .on('broadcast', { event: 'slack_message_received' }, (payload) => {
        const slackMessage = payload.payload
        console.log('Received Slack message:', slackMessage)
        
        // 添加到消息列表
        setMessages(prev => [...prev, {
          id: slackMessage.id,
          role: 'assistant' as const,
          content: slackMessage.content || slackMessage.text || 'Slack消息',
          source: 'slack',
          author: {
            name: slackMessage.metadata?.user_name || 'Slack User',
            avatar: slackMessage.metadata?.avatar || ''
          },
          channel: slackMessage.metadata?.channel_name || 'channel',
          timestamp: new Date(slackMessage.created_at || Date.now()),
          metadata: {
            channelId: slackMessage.metadata?.channel_id,
            messageId: slackMessage.metadata?.timestamp
          }
        }])
      })
      .subscribe()

    console.log('Subscribed to Slack messages for context:', contextId)

    return () => {
      console.log('Unsubscribing from Slack messages')
      supabase.removeChannel(channel)
    }
  }, [contextId])

  // 检查Slack连接状态
  useEffect(() => {
    if (contextId) {
      checkSlackStatus()
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

      {/* 主对话区域 */}
      <div className="flex-1 flex flex-col">

        {/* 对话内容区域 */}
        <div className="flex-1 overflow-y-auto" id="messages-container">
          <div className="max-w-4xl mx-auto">
            <div className="p-6">
              {/* 欢迎消息 */}
              <div className="flex gap-4 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-tl-md p-4 max-w-3xl">
                    <p className="text-gray-800 dark:text-gray-200 mb-2">
                      👋 {t.chat.messages.aiGreeting.replace('{contextName}', context.name)}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {t.chat.messages.aiGreetingDesc}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-4">{t.chat.messages.justNow}</p>
                </div>
              </div>

              {/* 对话消息列表 */}
              {messages.map((msg) => (
                <div key={msg.id} className={`group flex gap-4 mb-6 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                      {msg.source === 'slack' ? (
                        msg.author?.avatar ? (
                          <img 
                            src={msg.author.avatar} 
                            alt={msg.author.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                            <Slack className="w-5 h-5 text-white" />
                          </div>
                        )
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">AI</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex-1 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                    <div className={`rounded-2xl p-4 max-w-3xl ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-md ml-auto'
                        : msg.source === 'slack'
                        ? 'bg-purple-50 dark:bg-purple-900/20 text-gray-800 dark:text-gray-200 rounded-tl-md border border-purple-200 dark:border-purple-800'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-md'
                    }`}>
                      <div className="whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert">
                        {msg.content.split('\n').map((line, index) => {
                          // 处理Markdown格式
                          if (line.startsWith('```')) {
                            return <div key={index} className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono mt-2">{line.replace(/```/g, '')}</div>
                          }
                          if (line.includes('**') && line.includes('频道')) {
                            // 处理格式化的Slack消息头部
                            return (
                              <div key={index} className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                                <Slack className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                  {line.replace(/💬|\*\*/g, '').trim()}
                                </span>
                              </div>
                            )
                          }
                          return line ? <p key={index} className="mb-1">{line}</p> : <br key={index} />
                        })}
                      </div>
                    </div>
                    <div className={`flex items-center justify-between mt-2 ${
                      msg.role === 'user' ? 'mr-4 flex-row-reverse' : 'ml-4'
                    }`}>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(msg.timestamp)}
                        {msg.source === 'slack' && (
                          <span className="ml-2 text-purple-600 dark:text-purple-400">{t.chat.messages.fromSlack}</span>
                        )}
                      </p>
                      
                      {/* 消息操作按钮 */}
                      {msg.role === 'assistant' && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700"
                            onClick={() => copyMessage(msg.content)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          
                          {slackConnected && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs hover:bg-purple-100 dark:hover:bg-purple-900/20"
                              onClick={() => shareToSlack(msg)}
                            >
                              <Share className="w-3 h-3" />
                              <span className="ml-1">{t.chat.messages.shareToSlack}</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                        {user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* 正在输入指示器 */}
              {isSending && (
                <div className="flex gap-4 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                    <span className="text-white font-bold text-sm">AI</span>
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-tl-md p-4 max-w-3xl">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{t.chat.messages.aiThinking}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* 滚动锚点 */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* 底部输入区域 */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.chat.input.placeholder}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    disabled={isSending}
                  />
                  <Button
                    size="sm"
                    onClick={handleSendMessage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                    disabled={!message.trim() || isSending}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Quick Prompts 快速提示词 - 紧凑版 */}
              <div className="mt-3">
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((prompt, index) => {
                    const Icon = prompt.icon
                    return (
                      <button
                        key={index}
                        onClick={() => handleQuickPrompt(prompt.prompt)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs rounded-md transition-colors"
                        title={prompt.prompt}
                      >
                        <Icon className="w-3 h-3" />
                        <span className="font-medium">{prompt.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
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