'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataSourceSelector } from '@/components/data-source-selector'
import { useLanguage } from '@/lib/i18n/language-context'
import { useAuth } from '@/hooks/use-auth'
import { getContextTypeInfo } from '@/lib/context-utils'
import { 
  ContextType, 
  CreateContextRequest, 
  LifecycleType,
  DataSourceType
} from '@/types/context'
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  Sparkles,
  Target,
  Building2,
  Users,
  Shield,
  BookOpen,
  ChevronLeft,
  Home
} from 'lucide-react'

export default function CreateContextPage() {
  const { t, language } = useLanguage()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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

  // 检查认证状态
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleTypeSelect = (type: ContextType) => {
    const typeInfo = getContextTypeInfo(type, language)
    setFormData({
      ...formData,
      type,
      lifecycle: typeInfo.defaultLifecycle
    })
    setCurrentStep(2)
  }

  const handleDataSourcesChange = (sources: DataSourceType[]) => {
    setFormData({ ...formData, selectedDataSources: sources })
  }

  const handleSubmit = async () => {
    if (!formData.type || !formData.name) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        // 创建成功后跳转到新的 Context
        if (typeof window !== 'undefined') {
          localStorage.setItem('ai-brain-current-context', data.context.id)
        }
        router.push('/dashboard')
      } else {
        const error = await response.json()
        console.error('Failed to create context:', error)
      }
    } catch (error) {
      console.error('Error creating context:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedToNext = () => {
    if (currentStep === 1) return !!formData.type
    if (currentStep === 2) return formData.selectedDataSources && formData.selectedDataSources.length > 0
    if (currentStep === 3) return !!formData.name
    return false
  }

  const steps = [
    { number: 1, title: t.dashboard.selectContextType, description: '选择最适合您工作方式的空间类型' },
    { number: 2, title: t.dashboard.dataSources.title, description: t.dashboard.dataSources.description },
    { number: 3, title: t.dashboard.configureContext, description: '配置您的工作空间详细信息' }
  ]

  const contextTypes: { type: ContextType, icon: any, color: string }[] = [
    { type: 'PROJECT', icon: Target, color: 'from-blue-500 to-blue-600' },
    { type: 'DEPARTMENT', icon: Building2, color: 'from-purple-500 to-purple-600' },
    { type: 'TEAM', icon: Users, color: 'from-green-500 to-green-600' },
    { type: 'CLIENT', icon: Shield, color: 'from-orange-500 to-orange-600' },
    { type: 'PERSONAL', icon: BookOpen, color: 'from-gray-500 to-gray-600' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* 顶部导航 */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.back()}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {t.common.back}
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                <h1 className="text-lg font-semibold">{t.dashboard.createNewContext}</h1>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/contexts')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              {language === 'zh' ? '返回首页' : 'Home'}
            </Button>
          </div>
        </div>
      </header>

      {/* 进度条 */}
      <div className="border-b bg-background/50">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-sm transition-all ${
                    currentStep >= step.number 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`font-medium text-sm ${
                      currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-24 h-px mx-6 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-background rounded-xl shadow-sm border p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{t.dashboard.selectContextType}</h2>
                <p className="text-muted-foreground">{language === 'zh' ? '选择最适合您工作方式的空间类型' : 'Choose the workspace type that best fits your working style'}</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contextTypes.map(({ type, icon: Icon, color }) => {
                  const typeInfo = getContextTypeInfo(type, language)
                  const isSelected = formData.type === type
                  
                  return (
                    <Card 
                      key={type}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                        isSelected 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => handleTypeSelect(type)}
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-3 rounded-lg bg-gradient-to-r ${color}`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{typeInfo.title}</CardTitle>
                            {typeInfo.suggestedDuration && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {typeInfo.suggestedDuration}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="text-sm leading-relaxed">
                          {typeInfo.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{t.dashboard.dataSources.title}</h2>
                <p className="text-muted-foreground">{t.dashboard.dataSources.description}</p>
              </div>
              
              <DataSourceSelector
                selectedSources={formData.selectedDataSources || []}
                onSourcesChange={handleDataSourcesChange}
                onConfigure={(sourceType) => {
                  console.log('Configure', sourceType)
                }}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">{t.dashboard.configureContext}</h2>
                <p className="text-muted-foreground">{language === 'zh' ? '完善您的工作空间信息' : 'Complete your workspace information'}</p>
              </div>

              {/* 选择摘要 */}
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{language === 'zh' ? '工作空间类型' : 'Workspace Type'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      {formData.type && (() => {
                        const typeInfo = getContextTypeInfo(formData.type, language)
                        const contextTypeData = contextTypes.find(ct => ct.type === formData.type)
                        const Icon = contextTypeData?.icon
                        return (
                          <>
                            {Icon && (
                              <div className={`p-2 rounded-lg bg-gradient-to-r ${contextTypeData.color}`}>
                                <Icon className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{typeInfo.title}</div>
                              <div className="text-xs text-muted-foreground">{typeInfo.description}</div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{t.dashboard.dataSources.selectedSources}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {(formData.selectedDataSources || []).map((sourceType) => {
                        const sourceInfo = (t.dashboard.dataSources.types as any)[sourceType.toLowerCase()]
                        return (
                          <Badge key={sourceType} variant="secondary" className="text-xs">
                            {sourceInfo?.name || sourceType}
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 基本信息 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {t.dashboard.contextName} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder={`如：${formData.type === 'PROJECT' ? 'APP 2.0 开发项目' : formData.type === 'DEPARTMENT' ? '产品研发部' : formData.type === 'TEAM' ? '前端开发小组' : formData.type === 'CLIENT' ? '阿里巴巴合作项目' : '我的个人工作空间'}`}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    {t.dashboard.contextDescription}
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder={t.dashboard.contextDescriptionPlaceholder}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lifecycle" className="text-sm font-medium">
                    {t.dashboard.lifecycle}
                  </Label>
                  <Select
                    value={formData.lifecycle}
                    onValueChange={(value: LifecycleType) => 
                      setFormData({...formData, lifecycle: value})
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEMPORARY">
                        {language === 'zh' ? '临时 - 有明确结束时间' : 'Temporary - Has clear end date'}
                      </SelectItem>
                      <SelectItem value="PERMANENT">
                        {language === 'zh' ? '永久 - 持续运营' : 'Permanent - Ongoing operations'}
                      </SelectItem>
                      <SelectItem value="TRIGGERED">
                        {language === 'zh' ? '触发式 - 按需激活' : 'Triggered - Activated on demand'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 高级设置 */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="text-lg font-semibold">{t.dashboard.advancedSettings}</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{t.dashboard.enableAI}</Label>
                      <div className="text-xs text-muted-foreground">{t.dashboard.enableAIDesc}</div>
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

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{t.dashboard.allowInvites}</Label>
                      <div className="text-xs text-muted-foreground">{t.dashboard.allowInvitesDesc}</div>
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

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">{t.dashboard.publicAccess}</Label>
                      <div className="text-xs text-muted-foreground">{t.dashboard.publicAccessDesc}</div>
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
        </div>

        {/* 底部操作按钮 */}
        <div className="flex items-center justify-between mt-8">
          <div>
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={isSubmitting}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.dashboard.contexts.previous}
              </Button>
            )}
          </div>
          
          <div className="flex gap-3">
            {currentStep < 3 ? (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNext()}
                className="gap-2 min-w-32"
              >
                {t.dashboard.contexts.next}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={!formData.name || isSubmitting}
                className="gap-2 min-w-32"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.common.creating}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {t.dashboard.contexts.finish}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}