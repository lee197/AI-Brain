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
  FolderOpen,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Calendar,
  User,
  Clock,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Settings,
  Loader2,
  ArrowLeft,
  Shield,
  AlertTriangle,
  Download,
  Share,
  Eye,
  HardDrive,
  Database
} from 'lucide-react'

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  createdTime: string
  modifiedTime: string
  webViewLink?: string
  webContentLink?: string
  owners?: Array<{
    displayName: string
    emailAddress: string
  }>
  shared: boolean
  folder: boolean
}

interface DriveStats {
  user?: {
    displayName: string
    emailAddress: string
  }
  storageQuota?: {
    limit: string
    usage: string
    usageInDrive: string
  }
}

interface UserInfo {
  email?: string
  name?: string
  picture?: string
}

export default function GoogleDriveMessagesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const contextId = params.id as string

  const [files, setFiles] = useState<DriveFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFilter, setCurrentFilter] = useState('recent')
  const [isSearching, setIsSearching] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<{
    connected: boolean
    status: string
    message: string
    userInfo?: UserInfo
    driveStats?: DriveStats
  } | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [error, setError] = useState<string | null>(null)

  // 检测URL参数中的成功状态和倒计时
  useEffect(() => {
    const success = searchParams.get('drive_success')
    if (success === 'true') {
      setShowSuccess(true)
      setCountdown(5)
      
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

  // 加载连接状态和文件
  useEffect(() => {
    loadConnectionStatus()
  }, [contextId])

  useEffect(() => {
    if (connectionStatus?.connected) {
      loadFiles()
    }
  }, [connectionStatus, currentFilter])

  const loadConnectionStatus = async () => {
    try {
      const response = await fetch(`/api/google-drive/status?context_id=${contextId}`)
      const result = await response.json()
      setConnectionStatus(result)
      
      if (!result.connected) {
        setIsLoading(false)
      }
    } catch (error) {
      console.error('检查Google Drive连接状态失败:', error)
      setError('无法检查连接状态')
      setIsLoading(false)
    }
  }

  const loadFiles = async (query?: string) => {
    try {
      setIsSearching(true)
      setError(null)
      
      const params = new URLSearchParams({
        context_id: contextId,
        max_results: '50'
      })
      
      if (query) {
        params.append('search', query)
      } else {
        params.append('query', currentFilter)
      }
      
      const response = await fetch(`/api/google-drive/files?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setFiles(result.files || [])
      } else {
        setError(result.error || '获取文件失败')
      }
    } catch (error) {
      console.error('加载Google Drive文件失败:', error)
      setError('加载文件失败')
    } finally {
      setIsSearching(false)
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      loadFiles(searchQuery)
    } else {
      loadFiles()
    }
  }

  const handleQuickFilter = (filter: string) => {
    setCurrentFilter(filter)
    setSearchQuery('')
  }

  const handleConnect = async () => {
    try {
      const response = await fetch(`/api/google-drive/auth?context_id=${contextId}`)
      const result = await response.json()
      
      if (result.success && result.authUrl) {
        window.location.href = result.authUrl
      } else {
        setError(result.error || 'Failed to get auth URL')
      }
    } catch (error) {
      console.error('Google Drive连接失败:', error)
      setError('连接失败')
    }
  }

  const handleDisconnect = async () => {
    try {
      const response = await fetch(`/api/google-drive/status?context_id=${contextId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setConnectionStatus({ connected: false, status: 'disconnected', message: '已断开连接' })
        setFiles([])
      }
    } catch (error) {
      console.error('断开连接失败:', error)
      setError('断开连接失败')
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

  const formatFileSize = (sizeBytes?: string): string => {
    if (!sizeBytes) return language === 'zh' ? '未知' : 'Unknown'
    
    const bytes = parseInt(sizeBytes)
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    
    if (bytes === 0) return '0 Byte'
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    const size = (bytes / Math.pow(1024, i)).toFixed(1)
    
    return `${size} ${sizes[i]}`
  }

  // 检测URL参数中的成功状态和倒计时
  useEffect(() => {
    const success = searchParams.get('drive_success')
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

  // 加载连接状态
  useEffect(() => {
    loadConnectionStatus()
  }, [contextId])

  // 当连接状态改变时加载文件
  useEffect(() => {
    if (connectionStatus?.connected) {
      loadFiles()
    }
  }, [connectionStatus])

  const getFileIcon = (mimeType: string, folder: boolean) => {
    if (folder) return FolderOpen
    
    if (mimeType.includes('document')) return FileText
    if (mimeType.includes('spreadsheet')) return Database
    if (mimeType.includes('presentation')) return FileText
    if (mimeType.includes('image')) return Image
    if (mimeType.includes('video')) return Video
    if (mimeType.includes('audio')) return Music
    
    return FileText
  }

  const getFileTypeDisplayName = (mimeType: string): string => {
    const typeMap: Record<string, string> = {
      'application/vnd.google-apps.document': language === 'zh' ? 'Google 文档' : 'Google Docs',
      'application/vnd.google-apps.spreadsheet': language === 'zh' ? 'Google 表格' : 'Google Sheets',
      'application/vnd.google-apps.presentation': language === 'zh' ? 'Google 幻灯片' : 'Google Slides',
      'application/vnd.google-apps.folder': language === 'zh' ? '文件夹' : 'Folder',
      'application/pdf': 'PDF',
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'text/plain': language === 'zh' ? '纯文本' : 'Text'
    }

    return typeMap[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'File'
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Google Drive</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' ? 'Google云端硬盘集成' : 'Google Cloud Storage Integration'}
              </p>
            </div>
          </div>
        </div>

        {showSuccess && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 mb-6">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {language === 'zh' 
                ? `🎉 Google Drive连接成功！${countdown}秒后自动返回数据源列表...`
                : `🎉 Google Drive connected successfully! Redirecting to data sources in ${countdown} seconds...`}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <FolderOpen className="w-5 h-5" />
              {language === 'zh' ? '连接Google Drive' : 'Connect Google Drive'}
            </CardTitle>
            <CardDescription>
              {language === 'zh' 
                ? '连接您的Google Drive账户以访问文档、表格、演示文稿和文件'
                : 'Connect your Google Drive account to access docs, sheets, presentations and files'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            {connectionStatus?.status === 'token_expired' && (
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  {language === 'zh' 
                    ? '⚠️ 授权已过期，请重新连接Google Drive'
                    : '⚠️ Authorization expired, please reconnect Google Drive'}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '连接后您可以：' : 'After connecting you can:'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  {language === 'zh' ? '访问文件' : 'Access files'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Search className="w-4 h-4 text-green-600" />
                  {language === 'zh' ? '搜索内容' : 'Search content'}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-purple-600" />
                  {language === 'zh' ? '文档预览' : 'Document preview'}
                </div>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              size="lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {language === 'zh' ? '连接Google Drive' : 'Connect Google Drive'}
            </Button>

            <div className="text-xs text-gray-500 dark:text-gray-400">
              <Shield className="w-3 h-3 inline mr-1" />
              {language === 'zh' 
                ? '我们只读取您的文件，不会修改或删除任何内容'
                : 'We only read your files and never modify or delete anything'}
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Google Drive</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {connectionStatus.userInfo?.email && (
                  <span className="text-blue-600 font-medium">
                    {connectionStatus.userInfo.email}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => loadFiles()}
              variant="outline"
              size="sm"
              disabled={isSearching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isSearching ? 'animate-spin' : ''}`} />
              {language === 'zh' ? '刷新' : 'Refresh'}
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
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 mb-6">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {language === 'zh' 
              ? `🎉 Google Drive连接成功！${countdown}秒后自动返回数据源列表...`
              : `🎉 Google Drive connected successfully! Redirecting to data sources in ${countdown} seconds...`}
          </AlertDescription>
        </Alert>
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
      {connectionStatus.driveStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{files.length}</div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '当前文件' : 'Current Files'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {connectionStatus.driveStats.storageQuota?.usage ? 
                      formatFileSize(connectionStatus.driveStats.storageQuota.usage) : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '已使用' : 'Used'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Archive className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {connectionStatus.driveStats.storageQuota?.limit ? 
                      formatFileSize(connectionStatus.driveStats.storageQuota.limit) : 'Unlimited'}
                  </div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '总容量' : 'Total'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{connectionStatus.driveStats.user?.displayName || 'User'}</div>
                  <div className="text-xs text-gray-600">{language === 'zh' ? '账户名称' : 'Account'}</div>
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
                placeholder={language === 'zh' ? '搜索文件...' : 'Search files...'}
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
            {[
              { key: 'recent', label: language === 'zh' ? '最近' : 'Recent' },
              { key: 'shared', label: language === 'zh' ? '共享' : 'Shared' },
              { key: 'docs', label: language === 'zh' ? '文档' : 'Docs' },
              { key: 'sheets', label: language === 'zh' ? '表格' : 'Sheets' },
              { key: 'slides', label: language === 'zh' ? '幻灯片' : 'Slides' },
              { key: 'folders', label: language === 'zh' ? '文件夹' : 'Folders' }
            ].map((filter) => (
              <Button
                key={filter.key}
                onClick={() => handleQuickFilter(filter.key)}
                variant={currentFilter === filter.key ? "default" : "outline"}
                size="sm"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 文件列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">{language === 'zh' ? '加载中...' : 'Loading...'}</span>
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              {language === 'zh' ? '没有找到文件' : 'No files found'}
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              {language === 'zh' ? '尝试调整搜索条件或检查连接状态' : 'Try adjusting search criteria or check connection status'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.mimeType, file.folder)
            return (
              <Card key={file.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        file.folder ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <FileIcon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {file.name}
                          </h3>
                          {file.shared && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              <Share className="w-3 h-3 mr-1" />
                              {language === 'zh' ? '共享' : 'Shared'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <span>{getFileTypeDisplayName(file.mimeType)}</span>
                          {file.size && <span>{formatFileSize(file.size)}</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(file.modifiedTime)}
                          </span>
                        </div>
                        
                        {file.owners && file.owners.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            {file.owners[0].displayName || file.owners[0].emailAddress}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {file.webViewLink && (
                        <Button
                          onClick={() => window.open(file.webViewLink, '_blank')}
                          variant="ghost"
                          size="sm"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {file.webContentLink && (
                        <Button
                          onClick={() => window.open(file.webContentLink, '_blank')}
                          variant="ghost"
                          size="sm"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}