'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useLanguage } from '@/lib/i18n/language-context'
import { UserMenu } from '@/components/user-menu'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useAuth } from '@/hooks/use-auth'
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
  Brain
} from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'jira' | 'slack' | 'github' | 'calendar'
  title: string
  description: string
  time: string
  icon: any
  color: string
  urgent?: boolean
}

interface StatCard {
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: any
  color: string
}

export default function DashboardPage() {
  const { t } = useLanguage()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [aiInput, setAiInput] = useState('')

  // 检查认证状态
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // 模拟数据
  const stats: StatCard[] = [
    {
      title: '今日任务 / Today Tasks',
      value: 12,
      change: '+3 较昨日',
      trend: 'up',
      icon: CheckCircle2,
      color: 'text-green-600'
    },
    {
      title: '未读消息 / Unread Messages',
      value: 5,
      change: '2 紧急',
      trend: 'neutral',
      icon: MessageSquare,
      color: 'text-blue-600'
    },
    {
      title: '待审核 PR / Pending PRs',
      value: 3,
      change: '1 需立即处理',
      trend: 'down',
      icon: GitPullRequest,
      color: 'text-purple-600'
    },
    {
      title: '活跃集成 / Active Integrations',
      value: 4,
      change: '全部正常',
      trend: 'up',
      icon: Zap,
      color: 'text-orange-600'
    }
  ]

  const recentActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'jira',
      title: 'JIRA: 修复登录问题',
      description: '任务 #AI-123 已分配给你',
      time: '5 分钟前',
      icon: AlertCircle,
      color: 'text-blue-600',
      urgent: true
    },
    {
      id: '2',
      type: 'slack',
      title: 'Slack: @john 提到了你',
      description: '在 #development 频道关于 API 设计的讨论',
      time: '15 分钟前',
      icon: MessageSquare,
      color: 'text-purple-600'
    },
    {
      id: '3',
      type: 'github',
      title: 'GitHub: PR #456 需要审核',
      description: 'feat: 添加用户认证功能',
      time: '1 小时前',
      icon: GitPullRequest,
      color: 'text-gray-600'
    },
    {
      id: '4',
      type: 'calendar',
      title: '日历: 团队会议即将开始',
      description: '每周进度同步会议 - 下午 3:00',
      time: '2 小时后',
      icon: Calendar,
      color: 'text-green-600'
    }
  ]

  const sidebarItems = [
    { icon: LayoutDashboard, label: '概览 / Overview', active: true },
    { icon: MessageSquare, label: 'AI 对话 / AI Chat' },
    { icon: FolderOpen, label: '项目 / Projects' },
    { icon: Users, label: '团队 / Team' },
    { icon: Activity, label: '活动 / Activity' },
    { icon: Settings, label: '设置 / Settings' }
  ]

  return (
    <div className="flex h-screen bg-background">
      {/* 侧边栏 */}
      <aside className="w-64 border-r bg-card">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
              <span className="text-xl">🤖</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">AI Brain</h1>
              <p className="text-xs text-muted-foreground">工作台 / Workspace</p>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  item.active 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部栏 */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索任务、文档、对话... / Search tasks, docs, chats..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <LanguageSwitcher />
              <UserMenu />
            </div>
          </div>
        </header>

        {/* 主要内容 */}
        <main className="flex-1 overflow-auto p-6">
          {/* 欢迎区域 */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">
              欢迎回来 / Welcome back, {user.name || user.email?.split('@')[0]}! 👋
            </h2>
            <p className="text-muted-foreground">
              今天是个高效的一天，让 AI Brain 帮助你完成更多任务
            </p>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    {stat.trend === 'up' && (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI 助手对话 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI 助手 / AI Assistant
                </CardTitle>
                <CardDescription>
                  输入自然语言指令，AI 会帮你完成任务
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 对话历史 */}
                  <div className="space-y-3 min-h-[200px] max-h-[300px] overflow-y-auto p-4 bg-muted/30 rounded-lg">
                    <div className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm">
                          你好！我是你的 AI 助手。我可以帮你：
                        </p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                          <li>• 创建和管理 Jira 任务</li>
                          <li>• 发送 Slack 消息</li>
                          <li>• 查看 GitHub PR</li>
                          <li>• 安排日历会议</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 输入框 */}
                  <div className="flex gap-2">
                    <Input 
                      placeholder="输入指令，如：创建一个关于登录优化的 Jira 任务..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && aiInput.trim()) {
                          // 处理 AI 输入
                          setAiInput('')
                        }
                      }}
                    />
                    <Button size="icon">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* 快捷操作 */}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      创建任务
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      查看日程
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      发送消息
                    </Badge>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      生成报告
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 最近活动 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    最近活动 / Recent
                  </span>
                  <Button variant="ghost" size="sm">
                    查看全部
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className={`mt-1 ${activity.color}`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {activity.title}
                          </p>
                          {activity.urgent && (
                            <Badge variant="destructive" className="text-xs shrink-0">
                              紧急
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 快速操作区 */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>快速操作 / Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <PlusCircle className="w-6 h-6" />
                  <span className="text-xs">创建任务</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <Calendar className="w-6 h-6" />
                  <span className="text-xs">安排会议</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <FileText className="w-6 h-6" />
                  <span className="text-xs">生成报告</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <Database className="w-6 h-6" />
                  <span className="text-xs">数据分析</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}