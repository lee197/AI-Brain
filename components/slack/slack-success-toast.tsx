'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SlackSuccessToastProps {
  isDemo?: boolean
  onClose?: () => void
}

export function SlackSuccessToast({ isDemo = false, onClose }: SlackSuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // 5秒后自动关闭
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  const handleClose = () => {
    setIsVisible(false)
    onClose?.()
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
              {isDemo ? 'Slack演示已启用！' : 'Slack集成成功！'}
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {isDemo 
                ? '你现在可以体验Slack消息实时接收功能'
                : '现在可以接收Slack工作空间的实时消息了'
              }
            </p>
            {isDemo && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                💡 这是演示模式，要连接真实Slack请配置API密钥
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="flex-shrink-0 p-1 h-auto text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}