'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/lib/i18n/language-context'
import { UserMenu } from '@/components/user-menu'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useAuth } from '@/hooks/use-auth'
import { useContextManager } from '@/hooks/use-context'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Context } from '@/types/context'
import { 
  MessageSquare, 
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  FileText,
  GitPullRequest,
  Calendar,
  Search,
  Bell,
  LayoutDashboard,
  FolderOpen,
  Settings,
  PlusCircle,
  Send,
  Activity,
  Zap,
  Database,
  Globe,
  Brain,
  Inbox,
  BarChart3,
  Target,
  AlertTriangle,
  CheckSquare,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Monitor,
  Sparkles,
  ArrowUpRight,
  Cpu,
  Wifi,
  WifiOff,
  GripVertical
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  suggestions?: string[]
  actions?: ActionItem[]
}

interface ActionItem {
  id: string
  type: 'create_task' | 'send_message' | 'schedule_meeting' | 'generate_report'
  title: string
  status: 'pending' | 'executing' | 'completed' | 'failed'
  progress?: number
  result?: string
}

interface DataSource {
  id: string
  name: string
  type: 'slack' | 'jira' | 'github' | 'google'
  status: 'connected' | 'syncing' | 'error' | 'disconnected'
  lastSync: Date
  itemCount: number
  quality: number
}

interface InsightItem {
  id: string
  type: 'warning' | 'opportunity' | 'trend' | 'suggestion'
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  icon: any
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const { user, loading } = useAuth()
  const router = useRouter()
  const { 
    currentContext, 
    loading: contextLoading 
  } = useContextManager()
  const [aiInput, setAiInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeActions, setActiveActions] = useState<ActionItem[]>([])

  // 检查认证状态
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 初始化和更新示例对话（响应语言变化）
  useEffect(() => {
    const aiGreeting = `${t.dashboard.aiGreeting}

• ${t.dashboard.capabilities.taskManagement}
• ${t.dashboard.capabilities.teamCollaboration}
• ${t.dashboard.capabilities.codeManagement}
• ${t.dashboard.capabilities.meetingScheduling}
• ${t.dashboard.capabilities.dataInsights}

${t.dashboard.todayFocus}
- ${t.dashboard.focusItems.prPending}
- ${t.dashboard.focusItems.projectRisk}
- ${t.dashboard.focusItems.teamOverload}

${t.dashboard.howCanIHelp}`
      
    const initialMessage: Message = {
      id: '1',
      role: 'assistant',
      content: aiGreeting,
      timestamp: new Date(),
      suggestions: [
        t.dashboard.suggestions.todayTasks,
        t.dashboard.suggestions.progressReport,
        t.dashboard.suggestions.optimizeWorkload,
        t.dashboard.suggestions.scheduleMeeting
      ]
    }

    // 更新或创建初始消息，确保语言切换时内容也更新
    setMessages(prevMessages => {
      if (prevMessages.length === 0) {
        return [initialMessage]
      } else {
        // 更新现有消息中的AI回复内容以匹配当前语言
        return prevMessages.map((msg) => {
          if (msg.role === 'assistant' && msg.id === '1') {
            // 更新初始AI消息
            return { ...initialMessage, timestamp: msg.timestamp }
          } else if (msg.role === 'assistant' && msg.actions) {
            // 更新带有操作的AI消息
            return {
              ...msg,
              content: t.dashboard.aiResponse,
              actions: msg.actions.map(action => ({
                ...action,
                title: t.dashboard.createJiraTask
              }))
            }
          }
          return msg
        })
      }
    })
  }, [t])

  // 如果没有选择Context，重定向到Context选择页面
  useEffect(() => {
    if (!contextLoading && !currentContext) {
      // 检查localStorage中是否有保存的Context ID
      const savedContextId = typeof window !== 'undefined' 
        ? localStorage.getItem('ai-brain-current-context')
        : null
      
      // 只有在没有保存的Context ID时才重定向
      if (!savedContextId) {
        router.push('/contexts')
      }
    }
  }, [currentContext, contextLoading, router])

  // 定义处理函数
  const handleSendMessage = () => {
    if (!aiInput.trim()) return

    const contextPrefix = currentContext ? `[${currentContext.name}] ` : ''
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: aiInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setAiInput('')
    setIsProcessing(true)

    // 模拟 AI 响应（Context感知）
    setTimeout(() => {
      const contextAwareResponse = currentContext 
        ? `${contextPrefix}${t.dashboard.aiResponse}\n\n基于当前工作空间"${currentContext.name}"的上下文，我建议：\n1. 在此${currentContext.type === 'PROJECT' ? '项目' : currentContext.type === 'DEPARTMENT' ? '部门' : '工作空间'}内处理相关任务\n2. 确保与团队成员协调\n3. 遵循工作空间的设置和规范`
        : t.dashboard.aiResponse

      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: contextAwareResponse,
        timestamp: new Date(),
        actions: [
          {
            id: 'action1',
            type: 'create_task',
            title: currentContext ? `在 ${currentContext.name} 中创建任务` : t.dashboard.createJiraTask,
            status: 'pending'
          }
        ]
      }
      setMessages(prev => [...prev, aiResponse])
      setIsProcessing(false)
    }, 2000)
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // 如果用户未认证，返回 null（将被重定向）
  if (!user) {
    return null
  }

