/**
 * 数据源状态指示器组件
 * 显示各个MCP服务的连接状态，支持重新授权
 */

'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ExternalLink
} from 'lucide-react'

interface DataSourceStatus {
  id: string
  name: string
  status: 'connected' | 'error' | 'refreshing' | 'needs_auth'
  lastUpdated?: string
  errorMessage?: string
  authUrl?: string
}

interface TokenError {
  provider: string
  code: string
  message: string
  auth_url?: string
}

interface DataSourceStatusProps {
  contextId?: string
  tokenErrors?: TokenError[]
  onRefresh?: () => void
}

export function DataSourceStatus({ 
  contextId, 
  tokenErrors = [], 
  onRefresh 
}: DataSourceStatusProps) {
  const [sources, setSources] = useState<DataSourceStatus[]>([
    {
      id: 'google-workspace',
      name: 'Google Workspace',
      status: 'connected',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'slack',
      name: 'Slack',
      status: 'connected',
      lastUpdated: new Date().toISOString()
    }
  ])

  // 根据tokenErrors更新状态
  useEffect(() => {
    if (tokenErrors.length > 0) {
      setSources(prev => prev.map(source => {
        const error = tokenErrors.find(e => 
          e.provider === 'google' && source.id === 'google-workspace' ||
          e.provider === 'slack' && source.id === 'slack'
        )
        
        if (error) {
          return {
            ...source,
            status: error.code === 'token_expired' ? 'needs_auth' : 'error',
            errorMessage: error.message,
            authUrl: error.auth_url,
            lastUpdated: new Date().toISOString()
          }
        }
        
        return source
      }))
    }
  }, [tokenErrors])

  const getStatusIcon = (status: DataSourceStatus['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case 'error':
      case 'needs_auth':
        return <AlertCircle className="h-3 w-3 text-red-500" />
      case 'refreshing':
        return <RefreshCw className="h-3 w-3 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const getStatusText = (status: DataSourceStatus['status']) => {
    switch (status) {
      case 'connected':
        return '已连接'
      case 'error':
        return '连接错误'
      case 'needs_auth':
        return '需要授权'
      case 'refreshing':
        return '连接中...'
      default:
        return '未知状态'
    }
  }

  const getStatusColor = (status: DataSourceStatus['status']) => {
    switch (status) {
      case 'connected':
        return 'default'
      case 'error':
      case 'needs_auth':
        return 'destructive'
      case 'refreshing':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const handleReauthorize = (source: DataSourceStatus) => {
    if (source.authUrl) {
      window.open(source.authUrl, '_blank')
    } else {
      // 生成授权URL
      const authUrl = `/api/${source.id.replace('-workspace', '')}/oauth/authorize?contextId=${contextId}`
      window.open(authUrl, '_blank')
    }
  }

  const connectedCount = sources.filter(s => s.status === 'connected').length
  const totalCount = sources.length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-2 text-xs"
        >
          <div className="flex items-center gap-1">
            {getStatusIcon(
              connectedCount === totalCount ? 'connected' : 
              sources.some(s => s.status === 'needs_auth') ? 'needs_auth' : 'error'
            )}
            <span className="hidden sm:inline">
              数据源 {connectedCount}/{totalCount}
            </span>
            <span className="sm:hidden">
              {connectedCount}/{totalCount}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">数据源状态</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {sources.map((source) => (
              <div 
                key={source.id}
                className="flex items-center justify-between p-2 rounded-lg border"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(source.status)}
                  <div>
                    <div className="text-sm font-medium">{source.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {getStatusText(source.status)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={getStatusColor(source.status) as any}
                    className="text-xs"
                  >
                    {getStatusText(source.status)}
                  </Badge>
                  
                  {(source.status === 'needs_auth' || source.status === 'error') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReauthorize(source)}
                      className="h-6 text-xs px-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      重新授权
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {tokenErrors.length > 0 && (
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground mb-2">
                最近错误：
              </div>
              <div className="space-y-1">
                {tokenErrors.slice(0, 2).map((error, index) => (
                  <div 
                    key={index}
                    className="text-xs text-red-600 bg-red-50 p-2 rounded"
                  >
                    <strong>{error.provider}:</strong> {error.message}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-2 border-t text-xs text-muted-foreground">
            最后更新: {new Date().toLocaleTimeString('zh-CN')}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}