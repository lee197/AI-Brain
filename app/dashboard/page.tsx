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
import { Markdown } from '@/components/ui/markdown'
import { useLanguage } from '@/lib/i18n/language-context'
import { UserMenu } from '@/components/user-menu'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useAuth } from '@/hooks/use-auth'
import { useContextManager } from '@/hooks/use-context'
import { 
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Calendar,
  Search,
  Bell,
  Send,
  Database,
  Globe,
  Brain,
  BarChart3,
  CheckSquare,
  Loader2,
  Sparkles,
  AlertTriangle,
  Target,
  TrendingUp
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
  const handleSendMessage = async () => {
    if (!aiInput.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: aiInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = aiInput
    setAiInput('')
    setIsProcessing(true)

    try {
      // 调用真正的AI API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          contextId: currentContext?.id,
          conversationId: `conv_${Date.now()}`, // 简单的会话ID生成
          aiModel: 'openai' // 可以让用户选择
        }),
      })

      if (!response.ok) {
        throw new Error(`AI服务错误: ${response.status}`)
      }

      const aiData = await response.json()
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiData.response,
        timestamp: new Date(),
        actions: aiData.actions?.map((action: any, index: number) => ({
          id: `action_${Date.now()}_${index}`,
          type: action.type,
          title: action.title,
          status: action.status || 'pending'
        })) || []
      }
      
      setMessages(prev => [...prev, aiResponse])
      
      // 如果有可执行操作，添加到活动操作列表
      if (aiData.actions?.length > 0) {
        setActiveActions(prev => [...prev, ...aiResponse.actions])
      }
      
    } catch (error) {
      console.error('AI Chat Error:', error)
      
      // 错误时的降级响应
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `抱歉，AI服务暂时不可用。但我可以提供一些基本帮助：

${currentContext ? `当前工作空间: **${currentContext.name}**\n\n` : ''}请尝试以下操作：
• 检查网络连接
• 稍后重试
• 使用快捷标签快速开始常见任务

或者直接告诉我你需要什么帮助，我会尽力协助你。`,
        timestamp: new Date(),
        actions: []
      }
      
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsProcessing(false)
    }
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
    <div className="h-screen flex flex-col bg-background">
        
        {/* 顶部状态栏 */}
        <header className="border-b bg-card/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold">
                {currentContext ? currentContext.name : 'AI Brain'}
              </h1>
              <Badge variant="outline" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                {t.dashboard.aiReady || 'AI 就绪'}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
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
                      {message.role === 'assistant' ? (
                        <Markdown 
                          content={message.content} 
                          className="whitespace-pre-wrap text-sm leading-relaxed"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>
                      )}
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
              
              {/* 快捷建议 - 整合原左侧面板的提示 */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                  onClick={() => setAiInput('查看当前数据源连接状态')}
                >
                  <Database className="w-3 h-3" />
                  查看数据源
                </Badge>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                  onClick={() => setAiInput('为我生成今天的任务清单')}
                >
                  <CheckSquare className="w-3 h-3" />
                  任务清单
                </Badge>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                  onClick={() => setAiInput('分析团队本周的工作进展')}
                >
                  <BarChart3 className="w-3 h-3" />
                  工作进展
                </Badge>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                  onClick={() => setAiInput('帮我安排下周的会议')}
                >
                  <Calendar className="w-3 h-3" />
                  安排会议
                </Badge>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                  onClick={() => setAiInput('搜索相关项目文档')}
                >
                  <Search className="w-3 h-3" />
                  搜索文档
                </Badge>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                  onClick={() => setAiInput('生成项目状态报告')}
                >
                  <FileText className="w-3 h-3" />
                  生成报告
                </Badge>
                <Badge 
                  variant="secondary" 
                  className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                  onClick={() => setAiInput('查看团队成员状态')}
                >
                  <Users className="w-3 h-3" />
                  团队状态
                </Badge>
                {currentContext && (
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
                    onClick={() => router.push('/contexts')}
                  >
                    <Globe className="w-3 h-3" />
                    切换工作空间
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </main>
    </div>
  )
}