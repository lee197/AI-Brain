'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Zap,
  X,
  ArrowRight,
  Slack,
  Users,
  MessageSquare,
  TrendingUp
} from 'lucide-react'

interface ConnectionStatusToastProps {
  source: string
  isConnecting: boolean
  isConnected: boolean
  error?: string
  onClose: () => void
  onTryDemo?: () => void
}

export function ConnectionStatusToast({ 
  source, 
  isConnecting, 
  isConnected, 
  error, 
  onClose,
  onTryDemo 
}: ConnectionStatusToastProps) {
  const { t, language } = useLanguage()
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(1)
  const [steps] = useState([
    {
      id: 1,
      title: language === 'zh' ? '验证授权...' : 'Verifying authorization...',
      duration: 1000
    },
    {
      id: 2, 
      title: language === 'zh' ? '连接工作区...' : 'Connecting workspace...',
      duration: 1500
    },
    {
      id: 3,
      title: language === 'zh' ? '同步数据...' : 'Syncing data...',
      duration: 2000
    },
    {
      id: 4,
      title: language === 'zh' ? '完成配置...' : 'Completing setup...',
      duration: 1000
    }
  ])

  useEffect(() => {
    if (isConnecting && !isConnected && !error) {
      let currentProgress = 0
      let currentStep = 1
      
      const timer = setInterval(() => {
        currentProgress += 2
        setProgress(currentProgress)
        
        // 步骤切换逻辑
        if (currentProgress > 25 && currentStep === 1) {
          setStep(2)
          currentStep = 2
        } else if (currentProgress > 50 && currentStep === 2) {
          setStep(3)
          currentStep = 3
        } else if (currentProgress > 75 && currentStep === 3) {
          setStep(4)
          currentStep = 4
        }
        
        if (currentProgress >= 100) {
          clearInterval(timer)
        }
      }, 100)
      
      return () => clearInterval(timer)
    }
  }, [isConnecting, isConnected, error])

  if (!isConnecting && !isConnected && !error) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {/* 连接中状态 */}
      {isConnecting && !isConnected && !error && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200">
                  {language === 'zh' ? `正在连接 ${source}...` : `Connecting to ${source}...`}
                </h4>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  {steps[step - 1]?.title}
                </p>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-blue-600"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* 连接成功状态 */}
      {isConnected && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                🎉 {source} {language === 'zh' ? '连接成功！' : 'Connected Successfully!'}
              </h4>
              
              {source === 'Slack' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                      <MessageSquare className="w-3 h-3" />
                      <span>12 {language === 'zh' ? '频道' : 'channels'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                      <Users className="w-3 h-3" />
                      <span>45 {language === 'zh' ? '用户' : 'users'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-700 dark:text-green-300">
                      <TrendingUp className="w-3 h-3" />
                      <span>10k+ {language === 'zh' ? '消息' : 'messages'}</span>
                    </div>
                  </div>
                  
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-md p-2 mt-2">
                    <p className="text-xs text-green-800 dark:text-green-200">
                      💡 {language === 'zh' 
                        ? '尝试问我："本周团队讨论了哪些重要事项？"'
                        : 'Try asking: "What important topics did the team discuss this week?"'}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-green-600"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      )}

      {/* 连接错误状态 */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1 space-y-3">
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-200">
                  {language === 'zh' ? '连接失败' : 'Connection Failed'}
                </h4>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-300 hover:bg-red-100"
                  onClick={() => window.location.reload()}
                >
                  {language === 'zh' ? '重试' : 'Retry'}
                </Button>
                
                {onTryDemo && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={onTryDemo}
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    {language === 'zh' ? '体验演示' : 'Try Demo'}
                  </Button>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-600"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Alert>
      )}
    </div>
  )
}