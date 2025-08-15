'use client'

import { useAuth } from '@/hooks/use-auth'
import { useContextManager } from '@/hooks/use-context'
import { getMockUserClient, isMockMode } from '@/lib/mock-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { user, loading, isAuthenticated } = useAuth()
  const { contexts, currentContext, loading: contextLoading, error: contextError } = useContextManager()
  const [mockUser, setMockUser] = useState(null)
  const [cookies, setCookies] = useState('')

  useEffect(() => {
    // Check mock auth status
    const mockUserData = getMockUserClient()
    setMockUser(mockUserData)
    
    // Check cookies
    if (typeof document !== 'undefined') {
      setCookies(document.cookie)
    }
  }, [])

  const clearAllAuth = () => {
    // Clear localStorage
    localStorage.removeItem('mock-auth-user')
    localStorage.removeItem('ai-brain-current-context')
    
    // Clear cookies by setting them to expire
    document.cookie = 'ai-brain-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    document.cookie = 'mock-auth-user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    
    window.location.reload()
  }

  const setDemoUser = () => {
    const demoUser = {
      id: 'mock-user-admin',
      email: 'admin@aibrain.com',
      name: '管理员 Admin',
      avatar: '👨‍💼',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
    
    localStorage.setItem('mock-auth-user', JSON.stringify(demoUser))
    document.cookie = `ai-brain-auth=${JSON.stringify({ email: demoUser.email })}; path=/`
    
    window.location.href = '/dashboard'
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">🔧 AI Brain Debug Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle>🔐 Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p><strong>Mock Mode:</strong> {isMockMode() ? '✅ Yes' : '❌ No'}</p>
              <p><strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}</p>
              <p><strong>Is Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
              <p><strong>User Object:</strong> {user ? '✅ Present' : '❌ Null'}</p>
            </div>
            
            {user && (
              <div className="bg-gray-100 p-3 rounded text-sm">
                <strong>User Details:</strong>
                <pre>{JSON.stringify(user, null, 2)}</pre>
              </div>
            )}
            
            <div className="space-y-2">
              <Button onClick={setDemoUser} className="w-full">
                🚀 Set Demo User & Redirect to Dashboard
              </Button>
              <Button onClick={clearAllAuth} variant="destructive" className="w-full">
                🗑️ Clear All Auth Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Context Status */}
        <Card>
          <CardHeader>
            <CardTitle>🔄 Context Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p><strong>Context Loading:</strong> {contextLoading ? '⏳ Yes' : '✅ No'}</p>
              <p><strong>Context Error:</strong> {contextError || '✅ No error'}</p>
              <p><strong>Contexts Count:</strong> {contexts.length}</p>
              <p><strong>Current Context:</strong> {currentContext?.name || '❌ None'}</p>
            </div>
            
            {contexts.length > 0 && (
              <div className="bg-gray-100 p-3 rounded text-sm">
                <strong>Available Contexts:</strong>
                <ul className="list-disc list-inside">
                  {contexts.map(ctx => (
                    <li key={ctx.id}>{ctx.name} ({ctx.type})</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Storage Status */}
        <Card>
          <CardHeader>
            <CardTitle>💾 Storage Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p><strong>Mock User in localStorage:</strong> {mockUser ? '✅ Present' : '❌ Null'}</p>
              <p><strong>Cookies:</strong> {cookies ? '✅ Present' : '❌ Empty'}</p>
            </div>
            
            {mockUser && (
              <div className="bg-gray-100 p-3 rounded text-sm">
                <strong>Mock User Data:</strong>
                <pre>{JSON.stringify(mockUser, null, 2)}</pre>
              </div>
            )}
            
            {cookies && (
              <div className="bg-gray-100 p-3 rounded text-sm">
                <strong>Cookies:</strong>
                <pre>{cookies}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button asChild className="w-full">
                <a href="/dashboard">🏠 Go to Dashboard</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/login">🔐 Go to Login</a>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href="/">🌟 Go to Home</a>
              </Button>
              <Button onClick={() => window.location.reload()} variant="secondary" className="w-full">
                🔄 Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}