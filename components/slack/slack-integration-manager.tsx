'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  Slack,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  RefreshCw,
  Settings,
  Trash2,
  TestTube,
  Shield,
  Activity,
  Users,
  MessageSquare,
  Clock,
  Zap,
  AlertCircle
} from 'lucide-react'

// Slack连接状态类型
type SlackStatus = 'disconnected' | 'configuring' | 'connecting' | 'testing' | 'connected' | 'error' | 'reconnecting'

// Slack配置接口
interface SlackConfig {
  botToken: string
  signingSecret: string
  clientId: string
  clientSecret: string
  workspaceName?: string
  teamId?: string
  botUserId?: string
  connectedAt?: string
  lastSync?: string
}

// 频道信息接口
interface SlackChannel {
  id: string
  name: string
  isPrivate: boolean
  memberCount: number
  isMonitored: boolean
}

interface SlackIntegrationManagerProps {
  contextId: string
  initialConfig?: Partial<SlackConfig>
  onConfigChange?: (config: SlackConfig) => void
  onStatusChange?: (status: SlackStatus) => void
  onClose?: () => void
}

export function SlackIntegrationManager({ 
  contextId, 
  initialConfig,
  onConfigChange,
  onStatusChange,
  onClose 
}: SlackIntegrationManagerProps) {
  const { t, language } = useLanguage()
  
  // 状态管理
  const [status, setStatus] = useState<SlackStatus>('disconnected')
  const [activeStep, setActiveStep] = useState(1)
  const [showSecrets, setShowSecrets] = useState(false)
  const [config, setConfig] = useState<SlackConfig>({
    botToken: initialConfig?.botToken || '',
    signingSecret: initialConfig?.signingSecret || '',
    clientId: initialConfig?.clientId || '',
    clientSecret: initialConfig?.clientSecret || '',
    ...initialConfig
  })
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [channelsConfigured, setChannelsConfigured] = useState(false)
  const [connectionStats, setConnectionStats] = useState({
    channels: 0,
    users: 0,
    messages: 0,
    lastSync: null as Date | null
  })
  const [testResults, setTestResults] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  // 配置步骤
  const configSteps = [
    {
      id: 1,
      title: language === 'zh' ? '基础配置' : 'Basic Setup',
      description: language === 'zh' ? '配置Slack应用密钥' : 'Configure Slack app credentials'
    },
    {
      id: 2,
      title: language === 'zh' ? '连接测试' : 'Connection Test',
      description: language === 'zh' ? '验证连接和权限' : 'Verify connection and permissions'
    },
    {
      id: 3,
      title: language === 'zh' ? '频道选择' : 'Channel Selection',
      description: language === 'zh' ? '选择要监控的频道' : 'Select channels to monitor'
    },
    {
      id: 4,
      title: language === 'zh' ? '完成配置' : 'Finalize Setup',
      description: language === 'zh' ? '确认设置并激活' : 'Confirm settings and activate'
    }
  ]

  // 更新状态并通知父组件
  const updateStatus = (newStatus: SlackStatus) => {
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }

  // 更新配置并通知父组件
  const updateConfig = (newConfig: Partial<SlackConfig>) => {
    const updatedConfig = { ...config, ...newConfig }
    setConfig(updatedConfig)
    onConfigChange?.(updatedConfig)
  }

  // 组件加载时自动检查Slack配置状态
  useEffect(() => {
    console.log('🔍 SlackIntegrationManager已加载，检查当前配置状态', { contextId, status })
    // 延迟加载配置，确保组件完全初始化
    setTimeout(() => {
      loadActualSlackConfig()
    }, 100)
  }, [])

  // 加载实际的Slack配置
  const loadActualSlackConfig = async () => {
    console.log('🚀 开始加载Slack配置...', { contextId })
    try {
      const response = await fetch(`/api/slack/config?contextId=${contextId}`)
      console.log('📡 API响应状态:', response.status)
      const result = await response.json()
      console.log('📦 API响应数据:', result)
      
      if (result.success && result.config) {
        console.log('📋 成功加载Slack配置:', result.workspace?.teamName)
        
        // 更新配置状态
        updateConfig(result.config)
        updateStatus('connected')
        
        // 设置为第4步（完成状态），显示配置信息
        setActiveStep(4)
        
        // 如果有工作区信息，更新连接统计
        if (result.workspace) {
          setConnectionStats({
            channels: 12, // 模拟数据，实际应该从API获取
            users: 45,
            messages: 10,
            lastSync: new Date()
          })
        }
      } else {
        console.log('🔧 未找到有效的Slack配置，保持默认状态')
        // 保持默认状态，让用户可以进行配置
        updateStatus('disconnected')
        setActiveStep(1)
      }
    } catch (error) {
      console.error('加载Slack配置失败:', error)
      // 出错时也保持默认状态
      updateStatus('disconnected')
      setActiveStep(1)
    }
  }

  // 测试连接
  const testConnection = async () => {
    updateStatus('testing')
    setTestResults(null)
    
    try {
      const response = await fetch('/api/slack/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextId,
          config: {
            botToken: config.botToken,
            signingSecret: config.signingSecret
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTestResults({
          success: true,
          message: language === 'zh' ? '连接测试成功！' : 'Connection test successful!',
          details: result.data
        })
        
        // 更新工作区信息
        updateConfig({
          workspaceName: result.data.team?.name,
          teamId: result.data.team?.id,
          botUserId: result.data.user?.id
        })
        
        // 获取频道列表
        if (result.data.channels) {
          setChannels(result.data.channels)
        }
        
        setActiveStep(3) // 进入频道选择步骤
      } else {
        setTestResults({
          success: false,
          message: result.error || (language === 'zh' ? '连接测试失败' : 'Connection test failed')
        })
      }
    } catch (error) {
      setTestResults({
        success: false,
        message: language === 'zh' ? '网络错误，请重试' : 'Network error, please try again'
      })
    } finally {
      updateStatus('configuring')
    }
  }

  // 保存配置并连接
  const saveAndConnect = async () => {
    updateStatus('connecting')
    
    try {
      const response = await fetch('/api/slack/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextId,
          config,
          monitoredChannels: channels.filter(c => c.isMonitored).map(c => c.id)
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        updateStatus('connected')
        updateConfig({
          connectedAt: new Date().toISOString()
        })
        setConnectionStats(result.stats)
      } else {
        updateStatus('error')
      }
    } catch (error) {
      updateStatus('error')
    }
  }

  // 断开连接
  const disconnect = async () => {
    try {
      console.log('🔌 开始断开Slack连接...')
      const response = await fetch('/api/slack/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextId })
      })
      
      const result = await response.json()
      console.log('🔌 断开连接响应:', result)
      
      if (response.ok && result.success) {
        console.log('✅ 断开连接成功，重新加载配置状态')
        
        // 重新加载实际的配置状态，而不是手动设置
        setTimeout(() => {
          loadActualSlackConfig()
        }, 500) // 延迟一点确保环境变量已更新
        
        // 通知父组件状态变化
        onStatusChange?.('disconnected')
      }
    } catch (error) {
      console.error('Disconnect error:', error)
    }
  }

  // 重新连接
  const reconnect = async () => {
    updateStatus('reconnecting')
    await saveAndConnect()
  }

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // 切换频道监控状态
  const toggleChannelMonitoring = (channelId: string) => {
    setChannels(channels.map(channel => 
      channel.id === channelId 
        ? { ...channel, isMonitored: !channel.isMonitored }
        : channel
    ))
  }

  return (
    <div className="space-y-6">
      {/* 状态头部 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Slack className="w-7 h-7" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Slack {language === 'zh' ? '集成管理' : 'Integration Manager'}
                  {status === 'connected' && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {language === 'zh' ? '已连接' : 'Connected'}
                    </Badge>
                  )}
                  {status === 'error' && (
                    <Badge variant="destructive">
                      <XCircle className="w-3 h-3 mr-1" />
                      {language === 'zh' ? '错误' : 'Error'}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {config.workspaceName && (
                    <span className="text-sm font-medium text-blue-600">
                      {config.workspaceName} • 
                    </span>
                  )}
                  {language === 'zh' 
                    ? '管理您的Slack工作区连接和配置' 
                    : 'Manage your Slack workspace connection and configuration'}
                </CardDescription>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              {status === 'connected' && (
                <>
                  <Button variant="outline" size="sm" onClick={reconnect}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '重新连接' : 'Reconnect'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={disconnect} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'zh' ? '断开连接' : 'Disconnect'}
                  </Button>
                </>
              )}
              {(status === 'disconnected' || status === 'error') && (
                <Button onClick={() => setActiveStep(1)} className="bg-purple-600 hover:bg-purple-700">
                  <Settings className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '配置连接' : 'Configure Connection'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        {/* 频道选择 CTA - 最显眼位置 */}
        {status === 'connected' && !channelsConfigured && (
          <CardContent className="pb-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 p-6 text-white shadow-2xl">
              {/* 背景装饰 */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-300/30 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        {language === 'zh' ? '🎯 下一步：选择频道' : '🎯 Next Step: Select Channels'}
                      </h3>
                      <p className="text-blue-100 text-sm">
                        {language === 'zh' ? 'Slack已连接成功！' : 'Slack connected successfully!'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-white/90 mb-6 leading-relaxed">
                  {language === 'zh' 
                    ? 'AI Brain还未监控任何频道。选择要分析的频道，开始获得智能的团队协作洞察和自动化建议。'
                    : 'AI Brain is not monitoring any channels yet. Select channels to analyze for smart team collaboration insights and automation suggestions.'}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{language === 'zh' ? '团队洞察' : 'Team Insights'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      <span>{language === 'zh' ? '智能建议' : 'Smart Suggestions'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="w-4 h-4" />
                      <span>{language === 'zh' ? '实时分析' : 'Real-time Analysis'}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      if (onClose) {
                        onClose()
                      }
                      const channelSelectionUrl = `/contexts/${contextId}/slack/channels?team=${encodeURIComponent(config.workspaceName || 'Slack Workspace')}`
                      window.location.href = channelSelectionUrl
                    }}
                    className="bg-white text-purple-700 hover:bg-white/90 font-semibold px-6 py-2 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                    size="lg"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    {language === 'zh' ? '立即选择频道' : 'Select Channels Now'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {/* 频道已配置成功状态 */}
        {status === 'connected' && channelsConfigured && (
          <CardContent className="pb-0">
            <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    {language === 'zh' ? '✅ 频道监控已激活' : '✅ Channel Monitoring Active'}
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {language === 'zh' 
                      ? 'AI Brain正在监控您选择的频道，智能洞察功能已激活。'
                      : 'AI Brain is monitoring your selected channels and smart insights are now active.'}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100">
                  {language === 'zh' ? '管理频道' : 'Manage Channels'}
                </Button>
              </div>
            </div>
          </CardContent>
        )}

        {/* 连接统计 */}
        {status === 'connected' && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{connectionStats.channels}</div>
                <div className="text-xs text-gray-500">{language === 'zh' ? '频道' : 'Channels'}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{connectionStats.users}</div>
                <div className="text-xs text-gray-500">{language === 'zh' ? '用户' : 'Users'}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{connectionStats.messages}k+</div>
                <div className="text-xs text-gray-500">{language === 'zh' ? '消息' : 'Messages'}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  <Activity className="w-6 h-6 mx-auto" />
                </div>
                <div className="text-xs text-gray-500">{language === 'zh' ? '实时同步' : 'Live Sync'}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 配置界面 */}
      {(status === 'disconnected' || status === 'configuring' || status === 'error' || status === 'connected') && (
        <Card>
          <CardHeader>
            <CardTitle>{language === 'zh' ? '配置向导' : 'Configuration Wizard'}</CardTitle>
            <CardDescription>
              {language === 'zh' ? '按照以下步骤完成Slack集成配置' : 'Follow these steps to complete Slack integration setup'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={`step-${activeStep}`} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                {configSteps.map((step) => (
                  <TabsTrigger 
                    key={step.id} 
                    value={`step-${step.id}`}
                    disabled={step.id > activeStep}
                    className="text-xs"
                  >
                    {step.id}. {step.title}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* 步骤1: 基础配置 */}
              <TabsContent value="step-1" className="space-y-4">
                {/* 一键OAuth选项 */}
                <div className="mb-6">
                  <div className="text-center space-y-4 p-6 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border-2 border-dashed border-green-300">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white">
                      <Zap className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">
                        {language === 'zh' ? '🚀 推荐：一键授权连接' : '🚀 Recommended: One-Click OAuth'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {language === 'zh' 
                          ? '最简单的方式！无需手动复制密钥，直接跳转Slack授权即可完成配置'
                          : 'The easiest way! No manual key copying needed, just authorize with Slack directly'}
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        const oauthUrl = `/api/auth/slack/install?context_id=${contextId}`
                        window.location.href = oauthUrl
                      }}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3"
                      size="lg"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      {language === 'zh' ? '一键连接 Slack' : 'Connect with Slack'}
                    </Button>
                  </div>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                        {language === 'zh' ? '或者手动配置' : 'Or configure manually'}
                      </span>
                    </div>
                  </div>
                </div>

                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    <strong>{language === 'zh' ? '高级配置：' : 'Advanced Setup: '}</strong>
                    {language === 'zh' 
                      ? '仅在需要特殊配置或调试时使用。请从Slack应用管理页面获取以下密钥信息'
                      : 'Only use for special configurations or debugging. Please obtain the following credentials from your Slack app management page'}
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bot-token" className="flex items-center gap-2">
                      Bot Token
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => setShowSecrets(!showSecrets)}
                      >
                        {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </Label>
                    <Input
                      id="bot-token"
                      type={showSecrets ? 'text' : 'password'}
                      placeholder="xoxb-..."
                      value={config.botToken}
                      onChange={(e) => updateConfig({ botToken: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signing-secret">Signing Secret</Label>
                    <Input
                      id="signing-secret"
                      type={showSecrets ? 'text' : 'password'}
                      placeholder="********************************"
                      value={config.signingSecret}
                      onChange={(e) => updateConfig({ signingSecret: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="client-id">Client ID</Label>
                      <Input
                        id="client-id"
                        placeholder="1234567890.1234567890"
                        value={config.clientId}
                        onChange={(e) => updateConfig({ clientId: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client-secret">Client Secret</Label>
                      <Input
                        id="client-secret"
                        type={showSecrets ? 'text' : 'password'}
                        placeholder="********************************"
                        value={config.clientSecret}
                        onChange={(e) => updateConfig({ clientSecret: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" asChild>
                    <a 
                      href="https://api.slack.com/apps" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {language === 'zh' ? '打开Slack应用管理' : 'Open Slack App Management'}
                    </a>
                  </Button>
                  <Button 
                    onClick={() => setActiveStep(2)}
                    disabled={!config.botToken || !config.signingSecret}
                  >
                    {language === 'zh' ? '下一步' : 'Next Step'}
                  </Button>
                </div>
              </TabsContent>

              {/* 步骤2: 连接测试 */}
              <TabsContent value="step-2" className="space-y-4">
                <div className="text-center space-y-4">
                  <TestTube className="w-16 h-16 mx-auto text-blue-500" />
                  <div>
                    <h3 className="text-lg font-medium">
                      {language === 'zh' ? '测试连接' : 'Test Connection'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'zh' 
                        ? '验证您的配置是否正确，并检查权限设置'
                        : 'Verify your configuration is correct and check permissions'}
                    </p>
                  </div>

                  {testResults && (
                    <Alert className={testResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                      {testResults.success ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <AlertDescription>
                        {testResults.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => setActiveStep(1)}>
                      {language === 'zh' ? '返回配置' : 'Back to Config'}
                    </Button>
                    <Button 
                      onClick={testConnection}
                      disabled={status === 'testing'}
                    >
                      {status === 'testing' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4 mr-2" />
                      )}
                      {language === 'zh' ? '开始测试' : 'Start Test'}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* 步骤3: 频道选择 */}
              <TabsContent value="step-3" className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    {language === 'zh' ? '选择要监控的频道' : 'Select Channels to Monitor'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {language === 'zh' 
                      ? '选择AI Brain可以访问和分析的Slack频道'
                      : 'Choose which Slack channels AI Brain can access and analyze'}
                  </p>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {channels.map((channel) => (
                    <div 
                      key={channel.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          {channel.isPrivate ? (
                            <Shield className="w-4 h-4 text-purple-600" />
                          ) : (
                            <MessageSquare className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">#{channel.name}</div>
                          <div className="text-xs text-gray-500">
                            {channel.memberCount} {language === 'zh' ? '成员' : 'members'} • 
                            {channel.isPrivate ? (
                              language === 'zh' ? ' 私有频道' : ' Private'
                            ) : (
                              language === 'zh' ? ' 公开频道' : ' Public'
                            )}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={channel.isMonitored}
                        onCheckedChange={() => toggleChannelMonitoring(channel.id)}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setActiveStep(2)}>
                    {language === 'zh' ? '上一步' : 'Previous'}
                  </Button>
                  <Button 
                    onClick={() => setActiveStep(4)}
                    disabled={!channels.some(c => c.isMonitored)}
                  >
                    {language === 'zh' ? '下一步' : 'Next Step'}
                  </Button>
                </div>
              </TabsContent>

              {/* 步骤4: 完成配置 */}
              <TabsContent value="step-4" className="space-y-4">
                {status === 'connected' ? (
                  /* 已连接状态：显示实际密钥信息 */
                  <div className="space-y-6">
                    <div className="text-center space-y-4">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                      <div>
                        <h3 className="text-lg font-medium text-green-700">
                          🎉 {language === 'zh' ? 'Slack集成成功！' : 'Slack Integration Successful!'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {language === 'zh' 
                            ? '以下是您的Slack连接详细信息'
                            : 'Here are your Slack connection details'}
                        </p>
                      </div>
                    </div>

                    {/* 工作区信息 */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center text-white">
                          <Slack className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                            {config.workspaceName || 'Slack工作区'}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'zh' ? '团队ID：' : 'Team ID: '}{config.teamId}
                          </p>
                          {config.connectedAt && (
                            <p className="text-xs text-gray-500">
                              {language === 'zh' ? '连接时间：' : 'Connected: '}
                              {new Date(config.connectedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 密钥信息 */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        {language === 'zh' ? '获得的密钥信息' : 'Obtained Credentials'}
                      </h4>
                      
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            Bot Token
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => setShowSecrets(!showSecrets)}
                            >
                              {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => copyToClipboard(config.botToken)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </Label>
                          <div className="relative">
                            <Input
                              type={showSecrets ? 'text' : 'password'}
                              value={config.botToken}
                              readOnly
                              className="bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Client ID</Label>
                            <div className="relative">
                              <Input
                                value={config.clientId}
                                readOnly
                                className="bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 px-2"
                                onClick={() => copyToClipboard(config.clientId)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Bot User ID</Label>
                            <Input
                              value={config.botUserId || 'N/A'}
                              readOnly
                              className="bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                            />
                          </div>
                        </div>

                        {config.signingSecret && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              Signing Secret
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={() => copyToClipboard(config.signingSecret)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </Label>
                            <Input
                              type={showSecrets ? 'text' : 'password'}
                              value={config.signingSecret}
                              readOnly
                              className="bg-gray-50 dark:bg-gray-800 font-mono text-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 成功提示 */}
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>{language === 'zh' ? '✅ 集成完成！' : '✅ Integration Complete!'}</strong>
                        <br />
                        {language === 'zh' 
                          ? '您的Slack工作区已成功连接。您可以复制上述密钥信息用于其他配置，或直接开始使用AI Brain进行团队协作。'
                          : 'Your Slack workspace is successfully connected. You can copy the credentials above for other configurations, or start using AI Brain for team collaboration right away.'}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  /* 未连接状态：显示确认配置 */
                  <div className="text-center space-y-4">
                    <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                    <div>
                      <h3 className="text-lg font-medium">
                        {language === 'zh' ? '准备完成' : 'Ready to Complete'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {language === 'zh' 
                          ? '确认配置信息，点击完成开始使用Slack集成'
                          : 'Review your configuration and click finish to start using Slack integration'}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 text-left">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">{language === 'zh' ? '工作区：' : 'Workspace: '}</span>
                          {config.workspaceName}
                        </div>
                        <div>
                          <span className="font-medium">{language === 'zh' ? '监控频道：' : 'Monitored Channels: '}</span>
                          {channels.filter(c => c.isMonitored).length}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center gap-4">
                      <Button variant="outline" onClick={() => setActiveStep(3)}>
                        {language === 'zh' ? '返回修改' : 'Back to Modify'}
                      </Button>
                      <Button 
                        onClick={saveAndConnect}
                        disabled={status === 'connecting'}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {status === 'connecting' ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        {language === 'zh' ? '完成配置' : 'Finish Setup'}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}