'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slack, Loader2, Power, PowerOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlackConnectionToggleProps {
  contextId: string
  isConnected: boolean
  onConnectionChange: (connected: boolean) => void
  className?: string
  size?: 'sm' | 'default' | 'lg'
}

export function SlackConnectionToggle({
  contextId,
  isConnected,
  onConnectionChange,
  className,
  size = 'default'
}: SlackConnectionToggleProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDisconnect = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/slack/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contextId }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onConnectionChange(false)
        console.log('✅ Slack连接已断开')
      } else {
        throw new Error(data.message || data.error || 'Failed to disconnect')
      }
    } catch (error) {
      console.error('Disconnect error:', error)
      setError(error instanceof Error ? error.message : 'Failed to disconnect')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReconnect = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      // 直接跳转到OAuth，让用户选择工作空间
      console.log('🚀 跳转到Slack OAuth，让用户选择工作空间...')
      window.location.href = `/api/auth/slack/install?context_id=${contextId}`
      
    } catch (error) {
      console.error('Reconnect error:', error)
      setError('跳转失败，请稍后重试')
      setIsLoading(false)
    }
  }


  if (isConnected) {
    return (
      <div className={cn("space-y-2", className)}>
        <Button
          variant="outline"
          size={size}
          onClick={handleDisconnect}
          disabled={isLoading}
          className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <PowerOff className="w-4 h-4 mr-2" />
          )}
          断开Slack连接
        </Button>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Button
        variant="default"
        size={size}
        onClick={handleReconnect}
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Slack className="w-4 h-4 mr-2" />
        )}
        连接Slack
      </Button>
      
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}