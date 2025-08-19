'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getChannelConfig } from '@/lib/slack/channel-config'
import { saveMessageHistory, getMessageHistory, SlackMessageHistory } from '@/lib/slack/message-history'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Slack, 
  Send, 
  Hash, 
  Lock, 
  Users, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  History,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

interface SlackChannel {
  id: string
  name: string
  isPrivate: boolean
  memberCount: number
  topic: string
  purpose: string
  isArchived: boolean
  isBotMember: boolean
  canReceiveMessages: boolean
}

interface SlackSendMessageProps {
  isOpen: boolean
  onClose: () => void
  contextId: string
  onMessageSent?: (result: any) => void
  // 可选的预设内容
  defaultMessage?: string
  defaultChannelId?: string
}

export function SlackSendMessage({ 
  isOpen, 
  onClose, 
  contextId, 
  onMessageSent,
  defaultMessage = '',
  defaultChannelId = ''
}: SlackSendMessageProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [selectedChannelId, setSelectedChannelId] = useState<string>(defaultChannelId)
  const [message, setMessage] = useState<string>(defaultMessage)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [messageHistory, setMessageHistory] = useState<SlackMessageHistory[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // 加载可用频道列表
  const loadChannels = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/slack/channels')
      const data = await response.json()
      
      if (data.success) {
        // 只显示Bot已加入的频道
        const availableChannels = data.channels.filter((ch: SlackChannel) => ch.isBotMember)
        setChannels(availableChannels)
        
        // 如果有用户选择的频道配置，优先显示这些频道
        const selectedChannels = getChannelConfig(contextId)
        if (selectedChannels.length > 0) {
          const userChannels = availableChannels.filter((ch: SlackChannel) => 
            selectedChannels.includes(ch.id)
          )
          setChannels(userChannels)
        }
        
        // 如果没有预设频道ID且有可用频道，默认选择第一个
        if (!defaultChannelId && availableChannels.length > 0) {
          setSelectedChannelId(availableChannels[0].id)
        }
      } else {
        setError(data.error || '获取频道列表失败')
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
      console.error('Load channels error:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载消息历史
  const loadMessageHistory = () => {
    const history = getMessageHistory(contextId)
    setMessageHistory(history)
  }

  // 发送消息到Slack
  const handleSendMessage = async () => {
    if (!selectedChannelId || !message.trim()) {
      setError('请选择频道并输入消息内容')
      return
    }
    
    setSending(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/slack/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: selectedChannelId,
          message: message.trim(),
          contextId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(`消息已成功发送到 #${getChannelName(selectedChannelId)}`)
        onMessageSent?.(data.data)
        
        // 保存到历史记录
        saveMessageHistory(contextId, {
          content: message.trim(),
          channelId: selectedChannelId,
          channelName: getChannelName(selectedChannelId),
          sentAt: Date.now(),
          messageTs: data.data?.messageTs,
          permalink: data.data?.permalink,
          status: 'success'
        })
        
        // 刷新历史记录
        loadMessageHistory()
        
        // 清空表单
        setMessage('')
        
        // 3秒后自动关闭
        setTimeout(() => {
          onClose()
          setSuccess(null)
        }, 3000)
      } else {
        if (data.needsInvite) {
          setError(`Bot未加入 #${getChannelName(selectedChannelId)} 频道，请先邀请Bot`)
        } else {
          setError(data.error || '发送消息失败')
        }
        
        // 保存失败记录
        saveMessageHistory(contextId, {
          content: message.trim(),
          channelId: selectedChannelId,
          channelName: getChannelName(selectedChannelId),
          sentAt: Date.now(),
          status: 'failed',
          error: data.error || '发送失败'
        })
        
        // 刷新历史记录
        loadMessageHistory()
      }
    } catch (error) {
      const errorMessage = '网络错误，请稍后重试'
      setError(errorMessage)
      console.error('Send message error:', error)
      
      // 保存失败记录
      saveMessageHistory(contextId, {
        content: message.trim(),
        channelId: selectedChannelId,
        channelName: getChannelName(selectedChannelId),
        sentAt: Date.now(),
        status: 'failed',
        error: errorMessage
      })
      
      // 刷新历史记录
      loadMessageHistory()
    } finally {
      setSending(false)
    }
  }

  // 获取频道名称
  const getChannelName = (channelId: string): string => {
    const channel = channels.find(ch => ch.id === channelId)
    return channel?.name || 'unknown'
  }

  // 获取选中频道信息
  const selectedChannel = channels.find(ch => ch.id === selectedChannelId)

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    if (isOpen) {
      loadChannels()
      loadMessageHistory()
      setMessage(defaultMessage)
      setSelectedChannelId(defaultChannelId)
      setError(null)
      setSuccess(null)
    }
  }, [isOpen, defaultMessage, defaultChannelId])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Slack className="w-5 h-5 text-purple-600" />
              <DialogTitle>发送消息到Slack</DialogTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              {showHistory ? '隐藏历史' : '消息历史'}
              {messageHistory.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {messageHistory.length}
                </Badge>
              )}
            </Button>
          </div>
          <DialogDescription>
            选择目标频道并编写消息，AI Brain将代表您发送到Slack。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 消息历史记录 */}
          {showHistory && (
            <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">消息发送历史</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMessageHistory}
                  className="h-6 px-2"
                >
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
              
              {messageHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  暂无发送记录
                </p>
              ) : (
                <div className="space-y-2">
                  {messageHistory.slice(0, 10).map((record) => (
                    <div
                      key={record.id}
                      className="flex items-start justify-between p-2 bg-white border border-gray-200 rounded text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Hash className="w-3 h-3 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {record.channelName}
                          </span>
                          <Badge 
                            variant={record.status === 'success' ? 'outline' : 'destructive'} 
                            className="text-xs"
                          >
                            {record.status === 'success' ? '成功' : '失败'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 truncate mb-1">
                          {record.content}
                        </p>
                        <p className="text-gray-500">
                          {formatTime(record.sentAt)}
                        </p>
                        {record.error && (
                          <p className="text-red-600 mt-1">
                            错误: {record.error}
                          </p>
                        )}
                      </div>
                      
                      {record.status === 'success' && record.permalink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 ml-2 flex-shrink-0"
                          onClick={() => window.open(record.permalink, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {messageHistory.length > 10 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-gray-500">
                        显示最近10条记录，共{messageHistory.length}条
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="ml-2 text-sm text-gray-600">加载频道列表...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">发送失败</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">发送成功</span>
              </div>
              <p className="text-sm text-green-600 mt-1">{success}</p>
            </div>
          )}

          {!loading && channels.length > 0 && (
            <>
              {/* 频道选择 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  选择目标频道
                </label>
                <Select value={selectedChannelId} onValueChange={setSelectedChannelId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择要发送消息的频道" />
                  </SelectTrigger>
                  <SelectContent>
                    {channels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <div className="flex items-center gap-2">
                          {channel.isPrivate ? (
                            <Lock className="w-4 h-4 text-gray-500" />
                          ) : (
                            <Hash className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-medium">{channel.name}</span>
                          <Badge variant="outline" className="text-xs">
                            <Users className="w-3 h-3 mr-1" />
                            {channel.memberCount}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 选中频道的详细信息 */}
                {selectedChannel && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {selectedChannel.isPrivate ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Hash className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        {selectedChannel.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        {selectedChannel.memberCount} 成员
                      </Badge>
                    </div>
                    {selectedChannel.topic && (
                      <p className="text-sm text-gray-600">
                        {selectedChannel.topic}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* 消息编写 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  消息内容
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="输入要发送到Slack的消息..."
                  className="min-h-[120px] resize-none"
                  disabled={sending}
                />
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>支持Markdown格式</span>
                  <span>{message.length}/4000 字符</span>
                </div>
              </div>

              {/* 预览区域 */}
              {message.trim() && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900">
                      消息预览
                    </label>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm font-medium text-blue-900">AI Brain</span>
                        <span className="text-xs text-blue-600">刚刚</span>
                      </div>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">
                        {message}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {!loading && channels.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Slack className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">无可用频道</p>
              <p className="text-sm">Bot未加入任何频道，或者没有选择监听的频道</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadChannels}
                className="mt-3"
              >
                重新加载
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={sending}>
            取消
          </Button>
          <Button 
            onClick={handleSendMessage} 
            disabled={sending || !selectedChannelId || !message.trim() || channels.length === 0}
            className="min-w-[100px]"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                发送中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                发送消息
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}