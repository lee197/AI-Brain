'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { setMockUserClient } from '@/lib/mock-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestAuthPage() {
  const router = useRouter()

  const loginAsAdmin = () => {
    const adminUser = {
      id: 'mock-user-admin',
      email: 'admin@aibrain.com',
      name: '管理员 Admin',
      avatar: '👨‍💼',
      role: 'admin',
      createdAt: new Date().toISOString()
    }
    
    // Set auth data in both localStorage and cookie
    setMockUserClient(adminUser)
    document.cookie = `ai-brain-auth=${JSON.stringify({ email: adminUser.email })}; path=/`
    
    // Redirect to dashboard
    router.push('/dashboard')
  }

  const loginAsDemo = () => {
    const demoUser = {
      id: 'mock-user-demo',
      email: 'demo@aibrain.com',
      name: '演示用户 Demo User',
      avatar: '👤',
      role: 'user',
      createdAt: new Date().toISOString()
    }
    
    // Set auth data in both localStorage and cookie
    setMockUserClient(demoUser)
    document.cookie = `ai-brain-auth=${JSON.stringify({ email: demoUser.email })}; path=/`
    
    // Redirect to dashboard
    router.push('/dashboard')
  }

  const clearAuth = () => {
    localStorage.removeItem('mock-auth-user')
    localStorage.removeItem('ai-brain-current-context')
    document.cookie = 'ai-brain-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    window.location.reload()
  }

  return (
    <div className="container mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">🧪 Authentication Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loginAsAdmin} className="w-full">
              👨‍💼 Login as Admin & Go to Dashboard
            </Button>
            <Button onClick={loginAsDemo} variant="outline" className="w-full">
              👤 Login as Demo User & Go to Dashboard
            </Button>
            <Button onClick={clearAuth} variant="destructive" className="w-full">
              🗑️ Clear Authentication
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <a href="/dashboard">🏠 Go to Dashboard</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/login">🔐 Go to Login Page</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/debug">🔧 Go to Debug Page</a>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <a href="/">🌟 Go to Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}