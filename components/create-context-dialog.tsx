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
import { DataSourceSelector } from '@/components/data-source-selector'
import { useLanguage } from '@/lib/i18n/language-context'
import { getContextTypeInfo } from '@/lib/context-utils'
import { 
  ContextType, 
  CreateContextRequest, 
  LifecycleType,
  DataSourceType
} from '@/types/context'
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react'

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
  const { t, language } = useLanguage()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<CreateContextRequest>>({
    type: undefined,
    name: '',
    description: '',
    lifecycle: undefined,
    selectedDataSources: [],
    settings: {
      isPublic: false,
      allowInvites: true,
      aiEnabled: true,
      dataSources: [],
    }
  })

  const handleTypeSelect = (type: ContextType) => {
    const typeInfo = getContextTypeInfo(type, language)
    setFormData({
      ...formData,
      type,
      lifecycle: typeInfo.defaultLifecycle
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
          selectedDataSources: [],
          settings: {
            isPublic: false,
            allowInvites: true,
            aiEnabled: true,
            dataSources: [],
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
        selectedDataSources: [],
        settings: {
          isPublic: false,
          allowInvites: true,
          aiEnabled: true,
          dataSources: [],
        }
      })
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{t.dashboard.createNewContext || '创建新工作空间'}</span>
            <Badge variant="outline" className="text-xs">
              {t.dashboard.contexts.step} {step} {t.dashboard.contexts.of} 3
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? (t.dashboard.selectContextType || '选择最适合您工作方式的空间类型')
              : step === 2
              ? (t.dashboard.dataSources?.title || '数据源配置')
              : (t.dashboard.configureContext || '配置您的工作空间详细信息')
            }
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          // 第一步：选择Context类型
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              {(['PROJECT', 'DEPARTMENT', 'TEAM', 'CLIENT', 'PERSONAL'] as ContextType[]).map((type) => {
                const typeInfo = getContextTypeInfo(type, language)
                return (
                  <Card 
                    key={type}
                    className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
                    onClick={() => handleTypeSelect(type)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeInfo.icon}</span>
                        <div className="flex-1">
                          <CardTitle className="text-base">{typeInfo.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {typeInfo.description}
                          </CardDescription>
                        </div>
                        {typeInfo.suggestedDuration && (
                          <Badge variant="outline" className="text-xs">
                            {typeInfo.suggestedDuration}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : step === 2 ? (
          // 第二步：数据源选择
          <div className="py-4">
            <DataSourceSelector
              selectedSources={formData.selectedDataSources || []}
              onSourcesChange={(sources) => setFormData({ ...formData, selectedDataSources: sources })}
              onConfigure={(sourceType) => {
                console.log('Configure', sourceType)
                // 这里可以打开配置对话框或跳转到配置页面
              }}
            />
          </div>
        ) : (
          // 第三步：配置详细信息
          <div className="grid gap-6 py-4">
            {/* 选中的类型和数据源显示 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="text-2xl">
                  {formData.type && getContextTypeInfo(formData.type, language).icon}
                </span>
                <div className="flex-1">
                  <div className="font-medium">
                    {formData.type && getContextTypeInfo(formData.type, language).title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formData.type && getContextTypeInfo(formData.type, language).description}
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
              
              {/* 数据源显示 */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {t.dashboard.dataSources?.selectedSources || '已选择的数据源'} ({(formData.selectedDataSources || []).length})
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(formData.selectedDataSources || []).map((sourceType) => {
                      const sourceInfo = t.dashboard.dataSources?.types?.[sourceType.toLowerCase() as keyof typeof t.dashboard.dataSources.types] || null
                      return (
                        <Badge key={sourceType} variant="secondary" className="text-xs">
                          {sourceInfo?.name || sourceType}
                        </Badge>
                      )
                    })}
                    {(formData.selectedDataSources || []).length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        {t.dashboard.dataSources?.noSourcesSelected || '暂未选择数据源'}
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStep(2)}
                  className="ml-auto"
                >
                  {t.common.change || '更改'}
                </Button>
              </div>
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
          {step > 1 && (
            <Button 
              variant="outline" 
              onClick={() => setStep(step - 1)}
              disabled={loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.dashboard.contexts.previous || '上一步'}
            </Button>
          )}
          
          {step < 3 && (
            <Button 
              onClick={() => setStep(step + 1)}
              disabled={step === 2 && (!formData.selectedDataSources || formData.selectedDataSources.length === 0)}
            >
              {t.dashboard.contexts.next || '下一步'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          
          {step === 3 && (
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
                  {t.dashboard.contexts.finish || '完成'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}