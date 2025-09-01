'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/i18n/language-context'
import { Send, Clock, Plus, BarChart3, MessageSquare, Github, Copy, Share } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: Date
}

interface EnhancedChatProps {
  contextId: string
  user: any
  slackConnected: boolean
  onShareToSlack: (message: any) => void
}

export function EnhancedChat({ contextId, user, slackConnected, onShareToSlack }: EnhancedChatProps) {
  const { t, language } = useLanguage()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 自定义状态管理替换 useChat Hook
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 ${t.chat.messages.aiGreeting.replace('{contextName}', contextId)}\n\n${t.chat.messages.aiGreetingDesc}`,
      createdAt: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 自定义消息发送功能
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      createdAt: new Date()
    }
    
    // 添加用户消息
    setMessages(prev => [...prev, userMessage])
    const currentInput = input.trim()
    setInput('')
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          contextId,
          model: 'gemini-flash',
        }),
      })
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }
      
      const responseText = await response.text()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        createdAt: new Date()
      }
      
      // 添加AI响应
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (err) {
      console.error('Chat error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(new Error(errorMessage))
      
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant', 
        content: `❌ 抱歉，发生了错误：${errorMessage}`,
        createdAt: new Date()
      }
      
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }
  
  // 输入变化处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  // Quick prompt suggestions
  const quickPrompts = [
    { title: t.chat.quickPrompts.todaySchedule, prompt: t.chat.quickPrompts.todaySchedulePrompt, icon: Clock },
    { title: t.chat.quickPrompts.createTask, prompt: t.chat.quickPrompts.createTaskPrompt, icon: Plus },
    { title: t.chat.quickPrompts.projectStatus, prompt: t.chat.quickPrompts.projectStatusPrompt, icon: BarChart3 },
    { title: t.chat.quickPrompts.teamCollaboration, prompt: t.chat.quickPrompts.teamCollaborationPrompt, icon: MessageSquare },
    { title: t.chat.quickPrompts.codeReview, prompt: t.chat.quickPrompts.codeReviewPrompt, icon: Github },
    { title: t.chat.quickPrompts.dataAnalysis, prompt: t.chat.quickPrompts.dataAnalysisPrompt, icon: BarChart3 },
  ]

  // 填充快速提示词
  const handleQuickPrompt = (prompt: string) => {
    // 使用 handleInputChange 设置输入值
    const event = { target: { value: prompt } } as React.ChangeEvent<HTMLInputElement>
    handleInputChange(event)
  }

  // 复制消息
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 分享到Slack
  const shareToSlack = (message: any) => {
    onShareToSlack(message)
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(language, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  // 处理键盘事件 - 移除自定义处理，让 Vercel AI SDK 处理
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 只在 Shift+Enter 时允许换行，Enter 键让表单自然提交
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // 不做任何其他处理，让表单的 onSubmit 处理提交
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* 使用 Vercel AI SDK 的聊天界面 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`group flex gap-4 mb-6 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
              )}
              
              <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`rounded-2xl p-4 max-w-3xl ${
                  message.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-md ml-auto'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-md'
                }`}>
                  <div className="whitespace-pre-wrap prose prose-sm max-w-none dark:prose-invert">
                    {(message.content || '').split('\n').map((line, index) => {
                      // 处理Markdown格式
                      if (line.startsWith('```')) {
                        return <div key={index} className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono mt-2">{line.replace(/```/g, '')}</div>
                      }
                      if (line.includes('**') && line.includes('邮件')) {
                        // 处理格式化的邮件上下文头部
                        return (
                          <div key={index} className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-200 dark:border-blue-800">
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              {line.replace(/📧|\*\*/g, '').trim()}
                            </span>
                          </div>
                        )
                      }
                      if (line.includes('**') && line.includes('Slack')) {
                        // 处理格式化的Slack上下文头部
                        return (
                          <div key={index} className="flex items-center gap-2 mb-2 pb-2 border-b border-purple-200 dark:border-purple-800">
                            <Share className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                              {line.replace(/💬|\*\*/g, '').trim()}
                            </span>
                          </div>
                        )
                      }
                      return line ? <p key={index} className="mb-1">{line}</p> : <br key={index} />
                    })}
                  </div>
                </div>
                
                <div className={`flex items-center justify-between mt-2 ${
                  message.role === 'user' ? 'mr-4 flex-row-reverse' : 'ml-4'
                }`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(message.createdAt || new Date())}
                  </p>
                  
                  {/* 消息操作按钮 */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={() => copyMessage(message.content || '')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      
                      {slackConnected && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs hover:bg-purple-100 dark:hover:bg-purple-900/20"
                          onClick={() => shareToSlack(message)}
                        >
                          <Share className="w-3 h-3" />
                          <span className="ml-1">{t.chat.messages.shareToSlack}</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-600 dark:text-gray-300 font-medium text-sm">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* 正在输入指示器 */}
          {isLoading && (
            <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div className="flex-1">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-tl-md p-4 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">{t.chat.messages.aiThinking}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="flex gap-4 mb-6">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-bold text-sm">!</span>
              </div>
              <div className="flex-1">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl rounded-tl-md p-4 max-w-3xl">
                  <p className="text-red-800 dark:text-red-200 mb-2">
                    ❌ 发送消息时出现错误
                  </p>
                  <p className="text-red-600 dark:text-red-400 text-sm mb-3">
                    {error.message || '请稍后重试或检查网络连接。'}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => reload()}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    重试
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部输入区域 */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder={t.chat.input.placeholder}
                  className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Quick Prompts 快速提示词 */}
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((prompt, index) => {
                  const Icon = prompt.icon
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleQuickPrompt(prompt.prompt)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs rounded-md transition-colors"
                      title={prompt.prompt}
                      disabled={isLoading}
                    >
                      <Icon className="w-3 h-3" />
                      <span className="font-medium">{prompt.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 加载时的停止按钮 */}
            {isLoading && (
              <div className="mt-2 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLoading(false)}
                  className="text-xs"
                >
                  停止生成
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}