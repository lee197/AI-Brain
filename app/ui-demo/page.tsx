import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function UIDemoPage() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold gradient-text">
          AI Brain UI Components
        </h1>
        <p className="text-muted-foreground">
          shadcn/ui 组件展示页面
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Buttons */}
        <Card className="ai-shadow">
          <CardHeader>
            <CardTitle>按钮组件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>默认按钮</Button>
              <Button variant="secondary">次要按钮</Button>
              <Button variant="outline">边框按钮</Button>
              <Button variant="ghost">幽灵按钮</Button>
              <Button variant="destructive">危险按钮</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">小按钮</Button>
              <Button size="default">默认大小</Button>
              <Button size="lg">大按钮</Button>
            </div>
          </CardContent>
        </Card>

        {/* Input */}
        <Card className="ai-shadow">
          <CardHeader>
            <CardTitle>输入框</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="请输入内容..." />
            <Input placeholder="电子邮箱" type="email" />
            <Input placeholder="密码" type="password" />
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="ai-shadow">
          <CardHeader>
            <CardTitle>徽章组件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>默认</Badge>
              <Badge variant="secondary">次要</Badge>
              <Badge variant="outline">边框</Badge>
              <Badge variant="destructive">危险</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="gradient-bg">AI 助手</Badge>
              <Badge variant="outline">在线</Badge>
              <Badge variant="secondary">Beta</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card className="ai-shadow">
          <CardHeader>
            <CardTitle>头像组件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Avatar>
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>用户</AvatarFallback>
              </Avatar>
              <Avatar className="ai-glow">
                <AvatarFallback className="gradient-bg">🤖</AvatarFallback>
              </Avatar>
            </div>
          </CardContent>
        </Card>

        {/* Dropdown Menu */}
        <Card className="ai-shadow">
          <CardHeader>
            <CardTitle>下拉菜单</CardTitle>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">打开菜单</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>用户资料</DropdownMenuItem>
                <DropdownMenuItem>设置</DropdownMenuItem>
                <DropdownMenuItem>帮助</DropdownMenuItem>
                <DropdownMenuItem>登出</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>

        {/* Dialog */}
        <Card className="ai-shadow">
          <CardHeader>
            <CardTitle>对话框</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog>
              <DialogTrigger asChild>
                <Button>打开对话框</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Brain 设置</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>这是一个示例对话框。</p>
                  <Input placeholder="输入您的设置..." />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline">取消</Button>
                    <Button>保存</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Theme Demo */}
      <Card className="gradient-bg ai-shadow">
        <CardHeader>
          <CardTitle className="gradient-text">AI Brain 主题展示</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">品牌色彩</h3>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-primary rounded" />
                <div className="w-8 h-8 bg-secondary rounded" />
                <div className="w-8 h-8 bg-accent rounded" />
                <div className="w-8 h-8 bg-muted rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">自定义样式</h3>
              <div className="space-y-1">
                <div className="text-sm gradient-text font-medium">
                  渐变文字效果
                </div>
                <div className="text-sm p-2 gradient-bg rounded">
                  渐变背景效果
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}