'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { 
  ContextType, 
  CreateContextRequest, 
  CONTEXT_TYPE_INFO, 
  LifecycleType 
} from '@/types/context'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface CreateContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContextCreated: (context: any) => void
}

export function CreateContextDialog({
  open,
  onOpenChange,
  onContextCreated
}: CreateContextDialogProps) {
  const { t } = useLanguage()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateContextRequest>>({
    type: undefined,
    name: '',
    description: '',
    lifecycle: undefined,
    settings: {
      isPublic: false,
      allowInvites: true,
      aiEnabled: true,
    }
  })

  const handleTypeSelect = (type: ContextType) => {
    setFormData({
      ...formData,
      type,
      lifecycle: CONTEXT_TYPE_INFO[type].defaultLifecycle
    })
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!formData.type || !formData.name) return

    setLoading(true)
    try {
      const response = await fetch('/api/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        onContextCreated(data.context)
        onOpenChange(false)
        // 重置表单
        setFormData({
          type: undefined,
          name: '',
          description: '',
          lifecycle: undefined,
          settings: {
            isPublic: false,
            allowInvites: true,
            aiEnabled: true,
          }
        })
        setStep(1)
      } else {
        const error = await response.json()
        console.error('Failed to create context:', error)
      }
    } catch (error) {
      console.error('Error creating context:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDialogChange = (open: boolean) => {
    if (!open) {
      setStep(1)
      setFormData({
        type: undefined,
        name: '',
        description: '',
        lifecycle: undefined,
        settings: {
          isPublic: false,
          allowInvites: true,
          aiEnabled: true,
        }
      })
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {t.dashboard.createNewContext || '创建新工作空间'}
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? (t.dashboard.selectContextType || '选择最适合您工作方式的空间类型')
              : (t.dashboard.configureContext || '配置您的工作空间详细信息')
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          // 第一步：选择Context类型
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              {Object.entries(CONTEXT_TYPE_INFO).map(([type, info]) => (
                <Card 
                  key={type}
                  className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                  onClick={() => handleTypeSelect(type as ContextType)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div className="flex-1">
                        <CardTitle className="text-base">{info.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {info.description}
                        </CardDescription>
                      </div>
                      {info.suggestedDuration && (
                        <Badge variant="outline" className="text-xs">
                          {info.suggestedDuration}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // 第二步：配置详细信息
          <div className="grid gap-6 py-4">
            {/* 选中的类型显示 */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <span className="text-2xl">
                {formData.type && CONTEXT_TYPE_INFO[formData.type].icon}
              </span>
              <div>
                <div className="font-medium">
                  {formData.type && CONTEXT_TYPE_INFO[formData.type].title}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formData.type && CONTEXT_TYPE_INFO[formData.type].description}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setStep(1)}
                className="ml-auto"
              >
                {t.common.change || '更改'}
              </Button>
            </div>

            {/* 基本信息 */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  {t.dashboard.contextName || '工作空间名称'} *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={`如：${formData.type === 'PROJECT' ? 'APP 2.0 开发' : formData.type === 'DEPARTMENT' ? '产品研发部' : formData.type === 'TEAM' ? '前端小组' : formData.type === 'CLIENT' ? '阿里巴巴' : '我的工作空间'}`}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">
                  {t.dashboard.contextDescription || '描述'}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder={t.dashboard.contextDescriptionPlaceholder || '简要描述这个工作空间的用途和目标...'}
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lifecycle">
                  {t.dashboard.lifecycle || '生命周期'}
                </Label>
                <Select
                  value={formData.lifecycle}
                  onValueChange={(value: LifecycleType) => 
                    setFormData({...formData, lifecycle: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEMPORARY">
                      临时 - 有明确结束时间
                    </SelectItem>
                    <SelectItem value="PERMANENT">
                      永久 - 持续运营
                    </SelectItem>
                    <SelectItem value="TRIGGERED">
                      触发式 - 按需激活
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 高级设置 */}
            <div className="grid gap-4">
              <Label className="text-base font-medium">
                {t.dashboard.advancedSettings || '高级设置'}
              </Label>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal">
                      {t.dashboard.enableAI || '启用 AI 助手'}
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      {t.dashboard.enableAIDesc || '在此工作空间中使用 AI 功能'}
                    </div>
                  </div>
                  <Switch
                    checked={formData.settings?.aiEnabled}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData, 
                        settings: {...formData.settings, aiEnabled: checked}
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal">
                      {t.dashboard.allowInvites || '允许邀请成员'}
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      {t.dashboard.allowInvitesDesc || '成员可以邀请其他人加入'}
                    </div>
                  </div>
                  <Switch
                    checked={formData.settings?.allowInvites}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData, 
                        settings: {...formData.settings, allowInvites: checked}
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-normal">
                      {t.dashboard.publicAccess || '公开访问'}
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      {t.dashboard.publicAccessDesc || '允许组织内其他人发现此工作空间'}
                    </div>
                  </div>
                  <Switch
                    checked={formData.settings?.isPublic}
                    onCheckedChange={(checked) => 
                      setFormData({
                        ...formData, 
                        settings: {...formData.settings, isPublic: checked}
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 2 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(1)}
              disabled={loading}
            >
              {t.common.back || '返回'}
            </Button>
          )}
          
          {step === 2 && (
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.common.creating || '创建中...'}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t.common.create || '创建'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}