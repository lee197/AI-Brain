'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/i18n/language-context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { UserMenu } from '@/components/user-menu'
import { useAuth } from '@/hooks/use-auth'
import { Context } from '@/types/context'
import { getContextTypeInfo } from '@/lib/context-utils'
import { 
  ArrowLeft,
  Settings,
  Users,
  Activity,
  MessageSquare,
  BarChart3,
  Calendar,
  FileText,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react'

export default function ContextDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user, loading } = useAuth()
  const [context, setContext] = useState<Context | null>(null)
  const [loadingContext, setLoadingContext] = useState(true)

  const contextId = params.id as string

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* 顶部导航 */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/contexts')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.common.back}
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-xl">
                  {contextTypeInfo.icon}
                </div>
                <div>
                  <h1 className="text-xl font-semibold">{context.name}</h1>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {contextTypeInfo.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {context.description}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* 概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃度</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98%</div>
              <p className="text-xs text-muted-foreground">
                较上周 +12%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">团队成员</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{context.teamMembers?.length || 1}</div>
              <p className="text-xs text-muted-foreground">
                +2 本月新增
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">消息数</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                较昨天 +18
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">任务完成</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-xs text-muted-foreground">
                本周目标进度
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 主要功能区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI聊天区域 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI 智能助手
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <Zap className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">AI助手即将上线</h3>
                  <p className="text-muted-foreground">
                    在这里与AI助手对话，获取项目洞察和建议
                  </p>
                  <Button className="mt-4">
                    开始对话
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 侧边栏功能 */}
          <div className="space-y-6">
            {/* 团队成员 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  团队成员
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.name || '当前用户'}</p>
                      <p className="text-xs text-muted-foreground">拥有者</p>
                    </div>
                  </div>
                  {context.teamMembers?.slice(0, 3).map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {member.name?.charAt(0) || 'M'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full">
                    查看全部成员
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  快速操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    报告
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    日程
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    文档
                  </Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    设置
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 最近活动 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              最近活动
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Context创建成功</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(context.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium">AI助手集成准备中</p>
                  <p className="text-xs text-muted-foreground">即将开始智能对话</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}