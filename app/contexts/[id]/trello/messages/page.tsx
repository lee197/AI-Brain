'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Kanban, 
  Search, 
  Clock,
  Users,
  Calendar,
  Tag,
  MessageSquare,
  Paperclip,
  CheckSquare,
  AlertCircle,
  Star,
  MoreVertical
} from 'lucide-react'
import { generateTrelloData } from '@/lib/data-sources/mock-data-generator'

export default function TrelloMessagesPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const trelloData = useMemo(() => generateTrelloData(), [])

  const filteredCards = useMemo(() => {
    return trelloData.cards.filter(card =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.list.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.board.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.labels.some(label => label.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [trelloData.cards, searchTerm])

  const getStatusColor = (list: string) => {
    switch (list.toLowerCase()) {
      case 'to do':
      case '待办': 
        return 'bg-gray-100 text-gray-800'
      case 'in progress':
      case '进行中': 
        return 'bg-blue-100 text-blue-800'
      case 'review':
      case '审核中': 
        return 'bg-yellow-100 text-yellow-800'
      case 'done':
      case '已完成': 
        return 'bg-green-100 text-green-800'
      default: 
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getLabelColor = (label: string) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-orange-100 text-orange-800'
    ]
    return colors[label.length % colors.length]
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

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '高优先级'
      case 'medium': return '中优先级'
      case 'low': return '低优先级'
      default: return '普通'
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Kanban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Trello</h1>
            <p className="text-gray-600">看板任务管理</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {trelloData.cards.length} 卡片
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索卡片、描述或标签..."
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
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">总卡片数</p>
                <p className="text-xl font-bold">{trelloData.cards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Kanban className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">看板数</p>
                <p className="text-xl font-bold">{new Set(trelloData.cards.map(c => c.board)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">参与成员</p>
                <p className="text-xl font-bold">{new Set(trelloData.cards.flatMap(c => c.members)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">逾期任务</p>
                <p className="text-xl font-bold">{trelloData.cards.filter(c => c.dueDate && isOverdue(c.dueDate)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredCards.map((card) => (
          <Card key={card.id} className={`transition-all hover:shadow-md ${card.dueDate && isOverdue(card.dueDate) ? 'border-l-4 border-l-red-500' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">{card.title}</CardTitle>
                      {card.priority && (
                        <Badge className={getPriorityColor(card.priority)}>
                          {getPriorityText(card.priority)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Kanban className="w-4 h-4" />
                      <span>{card.board}</span>
                      <span>•</span>
                      <Badge className={getStatusColor(card.list)}>
                        {card.list}
                      </Badge>
                    </div>
                    {card.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {card.labels.map((label, index) => (
                          <Badge key={index} variant="outline" className={`text-xs ${getLabelColor(label)}`}>
                            <Tag className="w-3 h-3 mr-1" />
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {card.dueDate && (
                    <div className={`text-sm flex items-center space-x-1 ${isOverdue(card.dueDate) ? 'text-red-600' : 'text-gray-500'}`}>
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(card.dueDate)}</span>
                      {isOverdue(card.dueDate) && <AlertCircle className="w-4 h-4" />}
                    </div>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{card.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {card.members.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <div className="flex -space-x-1">
                        {card.members.slice(0, 3).map((member, index) => (
                          <Avatar key={index} className="w-6 h-6 border-2 border-white">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member}`} />
                            <AvatarFallback className="text-xs">{member.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                        {card.members.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                            +{card.members.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {card.comments > 0 && (
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{card.comments}</span>
                      </div>
                    )}
                    {card.attachments > 0 && (
                      <div className="flex items-center space-x-1">
                        <Paperclip className="w-4 h-4" />
                        <span>{card.attachments}</span>
                      </div>
                    )}
                    {card.checklist && (
                      <div className="flex items-center space-x-1">
                        <CheckSquare className="w-4 h-4" />
                        <span>{card.checklist.completed}/{card.checklist.total}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <CheckSquare className="w-4 h-4 mr-1" />
                    查看卡片
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

      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <Kanban className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的卡片</h3>
          <p className="text-gray-600">尝试使用不同的搜索关键词</p>
        </div>
      )}
    </div>
  )
}