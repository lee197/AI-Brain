'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { 
  CheckCircle,
  Loader2,
  ArrowLeft,
  BrainCircuit
} from 'lucide-react'

function OAuthSuccessContent() {
  const searchParams = useSearchParams()
  const { language } = useLanguage()
  const [contextId, setContextId] = useState<string | null>(null)
  
  useEffect(() => {
    // 从URL参数中获取context_id
    const urlContextId = searchParams.get('context_id')
    
    if (urlContextId) {
      setContextId(urlContextId)
    } else {
      // 尝试从localStorage获取最后访问的context
      const lastContext = localStorage.getItem('lastContextId')
      if (lastContext) {
        setContextId(lastContext)
      }
    }
  }, [searchParams])

  const handleManualReturn = () => {
    if (contextId) {
      window.location.href = `/contexts/${contextId}/settings?tab=overview&success=google_workspace_connected`
    } else {
      // 如果没有context_id，跳转到主页
      window.location.href = '/'
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
            {language === 'zh' ? 'Google Workspace 认证成功' : 'Google Workspace Authentication Successful'}
          </CardTitle>
          <CardDescription>
            {language === 'zh' ? '您的Google账户已成功连接到AI Brain' : 'Your Google account has been successfully connected to AI Brain'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-green-600 mb-4" />
            <p className="text-green-700 dark:text-green-400 font-medium mb-4">
              {language === 'zh' ? '✅ Google Workspace 集成已成功连接！' : '✅ Google Workspace integration connected successfully!'}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {language === 'zh' 
                ? '您的Google Workspace凭证已安全保存。现在可以关闭此窗口并返回AI Brain应用继续使用。'
                : 'Your Google Workspace credentials have been securely saved. You can now close this window and return to the AI Brain app.'}
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={handleManualReturn} 
                className="w-full"
                size="lg"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'zh' ? '返回AI Brain应用' : 'Return to AI Brain App'}
              </Button>
              
              <p className="text-xs text-center text-gray-500">
                {language === 'zh' 
                  ? '如果按钮无效，请手动关闭此标签页并返回原来的AI Brain页面'
                  : 'If the button doesn\'t work, please close this tab manually and return to the original AI Brain page'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Loading component for Suspense
function OAuthSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p>Loading...</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<OAuthSuccessLoading />}>
      <OAuthSuccessContent />
    </Suspense>
  )
}