'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  FileText, 
  Database, 
  Search, 
  Clock,
  Tag,
  Users,
  Eye,
  Edit3,
  Calendar,
  Bookmark
} from 'lucide-react'
import { generateNotionData } from '@/lib/data-sources/mock-data-generator'

export default function NotionMessagesPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('pages')
  
  const notionData = useMemo(() => generateNotionData(), [])

  const filteredPages = useMemo(() => {
    return notionData.pages.filter(page =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [notionData.pages, searchTerm])

  const filteredDatabases = useMemo(() => {
    return notionData.databases.filter(db =>
      db.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      db.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [notionData.databases, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPageIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="w-5 h-5 text-blue-600" />
      case 'database': return <Database className="w-5 h-5 text-green-600" />
      case 'page': return <BookOpen className="w-5 h-5 text-purple-600" />
      default: return <BookOpen className="w-5 h-5 text-gray-600" />
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notion</h1>
            <p className="text-gray-600">页面和数据库</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          {notionData.pages.length + notionData.databases.length} 项目
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索页面和数据库..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pages" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>页面 ({notionData.pages.length})</span>
          </TabsTrigger>
          <TabsTrigger value="databases" className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>数据库 ({notionData.databases.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          {filteredPages.map((page) => (
            <Card key={page.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getPageIcon(page.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{page.title}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${page.author}`} />
                          <AvatarFallback>{page.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>由 {page.author} 创建</span>
                        <Badge className={getStatusColor(page.status)}>
                          {page.status === 'draft' ? '草稿' : page.status === 'published' ? '已发布' : '已归档'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(page.lastModified)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{page.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {page.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span>{page.views}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-1" />
                      编辑页面
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="databases" className="space-y-4">
          {filteredDatabases.map((database) => (
            <Card key={database.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{database.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{database.records} 条记录</span>
                        <Badge variant="outline">{database.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(database.lastModified)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{database.description}</p>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">属性字段:</h4>
                    <div className="flex flex-wrap gap-2">
                      {database.properties.map((prop, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {prop}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>创建者: {database.owner}</span>
                      <span>视图: {database.views} 个</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        查看数据
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bookmark className="w-4 h-4 mr-1" />
                        添加收藏
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}