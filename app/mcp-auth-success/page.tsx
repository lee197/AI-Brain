'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { 
  CheckCircle,
  Loader2,
  AlertCircle,
  ArrowLeft,
  BrainCircuit
} from 'lucide-react'

export default function MCPAuthSuccessPage() {
  const searchParams = useSearchParams()
  const { t, language } = useLanguage()
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)
  
  const contextId = searchParams.get('context_id')

  useEffect(() => {
    if (!contextId) {
      setStatus('error')
      setError('Missing context ID')
      return
    }

    checkAuthStatus()
  }, [contextId])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch(`/api/mcp/google-workspace/check-auth?context_id=${contextId}`)
      const data = await response.json()
      
      if (data.success && data.authenticated) {
        setStatus('success')
      } else if (data.success && !data.authenticated) {
        // 认证还未完成，等待一下再检查
        setTimeout(checkAuthStatus, 2000)
      } else {
        setStatus('error')
        setError(data.error || 'Authentication check failed')
      }
    } catch (error) {
      setStatus('error')
      setError('Failed to check authentication status')
    }
  }

  const goBackToSettings = () => {
    if (contextId) {
      window.location.href = `/contexts/${contextId}/settings`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <CardTitle>
            {language === 'zh' ? 'Google Workspace MCP 认证' : 'Google Workspace MCP Authentication'}
          </CardTitle>
          <CardDescription>
            {language === 'zh' ? '正在验证您的认证状态...' : 'Verifying your authentication status...'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'checking' && (
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '检查认证状态中...' : 'Checking authentication status...'}
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-4" />
              <p className="text-green-700 dark:text-green-400 font-medium mb-4">
                {language === 'zh' ? '✅ 认证成功！' : '✅ Authentication Successful!'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {language === 'zh' 
                  ? 'Google Workspace MCP 集成已成功连接。您现在可以返回设置页面。'
                  : 'Google Workspace MCP integration has been successfully connected. You can now return to the settings page.'}
              </p>
              <Button onClick={goBackToSettings} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'zh' ? '返回设置' : 'Back to Settings'}
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-8 h-8 mx-auto text-red-600 mb-4" />
              <p className="text-red-700 dark:text-red-400 font-medium mb-2">
                {language === 'zh' ? '❌ 认证失败' : '❌ Authentication Failed'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || (language === 'zh' ? '认证过程中发生错误' : 'An error occurred during authentication')}
              </p>
              <div className="space-y-2">
                <Button onClick={checkAuthStatus} variant="outline" className="w-full">
                  <Loader2 className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '重试检查' : 'Retry Check'}
                </Button>
                <Button onClick={goBackToSettings} className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === 'zh' ? '返回设置' : 'Back to Settings'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}