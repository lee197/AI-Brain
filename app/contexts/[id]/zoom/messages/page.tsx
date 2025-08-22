'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Video, 
  Search, 
  Clock,
  Users,
  Calendar,
  Play,
  Download,
  FileText,
  Mic,
  MicOff,
  VideoOff,
  Phone,
  PhoneOff,
  MoreVertical
} from 'lucide-react'
import { generateZoomData } from '@/lib/data-sources/mock-data-generator'

export default function ZoomMessagesPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const zoomData = useMemo(() => generateZoomData(), [])

  const filteredMeetings = useMemo(() => {
    return zoomData.meetings.filter(meeting =>
      meeting.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [zoomData.meetings, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'ongoing': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '已结束'
      case 'ongoing': return '进行中'
      case 'scheduled': return '已安排'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}小时${mins}分钟`
    }
    return `${mins}分钟`
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

  const getParticipantStatus = (status: string) => {
    switch (status) {
      case 'joined': return { icon: <Video className="w-3 h-3" />, color: 'text-green-600' }
      case 'left': return { icon: <VideoOff className="w-3 h-3" />, color: 'text-gray-600' }
      case 'waiting': return { icon: <Clock className="w-3 h-3" />, color: 'text-yellow-600' }
      default: return { icon: <Users className="w-3 h-3" />, color: 'text-gray-600' }
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Zoom</h1>
            <p className="text-gray-600">视频会议记录</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {zoomData.meetings.length} 会议
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索会议、主持人或参与者..."
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
              <Video className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">总会议数</p>
                <p className="text-xl font-bold">{zoomData.meetings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">总参与者</p>
                <p className="text-xl font-bold">{zoomData.meetings.reduce((sum, m) => sum + m.participants.length, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">总时长</p>
                <p className="text-xl font-bold">{formatDuration(zoomData.meetings.reduce((sum, m) => sum + m.duration, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">有录制</p>
                <p className="text-xl font-bold">{zoomData.meetings.filter(m => m.hasRecording).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {filteredMeetings.map((meeting) => (
          <Card key={meeting.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg">{meeting.topic}</CardTitle>
                      <Badge className={getStatusColor(meeting.status)}>
                        {getStatusText(meeting.status)}
                      </Badge>
                      {meeting.hasRecording && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          <Play className="w-3 h-3 mr-1" />
                          有录制
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${meeting.host}`} />
                        <AvatarFallback>{meeting.host.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>主持人: {meeting.host}</span>
                      <span>•</span>
                      <Users className="w-4 h-4" />
                      <span>{meeting.participants.length} 人参加</span>
                      <span>•</span>
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(meeting.duration)}</span>
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
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">参与者:</h4>
                  <div className="flex flex-wrap gap-2">
                    {meeting.participants.map((participant, index) => {
                      const status = getParticipantStatus(participant.status)
                      return (
                        <div key={index} className="flex items-center space-x-1 bg-gray-50 rounded-full px-3 py-1">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${participant.name}`} />
                            <AvatarFallback className="text-xs">{participant.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{participant.name}</span>
                          <div className={status.color}>
                            {status.icon}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDuration(participant.duration)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>会议ID: {meeting.meetingId}</span>
                    {meeting.password && (
                      <span>密码: {meeting.password}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {meeting.hasRecording && (
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-1" />
                        播放录制
                      </Button>
                    )}
                    {meeting.hasChatLog && (
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-1" />
                        聊天记录
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      下载
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMeetings.length === 0 && (
        <div className="text-center py-12">
          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的会议</h3>
          <p className="text-gray-600">尝试使用不同的搜索关键词</p>
        </div>
      )}
    </div>
  )
}