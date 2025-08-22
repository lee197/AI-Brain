'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  Mail,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  User,
  Clock,
  Paperclip,
  Eye,
  EyeOff,
  Star,
  Archive,
  Settings,
  Loader2,
  ArrowLeft,
  Shield,
  AlertTriangle
} from 'lucide-react'

interface ProcessedEmail {
  id: string
  subject: string
  sender: string        // 改为sender
  senderEmail: string   // 改为senderEmail
  snippet: string       // 改为snippet（预览）
  timestamp: string     // 改为timestamp
  isRead: boolean
  attachments: any[]    // 改为attachments数组
  labels: string[]
  threadId: string
}

interface GmailStats {
  emailAddress?: string
  totalMessages?: number
  totalThreads?: number
  totalLabels?: number
}

interface UserInfo {
  email?: string
  name?: string
  picture?: string
}

export default function GmailMessagesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const contextId = params.id as string

  const [emails, setEmails] = useState<ProcessedEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('in:inbox')
  const [isSearching, setIsSearching] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    status: string
    message: string
    userInfo?: UserInfo
    gmailStats?: GmailStats
  } | null>(null)
  const [isCheckingConnection, setIsCheckingConnection] = useState(true)
  const [showSuccess, setShowSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [storageStats, setStorageStats] = useState<{
    metadataCount: number
    contentCount: number
    totalSize: string
  } | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [aiStats, setAiStats] = useState<{
    totalIndexed: number
    lastUpdated: string
    storageSize: string
  } | null>(null)
  const [isIndexing, setIsIndexing] = useState(false)
  const emailsPerPage = 20 // 每页显示20封邮件

  const loadConnectionStatus = async () => {
    try {
      setIsCheckingConnection(true)
      const response = await fetch(`/api/gmail/status?context_id=${contextId}`)
      const result = await response.json()
      setConnectionStatus(result)
      
      if (!result.connected) {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('检查Gmail连接状态失败:', error)
      setError('无法检查连接状态')
      setIsLoading(false)
    } finally {
      setIsCheckingConnection(false)
    }
  }

  const loadEmails = async (query: string = searchQuery, page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setIsSearching(true)
        setIsLoading(true)
      }
      setError(null)
      
      const response = await fetch(
        `/api/gmail/emails?context_id=${contextId}&query=${encodeURIComponent(query)}&max_results=${emailsPerPage}&page=${page}`
      )
      const result = await response.json()
      
      if (result.success) {
        if (append) {
          setEmails(prev => [...prev, ...(result.emails || [])])
        } else {
          setEmails(result.emails || [])
        }
        // 如果返回的邮件数少于请求的数量，说明没有更多邮件了
        setHasMore(result.hasMore !== undefined ? result.hasMore : (result.emails?.length || 0) === emailsPerPage)
        
        // 更新存储统计和缓存状态
        if (result.storageStats) {
          setStorageStats(result.storageStats)
        }
        if (result.fromCache !== undefined) {
          setFromCache(result.fromCache)
        }
      } else {
        setError(result.error || '获取邮件失败')
      }
    } catch (error) {
      console.error('加载Gmail邮件失败:', error)
      setError('加载邮件失败')
    } finally {
      setIsSearching(false)
      setIsLoading(false)
    }
  }

  const loadMoreEmails = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    loadEmails(searchQuery, nextPage, true)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    setEmails([])
    loadEmails(searchQuery, 1, false)
  }

  const handleQuickFilter = (filter: string) => {
    setSearchQuery(filter)
    setCurrentPage(1)
    setEmails([])
    loadEmails(filter, 1, false)
  }

  const handleConnect = () => {
    const authUrl = `/api/gmail/auth?context_id=${contextId}`
    window.location.href = authUrl
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch(`/api/gmail/status?context_id=${contextId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConnectionStatus({ connected: false, status: 'disconnected', message: '已断开连接' })
        setEmails([])
      }
    } catch (error) {
      console.error('断开连接失败:', error)
      setError('断开连接失败')
    }
  }

  const loadAIStats = async () => {
    try {
      const response = await fetch(`/api/gmail/ai-context?context_id=${contextId}&action=stats`)
      const result = await response.json()
      
      if (result.success) {
        setAiStats(result.stats)
      }
    } catch (error) {
      console.error('加载AI统计信息失败:', error)
    }
  }

  const handleIndexForAI = async () => {
    try {
      setIsIndexing(true)
      setError(null)
      
      const response = await fetch(`/api/gmail/ai-context?context_id=${contextId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'index',
          options: {
            maxEmails: 50,
            priority: 'recent'
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setAiStats(result.stats)
        // 显示成功消息几秒钟
        const successMessage = result.message
        setError(null)
        
        // 临时显示成功消息
        setTimeout(() => {
          console.log('AI索引完成:', successMessage)
        }, 100)
      } else {
        setError(result.error || 'AI索引失败')
      }
    } catch (error) {
      console.error('AI索引失败:', error)
      setError('AI索引失败')
    } finally {
      setIsIndexing(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return language === 'zh' ? '今天' : 'Today'
    } else if (diffDays === 2) {
      return language === 'zh' ? '昨天' : 'Yesterday'
    } else if (diffDays <= 7) {
      return `${diffDays} ${language === 'zh' ? '天前' : 'days ago'}`
    } else {
      return date.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')
    }
  }

  // 检测URL参数中的成功状态和倒计时
  useEffect(() => {
    const success = searchParams.get('gmail_success')
    if (success === 'true') {
      setShowSuccess(true)
      setCountdown(5)
      // 连接成功后立即重新加载连接状态
      loadConnectionStatus()
      
      // 倒计时
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval)
            setShowSuccess(false)
            // 跳转回数据源设置页面
            window.location.href = `/contexts/${contextId}/settings?tab=data-sources`
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
      return () => clearInterval(countdownInterval)
    }
  }, [searchParams, contextId])

  // 加载连接状态和邮件
  useEffect(() => {
    loadConnectionStatus()
  }, [contextId])

  // 当连接状态改变时加载邮件和AI统计
  useEffect(() => {
    if (connectionStatus?.connected) {
      loadEmails()
      loadAIStats()
    }
  }, [connectionStatus])

  // 如果正在检查连接状态，显示加载界面
  if (isCheckingConnection) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {language === 'zh' ? '正在检查Gmail连接状态...' : 'Checking Gmail connection status...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 如果没有连接
  if (!connectionStatus?.connected) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button
            onClick={() => window.history.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'zh' ? '返回' : 'Back'}
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gmail</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' ? 'Google邮件服务集成' : 'Google Email Service Integration'}
              </p>
            </div>
          </div>
        </div>

        {showSuccess && (
          <div className="mb-6 text-center text-green-600 dark:text-green-400">
            {language === 'zh' 
              ? `✅ 连接成功，${countdown}秒后返回...`
              : `✅ Connected successfully, returning in ${countdown}s...`}
          </div>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              {language === 'zh' ? '重新连接Gmail' : 'Reconnect Gmail'}
            </CardTitle>
            <CardDescription>
              {language === 'zh' 
                ? '需要重新授权Gmail以获取完整的邮件访问权限'
                : 'Need to reauthorize Gmail to get full email access permissions'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {/* 首先显示重要警告 */}
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="font-semibold mb-2">
                  {language === 'zh' 
                    ? '⚠️ 重要：请手动勾选所有权限' 
                    : '⚠️ Important: Please manually check all permissions'}
                </div>
                <div className="text-sm">
                  {language === 'zh' 
                    ? '在Google授权页面，您需要手动勾选"Select all"或单独勾选以下两个Gmail权限。这是Google的安全要求，无法自动选择。' 
                    : 'On the Google authorization page, you need to manually check "Select all" or individually check the two Gmail permissions below. This is a Google security requirement and cannot be automatically selected.'}
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {language === 'zh' ? '必须勾选的权限：' : 'Required permissions to check:'}
              </div>
              <div className="grid grid-cols-1 gap-2 text-left max-w-md mx-auto">
                <div className="flex items-center gap-2 text-sm p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border-2 border-red-300">
                  <Mail className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-red-900 dark:text-red-100">
                      {language === 'zh' ? '📧 查看您的电子邮件消息和设置' : '📧 View your email messages and settings'}
                    </div>
                    <div className="text-xs text-red-700 dark:text-red-300 mt-1">
                      {language === 'zh' ? '必须勾选此项才能查看邮件' : 'Must check this to view emails'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">
                      {language === 'zh' ? '✉️ 代表您发送电子邮件' : '✉️ Send email on your behalf'}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {language === 'zh' ? '可选：如需发送邮件功能' : 'Optional: For sending email feature'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center">
                <div className="text-sm font-medium text-green-800 dark:text-green-200">
                  {language === 'zh' 
                    ? '💡 提示：点击"Select all"可一次性勾选所有权限' 
                    : '💡 Tip: Click "Select all" to check all permissions at once'}
                </div>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === 'zh' ? '连接Gmail' : 'Connect Gmail'}
            </Button>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              <Shield className="w-3 h-3 inline mr-1" />
              {language === 'zh' 
                ? '我们只读取您的邮件，不会发送或删除任何内容'
                : 'We only read your emails and never send or delete anything'}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          onClick={() => window.history.back()}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'zh' ? '返回' : 'Back'}
        </Button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gmail</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {connectionStatus.userInfo?.email && (
                  <span className="text-green-600 font-medium">
                    {connectionStatus.userInfo.email}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {/* 存储和AI统计信息 */}
            <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 mr-4">
              {storageStats && (
                <div className="flex items-center gap-2">
                  <span>📊 {language === 'zh' ? '本地缓存:' : 'Local Cache:'}</span>
                  <span>{storageStats.metadataCount} {language === 'zh' ? '封邮件' : 'emails'}</span>
                  <span>• {storageStats.totalSize}</span>
                  {fromCache && (
                    <span className="text-green-600">
                      ⚡ {language === 'zh' ? '缓存模式' : 'Cached'}
                    </span>
                  )}
                </div>
              )}
              {aiStats && (
                <div className="flex items-center gap-2">
                  <span>🤖 {language === 'zh' ? 'AI索引:' : 'AI Indexed:'}</span>
                  <span>{aiStats.totalIndexed} {language === 'zh' ? '封邮件' : 'emails'}</span>
                  <span>• {aiStats.storageSize}</span>
                </div>
              )}
            </div>
            
            <Button
              onClick={() => loadEmails()}
              variant="outline"
              size="sm"
              disabled={isSearching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSearching ? 'animate-spin' : ''}`} />
              {language === 'zh' ? '刷新' : 'Refresh'}
            </Button>

            <Button
              onClick={handleIndexForAI}
              variant="outline"
              size="sm"
              disabled={isIndexing}
              className="bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-950 dark:hover:bg-purple-900 dark:border-purple-800 dark:text-purple-300"
            >
              {isIndexing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <span className="mr-2">🤖</span>
              )}
              {language === 'zh' ? 'AI学习' : 'AI Learn'}
            </Button>
            <Button
              onClick={handleDisconnect}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              {language === 'zh' ? '断开连接' : 'Disconnect'}
            </Button>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="mb-4 text-center text-green-600 dark:text-green-400">
          {language === 'zh' 
            ? '✅ 连接成功，正在同步邮件数据...'
            : '✅ Connected successfully, syncing email data...'}
        </div>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20 mb-6">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      {connectionStatus.gmailStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{connectionStatus.gmailStats.totalMessages?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '总邮件' : 'Total Emails'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{connectionStatus.gmailStats.totalThreads?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '对话' : 'Threads'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold">{connectionStatus.gmailStats.totalLabels || '0'}</div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '标签' : 'Labels'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{emails.length}</div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '当前显示' : 'Currently Shown'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和过滤 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-2 mb-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder={language === 'zh' ? '搜索邮件...' : 'Search emails...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['in:inbox', 'is:unread', 'is:starred', 'has:attachment'].map((filter) => (
              <Button
                key={filter}
                onClick={() => handleQuickFilter(filter)}
                variant={searchQuery === filter ? "default" : "outline"}
                size="sm"
              >
                {filter.replace(':', ': ')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 邮件列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">{language === 'zh' ? '加载中...' : 'Loading...'}</span>
        </div>
      ) : emails.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {language === 'zh' ? '没有找到邮件' : 'No emails found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {language === 'zh' ? '尝试调整搜索条件或检查连接状态' : 'Try adjusting search criteria or check connection status'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {emails.map((email) => (
            <Card 
              key={email.id} 
              className={`transition-all hover:shadow-md cursor-pointer ${!email.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
              onClick={() => window.open(`/contexts/${contextId}/gmail/email/${email.id}`, '_blank')}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-sm">{email.sender}</span>
                        <span className="text-xs text-gray-500">&lt;{email.senderEmail}&gt;</span>
                      </div>
                      {!email.isRead && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                          {language === 'zh' ? '未读' : 'Unread'}
                        </Badge>
                      )}
                      {email.attachments && email.attachments.length > 0 && (
                        <Paperclip className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
                      {email.subject || (language === 'zh' ? '(无主题)' : '(No Subject)')}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">
                      {email.snippet}
                    </p>
                    
                    {email.labels && email.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {email.labels.slice(0, 3).map((label) => (
                          <Badge key={label} variant="outline" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                        {email.labels.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{email.labels.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(email.timestamp)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 加载更多按钮 */}
      {!isLoading && emails.length > 0 && hasMore && (
        <div className="mt-6 text-center">
          <Button
            onClick={loadMoreEmails}
            variant="outline"
            size="lg"
            disabled={isSearching}
            className="min-w-[200px]"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'zh' ? '加载中...' : 'Loading...'}
              </>
            ) : (
              <>
                {language === 'zh' ? '加载更多邮件' : 'Load More Emails'}
              </>
            )}
          </Button>
        </div>
      )}

      {/* 没有更多邮件提示 */}
      {!isLoading && emails.length > 0 && !hasMore && (
        <div className="mt-6 text-center text-gray-500 dark:text-gray-400">
          {language === 'zh' ? '没有更多邮件了' : 'No more emails'}
        </div>
      )}
    </div>
  )
}