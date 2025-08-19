'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function SetupSupabase() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [testResult, setTestResult] = useState<any>(null)

  const supabase = createClient()

  // 测试Supabase连接
  const testConnection = async () => {
    setLoading(true)
    try {
      // 测试Supabase连接
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setTestResult({ 
          connected: false, 
          error: error.message,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL 
        })
      } else {
        setTestResult({ 
          connected: true, 
          session: data.session,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL 
        })
      }
    } catch (err: any) {
      setTestResult({ 
        connected: false, 
        error: err.message 
      })
    } finally {
      setLoading(false)
    }
  }

  // 创建新用户
  const handleSignUp = async () => {
    if (!email || !password) {
      setMessage('请输入邮箱和密码')
      setStatus('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // 1. 注册新用户
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: 'AI Brain User',
            avatar_url: ''
          }
        }
      })

      if (error) {
        setMessage(`注册失败: ${error.message}`)
        setStatus('error')
      } else if (data.user) {
        setMessage('注册成功！请检查您的邮箱进行验证（如果启用了邮箱验证）')
        setStatus('success')
        
        // 如果没有启用邮箱验证，直接登录
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (!signInError) {
          setMessage('注册并登录成功！即将跳转到主页...')
          setTimeout(() => {
            router.push('/contexts')
          }, 2000)
        }
      }
    } catch (err: any) {
      setMessage(`错误: ${err.message}`)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // 使用现有用户登录
  const handleSignIn = async () => {
    if (!email || !password) {
      setMessage('请输入邮箱和密码')
      setStatus('error')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setMessage(`登录失败: ${error.message}`)
        setStatus('error')
      } else if (data.user) {
        setMessage('登录成功！即将跳转到主页...')
        setStatus('success')
        setTimeout(() => {
          router.push('/contexts')
        }, 2000)
      }
    } catch (err: any) {
      setMessage(`错误: ${err.message}`)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // 获取当前用户
  const checkCurrentUser = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setMessage(`当前已登录用户: ${user.email}`)
        setStatus('success')
      } else {
        setMessage('当前没有登录用户')
        setStatus('idle')
      }
    } catch (err: any) {
      setMessage(`检查失败: ${err.message}`)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // 登出
  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      setMessage('已退出登录')
      setStatus('idle')
      setTestResult(null)
    } catch (err: any) {
      setMessage(`退出失败: ${err.message}`)
      setStatus('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Supabase 认证设置</CardTitle>
            <CardDescription>
              配置和测试真实的Supabase认证系统
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 连接状态 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">1. 测试Supabase连接</h3>
              <div className="flex gap-4">
                <Button onClick={testConnection} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  测试连接
                </Button>
                <Button onClick={checkCurrentUser} disabled={loading} variant="outline">
                  检查当前用户
                </Button>
              </div>
              
              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.connected ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex items-center gap-2">
                    {testResult.connected ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {testResult.connected ? '连接成功' : '连接失败'}
                    </span>
                  </div>
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* 创建/登录用户 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">2. 创建或登录用户</h3>
              
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="邮箱地址"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="password"
                  placeholder="密码（至少6位）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-4">
                <Button onClick={handleSignUp} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  创建新用户
                </Button>
                <Button onClick={handleSignIn} disabled={loading} variant="outline">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  登录现有用户
                </Button>
                <Button onClick={handleSignOut} disabled={loading} variant="destructive">
                  退出登录
                </Button>
              </div>

              {/* 消息显示 */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  status === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' :
                  status === 'error' ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200' :
                  'bg-gray-50 dark:bg-gray-800'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* 说明 */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold">说明</h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>📌 <strong>当前配置：</strong></p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</li>
                  <li>使用模拟认证: {process.env.NEXT_PUBLIC_USE_MOCK_AUTH || 'false'}</li>
                </ul>
                
                <p className="mt-4">📝 <strong>使用步骤：</strong></p>
                <ol className="list-decimal ml-6 space-y-1">
                  <li>先测试Supabase连接是否正常</li>
                  <li>创建一个新用户（使用真实邮箱）</li>
                  <li>或使用已有账户登录</li>
                  <li>登录成功后会自动跳转到主页</li>
                </ol>

                <p className="mt-4">⚠️ <strong>注意事项：</strong></p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>密码至少需要6个字符</li>
                  <li>如果Supabase启用了邮箱验证，需要先验证邮箱</li>
                  <li>登录后，认证信息会保存在cookies中</li>
                  <li>后端API就能正确获取用户信息了</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}