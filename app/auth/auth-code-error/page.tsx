import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md ai-shadow">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="text-red-600 w-6 h-6" />
          </div>
          <CardTitle className="text-xl text-red-600">认证失败</CardTitle>
          <p className="text-muted-foreground">
            登录过程中出现了问题
          </p>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            可能的原因：
          </p>
          <ul className="text-sm text-muted-foreground text-left space-y-1">
            <li>• 认证链接已过期</li>
            <li>• 认证链接已被使用</li>
            <li>• 网络连接问题</li>
            <li>• 服务配置错误</li>
          </ul>
          <div className="pt-4 space-y-2">
            <Button asChild className="w-full">
              <Link href="/login">重新登录</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/signup">创建新账户</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}