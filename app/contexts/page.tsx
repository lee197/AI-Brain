'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLanguage } from '@/lib/i18n/language-context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { UserMenu } from '@/components/user-menu'
import { CreateContextDialog } from '@/components/create-context-dialog'
import { useAuth } from '@/hooks/use-auth'
import { Context, ContextType } from '@/types/context'
import { getContextTypeInfo } from '@/lib/context-utils'
import { 
  Search,
  Plus,
  Users,
  Clock,
  CheckCircle2,
  Archive,
  Settings,
  ArrowRight,
  Sparkles,
  Building2,
  FolderOpen,
  Globe,
  Loader2,
  BookOpen,
  Target,
  Shield,
  Rocket
} from 'lucide-react'

export default function ContextsPage() {
  const { t } = useLanguage()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [contexts, setContexts] = useState<Context[]>([])
  const [loadingContexts, setLoadingContexts] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedContextType, setSelectedContextType] = useState<ContextType | 'ALL'>('ALL')

  // 检查认证状态
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // 获取用户的Context列表
  useEffect(() => {
    if (user) {
      loadContexts()
    }
  }, [user])

  const loadContexts = async () => {
    setLoadingContexts(true)
    try {
      const response = await fetch('/api/contexts')
      if (response.ok) {
        const data = await response.json()
        setContexts(data.contexts || [])
      }
    } catch (error) {
      console.error('Failed to load contexts:', error)
    } finally {
      setLoadingContexts(false)
    }
  }

  // 处理Context选择
  const handleContextSelect = (context: Context) => {
    // 保存选中的Context到localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-brain-current-context', context.id)
    }
    // 跳转到Dashboard
    router.push('/dashboard')
  }

  // 处理Context创建
  const handleContextCreated = (context: Context) => {
    setContexts(prev => [...prev, context])
    setShowCreateDialog(false)
    // 自动选择新创建的Context
    handleContextSelect(context)
  }

  // 过滤和分组Context
  const filteredContexts = contexts.filter(ctx => {
    const matchesSearch = !searchTerm || 
      ctx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ctx.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedContextType === 'ALL' || ctx.type === selectedContextType
    
    return matchesSearch && matchesType && !ctx.archivedAt
  })

  const groupedContexts = filteredContexts.reduce((groups, context) => {
    const type = context.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(context)
    return groups
  }, {} as Record<ContextType, Context[]>)

  const formatLastActivity = (date: Date | string) => {
    const now = new Date()
    const targetDate = date instanceof Date ? date : new Date(date)
    
    if (isNaN(targetDate.getTime())) {
      return t.dashboard.unknown || '未知'
    }
    
    const diff = now.getTime() - targetDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return t.dashboard.today || '今天'
    if (days === 1) return t.dashboard.yesterday || '昨天'
    if (days < 7) return `${days}${t.dashboard.contexts.daysAgo}`
    if (days < 30) return `${Math.floor(days / 7)}${t.dashboard.contexts.weeksAgo}`
    return `${Math.floor(days / 30)}${t.dashboard.contexts.monthsAgo}`
  }

  const getContextIcon = (type: ContextType) => {
    return getContextTypeInfo(type, language).icon || '📁'
  }

  const getContextColor = (type: ContextType) => {
    const colors = {
      PROJECT: 'from-blue-500 to-blue-600',
      DEPARTMENT: 'from-purple-500 to-purple-600',
      TEAM: 'from-green-500 to-green-600',
      CLIENT: 'from-orange-500 to-orange-600',
      PERSONAL: 'from-gray-500 to-gray-600'
    }
    return colors[type] || 'from-gray-500 to-gray-600'
  }

  const contextTypeFilters = [
    { key: 'ALL' as const, label: t.dashboard.contexts.all, icon: Globe },
    { key: 'PROJECT' as ContextType, label: t.dashboard.contexts.project, icon: Target },
    { key: 'DEPARTMENT' as ContextType, label: t.dashboard.contexts.department, icon: Building2 },
    { key: 'TEAM' as ContextType, label: t.dashboard.contexts.team, icon: Users },
    { key: 'CLIENT' as ContextType, label: t.dashboard.contexts.client, icon: Shield },
    { key: 'PERSONAL' as ContextType, label: t.dashboard.contexts.personal, icon: BookOpen }
  ]

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* 顶部导航 */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Rocket className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-xl font-semibold">AI Brain</h1>
                  <p className="text-sm text-muted-foreground">{t.dashboard.contexts.title}</p>
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
        {/* 欢迎区域 */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {t.dashboard.contexts.welcomeBack}，{user.name}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t.dashboard.contexts.selectWorkspace}
            </p>
          </div>

          {/* 搜索和过滤 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.dashboard.contexts.searchWorkspaces}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
            
            <Button 
              onClick={() => setShowCreateDialog(true)}
              size="lg"
              className="h-12 px-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.dashboard.contexts.createNewWorkspace}
            </Button>
          </div>

          {/* 类型过滤器 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {contextTypeFilters.map((filter) => (
              <Button
                key={filter.key}
                variant={selectedContextType === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedContextType(filter.key)}
                className="h-8"
              >
                <filter.icon className="w-3 h-3 mr-1" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Context列表 */}
        {loadingContexts ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredContexts.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? t.dashboard.contexts.noMatchingWorkspaces : t.dashboard.contexts.noWorkspaces}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm ? t.dashboard.contexts.tryAdjustSearch : t.dashboard.contexts.noWorkspacesDesc}
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t.dashboard.contexts.createWorkspace}
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedContexts).map(([type, typeContexts]) => (
              <div key={type}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">{getContextIcon(type as ContextType)}</div>
                  <h3 className="text-lg font-semibold">
                    {getContextTypeInfo(type as ContextType, language).title}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {typeContexts.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeContexts.map((context) => (
                    <Card 
                      key={context.id} 
                      className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-0 shadow-md"
                      onClick={() => handleContextSelect(context)}
                    >
                      <CardHeader className="pb-3">
                        <div className={`w-full h-2 rounded-full bg-gradient-to-r ${getContextColor(context.type)} mb-3`} />
                        
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className={`text-white bg-gradient-to-r ${getContextColor(context.type)}`}>
                                {context.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-base truncate">
                                {context.name}
                              </CardTitle>
                              <Badge 
                                variant="secondary" 
                                className="text-xs mt-1"
                              >
                                {CONTEXT_TYPE_INFO[context.type]?.title}
                              </Badge>
                            </div>
                          </div>
                          
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {context.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{context.members.length} {t.dashboard.contexts.members}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatLastActivity(context.createdAt)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Context创建对话框 */}
      <CreateContextDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onContextCreated={handleContextCreated}
      />
    </div>
  )
}