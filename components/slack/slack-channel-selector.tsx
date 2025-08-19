'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getChannelConfig, saveChannelConfig } from '@/lib/slack/channel-config'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Slack, 
  Hash, 
  Lock, 
  Users, 
  CheckCircle2, 
  Circle,
  AlertTriangle,
  Loader2,
  Settings
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

interface SlackChannelSelectorProps {
  isOpen: boolean
  onClose: () => void
  contextId: string
  onChannelsSelected: (channels: string[]) => void
}

export function SlackChannelSelector({ 
  isOpen, 
  onClose, 
  contextId, 
  onChannelsSelected 
}: SlackChannelSelectorProps) {
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [selectedChannels, setSelectedChannels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载频道列表
  const loadChannels = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/slack/channels')
      const data = await response.json()
      
      if (data.success) {
        setChannels(data.channels)
        
        // 优先使用已保存的配置，否则默认选择Bot已加入的频道
        const savedConfig = getChannelConfig(contextId)
        if (savedConfig.length > 0) {
          // 过滤出仍然有效的频道（Bot仍在其中）
          const validSavedChannels = savedConfig.filter(channelId => 
            data.channels.some((ch: SlackChannel) => ch.id === channelId && ch.isBotMember)
          )
          setSelectedChannels(validSavedChannels)
        } else {
          // 默认选择Bot已加入的频道
          const defaultSelected = data.channels
            .filter((channel: SlackChannel) => channel.isBotMember)
            .map((channel: SlackChannel) => channel.id)
          setSelectedChannels(defaultSelected)
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

  // 切换频道选择状态
  const toggleChannel = (channelId: string, canReceiveMessages: boolean) => {
    if (!canReceiveMessages) {
      return // 如果Bot不在频道中，不允许选择
    }
    
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    )
  }

  // 保存选择的频道
  const handleSave = async () => {
    setSaving(true)
    
    try {
      const response = await fetch('/api/slack/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedChannels,
          contextId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 保存到本地配置
        saveChannelConfig(contextId, selectedChannels)
        onChannelsSelected(selectedChannels)
        onClose()
      } else {
        setError(data.error || '保存配置失败')
      }
    } catch (error) {
      setError('网络错误，请稍后重试')
      console.error('Save channels error:', error)
    } finally {
      setSaving(false)
    }
  }

  // 分类频道
  const availableChannels = channels.filter(channel => channel.canReceiveMessages)
  const unavailableChannels = channels.filter(channel => !channel.canReceiveMessages)

  useEffect(() => {
    if (isOpen) {
      loadChannels()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Slack className="w-5 h-5 text-purple-600" />
            选择Slack频道
          </DialogTitle>
          <DialogDescription>
            选择您希望AI Brain监听和同步消息的Slack频道。只有Bot已加入的频道才可以选择。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
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
                <span className="text-sm font-medium">加载失败</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadChannels}
                className="mt-2"
              >
                重试
              </Button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* 可选择的频道 */}
              {availableChannels.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    可同步频道 ({selectedChannels.length}/{availableChannels.length} 已选择)
                  </h4>
                  <div className="space-y-2">
                    {availableChannels.map(channel => (
                      <div
                        key={channel.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedChannels.includes(channel.id)
                            ? 'border-purple-300 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => toggleChannel(channel.id, channel.canReceiveMessages)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {selectedChannels.includes(channel.id) ? (
                                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                              {channel.isPrivate ? (
                                <Lock className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Hash className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {channel.name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {channel.memberCount}
                                </Badge>
                              </div>
                              {channel.topic && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {channel.topic}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 不可选择的频道 */}
              {unavailableChannels.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      不可同步频道 (Bot未加入)
                    </h4>
                    <div className="space-y-2">
                      {unavailableChannels.map(channel => (
                        <div
                          key={channel.id}
                          className="p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <Circle className="w-5 h-5 text-gray-400" />
                            <div className="flex items-center gap-2">
                              {channel.isPrivate ? (
                                <Lock className="w-4 h-4 text-gray-500" />
                              ) : (
                                <Hash className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-600">
                                  {channel.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  需要邀请Bot
                                </Badge>
                              </div>
                              {channel.topic && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {channel.topic}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 要监听这些频道的消息，请在Slack中使用 <code>/invite @AI Brain</code> 命令邀请Bot加入频道。
                      </p>
                    </div>
                  </div>
                </>
              )}

              {channels.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Slack className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>未找到可用的频道</p>
                  <p className="text-sm">请确保Slack连接正常</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || selectedChannels.length === 0}
            className="min-w-[100px]"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                保存中...
              </>
            ) : (
              `保存 (${selectedChannels.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}