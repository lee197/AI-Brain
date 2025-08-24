'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserMenu } from '@/components/user-menu'

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-8">
          <Badge className="gradient-bg">AI Brain Dashboard</Badge>
          <UserMenu />
        </div>
        
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full gradient-bg flex items-center justify-center ai-glow">
            <span className="text-3xl">🤖</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold gradient-text">
            AI Brain
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            您的智能工作助手，集成企业工具，自动化工作流，提供 AI 驱动的协助
          </p>
          <Badge className="gradient-bg">
            企业级 AI 助手
          </Badge>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="ai-shadow hover:ai-glow transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔗</span>
                多工具集成
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                连接 Slack、Jira、GitHub、Google Workspace 等企业工具
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">Slack</Badge>
                <Badge variant="secondary">Jira</Badge>
                <Badge variant="secondary">GitHub</Badge>
                <Badge variant="secondary">Google</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="ai-shadow hover:ai-glow transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                自然语言查询
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                跨所有连接工具进行自然语言查询和操作
              </p>
              <Badge className="gradient-bg">AI 驱动</Badge>
            </CardContent>
          </Card>

          <Card className="ai-shadow hover:ai-glow transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                自动化工作流
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                自动执行任务，节省每周 8-10 小时工作时间
              </p>
              <Badge variant="outline">时间节省</Badge>
            </CardContent>
          </Card>

          <Card className="ai-shadow hover:ai-glow transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                上下文感知
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                理解项目、团队和公司知识的 AI 助手
              </p>
              <Badge variant="outline">智能助手</Badge>
            </CardContent>
          </Card>

          <Card className="ai-shadow hover:ai-glow transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔄</span>
                实时同步
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                所有集成工具的数据实时同步和更新
              </p>
              <Badge variant="outline">实时数据</Badge>
            </CardContent>
          </Card>

          <Card className="ai-shadow hover:ai-glow transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                安全可靠
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                基于角色的访问控制，企业级安全保障
              </p>
              <Badge variant="outline">企业安全</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contexts/e7c5aa1e-de00-4327-81dd-cfeba3030081">
              <Button size="lg" className="w-full sm:w-auto">
                开始聊天 💬
              </Button>
            </Link>
            <Link href="/integrations">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                管理集成 🔧
              </Button>
            </Link>
            <Link href="/ui-demo">
              <Button variant="ghost" size="lg" className="w-full sm:w-auto">
                查看 UI 组件 🎨
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            开始您的 AI 驱动工作体验
          </p>
        </div>
      </div>
    </div>
  )
}