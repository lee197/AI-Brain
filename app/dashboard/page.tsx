'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // 重定向逻辑
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login')
      } else {
        router.replace('/contexts')
      }
    }
  }, [user, loading, router])

  // 显示加载状态
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">
          {loading ? '加载中...' : '正在跳转到工作空间...'}
        </p>
      </div>
    </div>
  )
}