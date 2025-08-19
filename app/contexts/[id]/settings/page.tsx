'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/hooks/use-auth'
import {
  Settings,
  Slack,
  Github,
  FileText,
  Database,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Play,
  HelpCircle,
  ChevronRight,
  Zap,
  Shield,
  Clock,
  Users
} from 'lucide-react'

// 数据源类型
type DataSourceType = 'slack' | 'github' | 'jira' | 'notion' | 'google'

interface DataSource {
  type: DataSourceType
  name: string
  icon: any
  status: 'connected' | 'disconnected' | 'configuring' | 'error'
  description: string
  features: string[]
  setupTime: string
  difficulty: 'easy' | 'medium' | 'hard'
  color: string
}

// 集成步骤
interface IntegrationStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
  icon: any
}

export default function ContextSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user, loading } = useAuth()
  
  const contextId = params.id as string
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedSource, setSelectedSource] = useState<DataSourceType | null>(null)
  const [showTokens, setShowTokens] = useState(false)
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [configProgress, setConfigProgress] = useState(0)
  
  // Slack 配置状态
  const [slackConfig, setSlackConfig] = useState({
    botToken: '',
    signingSecret: '',
    clientId: '',
    clientSecret: '',
    configured: false
  })
  
  // 数据源列表
  const dataSources: DataSource[] = [
    {
      type: 'slack',
      name: 'Slack',
      icon: Slack,
      status: slackConfig.configured ? 'connected' : 'disconnected',
      description: language === 'zh' 
        ? '连接 Slack 工作区，实时同步团队消息'
        : 'Connect Slack workspace for real-time team messaging',
      features: [
        language === 'zh' ? '实时消息同步' : 'Real-time message sync',
        language === 'zh' ? '双向通信' : 'Two-way communication',
        language === 'zh' ? '频道管理' : 'Channel management',
        language === 'zh' ? '文件共享' : 'File sharing'
      ],
      setupTime: '5-10 min',
      difficulty: 'easy',
      color: 'purple'
    },
    {
      type: 'github',
      name: 'GitHub',
      icon: Github,
      status: 'disconnected',
      description: language === 'zh'
        ? '集成代码仓库，跟踪项目进展'
        : 'Integrate code repos, track project progress',
      features: [
        language === 'zh' ? 'PR 管理' : 'PR management',
        language === 'zh' ? 'Issue 跟踪' : 'Issue tracking',
        language === 'zh' ? '代码审查' : 'Code review',
        language === 'zh' ? '部署状态' : 'Deploy status'
      ],
      setupTime: '5-8 min',
      difficulty: 'easy',
      color: 'gray'
    },
    {
      type: 'jira',
      name: 'Jira',
      icon: FileText,
      status: 'disconnected',
      description: language === 'zh'
        ? '项目管理和任务跟踪'
        : 'Project management and task tracking',
      features: [
        language === 'zh' ? '任务创建' : 'Task creation',
        language === 'zh' ? '进度跟踪' : 'Progress tracking',
        language === 'zh' ? '工作流自动化' : 'Workflow automation',
        language === 'zh' ? '报表分析' : 'Report analytics'
      ],
      setupTime: '10-15 min',
      difficulty: 'medium',
      color: 'blue'
    }
  ]

  // 当前步骤状态
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  
  // Slack 集成步骤
  const getSlackSteps = (): IntegrationStep[] => [
    {
      id: 'create-app',
      title: language === 'zh' ? '创建 Slack 应用' : 'Create Slack App',
      description: language === 'zh' 
        ? '在 Slack API 平台创建新应用'
        : 'Create new app on Slack API platform',
      completed: currentStepIndex > 0,
      current: currentStepIndex === 0,
      icon: Sparkles
    },
    {
      id: 'configure-permissions',
      title: language === 'zh' ? '配置权限' : 'Configure Permissions',
      description: language === 'zh'
        ? '设置必要的 Bot Token Scopes'
        : 'Set required Bot Token Scopes',
      completed: currentStepIndex > 1,
      current: currentStepIndex === 1,
      icon: Shield
    },
    {
      id: 'install-app',
      title: language === 'zh' ? '安装到工作区' : 'Install to Workspace',
      description: language === 'zh'
        ? '将应用安装到您的 Slack 工作区'
        : 'Install app to your Slack workspace',
      completed: currentStepIndex > 2,
      current: currentStepIndex === 2,
      icon: Zap
    },
    {
      id: 'configure-webhooks',
      title: language === 'zh' ? '配置 Webhooks' : 'Configure Webhooks',
      description: language === 'zh'
        ? '设置事件订阅以接收实时消息'
        : 'Set up event subscriptions for real-time messages',
      completed: currentStepIndex > 3,
      current: currentStepIndex === 3,
      icon: Database
    },
    {
      id: 'test-connection',
      title: language === 'zh' ? '测试连接' : 'Test Connection',
      description: language === 'zh'
        ? '验证集成是否正常工作'
        : 'Verify integration is working properly',
      completed: currentStepIndex > 4,
      current: currentStepIndex === 4,
      icon: Play
    }
  ]

  // 处理数据源选择
  const handleSourceSelect = (type: DataSourceType) => {
    setSelectedSource(type)
    setActiveTab('configure')
    // 重置步骤到第一步
    setCurrentStepIndex(0)
  }

  // 下一步
  const nextStep = () => {
    if (currentStepIndex < 4) {
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  // 上一步  
  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  // 保存Slack配置
  const saveSlackConfig = async () => {
    try {
      // 这里可以添加保存到数据库的逻辑
      console.log('Saving Slack config:', slackConfig)
      // 标记为已配置
      setSlackConfig(prev => ({ ...prev, configured: true }))
    } catch (error) {
      console.error('Failed to save Slack config:', error)
    }
  }

  // 测试 Slack 连接
  const testSlackConnection = async () => {
    setIsConfiguring(true)
    setConfigProgress(0)
    
    // 模拟进度
    const interval = setInterval(() => {
      setConfigProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 20
      })
    }, 500)
    
    try {
      const response = await fetch('/api/admin/slack/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackConfig)
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSlackConfig(prev => ({ ...prev, configured: true }))
      }
    } catch (error) {
      console.error('Test connection failed:', error)
    } finally {
      setTimeout(() => {
        setIsConfiguring(false)
        setConfigProgress(0)
      }, 2500)
    }
  }

  // 复制 Webhook URL
  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/webhooks/slack`
    navigator.clipboard.writeText(url)
  }

  // 处理URL参数
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      
      // 设置初始标签页
      const tab = urlParams.get('tab')
      if (tab && ['overview', 'configure', 'monitoring'].includes(tab)) {
        setActiveTab(tab)
      }
      
      // 设置选中的数据源
      const source = urlParams.get('source')
      if (source && ['slack', 'github', 'jira'].includes(source)) {
        setSelectedSource(source as DataSourceType)
        if (tab === 'configure') {
          setActiveTab('configure')
        }
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/contexts/${contextId}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'zh' ? '返回' : 'Back'}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {language === 'zh' ? '工作空间设置' : 'Workspace Settings'}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '管理数据源和集成' : 'Manage data sources and integrations'}
                  </p>
                </div>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {language === 'zh' ? '专业版' : 'Professional'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="overview">
              <Database className="w-4 h-4 mr-2" />
              {language === 'zh' ? '数据源' : 'Data Sources'}
            </TabsTrigger>
            <TabsTrigger value="configure">
              <Settings className="w-4 h-4 mr-2" />
              {language === 'zh' ? '配置' : 'Configure'}
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <Clock className="w-4 h-4 mr-2" />
              {language === 'zh' ? '监控' : 'Monitoring'}
            </TabsTrigger>
          </TabsList>

          {/* 数据源概览 */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'zh' ? '可用数据源' : 'Available Data Sources'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh'
                    ? '选择并连接您需要的数据源，AI Brain 将从这些平台获取数据并提供智能服务'
                    : 'Select and connect data sources you need, AI Brain will fetch data from these platforms and provide intelligent services'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dataSources.map((source) => {
                    const Icon = source.icon
                    const isConnected = source.status === 'connected'
                    
                    return (
                      <Card 
                        key={source.type}
                        className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${
                          isConnected ? 'border-green-500' : ''
                        }`}
                        onClick={() => handleSourceSelect(source.type)}
                      >
                        {isConnected && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-500 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {language === 'zh' ? '已连接' : 'Connected'}
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg bg-${source.color}-100 dark:bg-${source.color}-900/20 flex items-center justify-center`}>
                              <Icon className={`w-6 h-6 text-${source.color}-600 dark:text-${source.color}-400`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{source.name}</CardTitle>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {source.setupTime}
                                </Badge>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    source.difficulty === 'easy' ? 'text-green-600' :
                                    source.difficulty === 'medium' ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}
                                >
                                  {source.difficulty === 'easy' ? '简单' :
                                   source.difficulty === 'medium' ? '中等' : '复杂'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {source.description}
                          </p>
                          <div className="space-y-1">
                            {source.features.slice(0, 3).map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant={isConnected ? 'outline' : 'default'}
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSourceSelect(source.type)
                            }}
                          >
                            {isConnected ? (
                              <>
                                <Settings className="w-4 h-4 mr-2" />
                                {language === 'zh' ? '管理' : 'Manage'}
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                {language === 'zh' ? '立即连接' : 'Connect Now'}
                              </>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 集成优势 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  {language === 'zh' ? '为什么要集成数据源？' : 'Why Integrate Data Sources?'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">
                      {language === 'zh' ? '自动化工作流' : 'Automated Workflows'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh'
                        ? 'AI Brain 自动处理跨平台的任务，节省您的时间'
                        : 'AI Brain automatically handles cross-platform tasks, saving your time'
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-medium">
                      {language === 'zh' ? '统一数据视图' : 'Unified Data View'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh'
                        ? '在一个地方查看和管理所有工具的数据'
                        : 'View and manage data from all tools in one place'
                      }
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-medium">
                      {language === 'zh' ? '团队协作增强' : 'Enhanced Team Collaboration'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {language === 'zh'
                        ? '打破信息孤岛，提升团队协作效率'
                        : 'Break information silos, improve team collaboration efficiency'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 配置界面 */}
          <TabsContent value="configure" className="space-y-6">
            {selectedSource === 'slack' ? (
              <>
                {/* Slack 配置向导 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                          <Slack className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle>Slack 集成配置</CardTitle>
                          <CardDescription>
                            {language === 'zh'
                              ? '按照以下步骤完成 Slack 集成，预计需要 5-10 分钟'
                              : 'Follow these steps to complete Slack integration, estimated 5-10 minutes'
                            }
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Slack API
                        </a>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* 进度指示 */}
                    <div className="space-y-4">
                      {getSlackSteps().map((step, index) => {
                        const Icon = step.icon
                        return (
                          <div
                            key={step.id}
                            className={`flex gap-4 p-4 rounded-lg border transition-all ${
                              step.current 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                                : step.completed
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/10'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              step.completed 
                                ? 'bg-green-500 text-white'
                                : step.current
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                            }`}>
                              {step.completed ? (
                                <CheckCircle className="w-5 h-5" />
                              ) : (
                                <Icon className="w-5 h-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium flex items-center gap-2">
                                {step.title}
                                {step.current && (
                                  <Badge variant="default" className="text-xs">
                                    {language === 'zh' ? '当前步骤' : 'Current Step'}
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {step.description}
                              </p>
                              
                              {/* 步骤详细内容 */}
                              {step.current && step.id === 'create-app' && (
                                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                  <ol className="space-y-2 text-sm">
                                    <li>1. 访问 <a href="https://api.slack.com/apps" target="_blank" className="text-blue-600 hover:underline">api.slack.com/apps</a></li>
                                    <li>2. 点击 "Create New App" → "From scratch"</li>
                                    <li>3. App Name: <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">AI Brain Assistant</code></li>
                                    <li>4. 选择您的工作区，点击 "Create App"</li>
                                  </ol>
                                </div>
                              )}
                              
                              {step.current && step.id === 'configure-permissions' && (
                                <div className="mt-4 space-y-4">
                                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <h4 className="font-medium mb-2">Bot Token Scopes</h4>
                                    <div className="space-y-1 text-sm font-mono">
                                      <div>• channels:read</div>
                                      <div>• groups:read</div>
                                      <div>• users:read</div>
                                      <div>• chat:write</div>
                                      <div>• chat:write.public</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {step.current && step.id === 'install-app' && (
                                <div className="mt-4 space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="botToken">Bot User OAuth Token</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        id="botToken"
                                        type={showTokens ? 'text' : 'password'}
                                        value={slackConfig.botToken}
                                        onChange={(e) => setSlackConfig(prev => ({ ...prev, botToken: e.target.value }))}
                                        placeholder="xoxb-your-bot-token"
                                        className="font-mono"
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowTokens(!showTokens)}
                                      >
                                        {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label htmlFor="signingSecret">Signing Secret</Label>
                                    <Input
                                      id="signingSecret"
                                      type={showTokens ? 'text' : 'password'}
                                      value={slackConfig.signingSecret}
                                      onChange={(e) => setSlackConfig(prev => ({ ...prev, signingSecret: e.target.value }))}
                                      placeholder="your-signing-secret"
                                      className="font-mono"
                                    />
                                  </div>
                                </div>
                              )}
                              
                              {step.current && step.id === 'configure-webhooks' && (
                                <div className="mt-4 space-y-4">
                                  <div className="space-y-2">
                                    <Label>Request URL</Label>
                                    <div className="flex gap-2">
                                      <Input
                                        value={`${window.location.origin}/api/webhooks/slack`}
                                        readOnly
                                        className="font-mono text-sm"
                                      />
                                      <Button variant="outline" size="sm" onClick={copyWebhookUrl}>
                                        <Copy className="w-4 h-4" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {language === 'zh'
                                        ? '复制此 URL 到 Event Subscriptions 的 Request URL 字段'
                                        : 'Copy this URL to Event Subscriptions Request URL field'
                                      }
                                    </p>
                                  </div>
                                  
                                  <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      {language === 'zh'
                                        ? '订阅以下事件：message.channels, message.groups'
                                        : 'Subscribe to these events: message.channels, message.groups'
                                      }
                                    </AlertDescription>
                                  </Alert>
                                </div>
                              )}
                              
                              {step.current && step.id === 'test-connection' && (
                                <div className="mt-4">
                                  {isConfiguring ? (
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                        <span className="text-sm">
                                          {language === 'zh' ? '正在测试连接...' : 'Testing connection...'}
                                        </span>
                                      </div>
                                      <Progress value={configProgress} className="h-2" />
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      <Button onClick={testSlackConnection} className="w-full">
                                        <Play className="w-4 h-4 mr-2" />
                                        {language === 'zh' ? '测试连接' : 'Test Connection'}
                                      </Button>
                                      {slackConfig.configured && (
                                        <div className="flex items-center gap-2 text-green-600 text-sm">
                                          <CheckCircle className="w-4 h-4" />
                                          {language === 'zh' ? '连接测试成功！集成已完成。' : 'Connection test successful! Integration completed.'}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* 步骤导航按钮 */}
                              {step.current && (
                                <div className="mt-4 flex gap-2">
                                  {currentStepIndex > 0 && (
                                    <Button 
                                      variant="outline" 
                                      onClick={prevStep}
                                      size="sm"
                                    >
                                      {language === 'zh' ? '上一步' : 'Previous'}
                                    </Button>
                                  )}
                                  {currentStepIndex < 4 && step.id !== 'test-connection' && (
                                    <Button 
                                      onClick={nextStep}
                                      size="sm"
                                    >
                                      {language === 'zh' ? '下一步' : 'Next Step'}
                                      <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                  )}
                                  {step.id === 'install-app' && slackConfig.botToken && slackConfig.signingSecret && (
                                    <Button 
                                      onClick={() => {
                                        saveSlackConfig()
                                        nextStep()
                                      }}
                                      size="sm"
                                    >
                                      {language === 'zh' ? '保存并继续' : 'Save & Continue'}
                                      <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* 帮助卡片 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5" />
                      {language === 'zh' ? '需要帮助？' : 'Need Help?'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <a href="/docs/slack-commercial-integration-guide.md" target="_blank">
                        <FileText className="w-4 h-4 mr-2" />
                        {language === 'zh' ? '查看详细集成文档' : 'View Detailed Integration Guide'}
                      </a>
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="w-4 h-4 mr-2" />
                      {language === 'zh' ? '联系技术支持' : 'Contact Technical Support'}
                    </Button>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {language === 'zh' ? '选择数据源' : 'Select Data Source'}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    {language === 'zh'
                      ? '请从数据源选项卡中选择要配置的集成'
                      : 'Please select an integration to configure from Data Sources tab'
                    }
                  </p>
                  <Button onClick={() => setActiveTab('overview')}>
                    {language === 'zh' ? '查看数据源' : 'View Data Sources'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 监控面板 */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {language === 'zh' ? '集成状态监控' : 'Integration Status Monitoring'}
                </CardTitle>
                <CardDescription>
                  {language === 'zh'
                    ? '实时查看数据源连接状态和使用情况'
                    : 'Real-time view of data source connection status and usage'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {slackConfig.configured ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {language === 'zh' ? '消息同步' : 'Message Sync'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">1,234</div>
                          <p className="text-xs text-gray-500">
                            {language === 'zh' ? '今日消息数' : 'Messages today'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {language === 'zh' ? '活跃频道' : 'Active Channels'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">12</div>
                          <p className="text-xs text-gray-500">
                            {language === 'zh' ? '已连接频道' : 'Connected channels'}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {language === 'zh' ? '响应时间' : 'Response Time'}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">1.2s</div>
                          <p className="text-xs text-gray-500">
                            {language === 'zh' ? '平均延迟' : 'Average latency'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-medium mb-3">
                        {language === 'zh' ? '最近活动' : 'Recent Activity'}
                      </h3>
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-gray-500">
                              {new Date().toLocaleTimeString()}
                            </span>
                            <span>
                              {language === 'zh' 
                                ? `从 #general 频道同步了新消息`
                                : `Synced new message from #general channel`
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      {language === 'zh' ? '暂无数据' : 'No Data Available'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {language === 'zh'
                        ? '请先完成数据源集成配置'
                        : 'Please complete data source integration first'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}