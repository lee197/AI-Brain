'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import { SlackSendMessage } from '@/components/slack/slack-send-message'
import { SlackConnectionToggle } from '@/components/slack/slack-connection-toggle'
import { 
  Send, 
  Bot, 
  User, 
  Slack, 
  MessageSquare, 
  Settings,
  Share,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2
} from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant' | 'system'
  timestamp: Date
  source?: 'chat' | 'slack'
  channel?: string
  metadata?: any
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: '👋 您好！我是AI Brain，您的智能工作助手。我可以帮助您：\n\n• 📝 管理任务和项目\n• 💬 与Slack频道同步消息\n• 📊 分析团队数据\n• 🔍 跨工具搜索信息\n• ⚡ 自动化工作流\n\n请告诉我您需要什么帮助？',
      role: 'assistant',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSlackSend, setShowSlackSend] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [isSlackConnected, setIsSlackConnected] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 模拟上下文ID（在实际应用中应从路由或状态获取）
  const contextId = 'demo-context-id'

  // 滚动到最新消息
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // 检查Slack连接状态
  useEffect(() => {
    checkSlackConnection()
  }, [])

  const checkSlackConnection = async () => {
    try {
      const response = await fetch('/api/slack/status')
      const data = await response.json()
      setIsSlackConnected(data.connected || false)
    } catch (error) {
      console.error('检查Slack连接状态失败:', error)
    }
  }

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // 调用AI聊天API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          contextId: contextId,
          history: messages.slice(-10) // 发送最近10条消息作为上下文
        })
      })

      if (!response.ok) {
        throw new Error('API请求失败')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || '抱歉，我现在无法回答这个问题。',
        role: 'assistant',
        timestamp: new Date(),
        metadata: data.metadata
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('发送消息失败:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: '抱歉，我遇到了一些技术问题。请稍后再试。',
        role: 'assistant',
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 复制消息内容
  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  // 分享到Slack
  const shareToSlack = (message: Message) => {
    setSelectedMessage(message)
    setShowSlackSend(true)
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧边栏 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">AI Brain</h1>
              <p className="text-sm text-gray-600">智能工作助手</p>
            </div>
          </div>
          
          {/* 快速提示词 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">快速开始</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto p-2 text-xs"
                onClick={() => setInputMessage('查看今天的会议安排')}
              >
                📅 今日安排
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto p-2 text-xs"
                onClick={() => setInputMessage('创建一个新的Jira任务')}
              >
                📝 创建任务
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto p-2 text-xs"
                onClick={() => setInputMessage('分析团队本周的工作进展')}
              >
                📊 项目状态
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-auto p-2 text-xs"
                onClick={() => setInputMessage('发送项目更新到团队频道')}
              >
                📢 通知团队
              </Button>
            </div>
          </div>
        </div>

        {/* 数据源状态 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">数据源状态</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Slack className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-700">Slack</span>
              </div>
              <div className="flex items-center gap-2">
                {isSlackConnected ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
                <Badge variant={isSlackConnected ? "outline" : "secondary"} className="text-xs">
                  {isSlackConnected ? '已连接' : '未连接'}
                </Badge>
              </div>
            </div>
            
            <SlackConnectionToggle
              contextId={contextId}
              isConnected={isSlackConnected}
              onConnectionChange={setIsSlackConnected}
              size="sm"
            />
          </div>
        </div>

        {/* 底部用户信息 */}
        <div className="flex-1"></div>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Demo User</p>
              <p className="text-xs text-gray-600">demo@aibrain.com</p>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部标题栏 */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">AI对话</h2>
              <Badge variant="outline">Demo工作空间</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                🔍 搜索
              </Button>
              <Button variant="outline" size="sm">
                🌐 中/EN
              </Button>
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-2xl ${message.role === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                  
                  {message.source === 'slack' && message.channel && (
                    <div className="mt-2 flex items-center gap-1 text-xs opacity-75">
                      <Slack className="w-3 h-3" />
                      <span>来自 #{message.channel}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatTime(message.timestamp)}
                  </span>
                  
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => copyMessage(message.content)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      
                      {isSlackConnected && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => shareToSlack(message)}
                        >
                          <Share className="w-3 h-3" />
                          <span className="ml-1">分享到Slack</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-gray-200 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI正在思考...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入消息... (Shift+Enter换行，Enter发送)"
                className="min-h-[44px] max-h-32 resize-none"
                disabled={isLoading}
              />
              
              {/* 快速开始提示 */}
              {!inputMessage && (
                <div className="flex gap-2 mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setInputMessage('帮我总结今天的重要事项')}
                  >
                    📋 今日总结
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setInputMessage('检查是否有新的Pull Request需要审查')}
                  >
                    🔍 代码审查
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => setInputMessage('生成本周工作报告')}
                  >
                    📊 周报生成
                  </Button>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="h-11 px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-xs text-gray-500 mt-2 flex justify-between">
            <span>AI Brain可能会出错，请验证重要信息</span>
            <span>{inputMessage.length}/2000</span>
          </div>
        </div>
      </div>

      {/* Slack发送消息对话框 */}
      <SlackSendMessage
        isOpen={showSlackSend}
        onClose={() => {
          setShowSlackSend(false)
          setSelectedMessage(null)
        }}
        contextId={contextId}
        defaultMessage={selectedMessage?.content || ''}
        onMessageSent={(result) => {
          console.log('消息已发送到Slack:', result)
          // 可以在这里添加成功提示或更新UI
        }}
      />
    </div>
  )
}