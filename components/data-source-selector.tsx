'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DataSourceConfigModal } from '@/components/data-source-config-modal'
import { useLanguage } from '@/lib/i18n/language-context'
import { DataSourceType } from '@/types/context'
import { 
  MessageSquare,
  Calendar,
  GitBranch,
  FileText,
  Briefcase,
  Clock,
  Shield,
  Star,
  ExternalLink,
  Check
} from 'lucide-react'

interface DataSourceSelectorProps {
  selectedSources: DataSourceType[]
  onSourcesChange: (sources: DataSourceType[]) => void
  onConfigure?: (sourceType: DataSourceType) => void
}

export function DataSourceSelector({ 
  selectedSources, 
  onSourcesChange,
  onConfigure 
}: DataSourceSelectorProps) {
  const { t, language } = useLanguage()
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [configSourceType, setConfigSourceType] = useState<DataSourceType | null>(null)

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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case '简单':
      case 'Easy':
        return 'bg-green-100 text-green-800 border-green-200'
      case '中等':
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case '困难':
      case 'Hard':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleSourceToggle = (sourceType: DataSourceType) => {
    const newSources = selectedSources.includes(sourceType)
      ? selectedSources.filter(s => s !== sourceType)
      : [...selectedSources, sourceType]
    onSourcesChange(newSources)
  }

  const dataSources: DataSourceType[] = ['SLACK', 'JIRA', 'GITHUB', 'GOOGLE', 'NOTION']

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          {t.dashboard.dataSources?.selectSources || (language === 'zh' ? '选择数据源' : 'Select Data Sources')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.dashboard.dataSources?.description || (language === 'zh' ? '选择要集成的企业工具，AI 将从这些源获取数据' : 'Select enterprise tools to integrate, AI will get data from these sources')}
        </p>
      </div>

      <div className="grid gap-4">
        {dataSources.map((sourceType) => {
          const Icon = getSourceIcon(sourceType)
          const isSelected = selectedSources.includes(sourceType)
          const sourceInfo = t.dashboard.dataSources?.types?.[sourceType.toLowerCase() as keyof typeof t.dashboard.dataSources.types] || null
          
          if (!sourceInfo) {
            console.warn(`Missing translation for data source type: ${sourceType}`)
            return null
          }

          return (
            <Card 
              key={sourceType}
              className={`transition-all cursor-pointer ${
                isSelected 
                  ? 'border-primary bg-primary/5 shadow-md' 
                  : 'hover:border-primary/50 hover:shadow-sm'
              }`}
              onClick={() => handleSourceToggle(sourceType)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => handleSourceToggle(sourceType)}
                    className="mt-1"
                  />
                  
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${getSourceColor(sourceType)}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">
                        {sourceInfo.name || sourceType}
                      </CardTitle>
                      <Badge 
                        variant="outline" 
                        className={getDifficultyColor(sourceInfo.difficulty || 'Easy')}
                      >
                        {sourceInfo.difficulty || 'Easy'}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm mt-1">
                      {sourceInfo.description || `${sourceType} integration`}
                    </CardDescription>
                  </div>

                  {isSelected && (
                    <div className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid gap-4">
                  {/* 功能特性 */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {language === 'zh' ? '功能特性' : 'Features'}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(sourceInfo.features) ? sourceInfo.features.map((feature: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      )) : (
                        <span className="text-xs text-muted-foreground">No features available</span>
                      )}
                    </div>
                  </div>

                  {/* 详细信息 */}
                  <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{sourceInfo.time || '5-10 minutes'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>{Array.isArray(sourceInfo.scopes) ? sourceInfo.scopes.length : 0} {language === 'zh' ? '权限' : 'permissions'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      <span>{sourceInfo.difficulty || 'Easy'}</span>
                    </div>
                  </div>

                  {isSelected && onConfigure && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <div className="font-medium">
                            {t.dashboard.dataSources?.integrationSteps || (language === 'zh' ? '集成步骤' : 'Integration Steps')}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {t.dashboard.dataSources?.estimatedTime || (language === 'zh' ? '预计用时' : 'Estimated Time')}: {sourceInfo.time || '5-10 minutes'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setConfigSourceType(sourceType)
                              setConfigModalOpen(true)
                            }}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            {t.dashboard.dataSources?.configureNow || (language === 'zh' ? '立即配置' : 'Configure Now')}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selectedSources.length === 0 && (
        <div className="text-center py-8">
          <div className="text-sm text-muted-foreground">
            {t.dashboard.dataSources?.noSourcesSelected || (language === 'zh' ? '暂未选择数据源' : 'No data sources selected')}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {t.dashboard.dataSources?.selectAtLeastOne || (language === 'zh' ? '请至少选择一个数据源' : 'Please select at least one data source')}
          </div>
        </div>
      )}

      {selectedSources.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="text-sm font-medium mb-3">
            {t.dashboard.dataSources?.selectedSources || (language === 'zh' ? '已选择的数据源' : 'Selected Data Sources')} ({selectedSources.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedSources.map((sourceType) => {
              const Icon = getSourceIcon(sourceType)
              const sourceInfo = t.dashboard.dataSources?.types?.[sourceType.toLowerCase() as keyof typeof t.dashboard.dataSources.types] || null
              return (
                <Badge key={sourceType} variant="default" className="flex items-center gap-1">
                  <Icon className="w-3 h-3" />
                  {sourceInfo?.name || sourceType}
                </Badge>
              )
            })}
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {configSourceType && (
        <DataSourceConfigModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          sourceType={configSourceType}
          onConfigComplete={(config) => {
            console.log('Configuration complete:', config)
            if (onConfigure) {
              onConfigure(configSourceType)
            }
            setConfigModalOpen(false)
            setConfigSourceType(null)
          }}
        />
      )}
    </div>
  )
}