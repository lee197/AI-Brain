'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useLanguage } from '@/lib/i18n/language-context'
import {
  ArrowLeft,
  Search,
  Filter,
  FileText,
  Hash,
  Clock,
  Users,
  TrendingUp,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  Bug,
  CheckCircle,
  Circle,
  ArrowRight
} from 'lucide-react'

interface JiraIssue {
  id: string
  key: string
  summary: string
  description: string
  type: 'bug' | 'task' | 'story' | 'epic'
  status: 'todo' | 'in-progress' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee: {
    id: string
    name: string
    avatar: string
  }
  reporter: {
    id: string
    name: string
    avatar: string
  }
  project: {
    id: string
    name: string
    key: string
  }
  created: Date
  updated: Date
  resolution?: string
}

interface JiraData {
  issues: JiraIssue[]
  stats: {
    totalIssues: number
    projectCount: number
    userCount: number
    statusBreakdown: {
      todo: number
      inProgress: number
      done: number
    }
  }
}

export default function JiraMessagesPage() {
  const params = useParams()
  const router = useRouter()
  const { t, language } = useLanguage()
  
  const contextId = params.id as string
  const [jiraData, setJiraData] = useState<JiraData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 模拟Jira数据
  const generateMockJiraData = (): JiraData => {
    const projects = [
      { id: 'proj1', name: 'AI Brain', key: 'AIB' },
      { id: 'proj2', name: 'Marketing Site', key: 'MKT' },
      { id: 'proj3', name: 'Mobile App', key: 'MOB' }
    ]

    const users = [
      { id: 'user1', name: '张三', avatar: '' },
      { id: 'user2', name: '李四', avatar: '' },
      { id: 'user3', name: 'John Smith', avatar: '' },
      { id: 'user4', name: 'Sarah Chen', avatar: '' }
    ]

    const issues: JiraIssue[] = [
      {
        id: 'issue1',
        key: 'AIB-123',
        summary: '实现Slack集成功能',
        description: '需要开发Slack OAuth认证和消息同步功能',
        type: 'story',
        status: 'done',
        priority: 'high',
        assignee: users[0],
        reporter: users[1],
        project: projects[0],
        created: new Date('2024-01-15'),
        updated: new Date('2024-01-20'),
        resolution: '已完成开发和测试'
      },
      {
        id: 'issue2',
        key: 'AIB-124',
        summary: '修复数据库连接超时问题',
        description: '用户报告在高并发情况下数据库连接经常超时',
        type: 'bug',
        status: 'in-progress',
        priority: 'critical',
        assignee: users[2],
        reporter: users[0],
        project: projects[0],
        created: new Date('2024-01-18'),
        updated: new Date('2024-01-21')
      },
      {
        id: 'issue3',
        key: 'MKT-45',
        summary: '更新产品页面设计',
        description: '根据用户反馈更新产品展示页面的UI设计',
        type: 'task',
        status: 'todo',
        priority: 'medium',
        assignee: users[3],
        reporter: users[1],
        project: projects[1],
        created: new Date('2024-01-19'),
        updated: new Date('2024-01-19')
      },
      {
        id: 'issue4',
        key: 'AIB-125',
        summary: '添加多语言支持',
        description: '为应用程序添加中英文双语支持',
        type: 'epic',
        status: 'in-progress',
        priority: 'medium',
        assignee: users[0],
        reporter: users[2],
        project: projects[0],
        created: new Date('2024-01-16'),
        updated: new Date('2024-01-21')
      },
      {
        id: 'issue5',
        key: 'MOB-12',
        summary: '移动端登录界面优化',
        description: '优化移动端登录流程和界面体验',
        type: 'story',
        status: 'done',
        priority: 'low',
        assignee: users[3],
        reporter: users[2],
        project: projects[2],
        created: new Date('2024-01-17'),
        updated: new Date('2024-01-20'),
        resolution: '已发布到生产环境'
      }
    ]

    const statusBreakdown = {
      todo: issues.filter(i => i.status === 'todo').length,
      inProgress: issues.filter(i => i.status === 'in-progress').length,
      done: issues.filter(i => i.status === 'done').length
    }

    return {
      issues,
      stats: {
        totalIssues: issues.length,
        projectCount: projects.length,
        userCount: users.length,
        statusBreakdown
      }
    }
  }

  // 获取Jira数据
  const fetchJiraData = async () => {
    try {
      setError(null)
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData = generateMockJiraData()
      setJiraData(mockData)
    } catch (error) {
      console.error('Error fetching Jira data:', error)
      setError('Failed to load Jira data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchJiraData()
  }, [contextId])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchJiraData()
  }

  const getFilteredIssues = () => {
    if (!jiraData) return []
    
    let issues = jiraData.issues
    
    // 按状态过滤
    if (selectedStatus !== 'all') {
      issues = issues.filter(issue => issue.status === selectedStatus)
    }
    
    // 按搜索查询过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      issues = issues.filter(issue => 
        issue.summary.toLowerCase().includes(query) ||
        issue.key.toLowerCase().includes(query) ||
        issue.assignee.name.toLowerCase().includes(query) ||
        issue.project.name.toLowerCase().includes(query)
      )
    }
    
    return issues
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-4 h-4 text-red-500" />
      case 'task': return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'story': return <Circle className="w-4 h-4 text-green-500" />
      case 'epic': return <ArrowRight className="w-4 h-4 text-purple-500" />
      default: return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      case 'in-progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
      case 'done': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'zh' ? '正在加载Jira数据...' : 'Loading Jira data...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-md mx-auto mt-8">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {language === 'zh' ? `加载失败：${error}` : `Failed to load: ${error}`}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  const filteredIssues = getFilteredIssues()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* 顶部导航栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/contexts/${contextId}/settings`)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'zh' ? '返回设置' : 'Back to Settings'}
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {language === 'zh' ? 'Jira 项目中心' : 'Jira Project Center'}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'zh' ? '实时查看项目进展和任务状态' : 'Real-time project progress and task status'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {language === 'zh' ? '刷新' : 'Refresh'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                {language === 'zh' ? '导出' : 'Export'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* 统计卡片 */}
        {jiraData && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {jiraData.stats.totalIssues}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '总任务数' : 'Total Issues'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {jiraData.stats.projectCount}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '活跃项目' : 'Active Projects'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {jiraData.stats.userCount}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '参与成员' : 'Team Members'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {jiraData.stats.statusBreakdown.done}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {language === 'zh' ? '已完成' : 'Completed'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 搜索和过滤栏 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder={language === 'zh' ? '搜索任务、项目或成员...' : 'Search tasks, projects, or members...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                >
                  <option value="all">{language === 'zh' ? '所有状态' : 'All Status'}</option>
                  <option value="todo">{language === 'zh' ? '待办' : 'To Do'}</option>
                  <option value="in-progress">{language === 'zh' ? '进行中' : 'In Progress'}</option>
                  <option value="done">{language === 'zh' ? '已完成' : 'Done'}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 任务列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{language === 'zh' ? '项目任务' : 'Project Issues'}</span>
              <Badge variant="secondary">
                {filteredIssues.length} {language === 'zh' ? '个任务' : 'issues'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {language === 'zh' 
                ? '按更新时间排序的所有项目任务'
                : 'All project issues sorted by update time'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredIssues.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {language === 'zh' ? '没有找到任务' : 'No issues found'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {searchQuery || selectedStatus !== 'all'
                    ? (language === 'zh' ? '尝试调整搜索条件或过滤器' : 'Try adjusting your search or filter')
                    : (language === 'zh' ? '还没有创建任何任务' : 'No issues created yet')
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredIssues.map((issue, index) => (
                  <div key={issue.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                    <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getIssueIcon(issue.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                              {issue.key}
                            </span>
                            <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(issue.status)}`}>
                              {issue.status === 'todo' && (language === 'zh' ? '待办' : 'To Do')}
                              {issue.status === 'in-progress' && (language === 'zh' ? '进行中' : 'In Progress')}
                              {issue.status === 'done' && (language === 'zh' ? '已完成' : 'Done')}
                            </Badge>
                            <Badge className={`text-xs px-2 py-0.5 ${getPriorityColor(issue.priority)}`}>
                              {issue.priority === 'critical' && (language === 'zh' ? '紧急' : 'Critical')}
                              {issue.priority === 'high' && (language === 'zh' ? '高' : 'High')}
                              {issue.priority === 'medium' && (language === 'zh' ? '中' : 'Medium')}
                              {issue.priority === 'low' && (language === 'zh' ? '低' : 'Low')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {issue.updated.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}
                            </span>
                          </div>
                          
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                            {issue.summary}
                          </h3>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {issue.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={issue.assignee.avatar} />
                                <AvatarFallback>{issue.assignee.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span>{issue.assignee.name}</span>
                            </div>
                            <span>•</span>
                            <span>{issue.project.name}</span>
                            {issue.resolution && (
                              <>
                                <span>•</span>
                                <span className="text-green-600">{issue.resolution}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}