  // 数据收集模块数据
  const dataSources: DataSource[] = [
    {
      id: '1',
      name: 'Slack',
      type: 'slack',
      status: 'connected',
      lastSync: new Date(Date.now() - 5 * 60000),
      itemCount: 1247,
      quality: 95
    },
    {
      id: '2', 
      name: 'Jira',
      type: 'jira',
      status: 'syncing',
      lastSync: new Date(Date.now() - 2 * 60000),
      itemCount: 342,
      quality: 88
    },
    {
      id: '3',
      name: 'GitHub',
      type: 'github', 
      status: 'connected',
      lastSync: new Date(Date.now() - 8 * 60000),
      itemCount: 567,
      quality: 92
    },
    {
      id: '4',
      name: 'Google Workspace',
      type: 'google',
      status: 'error',
      lastSync: new Date(Date.now() - 3600000),
      itemCount: 0,
      quality: 0
    }
  ]

  // 智能洞察数据
  const insights: InsightItem[] = [
    {
      id: '1',
      type: 'warning',
      title: t.dashboard.projectRisk,
      description: t.dashboard.projectRiskDesc,
      priority: 'high',
      actionable: true,
      icon: AlertTriangle
    },
    {
      id: '2',
      type: 'opportunity',
      title: t.dashboard.resourceOptimization,
      description: t.dashboard.resourceOptimizationDesc,
      priority: 'medium',
      actionable: true,
      icon: Target
    },
    {
      id: '3',
      type: 'trend',
      title: t.dashboard.codeQuality,
      description: t.dashboard.codeQualityDesc,
      priority: 'low',
      actionable: false,
      icon: TrendingUp
    }
  ]

