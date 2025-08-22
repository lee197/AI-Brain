'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useLanguage } from '@/lib/i18n/language-context'
import { generateGoogleWorkspaceData } from '@/lib/data-sources/mock-data-generator'
import {
  ArrowLeft,
  Search,
  Filter,
  Mail,
  Calendar,
  FolderOpen,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Video,
  Star,
  Paperclip,
  CheckCircle,
  ExternalLink,
  Key,
  UserCheck
} from 'lucide-react'

interface GoogleWorkspaceStatus {
  connected: boolean
  status: string
  message: string
  userInfo?: {
    email: string
    name: string
    picture?: string
  }
  gmailStats?: {
    emailAddress: string
    totalMessages: number
    totalThreads: number
    totalLabels: number
  }
}

interface EmailData {
  id: string
  subject: string
  sender: string
  senderEmail: string
  recipients: string[]
  content: string
  timestamp: string
  isRead: boolean
  labels: string[]
  attachments: Array<{
    filename: string
    mimeType: string
    size: number
  }>
  snippet: string
}

export default function GoogleWorkspaceMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  
  const contextId = params.id as string
  const [connectionStatus, setConnectionStatus] = useState<GoogleWorkspaceStatus | null>(null)
  const [emails, setEmails] = useState<EmailData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState<'emails' | 'documents' | 'meetings'>('emails')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 检查连接状态
  const checkConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/google-workspace/status?context_id=${contextId}`)
      const status = await response.json()
      setConnectionStatus(status)
      return status
    } catch (error) {
      console.error('检查Google Workspace连接状态失败:', error)
      setConnectionStatus({
        connected: false,
        status: 'error',
        message: '无法检查连接状态'
      })
      return null
    }
  }

  // 获取Gmail邮件数据
  const fetchEmails = async (type: string = 'inbox', query?: string) => {
    try {
      setError(null)
      setIsRefreshing(true)

      const params = new URLSearchParams({
        context_id: contextId,
        type,
        max_results: '20'
      })

      if (query) {
        params.append('q', query)
      }

      const response = await fetch(`/api/google-workspace/emails?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '获取邮件失败')
      }

      if (data.success) {
        setEmails(data.emails || [])
      } else {
        setError(data.error || '获取邮件失败')
      }
    } catch (error: any) {
      console.error('获取Gmail邮件失败:', error)
      setError(error.message || '获取邮件失败')
      
      // 如果是认证错误，回退到mock数据
      if (error.message.includes('认证') || error.message.includes('授权')) {
        console.log('使用mock数据作为fallback')
        const mockData = generateGoogleWorkspaceData()
        setEmails(mockData.emails.map(email => ({
          id: email.id,
          subject: email.subject,
          sender: email.sender.name,
          senderEmail: email.sender.email,
          recipients: email.recipients.map(r => r.email),
          content: email.content,
          timestamp: email.timestamp.toISOString(),
          isRead: email.isRead,
          labels: email.labels,
          attachments: [],
          snippet: email.content.substring(0, 150) + '...'
        })))
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  // 初始化连接
  const initializeGoogleConnection = async () => {
    try {
      setIsConnecting(true)
      const response = await fetch(`/api/google-workspace/auth?context_id=${contextId}`)
      const data = await response.json()

      if (data.authUrl) {
        // 在新窗口打开授权页面
        window.open(data.authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes')
        
        // 监听授权完成
        const checkAuthComplete = setInterval(async () => {
          const status = await checkConnectionStatus()
          if (status?.connected) {
            clearInterval(checkAuthComplete)
            setIsConnecting(false)
            await fetchEmails()
          }
        }, 3000)

        // 30秒后停止检查
        setTimeout(() => {
          clearInterval(checkAuthComplete)
          setIsConnecting(false)
        }, 30000)
      }
    } catch (error) {
      console.error('初始化Google连接失败:', error)
      setIsConnecting(false)
    }
  }

  // 处理搜索
  const handleSearch = async () => {
    if (connectionStatus?.connected && searchQuery.trim()) {
      await fetchEmails('search', searchQuery.trim())
    }
  }

  // 断开连接
  const disconnectGoogle = async () => {
    try {
      const response = await fetch(`/api/google-workspace/status?context_id=${contextId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConnectionStatus({
          connected: false,
          status: 'disconnected',
          message: '已断开Google Workspace连接'
        })
        setEmails([])
      }
    } catch (error) {
      console.error('断开Google连接失败:', error)
    }
  }

  // 初始化
  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true)
      
      // 检查URL参数中的认证状态
      const authStatus = searchParams.get('google_auth')
      const email = searchParams.get('email')
      
      if (authStatus === 'success' && email) {
        // 认证成功，等待片刻再检查状态
        setTimeout(async () => {
          await checkConnectionStatus()
          await fetchEmails()
          setIsLoading(false)
        }, 1000)
        return
      }

      // 正常检查连接状态
      const status = await checkConnectionStatus()
      
      if (status?.connected) {
        await fetchEmails()
      }
      
      setIsLoading(false)
    }

    if (contextId) {
      initializePage()
    }
  }, [contextId])

  // 格式化时间
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2">加载Google Workspace数据...</span>
        </div>
      </div>
    )
  }

  // 未连接状态
  if (!connectionStatus?.connected) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </Button>
          </div>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">连接Google Workspace</CardTitle>
            <CardDescription>
              连接您的Google账户以访问Gmail、Google Drive和Calendar数据
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {connectionStatus?.message && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{connectionStatus.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>读取Gmail邮件</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>访问Google Drive文档</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>查看Calendar事件</span>
              </div>
            </div>

            <Button 
              onClick={initializeGoogleConnection}
              disabled={isConnecting}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  连接中...
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  连接Google Workspace
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              点击连接将跳转到Google授权页面，授权后自动返回
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 已连接状态
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 头部信息 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gmail</h1>
            <p className="text-gray-600">
              {connectionStatus.userInfo?.email} • 
              {connectionStatus.gmailStats?.totalMessages || 0} 封邮件
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchEmails('inbox')}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            刷新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={disconnectGoogle}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            断开连接
          </Button>
        </div>
      </div>

      {/* 状态提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">总邮件数</p>
                <p className="text-xl font-bold">{connectionStatus.gmailStats?.totalMessages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">已读邮件</p>
                <p className="text-xl font-bold">{emails.filter(e => e.isRead).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">未读邮件</p>
                <p className="text-xl font-bold">{emails.filter(e => !e.isRead).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Paperclip className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">附件邮件</p>
                <p className="text-xl font-bold">{emails.filter(e => e.attachments.length > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 邮件过滤标签页 */}
      <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emails" onClick={() => fetchEmails('inbox')}>
            <Mail className="w-4 h-4 mr-2" />
            收件箱
          </TabsTrigger>
          <TabsTrigger value="unread" onClick={() => fetchEmails('unread')}>
            <AlertCircle className="w-4 h-4 mr-2" />
            未读邮件
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="w-4 h-4 mr-2" />
            搜索
          </TabsTrigger>
        </TabsList>

        {/* 搜索框 */}
        {selectedTab === 'search' && (
          <div className="flex space-x-2">
            <Input
              placeholder="搜索邮件内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={!searchQuery.trim()}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* 邮件列表 */}
        <TabsContent value={selectedTab} className="space-y-4">
          {emails.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到邮件</h3>
                <p className="text-gray-600">
                  {selectedTab === 'search' 
                    ? '尝试使用不同的搜索关键词' 
                    : '这里还没有邮件数据'}
                </p>
              </CardContent>
            </Card>
          ) : (
            emails.map((email) => (
              <Card key={email.id} className={`transition-all hover:shadow-md ${!email.isRead ? 'border-l-4 border-l-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>{email.sender.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{email.sender}</span>
                          {!email.isRead && (
                            <Badge className="bg-blue-100 text-blue-800">未读</Badge>
                          )}
                          {email.attachments.length > 0 && (
                            <Paperclip className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{formatDate(email.timestamp)}</span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2">{email.subject}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{email.snippet}</p>
                      {email.recipients.length > 0 && (
                        <div className="text-xs text-gray-500">
                          收件人: {email.recipients.slice(0, 3).join(', ')}
                          {email.recipients.length > 3 && ` +${email.recipients.length - 3}`}
                        </div>
                      )}
                      {email.attachments.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {email.attachments.length} 个附件
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}