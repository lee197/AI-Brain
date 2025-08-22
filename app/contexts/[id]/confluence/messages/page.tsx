'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  BookOpen, 
  Search, 
  Clock,
  Users,
  Eye,
  Edit3,
  MessageSquare,
  Heart,
  FolderOpen,
  Calendar,
  Star
} from 'lucide-react'
import { generateConfluenceData } from '@/lib/data-sources/mock-data-generator'

export default function ConfluenceMessagesPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const confluenceData = useMemo(() => generateConfluenceData(), [])

  const filteredPages = useMemo(() => {
    return confluenceData.pages.filter(page =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.space.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.author.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [confluenceData.pages, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'published': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      case 'under_review': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿'
      case 'published': return '已发布'
      case 'archived': return '已归档'
      case 'under_review': return '审核中'
      default: return status
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Confluence</h1>
            <p className="text-gray-600">团队知识库</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {confluenceData.pages.length} 页面
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索页面、空间或作者..."
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
              <BookOpen className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">总页面数</p>
                <p className="text-xl font-bold">{confluenceData.pages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">活跃空间</p>
                <p className="text-xl font-bold">{new Set(confluenceData.pages.map(p => p.space)).size}</p>
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
                <p className="text-xl font-bold">{new Set(confluenceData.pages.map(p => p.author)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">总评论数</p>
                <p className="text-xl font-bold">{confluenceData.pages.reduce((sum, p) => sum + p.comments, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredPages.map((page) => (
          <Card key={page.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${page.author}`} />
                        <AvatarFallback>{page.author.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>由 {page.author} 创建</span>
                      <FolderOpen className="w-4 h-4" />
                      <span>{page.space}</span>
                      <Badge className={getStatusColor(page.status)}>
                        {getStatusText(page.status)}
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
              <p className="text-gray-700 mb-4">{page.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{page.views} 次查看</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="w-4 h-4" />
                    <span>{page.comments} 条评论</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{page.likes} 个赞</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>创建于 {formatDate(page.createdAt)}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    查看页面
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit3 className="w-4 h-4 mr-1" />
                    编辑
                  </Button>
                  <Button variant="outline" size="sm">
                    <Star className="w-4 h-4 mr-1" />
                    收藏
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的页面</h3>
          <p className="text-gray-600">尝试使用不同的搜索关键词</p>
        </div>
      )}
    </div>
  )
}