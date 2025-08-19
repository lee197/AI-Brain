'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slack, Loader2 } from 'lucide-react'

interface AddToSlackButtonProps {
  contextId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function AddToSlackButton({ contextId, className, size = 'md' }: AddToSlackButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleAddToSlack = () => {
    setIsLoading(true)
    // 重定向到我们的OAuth安装端点
    window.location.href = `/api/auth/slack/install?context_id=${contextId}`
  }

  return (
    <Button
      onClick={handleAddToSlack}
      disabled={isLoading}
      className={`bg-[#4A154B] hover:bg-[#4A154B]/90 text-white disabled:opacity-50 ${className}`}
      size={size}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Slack className="w-4 h-4 mr-2" />
      )}
      {isLoading ? '连接中...' : '添加到 Slack'}
    </Button>
  )
}

/**
 * 官方样式的Slack按钮（可选）
 */
export function OfficialSlackButton({ contextId }: { contextId: string }) {
  const handleAddToSlack = () => {
    window.location.href = `/api/auth/slack/install?context_id=${contextId}`
  }

  return (
    <button
      onClick={handleAddToSlack}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#4A154B] hover:bg-[#4A154B]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4A154B] transition-colors"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 10.1h2.52v2.542a2.528 2.528 0 0 1-2.52 2.523zm0-6.775a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 3.3a2.528 2.528 0 0 1 2.52 2.542v2.548H5.042zm6.775 0V3.3a2.528 2.528 0 0 1 2.523-2.3 2.528 2.528 0 0 1 2.52 2.3v5.09h-5.043zm6.775 6.775a2.528 2.528 0 0 1 2.52-2.523 2.528 2.528 0 0 1 2.523 2.523 2.528 2.528 0 0 1-2.523 2.523h-2.52v-2.523zm0-6.775h2.52a2.528 2.528 0 0 1 2.523 2.548 2.528 2.528 0 0 1-2.523 2.523h-5.043V8.39zm-6.775 6.775v2.523a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.523-2.523v-5.046h5.043v2.523z"/>
      </svg>
      Add to Slack
    </button>
  )
}