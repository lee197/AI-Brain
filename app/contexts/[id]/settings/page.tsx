'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/hooks/use-auth'
import { DataSourceWizard } from '@/components/data-source-wizard'
import {
  Settings,
  ArrowLeft,
  Loader2
} from 'lucide-react'

export default function ContextSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  const { user, loading } = useAuth()
  
  const contextId = params.id as string
  

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/contexts/${contextId}`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'zh' ? '返回' : 'Back'}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {language === 'zh' ? '工作空间设置' : 'Workspace Settings'}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '管理数据源和集成' : 'Manage data sources and integrations'}
                  </p>
                </div>
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {language === 'zh' ? '专业版' : 'Professional'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 数据源管理界面 */}
        <div className="space-y-6">
          <DataSourceWizard 
            contextId={contextId}
            onComplete={() => {
              // 配置完成后的处理
              console.log('Data source configuration completed')
            }}
          />
        </div>
      </div>
    </div>
  )
}