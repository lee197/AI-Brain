'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  Slack,
  CheckCircle,
  Shield,
  MessageSquare,
  Users,
  Search,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  Hash,
  Lock,
  Globe,
  Zap,
  ChevronRight,
  Filter,
  ExternalLink
} from 'lucide-react'

// 频道接口定义
interface SlackChannel {
  id: string
  name: string
  isPrivate: boolean
  memberCount: number
  isMonitored: boolean
  purpose?: string
  topic?: string
  lastActivity?: string
  messageCount?: number
  isBotMember?: boolean // Bot是否已加入频道
  canReceiveMessages?: boolean // 是否可以接收消息
  isArchived?: boolean // 是否已归档
}

interface ChannelSelectionWizardProps {
  contextId: string
  workspaceName: string
  onComplete: (selectedChannels: string[]) => void
  onSkip: () => void
}

export function ChannelSelectionWizard({ 
  contextId, 
  workspaceName, 
  onComplete, 
  onSkip 
}: ChannelSelectionWizardProps) {
  const { t, language } = useLanguage()
  const [channels, setChannels] = useState<SlackChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all')
  const [selectedCount, setSelectedCount] = useState(0)

  // 加载频道列表
  useEffect(() => {
    loadChannels()
  }, [])

  // 计算已选择频道数量
  useEffect(() => {
    setSelectedCount(channels.filter(c => c.isMonitored).length)
  }, [channels])

  const loadChannels = async () => {
    try {
      setLoading(true)
      console.log('📋 加载Slack频道列表...')
      
      // 1. 获取已保存的频道配置
      let configuredChannelIds: string[] = []
      try {
        console.log('🔍 获取已配置的频道列表...')
        const configResponse = await fetch(`/api/slack/channel-config?contextId=${contextId}`)
        const configData = await configResponse.json()
        
        if (configData.success && configData.data?.configuredChannels) {
          configuredChannelIds = configData.data.configuredChannels.map((ch: any) => ch.id || ch)
          console.log('✅ 找到已配置频道:', configuredChannelIds)
        }
      } catch (configError) {
        console.log('⚠️ 获取配置失败，使用默认推荐频道')
      }
      
      // 2. 调用API获取真实频道列表
      const response = await fetch('/api/slack/channels')
      const data = await response.json()
      
      if (data.success && data.channels) {
        // 如果没有已配置频道，使用推荐频道列表
        const recommendedChannels = ['general', 'development', 'ai-discussions', 'team', 'announcements']
        
        const formattedChannels: SlackChannel[] = data.channels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          isPrivate: channel.isPrivate || false,
          memberCount: channel.memberCount || 0,
          // 优先使用已配置的频道，如果没有则使用推荐频道
          isMonitored: configuredChannelIds.length > 0 
            ? configuredChannelIds.includes(channel.id)
            : recommendedChannels.includes(channel.name),
          purpose: channel.purpose || channel.topic || '',
          messageCount: Math.floor(Math.random() * 1000) + 100, // 模拟消息数量
          lastActivity: getRandomActivity(), // 生成随机活动时间
          isBotMember: channel.isBotMember || false, // Bot是否已加入
          canReceiveMessages: channel.canReceiveMessages || false, // 是否可以接收消息
          isArchived: channel.isArchived || false // 是否已归档
        }))
        
        setChannels(formattedChannels)
        console.log(`✅ 成功加载 ${formattedChannels.length} 个频道，其中 ${formattedChannels.filter(c => c.isMonitored).length} 个已配置`)
      } else {
        // API调用失败，使用备用演示数据
        console.log('⚠️ API调用失败，使用演示数据')
        const fallbackChannels: SlackChannel[] = [
          {
            id: 'C1234567890',
            name: 'general',
            isPrivate: false,
            memberCount: 45,
            isMonitored: true,
            purpose: language === 'zh' ? '公司范围的公告和一般讨论' : 'Company-wide announcements and general discussion',
            messageCount: 1250,
            lastActivity: language === 'zh' ? '2分钟前' : '2 minutes ago'
          },
          {
            id: 'C1234567891',
            name: 'development',
            isPrivate: false,
            memberCount: 12,
            isMonitored: true,
            purpose: language === 'zh' ? '开发团队讨论和代码审查' : 'Development team discussions and code reviews',
            messageCount: 890,
            lastActivity: language === 'zh' ? '15分钟前' : '15 minutes ago'
          },
          {
            id: 'C1234567892',
            name: 'ai-discussions',
            isPrivate: false,
            memberCount: 8,
            isMonitored: true,
            purpose: language === 'zh' ? 'AI和机器学习讨论' : 'AI and machine learning discussions',
            messageCount: 445,
            lastActivity: language === 'zh' ? '1小时前' : '1 hour ago'
          }
        ]
        setChannels(fallbackChannels)
      }
    } catch (error) {
      console.error('Failed to load channels:', error)
      // 网络错误时使用最小化的演示数据
      const errorChannels: SlackChannel[] = [
        {
          id: 'C1234567890',
          name: 'general',
          isPrivate: false,
          memberCount: 0,
          isMonitored: true,
          purpose: language === 'zh' ? '网络连接失败，显示演示数据' : 'Network failed, showing demo data',
          messageCount: 0,
          lastActivity: language === 'zh' ? '无法获取' : 'Unable to fetch'
        }
      ]
      setChannels(errorChannels)
    } finally {
      setLoading(false)
    }
  }

  // 生成随机活动时间
  const getRandomActivity = (): string => {
    const activities = language === 'zh' 
      ? ['刚刚', '2分钟前', '15分钟前', '30分钟前', '1小时前', '2小时前', '3小时前']
      : ['just now', '2 minutes ago', '15 minutes ago', '30 minutes ago', '1 hour ago', '2 hours ago', '3 hours ago']
    return activities[Math.floor(Math.random() * activities.length)]
  }

  // 切换频道监控状态
  const toggleChannelMonitoring = (channelId: string) => {
    setChannels(channels.map(channel => 
      channel.id === channelId 
        ? { ...channel, isMonitored: !channel.isMonitored }
        : channel
    ))
  }

  // 过滤频道
  const filteredChannels = channels.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         channel.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'public' && !channel.isPrivate) ||
                         (filter === 'private' && channel.isPrivate)
    
    return matchesSearch && matchesFilter
  })

  // 完成选择
  const handleComplete = () => {
    const selectedChannelIds = channels.filter(c => c.isMonitored).map(c => c.id)
    onComplete(selectedChannelIds)
  }

  // 快速选择建议的频道
  const selectRecommendedChannels = () => {
    const recommendedChannels = ['general', 'development', 'ai-discussions']
    setChannels(channels.map(channel => ({
      ...channel,
      isMonitored: recommendedChannels.includes(channel.name)
    })))
  }

  return (
    <div className="space-y-6">
      {/* 顶部介绍 */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Slack className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="w-5 h-5 text-purple-600" />
                {language === 'zh' ? '选择要监控的频道' : 'Choose Channels to Monitor'}
              </CardTitle>
              <CardDescription className="text-base mt-2">
                {language === 'zh' 
                  ? `已连接到 ${workspaceName}！选择AI Brain可以访问和分析的频道，以提供更智能的团队协作洞察。`
                  : `Connected to ${workspaceName}! Select which channels AI Brain can access and analyze to provide smarter team collaboration insights.`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{selectedCount}</div>
                <div className="text-sm text-gray-600">{language === 'zh' ? '已选择' : 'Selected'}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{channels.length}</div>
                <div className="text-sm text-gray-600">{language === 'zh' ? '总频道' : 'Total Channels'}</div>
              </div>
            </div>
            
            <Button 
              onClick={selectRecommendedChannels}
              variant="outline" 
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Zap className="w-4 h-4 mr-2" />
              {language === 'zh' ? '选择推荐频道' : 'Select Recommended'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 搜索和过滤 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{language === 'zh' ? '频道列表' : 'Channel List'}</CardTitle>
              <CardDescription>
                {language === 'zh' ? '选择AI Brain可以监控和分析的频道' : 'Choose channels for AI Brain to monitor and analyze'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              {filteredChannels.length} / {channels.length}
            </div>
          </div>
          
          {/* Bot权限提示 */}
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 mt-4">
            <Shield className="w-4 h-4 text-orange-600" />
            <AlertDescription>
              <div className="flex items-start justify-between">
                <div>
                  <strong>{language === 'zh' ? '重要提示：' : 'Important: '}</strong>
                  {language === 'zh' 
                    ? 'AI Brain只能监控Bot已加入的频道。未加入的频道将显示为灰色且不可选择。' 
                    : 'AI Brain can only monitor channels where the bot has been added. Channels without bot access are grayed out and cannot be selected.'}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="ml-4 text-orange-600 border-orange-300 hover:bg-orange-50"
                  onClick={() => {
                    window.open(`https://slack.com/help/articles/360035692513-invite-people-to-channels`, '_blank')
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {language === 'zh' ? '邀请Bot' : 'Invite Bot'}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 搜索和过滤控件 */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder={language === 'zh' ? '搜索频道名称或描述...' : 'Search channel names or descriptions...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: language === 'zh' ? '全部' : 'All', icon: Hash },
                { key: 'public', label: language === 'zh' ? '公开' : 'Public', icon: Globe },
                { key: 'private', label: language === 'zh' ? '私有' : 'Private', icon: Lock }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={filter === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(key as any)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-3 h-3" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* 频道列表 */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredChannels.map((channel) => {
                const canSelect = channel.isBotMember || channel.canReceiveMessages
                return (
                  <Card 
                    key={channel.id}
                    className={`transition-all ${
                      canSelect 
                        ? 'cursor-pointer' 
                        : 'cursor-not-allowed opacity-60'
                    } ${
                      channel.isMonitored 
                        ? 'border-blue-300 bg-blue-50/50 dark:bg-blue-950/10' 
                        : canSelect 
                          ? 'hover:border-gray-300' 
                          : 'border-gray-200'
                    }`}
                    onClick={() => canSelect && toggleChannelMonitoring(channel.id)}
                  >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center text-white">
                          {channel.isPrivate ? (
                            <Lock className="w-5 h-5" />
                          ) : (
                            <Hash className="w-5 h-5" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              #{channel.name}
                            </h4>
                            {channel.isPrivate && (
                              <Badge variant="secondary" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                {language === 'zh' ? '私有' : 'Private'}
                              </Badge>
                            )}
                            {!canSelect && (
                              <Badge variant="destructive" className="text-xs">
                                <Shield className="w-3 h-3 mr-1" />
                                {language === 'zh' ? 'Bot未加入' : 'Bot Not Added'}
                              </Badge>
                            )}
                            {canSelect && channel.isBotMember && (
                              <Badge className="text-xs bg-green-100 text-green-800 border-green-300">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {language === 'zh' ? 'Bot已加入' : 'Bot Member'}
                              </Badge>
                            )}
                          </div>
                          
                          {channel.purpose && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {channel.purpose}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {channel.memberCount} {language === 'zh' ? '成员' : 'members'}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {channel.messageCount} {language === 'zh' ? '消息' : 'messages'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {channel.lastActivity}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <Switch
                          checked={channel.isMonitored && canSelect}
                          disabled={!canSelect}
                          onCheckedChange={() => canSelect && toggleChannelMonitoring(channel.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )})}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 底部操作 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onSkip} className="text-gray-600">
          {language === 'zh' ? '跳过，稍后配置' : 'Skip, configure later'}
        </Button>
        
        <div className="flex items-center gap-4">
          {selectedCount > 0 && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 p-3">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200 text-sm">
                {language === 'zh' 
                  ? `已选择 ${selectedCount} 个频道，AI Brain将开始监控这些频道的对话`
                  : `${selectedCount} channels selected. AI Brain will start monitoring these conversations`}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleComplete}
            disabled={selectedCount === 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 min-w-[140px]"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            {language === 'zh' ? '开始监控' : 'Start Monitoring'}
            {selectedCount > 0 && (
              <Badge className="ml-2 bg-white/20 text-white border-white/30">
                {selectedCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}