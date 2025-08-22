'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  ArrowLeft,
  Mail,
  User,
  Calendar,
  Paperclip,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
  Copy,
  CheckCircle
} from 'lucide-react'

interface EmailDetail {
  id: string
  threadId: string
  subject: string
  from: string
  to: string
  cc: string
  date: string
  contentText: string
  contentHtml: string
  contentTextLength: number
  contentHtmlLength: number
  labels: string[]
  snippet: string
  sizeEstimate: number
}

export default function EmailDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { language } = useLanguage()
  const contextId = params.id as string
  const emailId = params.emailId as string

  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showHtml, setShowHtml] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadEmailDetail()
  }, [emailId])

  const loadEmailDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/gmail/email/${emailId}?context_id=${contextId}`)
      const result = await response.json()

      if (result.success) {
        setEmail(result.email)
      } else {
        setError(result.error || '加载邮件失败')
      }
    } catch (error) {
      console.error('加载邮件详情失败:', error)
      setError('加载邮件详情失败')
    } finally {
      setLoading(false)
    }
  }

  const copyContent = () => {
    if (email) {
      navigator.clipboard.writeText(email.contentText || email.contentHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error || !email) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'zh' ? '返回' : 'Back'}
        </Button>
        
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error || '邮件不存在'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-6">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {language === 'zh' ? '返回邮件列表' : 'Back to Email List'}
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {email.subject || (language === 'zh' ? '(无主题)' : '(No Subject)')}
                </CardTitle>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{language === 'zh' ? '发件人:' : 'From:'}</span>
                    <span>{email.from}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{language === 'zh' ? '收件人:' : 'To:'}</span>
                    <span>{email.to}</span>
                  </div>
                  
                  {email.cc && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{language === 'zh' ? '抄送:' : 'Cc:'}</span>
                      <span>{email.cc}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{language === 'zh' ? '时间:' : 'Date:'}</span>
                    <span>{new Date(email.date).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {email.labels.map(label => (
                    <Badge key={label} variant="outline" className="text-xs">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={copyContent}
                  variant="outline"
                  size="sm"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {language === 'zh' ? '已复制' : 'Copied'}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      {language === 'zh' ? '复制内容' : 'Copy Content'}
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-gray-500 text-right">
                  {formatFileSize(email.sizeEstimate)}
                </div>
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="p-6">
            {/* 内容统计 */}
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? '文本长度:' : 'Text Length:'}
                    </span>
                    <span className="ml-2 font-medium">{email.contentTextLength} {language === 'zh' ? '字符' : 'chars'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      {language === 'zh' ? 'HTML长度:' : 'HTML Length:'}
                    </span>
                    <span className="ml-2 font-medium">{email.contentHtmlLength} {language === 'zh' ? '字符' : 'chars'}</span>
                  </div>
                </div>
                
                {email.contentHtml && (
                  <Button
                    onClick={() => setShowHtml(!showHtml)}
                    variant="ghost"
                    size="sm"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {showHtml ? (language === 'zh' ? '显示文本' : 'Show Text') : (language === 'zh' ? '显示HTML' : 'Show HTML')}
                  </Button>
                )}
              </div>
            </div>

            {/* 邮件内容 */}
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {showHtml ? (
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    <code>{email.contentHtml}</code>
                  </pre>
                </div>
              ) : (
                <div className="whitespace-pre-wrap break-words">
                  {email.contentText || (
                    <div className="text-gray-500 italic">
                      {language === 'zh' ? '(此邮件只有HTML内容，点击上方按钮查看)' : '(This email only has HTML content, click button above to view)'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}