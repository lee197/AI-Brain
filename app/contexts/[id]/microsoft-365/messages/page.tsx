'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Mail, 
  FileText, 
  Video, 
  Search, 
  Calendar,
  PaperclipIcon,
  Users,
  Clock,
  Star,
  MessageSquare
} from 'lucide-react'
import { generateMicrosoft365Data } from '@/lib/data-sources/mock-data-generator'

export default function Microsoft365MessagesPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('emails')
  
  const microsoft365Data = useMemo(() => generateMicrosoft365Data(), [])

  const filteredEmails = useMemo(() => {
    return microsoft365Data.emails.filter(email =>
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [microsoft365Data.emails, searchTerm])

  const filteredDocuments = useMemo(() => {
    return microsoft365Data.documents.filter(doc =>
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [microsoft365Data.documents, searchTerm])

  const filteredMeetings = useMemo(() => {
    return microsoft365Data.meetings.filter(meeting =>
      meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.organizer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [microsoft365Data.meetings, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unread': return 'bg-blue-100 text-blue-800'
      case 'read': return 'bg-gray-100 text-gray-800'
      case 'important': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
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
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Microsoft 365</h1>
            <p className="text-gray-600">邮件、文档和会议</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {microsoft365Data.emails.length + microsoft365Data.documents.length + microsoft365Data.meetings.length} 项目
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索邮件、文档或会议..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="emails" className="flex items-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>邮件 ({microsoft365Data.emails.length})</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>文档 ({microsoft365Data.documents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex items-center space-x-2">
            <Video className="w-4 h-4" />
            <span>会议 ({microsoft365Data.meetings.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emails" className="space-y-4">
          {filteredEmails.map((email) => (
            <Card key={email.id} className={`transition-all hover:shadow-md ${email.status === 'unread' ? 'border-l-4 border-l-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${email.sender}`} />
                      <AvatarFallback>{email.sender.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{email.sender}</span>
                        <Badge className={getStatusColor(email.status)}>
                          {email.status === 'unread' ? '未读' : email.status === 'read' ? '已读' : '重要'}
                        </Badge>
                        {email.priority === 'high' && (
                          <Star className={`w-4 h-4 ${getPriorityColor(email.priority)}`} fill="currentColor" />
                        )}
                      </div>
                      <CardTitle className="text-lg mt-1">{email.subject}</CardTitle>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(email.timestamp)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{email.content}</p>
                {email.attachments && email.attachments.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <PaperclipIcon className="w-4 h-4" />
                    <span>{email.attachments.length} 个附件</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{doc.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>由 {doc.author} 创建</span>
                        <Badge variant="outline">{doc.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(doc.lastModified)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{doc.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{doc.size}</span>
                    <span>版本 {doc.version}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    打开文档
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          {filteredMeetings.map((meeting) => (
            <Card key={meeting.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>组织者: {meeting.organizer}</span>
                        <Badge variant="outline">{meeting.status}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(meeting.startTime)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-3">{meeting.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>时长: {meeting.duration} 分钟</span>
                    <span>参与者: {meeting.attendees.length} 人</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-1" />
                      加入会议
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-1" />
                      查看录音
                    </Button>
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