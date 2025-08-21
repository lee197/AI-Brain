'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  ArrowLeft,
  Search,
  Filter,
  MessageSquare,
  Hash,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  Calendar,
  MoreHorizontal
} from 'lucide-react'

interface SlackMessage {
  id: string
  channel: { id: string; name: string }
  user: { id: string; name: string; avatar: string }
  text: string
  timestamp: Date
  reactions: Array<{ name: string; count: number; users: string[] }>
  thread_count: number
}

interface SlackMessagesData {
  messages: SlackMessage[]
  messagesByChannel: Record<string, SlackMessage[]>
  stats: {
    totalMessages: number
    channelCount: number
    dateRange: {
      earliest: Date | null
      latest: Date | null
    }
    channelStats: Array<{
      name: string
      messageCount: number
      latestMessage: Date
    }>
  }
}

export default function SlackMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const contextId = params.id as string
  const [messagesData, setMessagesData] = useState<SlackMessagesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取Slack消息数据
  const fetchMessages = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/slack/messages?contextId=${contextId}`)
      const result = await response.json()
      
      if (result.success) {
        setMessagesData(result.data)
      } else {
        setError(result.error || 'Failed to load messages')
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [contextId])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchMessages()
  }

  const formatMessageTime = (timestamp: Date) => {
    const now = new Date()
    const messageDate = new Date(timestamp)
    const diffInHours = Math.abs(now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return messageDate.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const getFilteredMessages = () => {
    if (!messagesData) return []
    
    let messages = messagesData.messages
    
    // 按频道过滤
    if (selectedChannel !== 'all') {
      messages = messages.filter(msg => msg.channel.name === selectedChannel)
    }
    
    // 按搜索查询过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      messages = messages.filter(msg => 
        msg.text.toLowerCase().includes(query) ||
        msg.user.name.toLowerCase().includes(query) ||
        msg.channel.name.toLowerCase().includes(query)
      )
    }
    
    return messages
  }

  const getChannelColor = (channelName: string) => {
    const colors = [
      'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
      'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
      'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400',
      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
    ]
    const hash = channelName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return colors[Math.abs(hash) % colors.length]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '正在加载Slack消息...' : 'Loading Slack messages...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-md mx-auto mt-8">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {language === 'zh' ? `加载失败：${error}` : `Failed to load: ${error}`}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const filteredMessages = getFilteredMessages()
  const channels = messagesData ? Object.keys(messagesData.messagesByChannel) : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/contexts/${contextId}/settings`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'zh' ? '返回设置' : 'Back to Settings'}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {language === 'zh' ? 'Slack 消息中心' : 'Slack Message Center'}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '实时查看团队 Slack 频道消息' : 'Real-time team Slack channel messages'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {language === 'zh' ? '刷新' : 'Refresh'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {language === 'zh' ? '导出' : 'Export'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 统计卡片 */}
        {messagesData && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {messagesData.stats.totalMessages}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '总消息数' : 'Total Messages'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {messagesData.stats.channelCount}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '活跃频道' : 'Active Channels'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {new Set(messagesData.messages.map(m => m.user.id)).size}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '参与用户' : 'Active Users'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {messagesData.stats.dateRange.latest ? 
                        Math.ceil((new Date().getTime() - new Date(messagesData.stats.dateRange.latest).getTime()) / (1000 * 60 * 60)) : 0}h
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '最近活动' : 'Last Activity'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 搜索和过滤栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={language === 'zh' ? '搜索消息、用户或频道...' : 'Search messages, users, or channels...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="all">{language === 'zh' ? '所有频道' : 'All Channels'}</option>
                  {channels.map(channel => (
                    <option key={channel} value={channel}>#{channel}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 消息列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{language === 'zh' ? '消息时间线' : 'Message Timeline'}</span>
              <Badge variant="secondary">
                {filteredMessages.length} {language === 'zh' ? '条消息' : 'messages'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {language === 'zh' 
                ? '按时间倒序排列的所有Slack消息'
                : 'All Slack messages sorted by time (newest first)'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredMessages.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {language === 'zh' ? '没有找到消息' : 'No messages found'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || selectedChannel !== 'all'
                    ? (language === 'zh' ? '尝试调整搜索条件或过滤器' : 'Try adjusting your search or filter')
                    : (language === 'zh' ? '还没有接收到任何Slack消息' : 'No Slack messages received yet')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredMessages.map((message, index) => (
                  <div key={message.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={message.user.avatar} alt={message.user.name} />
                          <AvatarFallback>{message.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {message.user.name}
                            </span>
                            <Badge className={`text-xs px-2 py-0.5 ${getChannelColor(message.channel.name)}`}>
                              #{message.channel.name}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatMessageTime(message.timestamp)}
                            </span>
                            {message.thread_count > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {message.thread_count} {language === 'zh' ? '回复' : 'replies'}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2 whitespace-pre-wrap">
                            {message.text}
                          </p>
                          
                          {message.reactions.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {message.reactions.map((reaction, idx) => (
                                <Badge
                                  key={idx}
                                  variant="secondary"
                                  className="text-xs px-2 py-0.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                                >
                                  {reaction.name === '+1' && '👍'}
                                  {reaction.name === 'rocket' && '🚀'}
                                  {reaction.name === 'bug' && '🐛'}
                                  {reaction.name === 'art' && '🎨'}
                                  {reaction.name === 'eyes' && '👀'}
                                  {reaction.name === 'sushi' && '🍣'}
                                  {reaction.name === 'heart' && '❤️'}
                                  {reaction.name === 'chart_with_upwards_trend' && '📈'}
                                  {reaction.name === 'fire' && '🔥'}
                                  {reaction.name === 'tada' && '🎉'}
                                  {reaction.name === 'mountain' && '🏔️'}
                                  {reaction.name === 'hiking_boot' && '🥾'}
                                  {!['+1', 'rocket', 'bug', 'art', 'eyes', 'sushi', 'heart', 'chart_with_upwards_trend', 'fire', 'tada', 'mountain', 'hiking_boot'].includes(reaction.name) && `${reaction.name}`}
                                  <span className="ml-1">{reaction.count}</span>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}