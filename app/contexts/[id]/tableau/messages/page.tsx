'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Search, 
  Clock,
  Users,
  Calendar,
  Eye,
  Download,
  Share,
  TrendingUp,
  Database,
  FileText,
  Star,
  Filter,
  RefreshCw,
  Play
} from 'lucide-react'
import { generateTableauData } from '@/lib/data-sources/mock-data-generator'

export default function TableauMessagesPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const tableauData = useMemo(() => generateTableauData(), [])

  const filteredDashboards = useMemo(() => {
    return tableauData.dashboards.filter(dashboard =>
      dashboard.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dashboard.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dashboard.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dashboard.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dashboard.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [tableauData.dashboards, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return '已发布'
      case 'draft': return '草稿'
      case 'archived': return '已归档'
      case 'in_review': return '审核中'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dashboard': return <BarChart3 className="w-5 h-5 text-blue-600" />
      case 'workbook': return <FileText className="w-5 h-5 text-green-600" />
      case 'view': return <Eye className="w-5 h-5 text-purple-600" />
      default: return <BarChart3 className="w-5 h-5 text-gray-600" />
    }
  }

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'average': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPerformanceText = (performance: string) => {
    switch (performance) {
      case 'excellent': return '优秀'
      case 'good': return '良好'
      case 'average': return '一般'
      case 'poor': return '较差'
      default: return performance
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tableau</h1>
            <p className="text-gray-600">数据可视化仪表板</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          {tableauData.dashboards.length} 仪表板
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索仪表板、项目或标签..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">总仪表板数</p>
                <p className="text-xl font-bold">{tableauData.dashboards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">活跃项目</p>
                <p className="text-xl font-bold">{new Set(tableauData.dashboards.map(d => d.project)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">总访问量</p>
                <p className="text-xl font-bold">{tableauData.dashboards.reduce((sum, d) => sum + d.views, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">活跃作者</p>
                <p className="text-xl font-bold">{new Set(tableauData.dashboards.map(d => d.owner)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredDashboards.map((dashboard) => (
          <Card key={dashboard.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    {getTypeIcon(dashboard.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      <Badge className={getStatusColor(dashboard.status)}>
                        {getStatusText(dashboard.status)}
                      </Badge>
                      <Badge variant="outline" className={`${getPerformanceColor(dashboard.performance)}`}>
                        性能: {getPerformanceText(dashboard.performance)}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${dashboard.owner}`} />
                        <AvatarFallback>{dashboard.owner.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>创建者: {dashboard.owner}</span>
                      <span>•</span>
                      <FileText className="w-4 h-4" />
                      <span>项目: {dashboard.project}</span>
                      <span>•</span>
                      <Database className="w-4 h-4" />
                      <span>{dashboard.dataSources.length} 个数据源</span>
                    </div>
                    {dashboard.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {dashboard.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(dashboard.lastModified)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">{dashboard.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">数据源:</h4>
                    <div className="space-y-1">
                      {dashboard.dataSources.map((source, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <Database className="w-4 h-4 text-gray-400" />
                          <span>{source}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">统计信息:</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>{dashboard.views} 次查看</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>评分: {dashboard.rating}/5</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>创建: {formatDate(dashboard.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        查看
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Share className="w-4 h-4 mr-1" />
                        分享
                      </Button>
                      <Button variant="outline" size="sm">
                        <Star className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      导出
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDashboards.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的仪表板</h3>
          <p className="text-gray-600">尝试使用不同的搜索关键词</p>
        </div>
      )}
    </div>
  )
}