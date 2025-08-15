'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useLanguage } from '@/lib/i18n/language-context'
import { Context, ContextType, CONTEXT_TYPE_INFO } from '@/types/context'
import { 
  ChevronDown, 
  Plus, 
  Search,
  Users,
  Clock,
  Archive,
  Settings,
  CheckCircle2
} from 'lucide-react'

interface ContextSwitcherProps {
  currentContext?: Context
  onContextChange: (context: Context) => void
  onCreateNew: () => void
  className?: string
}

export function ContextSwitcher({ 
  currentContext, 
  onContextChange, 
  onCreateNew,
  className 
}: ContextSwitcherProps) {
  const { t } = useLanguage()
  const [contexts, setContexts] = useState<Context[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // 获取用户的Context列表
  useEffect(() => {
    loadContexts()
  }, [])

  const loadContexts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/contexts')
      if (response.ok) {
        const data = await response.json()
        setContexts(data.contexts || [])
      }
    } catch (error) {
      console.error('Failed to load contexts:', error)
    } finally {
      setLoading(false)
    }
  }

  // 按类型分组Context
  const groupedContexts = contexts.reduce((groups, context) => {
    const type = context.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(context)
    return groups
  }, {} as Record<ContextType, Context[]>)

  // 过滤搜索结果
  const filteredContexts = searchTerm
    ? contexts.filter(ctx => 
        ctx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ctx.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : null

  const formatLastActivity = (date: Date | string) => {
    const now = new Date()
    // Handle both Date objects and ISO date strings
    const targetDate = date instanceof Date ? date : new Date(date)
    
    // Check if the date is valid
    if (isNaN(targetDate.getTime())) {
      return t.dashboard.unknown || '未知'
    }
    
    const diff = now.getTime() - targetDate.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return t.dashboard.today || '今天'
    if (days === 1) return t.dashboard.yesterday || '昨天'
    if (days < 7) return `${days}天前`
    if (days < 30) return `${Math.floor(days / 7)}周前`
    return `${Math.floor(days / 30)}个月前`
  }

  const getContextIcon = (type: ContextType) => {
    return CONTEXT_TYPE_INFO[type]?.icon || '📁'
  }

  const getContextBadgeColor = (type: ContextType) => {
    const colors = {
      PROJECT: 'bg-blue-100 text-blue-700',
      DEPARTMENT: 'bg-purple-100 text-purple-700',
      TEAM: 'bg-green-100 text-green-700',
      CLIENT: 'bg-orange-100 text-orange-700',
      PERSONAL: 'bg-gray-100 text-gray-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={`h-10 justify-between min-w-[200px] ${className}`}
        >
          <div className="flex items-center gap-2">
            {currentContext ? (
              <>
                <span className="text-lg">
                  {getContextIcon(currentContext.type)}
                </span>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium truncate max-w-[140px]">
                    {currentContext.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {CONTEXT_TYPE_INFO[currentContext.type]?.title}
                  </span>
                </div>
              </>
            ) : (
              <>
                <span className="text-lg">📁</span>
                <span className="text-sm text-muted-foreground">
                  {t.dashboard.selectContext || '选择工作空间'}
                </span>
              </>
            )}
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80 p-0" align="start">
        {/* 搜索框 */}
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t.dashboard.searchContexts || '搜索工作空间...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Context列表 */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {t.common.loading || '加载中...'}
            </div>
          ) : filteredContexts ? (
            // 搜索结果
            filteredContexts.length > 0 ? (
              <div className="p-2">
                {filteredContexts.map((context) => (
                  <DropdownMenuItem
                    key={context.id}
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => onContextChange(context)}
                  >
                    <span className="text-lg">
                      {getContextIcon(context.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {context.name}
                        </span>
                        {currentContext?.id === context.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getContextBadgeColor(context.type)}`}
                        >
                          {CONTEXT_TYPE_INFO[context.type]?.title}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {context.members.length} 成员
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {t.dashboard.noContextsFound || '未找到匹配的工作空间'}
              </div>
            )
          ) : (
            // 分组显示
            Object.entries(groupedContexts).map(([type, typeContexts]) => (
              <div key={type}>
                <DropdownMenuLabel className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span>{getContextIcon(type as ContextType)}</span>
                    <span>{CONTEXT_TYPE_INFO[type as ContextType]?.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {typeContexts.length}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                
                <div className="p-1">
                  {typeContexts.map((context) => (
                    <DropdownMenuItem
                      key={context.id}
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => onContextChange(context)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {context.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {context.name}
                          </span>
                          {currentContext?.id === context.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                          {context.archivedAt && (
                            <Archive className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{context.members.length}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatLastActivity(context.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
                
                {Object.keys(groupedContexts).indexOf(type) < Object.keys(groupedContexts).length - 1 && (
                  <DropdownMenuSeparator />
                )}
              </div>
            ))
          )}
        </div>

        {/* 底部操作 */}
        <DropdownMenuSeparator />
        <div className="p-2">
          <DropdownMenuItem 
            className="flex items-center gap-2 p-3 cursor-pointer text-primary"
            onClick={onCreateNew}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm font-medium">
              {t.dashboard.createNewContext || '创建新工作空间'}
            </span>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="flex items-center gap-2 p-3 cursor-pointer">
            <Settings className="h-4 w-4" />
            <span className="text-sm">
              {t.dashboard.manageContexts || '管理工作空间'}
            </span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}