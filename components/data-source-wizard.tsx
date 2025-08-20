'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/language-context'
import { ConnectionStatusToast } from '@/components/connection-status-toast'
import { SlackIntegrationManager } from '@/components/slack/slack-integration-manager'
import {
  Slack,
  Github,
  FileText,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Loader2,
  Star,
  TrendingUp,
  Users,
  MessageSquare,
  GitBranch,
  ListChecks,
  Settings,
  ExternalLink,
  XCircle,
  Shield
} from 'lucide-react'

interface DataSourceWizardProps {
  contextId: string
  onComplete?: () => void
}

export function DataSourceWizard({ contextId, onComplete }: DataSourceWizardProps) {
  const { t, language } = useLanguage()
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedSources, setConnectedSources] = useState<string[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [showConnectionToast, setShowConnectionToast] = useState(false)
  const [showSlackManager, setShowSlackManager] = useState(false)
  const [slackConfig, setSlackConfig] = useState<any>(null)
  const [slackChannelStats, setSlackChannelStats] = useState<{
    configuredChannels: number
    totalChannels: number
    lastConfigured?: string
  } | null>(null)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)

  // 检测URL参数中的Slack成功状态和加载时检查连接状态
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const slackSuccess = urlParams.get('slack_success')
    const slackConfigured = urlParams.get('slack_configured')
    const isDemo = urlParams.get('demo')
    
    if (slackSuccess === 'true' || slackConfigured === 'true') {
      console.log('🎉 检测到Slack连接成功，更新状态')
      setConnectedSources(prev => [...prev.filter(s => s !== 'slack'), 'slack'])
      setShowSuccess(true)
      
      // 如果是配置成功，稍后刷新频道统计
      if (slackConfigured === 'true') {
        setTimeout(() => {
          fetchSlackChannelStats()
        }, 500)
      }
      
      // 清理URL参数
      const url = new URL(window.location.href)
      url.searchParams.delete('slack_success')
      url.searchParams.delete('slack_configured')
      url.searchParams.delete('demo')
      url.searchParams.delete('team')
      window.history.replaceState({}, '', url.toString())
      
      // 5秒后隐藏成功提示
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } else {
      // 如果没有URL参数，检查实际的连接状态
      checkSlackConnectionStatus()
    }
  }, [])

  // 检查Slack连接状态
  const checkSlackConnectionStatus = async () => {
    try {
      setIsCheckingConnection(true)
      console.log('🔍 检查Slack连接状态...')
      const response = await fetch(`/api/slack/config?contextId=${contextId}`)
      const result = await response.json()
      
      if (result.success && result.config && result.config.isConnected) {
        console.log('✅ 检测到已存在的Slack连接:', result.workspace?.teamName)
        setConnectedSources(prev => [...prev.filter(s => s !== 'slack'), 'slack'])
        
        // 获取频道配置信息
        await fetchSlackChannelStats()
      } else {
        console.log('❌ 未检测到Slack连接')
        setConnectedSources(prev => prev.filter(s => s !== 'slack'))
        setSlackChannelStats(null)
      }
    } catch (error) {
      console.error('检查Slack连接状态失败:', error)
      setConnectedSources(prev => prev.filter(s => s !== 'slack'))
      setSlackChannelStats(null)
    } finally {
      setIsCheckingConnection(false)
    }
  }

  // 获取Slack频道配置统计
  const fetchSlackChannelStats = async () => {
    try {
      console.log('📊 获取Slack频道配置统计...')
      
      // 从新的API端点获取频道配置信息
      const configResponse = await fetch(`/api/slack/channel-config?contextId=${contextId}`)
      const configData = await configResponse.json()
      
      if (configData.success && configData.stats) {
        setSlackChannelStats({
          configuredChannels: configData.stats.configuredCount,
          totalChannels: configData.stats.totalCount,
          lastConfigured: new Date(configData.stats.lastConfigured).toLocaleDateString()
        })
        
        console.log('📊 频道统计:', configData.stats)
      } else {
        // 如果新API失败，回退到旧方法
        const channelsResponse = await fetch('/api/slack/channels')
        const channelsData = await channelsResponse.json()
        
        setSlackChannelStats({
          configuredChannels: 0, // 没有配置时为0
          totalChannels: channelsData.success ? channelsData.channels?.length || 0 : 0,
          lastConfigured: undefined
        })
      }
    } catch (error) {
      console.error('获取频道统计失败:', error)
      // 设置默认值
      setSlackChannelStats({
        configuredChannels: 0,
        totalChannels: 0,
        lastConfigured: undefined
      })
    }
  }

  // 数据源配置 - 按推荐顺序排列
  const dataSources = [
    {
      id: 'slack',
      name: 'Slack',
      icon: Slack,
      priority: 1,
      difficulty: 'easy',
      setupTime: '1分钟',
      badge: language === 'zh' ? '推荐' : 'Recommended',
      badgeColor: 'bg-green-500',
      title: 'Slack', // 直接使用第三方名称
      description: language === 'zh'
        ? '团队沟通中心 - 连接Slack获取团队对话、决策和知识'
        : 'Team Communication Hub - Connect Slack to access team conversations, decisions and knowledge',
      benefits: [
        {
          icon: MessageSquare,
          text: language === 'zh' ? '实时消息同步' : 'Real-time message sync'
        },
        {
          icon: Users,
          text: language === 'zh' ? '团队协作历史' : 'Team collaboration history'
        },
        {
          icon: TrendingUp,
          text: language === 'zh' ? '对话洞察分析' : 'Conversation insights'
        }
      ],
      stats: {
        channels: 12,
        messages: '10k+',
        users: 45
      },
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      priority: 2,
      difficulty: 'easy',
      setupTime: '2分钟',
      badge: language === 'zh' ? '简单' : 'Easy',
      badgeColor: 'bg-blue-500',
      title: 'GitHub',
      description: language === 'zh'
        ? '代码协作平台 - 追踪代码变更、PR和项目进展'
        : 'Code Collaboration Platform - Track code changes, PRs and project progress',
      benefits: [
        {
          icon: GitBranch,
          text: language === 'zh' ? 'PR管理' : 'PR management'
        },
        {
          icon: CheckCircle,
          text: language === 'zh' ? 'Issue追踪' : 'Issue tracking'
        },
        {
          icon: TrendingUp,
          text: language === 'zh' ? '代码审查' : 'Code review'
        }
      ],
      stats: {
        repos: 8,
        prs: 156,
        issues: 89
      },
      color: 'from-gray-700 to-gray-900'
    },
    {
      id: 'jira',
      name: 'Jira',
      icon: FileText,
      priority: 3,
      difficulty: 'medium',
      setupTime: '5分钟',
      badge: language === 'zh' ? '中等' : 'Medium',
      badgeColor: 'bg-orange-500',
      title: 'Jira',
      description: language === 'zh'
        ? '项目管理中心 - 管理任务、跟踪进度、生成报告'
        : 'Project Management Hub - Manage tasks, track progress, generate reports',
      benefits: [
        {
          icon: ListChecks,
          text: language === 'zh' ? '任务管理' : 'Task management'
        },
        {
          icon: TrendingUp,
          text: language === 'zh' ? '进度追踪' : 'Progress tracking'
        },
        {
          icon: Users,
          text: language === 'zh' ? '工作流自动化' : 'Workflow automation'
        }
      ],
      stats: {
        projects: 5,
        tasks: 234,
        sprints: 12
      },
      color: 'from-blue-600 to-blue-700'
    }
  ]

  const handleConnect = async (sourceId: string) => {
    console.log('🔗 handleConnect被调用', { sourceId, showSlackManager })
    setSelectedSource(sourceId)
    
    if (sourceId === 'slack') {
      // 显示高级Slack集成管理器
      console.log('📱 显示Slack集成管理器')
      setShowSlackManager(true)
      console.log('📱 setShowSlackManager(true)已调用')
      return
    }

    // 其他数据源使用简单的连接流程
    setIsConnecting(true)
    setShowConnectionToast(true)
    setConnectionError(null)

    try {
      // 其他数据源的模拟连接
      await new Promise(resolve => setTimeout(resolve, 3000))
      setIsConnecting(false)
      setConnectedSources([...connectedSources, sourceId])
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setShowConnectionToast(false)
      }, 3000)
    } catch (error) {
      setIsConnecting(false)
      setConnectionError(error instanceof Error ? error.message : 'Connection failed')
      setTimeout(() => {
        setConnectionError(null)
        setShowConnectionToast(false)
      }, 5000)
    }
  }

  const handleTryDemo = () => {
    // 直接设置为演示连接成功
    if (selectedSource) {
      setIsConnecting(false)
      setConnectionError(null)
      setConnectedSources([...connectedSources, selectedSource])
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setShowConnectionToast(false)
      }, 3000)
    }
  }


  // Slack集成管理器回调
  const handleSlackConfigChange = (config: any) => {
    setSlackConfig(config)
  }

  const handleSlackStatusChange = (status: string) => {
    if (status === 'connected') {
      setConnectedSources([...connectedSources.filter(s => s !== 'slack'), 'slack'])
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
      }, 5000)
    } else if (status === 'disconnected') {
      setConnectedSources(connectedSources.filter(s => s !== 'slack'))
    }
  }

  // 断开连接处理
  const handleDisconnect = async (sourceId: string) => {
    try {
      if (sourceId === 'slack') {
        // 调用Slack断开连接API
        const response = await fetch('/api/slack/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contextId })
        })
        
        if (response.ok) {
          console.log('🔌 Slack连接已断开')
          setConnectedSources(connectedSources.filter(s => s !== sourceId))
          // 显示断开成功提示
          setShowSuccess(false)
        }
      } else {
        // 其他数据源的断开逻辑
        setConnectedSources(connectedSources.filter(s => s !== sourceId))
      }
    } catch (error) {
      console.error('断开连接失败:', error)
      setConnectionError('断开连接失败，请重试')
    }
  }

  return (
    <div className="space-y-6">

      {/* 成功提示 */}
      {showSuccess && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {language === 'zh' 
              ? '🎉 连接成功！AI Brain 正在同步数据...'
              : '🎉 Connected successfully! AI Brain is syncing data...'}
          </AlertDescription>
        </Alert>
      )}

      {/* 数据源卡片列表 */}
      <div className="space-y-4">
        {dataSources.map((source, index) => {
          const Icon = source.icon
          const isConnected = connectedSources.includes(source.id)
          const isCurrentlyConnecting = selectedSource === source.id && isConnecting
          const isSlackChecking = source.id === 'slack' && isCheckingConnection
          
          return (
            <Card 
              key={source.id}
              className={`relative overflow-hidden transition-all duration-300 ${
                isConnected 
                  ? 'border-green-500 bg-green-50/50 dark:bg-green-950/10'
                  : isSlackChecking 
                  ? 'border-blue-300 bg-blue-50/30 dark:bg-blue-950/10' 
                  : 'hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              {/* 优先级标记 */}
              {index === 0 && !isConnected && !isSlackChecking && (
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
                      <CardTitle className="flex items-center gap-2">
                        {source.title}
                        {isConnected && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {isSlackChecking && (
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        )}
                      </CardTitle>
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
                  {/* 功能亮点 */}
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

                  {/* 连接按钮区域 */}
                  <div className="flex gap-2">
                    {source.id === 'slack' && !isConnected && !isSlackChecking ? (
                      <>
                        {/* Slack一键连接按钮 */}
                        <Button
                          onClick={() => {
                            const oauthUrl = `/api/auth/slack/install?context_id=${contextId}`
                            window.location.href = oauthUrl
                          }}
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white flex-1"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {language === 'zh' ? '一键连接' : 'Quick Connect'}
                        </Button>
                        {/* 高级配置按钮 */}
                        <Button
                          onClick={() => {
                            console.log('🔧 点击高级配置按钮', { sourceId: source.id })
                            handleConnect(source.id)
                          }}
                          variant="outline"
                          className="px-3"
                          title={language === 'zh' ? '高级配置' : 'Advanced Setup'}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </>
                    ) : source.id === 'slack' && isSlackChecking ? (
                      /* Slack连接状态检查中 */
                      <Button
                        disabled={true}
                        className="min-w-[140px] bg-blue-100 text-blue-700 border-blue-200"
                      >
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'zh' ? '检查连接状态中...' : 'Checking connection...'}
                      </Button>
                    ) : (
                      /* 其他数据源或已连接状态 */
                      <Button
                        onClick={() => handleConnect(source.id)}
                        disabled={isConnected || isCurrentlyConnecting}
                        className={`min-w-[140px] ${
                          isConnected 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                        }`}
                      >
                        {isCurrentlyConnecting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {language === 'zh' ? '连接中...' : 'Connecting...'}
                          </>
                        ) : isConnected ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {language === 'zh' ? '已连接' : 'Connected'}
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            {language === 'zh' ? '一键连接' : 'Quick Connect'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* 连接后显示的数据统计 */}
                {isConnected && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Slack频道未配置警告 */}
                    {source.id === 'slack' && slackChannelStats && slackChannelStats.configuredChannels === 0 && (
                      <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-orange-800 dark:text-orange-200">
                          {language === 'zh' 
                            ? '⚠️ 尚未选择任何频道，请点击下方"选择频道"按钮进行配置'
                            : '⚠️ No channels selected yet. Please click "Select Channels" below to configure'}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* 连接状态信息 */}
                    {source.id === 'slack' && !slackChannelStats && (
                      <div className="text-sm text-gray-500">
                        {language === 'zh' ? '加载配置信息中...' : 'Loading configuration...'}
                      </div>
                    )}
                    {source.id !== 'slack' && (
                      <div className="text-sm">
                        <span className="text-gray-500">{language === 'zh' ? '连接状态：' : 'Connection: '}</span>
                        <span className="font-semibold text-green-600">{language === 'zh' ? '正常' : 'Active'}</span>
                      </div>
                    )}
                    
                    {/* 连接管理按钮 */}
                    <div className="flex items-center gap-2 pt-2">
                      {source.id === 'slack' ? (
                        <>
                          <Button 
                            onClick={() => {
                              const channelSelectionUrl = `/contexts/${contextId}/slack/channels?team=${encodeURIComponent('AI Brain')}`
                              window.location.href = channelSelectionUrl
                            }}
                            className={`${
                              slackChannelStats?.configuredChannels > 0 
                                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                            } text-white`}
                            size="sm"
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            {slackChannelStats?.configuredChannels > 0 
                              ? (language === 'zh' ? '重新选择频道' : 'Reconfigure Channels')
                              : (language === 'zh' ? '选择频道' : 'Select Channels')}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowSlackManager(true)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            {language === 'zh' ? '管理配置' : 'Manage Config'}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDisconnect(source.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            {language === 'zh' ? '断开连接' : 'Disconnect'}
                          </Button>
                        </>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDisconnect(source.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          {language === 'zh' ? '断开连接' : 'Disconnect'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 底部提示 */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <AlertCircle className="w-4 h-4 text-blue-600" />
        <AlertDescription>
          <strong>{language === 'zh' ? '💡 小贴士：' : '💡 Pro Tip: '}</strong>
          {language === 'zh' 
            ? '连接更多数据源，AI Brain 将提供更准确、更有价值的洞察。建议至少连接2个数据源以获得最佳体验。'
            : 'Connect more data sources for more accurate and valuable insights. We recommend connecting at least 2 sources for the best experience.'}
        </AlertDescription>
      </Alert>

      {/* 连接状态反馈 */}
      {showConnectionToast && selectedSource && (
        <ConnectionStatusToast
          source={dataSources.find(s => s.id === selectedSource)?.name || selectedSource}
          isConnecting={isConnecting}
          isConnected={connectedSources.includes(selectedSource)}
          error={connectionError || undefined}
          onClose={() => setShowConnectionToast(false)}
          onTryDemo={handleTryDemo}
        />
      )}

      {/* Slack高级集成管理器 */}
      {showSlackManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {language === 'zh' ? 'Slack 高级集成配置' : 'Advanced Slack Integration'}
                </h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowSlackManager(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
              
              <SlackIntegrationManager
                contextId={contextId}
                initialConfig={slackConfig}
                onConfigChange={handleSlackConfigChange}
                onStatusChange={handleSlackStatusChange}
                onClose={() => setShowSlackManager(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}