  return (
    <div className="h-screen bg-background">
      <PanelGroup direction="horizontal" className="h-full">
        {/* 左侧智能概览面板 */}
        <Panel defaultSize={25} minSize={15} maxSize={40} className="bg-card/50 flex flex-col">
        {/* 当前Context显示区域 */}
        <div className="p-4 border-b">
          {currentContext ? (
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {currentContext.type === 'PROJECT' ? '🚀' :
                 currentContext.type === 'DEPARTMENT' ? '🏢' :
                 currentContext.type === 'TEAM' ? '👥' :
                 currentContext.type === 'CLIENT' ? '🤝' : '📝'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {currentContext.name}
                </h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  {currentContext.type === 'PROJECT' ? '项目' :
                   currentContext.type === 'DEPARTMENT' ? '部门' :
                   currentContext.type === 'TEAM' ? '团队' :
                   currentContext.type === 'CLIENT' ? '客户' : '个人'}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/contexts')}
                className="text-xs"
              >
                切换
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            </div>
          )}
        </div>

        {/* 三模块架构状态 */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            {t.dashboard.systemStatus}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <Inbox className="w-3 h-3" />
                {t.dashboard.dataCollection}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600">{t.dashboard.running}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <Brain className="w-3 h-3" />
                {t.dashboard.aiAnalysis}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-blue-600">{t.dashboard.processing}</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                {t.dashboard.taskExecution}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-orange-600">{t.dashboard.ready}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 数据源状态 */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Database className="w-4 h-4" />
            {t.dashboard.dataSources}
          </h3>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {dataSources.map((source) => (
                <div key={source.id} className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded">
                  <div className="flex items-center gap-2">
                    {source.status === 'connected' && <Wifi className="w-3 h-3 text-green-500" />}
                    {source.status === 'syncing' && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                    {source.status === 'error' && <WifiOff className="w-3 h-3 text-red-500" />}
                    <span>{source.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{source.itemCount}</div>
                    <div className="text-xs">{source.quality}%</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* 智能洞察 */}
        <div className="flex-1 p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t.dashboard.insights}
          </h3>
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {insights.map((insight) => (
                <Card key={insight.id} className="p-3 text-xs">
                  <div className="flex items-start gap-2">
                    <insight.icon className={`w-4 h-4 mt-0.5 ${
                      insight.priority === 'high' ? 'text-red-500' :
                      insight.priority === 'medium' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium mb-1">
                        {insight.id === '1' ? t.dashboard.projectRisk :
                         insight.id === '2' ? t.dashboard.resourceOptimization :
                         t.dashboard.codeQuality}
                      </p>
                      <p className="text-muted-foreground">
                        {insight.id === '1' ? t.dashboard.projectRiskDesc :
                         insight.id === '2' ? t.dashboard.resourceOptimizationDesc :
                         t.dashboard.codeQualityDesc}
                      </p>
                      {insight.actionable && (
                        <Button size="sm" variant="outline" className="mt-2 h-6 px-2 text-xs">
                          {t.dashboard.takeAction}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
        </Panel>

        {/* 左右面板之间的调整把手 */}
        <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors flex items-center justify-center group">
          <div className="w-1 h-8 bg-border rounded-full group-hover:bg-primary/50 transition-colors">
            <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </PanelResizeHandle>

        {/* 中央 AI 对话区域 */}
        <Panel defaultSize={55} minSize={40} className="flex flex-col bg-background">
        {/* 顶部状态栏 */}
        <header className="border-b bg-card/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-muted-foreground">{t.dashboard.syncing} 3/4</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <span className="text-muted-foreground">{t.dashboard.pending} 5</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-muted-foreground">{t.dashboard.queued} 2</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-xs">
                <Cpu className="w-3 h-3 mr-1" />
                {t.dashboard.aiMode}: {t.dashboard.enhanced}
              </Badge>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <LanguageSwitcher />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* 主对话区域 - 占据大部分空间 */}
        <main className="flex-1 flex flex-col">
          {/* 对话消息区 */}
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  {message.role === 'assistant' && (
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Brain className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex-1 max-w-3xl ${
                    message.role === 'user' ? 'text-right' : ''
                  }`}>
                    <div className={`rounded-2xl p-4 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground ml-auto max-w-lg' 
                        : 'bg-card border'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                      {message.role === 'assistant' && (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            👍
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            👎
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2">
                            📝
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* AI 建议操作 */}
                    {message.suggestions && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {message.suggestions.map((suggestion, index) => (
                          <Badge 
                            key={index}
                            variant="outline" 
                            className="cursor-pointer hover:bg-secondary"
                            onClick={() => setAiInput(suggestion)}
                          >
                            {suggestion}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* 执行中的任务 */}
                    {message.actions && (
                      <div className="mt-4 space-y-2">
                        {message.actions.map((action) => (
                          <Card key={action.id} className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {action.status === 'executing' && <Loader2 className="w-4 h-4 animate-spin" />}
                                {action.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                {action.status === 'pending' && <Clock className="w-4 h-4 text-orange-500" />}
                                <span className="text-sm">{action.title}</span>
                              </div>
                              {action.status === 'pending' && (
                                <Button size="sm" variant="outline">
                                  执行
                                </Button>
                              )}
                            </div>
                            {action.progress && (
                              <Progress value={action.progress} className="mt-2" />
                            )}
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback>{(user.name || user.email)?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isProcessing && (
                <div className="flex gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Brain className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-card border rounded-2xl p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">{t.dashboard.aiThinking}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 输入区域 */}
          <div className="border-t bg-card/50 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && aiInput.trim()) {
                        handleSendMessage()
                      }
                    }}
                    placeholder={t.dashboard.inputPlaceholder}
                    className="text-base py-4 px-4 rounded-2xl"
                    disabled={isProcessing}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      📎
                    </Button>
                  </div>
                </div>
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!aiInput.trim() || isProcessing}
                  size="lg"
                  className="rounded-2xl px-6"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {/* 快捷建议 */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  t.dashboard.suggestions.todayTasks,
                  t.dashboard.suggestions.progressReport,
                  t.dashboard.suggestions.optimizeWorkload,
                  t.dashboard.suggestions.urgentTask,
                  t.dashboard.suggestions.scheduleMeeting
                ].map((suggestion, index) => (
                  <Badge 
                    key={index}
                    variant="secondary" 
                    className="cursor-pointer hover:bg-secondary/80"
                    onClick={() => setAiInput(suggestion)}
                  >
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </main>
        </Panel>

        {/* 中右面板之间的调整把手 */}
        <PanelResizeHandle className="w-2 bg-border hover:bg-primary/20 transition-colors flex items-center justify-center group">
          <div className="w-1 h-8 bg-border rounded-full group-hover:bg-primary/50 transition-colors">
            <GripVertical className="w-3 h-3 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </PanelResizeHandle>

        {/* 右侧任务执行面板 */}
        <Panel defaultSize={20} minSize={15} maxSize={35} className="border-l bg-card/30 flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            {t.dashboard.executionQueue}
          </h3>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {activeActions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t.dashboard.noTasks}</p>
              </div>
            ) : (
              activeActions.map((action) => (
                <Card key={action.id} className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {action.status === 'executing' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                    {action.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {action.status === 'pending' && <Clock className="w-4 h-4 text-orange-500" />}
                    {action.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    <span className="text-sm font-medium">{action.title}</span>
                  </div>
                  {action.progress !== undefined && (
                    <Progress value={action.progress} className="mb-2" />
                  )}
                  <div className="flex gap-1">
                    {action.status === 'pending' && (
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        <Play className="w-3 h-3 mr-1" />
                        {t.dashboard.start}
                      </Button>
                    )}
                    {action.status === 'executing' && (
                      <Button size="sm" variant="outline" className="h-6 text-xs">
                        <Pause className="w-3 h-3 mr-1" />
                        {t.dashboard.pause}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 text-xs">
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
        </Panel>
      </PanelGroup>

    </div>
  )
}