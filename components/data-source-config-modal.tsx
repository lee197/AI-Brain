'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/lib/i18n/language-context'
import { DataSourceType } from '@/types/context'
import { 
  MessageSquare,
  Calendar,
  GitBranch,
  FileText,
  Briefcase,
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
  Link2,
  Settings,
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  Info,
  Sparkles
} from 'lucide-react'

interface DataSourceConfigModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceType: DataSourceType
  onConfigComplete?: (config: any) => void
}

export function DataSourceConfigModal({
  open,
  onOpenChange,
  sourceType,
  onConfigComplete
}: DataSourceConfigModalProps) {
  const { t, language } = useLanguage()
  const [currentStep, setCurrentStep] = useState<'intro' | 'oauth' | 'config' | 'test' | 'complete'>('intro')
  const [isLoading, setIsLoading] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [configData, setConfigData] = useState({
    workspace: '',
    apiKey: '',
    channels: [] as string[],
    permissions: [] as string[]
  })

  const getSourceIcon = (type: DataSourceType) => {
    switch (type) {
      case 'SLACK':
        return MessageSquare
      case 'JIRA':
        return Briefcase
      case 'GITHUB':
        return GitBranch
      case 'GOOGLE':
        return Calendar
      case 'NOTION':
        return FileText
      default:
        return FileText
    }
  }

  const getSourceColor = (type: DataSourceType) => {
    switch (type) {
      case 'SLACK':
        return 'from-purple-500 to-purple-600'
      case 'JIRA':
        return 'from-blue-500 to-blue-600'
      case 'GITHUB':
        return 'from-gray-800 to-gray-900'
      case 'GOOGLE':
        return 'from-red-500 to-yellow-500'
      case 'NOTION':
        return 'from-gray-700 to-gray-800'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const Icon = getSourceIcon(sourceType)
  const sourceInfo = (t.dashboard.dataSources.types as any)[sourceType.toLowerCase()]

  const handleOAuthConnect = async () => {
    setIsLoading(true)
    // 模拟OAuth流程
    setTimeout(() => {
      setIsLoading(false)
      setCurrentStep('config')
    }, 2000)
  }

  const handleTestConnection = async () => {
    setIsLoading(true)
    // 模拟测试连接
    setTimeout(() => {
      setIsLoading(false)
      setCurrentStep('complete')
    }, 1500)
  }

  const handleComplete = () => {
    if (onConfigComplete) {
      onConfigComplete(configData)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${getSourceColor(sourceType)}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {language === 'zh' ? `配置 ${sourceInfo?.name || sourceType}` : `Configure ${sourceInfo?.name || sourceType}`}
              </DialogTitle>
              <DialogDescription>
                {language === 'zh' ? '完成集成设置以连接您的数据源' : 'Complete the integration setup to connect your data source'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-6">
          {currentStep === 'intro' && (
            <div className="space-y-6">
              {/* 功能介绍 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {language === 'zh' ? '集成功能' : 'Integration Features'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {sourceInfo?.features?.map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 权限说明 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {language === 'zh' ? '所需权限' : 'Required Permissions'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sourceInfo?.scopes?.map((scope: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                        <span className="text-sm text-muted-foreground">{scope}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 集成步骤预览 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    {language === 'zh' ? '集成步骤' : 'Integration Steps'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">1</div>
                      <div>
                        <div className="font-medium text-sm">{language === 'zh' ? '授权连接' : 'Authorize Connection'}</div>
                        <div className="text-xs text-muted-foreground">{language === 'zh' ? '通过OAuth安全连接您的账户' : 'Securely connect your account via OAuth'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">2</div>
                      <div>
                        <div className="font-medium text-sm">{language === 'zh' ? '配置设置' : 'Configure Settings'}</div>
                        <div className="text-xs text-muted-foreground">{language === 'zh' ? '选择要同步的数据和频道' : 'Select data and channels to sync'}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">3</div>
                      <div>
                        <div className="font-medium text-sm">{language === 'zh' ? '测试连接' : 'Test Connection'}</div>
                        <div className="text-xs text-muted-foreground">{language === 'zh' ? '验证集成是否正常工作' : 'Verify the integration is working'}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  {language === 'zh' 
                    ? `预计用时：${sourceInfo?.time || '5-10分钟'}。您可以随时暂停并稍后继续。`
                    : `Estimated time: ${sourceInfo?.time || '5-10 minutes'}. You can pause and continue later at any time.`
                  }
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep === 'oauth' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${getSourceColor(sourceType)} flex items-center justify-center`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'zh' ? `连接到 ${sourceInfo?.name}` : `Connect to ${sourceInfo?.name}`}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {language === 'zh' 
                    ? '您将被重定向到授权页面以安全连接您的账户'
                    : 'You will be redirected to authorize and securely connect your account'
                  }
                </p>
                
                {isLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {language === 'zh' ? '正在连接...' : 'Connecting...'}
                    </span>
                  </div>
                ) : (
                  <Button 
                    size="lg" 
                    onClick={handleOAuthConnect}
                    className="gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    {language === 'zh' ? '授权并连接' : 'Authorize & Connect'}
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  {language === 'zh' 
                    ? '我们使用OAuth 2.0进行安全认证。您的凭据不会存储在我们的服务器上。'
                    : 'We use OAuth 2.0 for secure authentication. Your credentials are never stored on our servers.'
                  }
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep === 'config' && (
            <div className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">{language === 'zh' ? '基本设置' : 'Basic Settings'}</TabsTrigger>
                  <TabsTrigger value="advanced">{language === 'zh' ? '高级选项' : 'Advanced Options'}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4 mt-4">
                  {sourceType === 'SLACK' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="workspace">{language === 'zh' ? '工作空间名称' : 'Workspace Name'}</Label>
                        <Input
                          id="workspace"
                          placeholder={language === 'zh' ? '例如：我的团队' : 'e.g., My Team'}
                          value={configData.workspace}
                          onChange={(e) => setConfigData({...configData, workspace: e.target.value})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>{language === 'zh' ? '选择要同步的频道' : 'Select Channels to Sync'}</Label>
                        <div className="space-y-2 border rounded-lg p-3">
                          {['#general', '#random', '#project-updates', '#dev-team'].map((channel) => (
                            <label key={channel} className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="rounded"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setConfigData({...configData, channels: [...configData.channels, channel]})
                                  } else {
                                    setConfigData({...configData, channels: configData.channels.filter(c => c !== channel)})
                                  }
                                }}
                              />
                              <span className="text-sm">{channel}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {sourceType === 'GITHUB' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="repos">{language === 'zh' ? '仓库选择' : 'Repository Selection'}</Label>
                        <div className="space-y-2 border rounded-lg p-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="repo-select" defaultChecked />
                            <span className="text-sm">{language === 'zh' ? '所有仓库' : 'All repositories'}</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="repo-select" />
                            <span className="text-sm">{language === 'zh' ? '选择特定仓库' : 'Select specific repositories'}</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
                
                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">
                      {language === 'zh' ? 'API 密钥（可选）' : 'API Key (Optional)'}
                    </Label>
                    <div className="relative">
                      <Input
                        id="api-key"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={language === 'zh' ? '用于高级功能' : 'For advanced features'}
                        value={configData.apiKey}
                        onChange={(e) => setConfigData({...configData, apiKey: e.target.value})}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'zh' ? '同步频率' : 'Sync Frequency'}</Label>
                    <select className="w-full px-3 py-2 border rounded-md">
                      <option>{language === 'zh' ? '实时' : 'Real-time'}</option>
                      <option>{language === 'zh' ? '每5分钟' : 'Every 5 minutes'}</option>
                      <option>{language === 'zh' ? '每小时' : 'Every hour'}</option>
                      <option>{language === 'zh' ? '每天' : 'Daily'}</option>
                    </select>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {currentStep === 'test' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                {isLoading ? (
                  <>
                    <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
                    <h3 className="text-lg font-semibold mb-2">
                      {language === 'zh' ? '测试连接中...' : 'Testing Connection...'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'zh' ? '正在验证您的配置' : 'Verifying your configuration'}
                    </p>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-semibold mb-2">
                      {language === 'zh' ? '连接成功！' : 'Connection Successful!'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === 'zh' ? '您的数据源已准备就绪' : 'Your data source is ready to use'}
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'zh' ? '配置完成！' : 'Configuration Complete!'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {language === 'zh' 
                    ? `${sourceInfo?.name} 已成功连接到您的工作空间`
                    : `${sourceInfo?.name} has been successfully connected to your workspace`
                  }
                </p>
              </div>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-base">
                    {language === 'zh' ? '下一步' : 'Next Steps'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-sm">
                        {language === 'zh' 
                          ? 'AI 将开始从此数据源学习和分析数据'
                          : 'AI will start learning and analyzing data from this source'
                        }
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-sm">
                        {language === 'zh' 
                          ? '您可以在聊天中询问关于此数据源的问题'
                          : 'You can ask questions about this data source in chat'
                        }
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-sm">
                        {language === 'zh' 
                          ? '自动化工作流现在可以使用此集成'
                          : 'Automated workflows can now use this integration'
                        }
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          {currentStep === 'intro' && (
            <Button onClick={() => setCurrentStep('oauth')} className="gap-2">
              {language === 'zh' ? '开始配置' : 'Start Configuration'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          
          {currentStep === 'config' && (
            <Button 
              onClick={() => setCurrentStep('test')}
              className="gap-2"
              disabled={sourceType === 'SLACK' && !configData.workspace}
            >
              {language === 'zh' ? '测试连接' : 'Test Connection'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          
          {currentStep === 'test' && !isLoading && (
            <Button onClick={handleTestConnection} className="gap-2">
              {language === 'zh' ? '完成测试' : 'Complete Test'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          
          {currentStep === 'complete' && (
            <Button onClick={handleComplete} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {language === 'zh' ? '完成' : 'Done'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}