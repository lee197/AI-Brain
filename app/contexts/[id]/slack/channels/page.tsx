'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/language-context'
import { ChannelSelectionWizard } from '@/components/slack/channel-selection-wizard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SlackChannelsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  
  const contextId = params.id as string
  const workspaceName = searchParams.get('team') || 'Slack Workspace'
  
  const [isCompleting, setIsCompleting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // 处理频道选择完成
  const handleChannelSelectionComplete = async (selectedChannelIds: string[]) => {
    setIsCompleting(true)
    
    try {
      console.log('💾 保存频道选择配置...', { contextId, selectedChannelIds })
      
      // 1. 首先保存频道配置到专门的API
      const channelConfigResponse = await fetch('/api/slack/channel-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextId,
          selectedChannels: selectedChannelIds
        })
      })

      if (!channelConfigResponse.ok) {
        throw new Error('保存频道配置失败')
      }

      console.log('✅ 频道配置已保存到专门的API')
      
      // 2. 获取当前的Slack配置（OAuth后应该已经保存）
      const configResponse = await fetch(`/api/slack/config?contextId=${contextId}`)
      const configData = await configResponse.json()
      
      console.log('🔍 配置响应详情:', configData)
      
      if (!configData.success) {
        console.error('❌ 配置验证失败:', configData)
        throw new Error(configData.error || '未找到有效的Slack配置，请重新连接')
      }
      
      if (!configData.config?.botToken) {
        console.error('❌ 缺少Bot Token:', configData.config)
        throw new Error('配置中缺少Bot Token，请重新连接')
      }
      
      // 3. 调用API保存完整的Slack配置（包含频道信息）
      const response = await fetch('/api/slack/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextId,
          config: {
            botToken: configData.config.botToken,
            signingSecret: configData.config.signingSecret || '',
            clientId: configData.config.clientId || '',
            clientSecret: configData.config.clientSecret || '',
            workspaceName: configData.config.workspaceName,
            teamId: configData.config.teamId,
            botUserId: configData.config.botUserId
          },
          monitoredChannels: selectedChannelIds
        })
      })

      if (response.ok) {
        console.log('✅ 完整的频道配置保存成功')
        setShowSuccess(true)
        
        // 2秒后跳转到数据源页面
        setTimeout(() => {
          router.push(`/contexts/${contextId}/settings?tab=data-sources&slack_configured=true`)
        }, 2000)
      }
    } catch (error) {
      console.error('保存频道配置失败:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  // 处理跳过配置
  const handleSkip = () => {
    router.push(`/contexts/${contextId}/settings?tab=data-sources&slack_success=true`)
  }

  // 返回数据源页面
  const handleBack = () => {
    router.push(`/contexts/${contextId}/settings?tab=data-sources`)
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mx-auto flex items-center justify-center text-white shadow-xl">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              🎉 {language === 'zh' ? 'Slack集成完成！' : 'Slack Integration Complete!'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {language === 'zh' 
                ? 'AI Brain正在开始监控您选择的频道，即将为您提供智能的团队协作洞察。'
                : 'AI Brain is now monitoring your selected channels and will start providing intelligent team collaboration insights.'}
            </p>
          </div>
          
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20 text-left">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>{language === 'zh' ? '下一步：' : 'Next Steps:'}</strong><br />
              {language === 'zh' 
                ? '• 在聊天界面中询问团队相关问题\n• AI Brain将分析您的Slack对话\n• 获得智能的团队协作建议'
                : '• Ask team-related questions in the chat interface\n• AI Brain will analyze your Slack conversations\n• Get intelligent team collaboration insights'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'zh' ? '返回数据源' : 'Back to Data Sources'}
          </Button>
          
          <div className="text-sm text-gray-500">
            {language === 'zh' ? '设置' : 'Settings'} → {language === 'zh' ? '数据源' : 'Data Sources'} → Slack → {language === 'zh' ? '频道选择' : 'Channel Selection'}
          </div>
        </div>

        {/* 频道选择向导 */}
        <div className="max-w-4xl mx-auto">
          <ChannelSelectionWizard
            contextId={contextId}
            workspaceName={workspaceName}
            onComplete={handleChannelSelectionComplete}
            onSkip={handleSkip}
          />
        </div>

        {/* 正在完成提示 */}
        {isCompleting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-sm w-full mx-4 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {language === 'zh' ? '正在完成配置...' : 'Completing Setup...'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {language === 'zh' ? '保存频道设置并启动AI Brain监控' : 'Saving channel settings and starting AI Brain monitoring'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}