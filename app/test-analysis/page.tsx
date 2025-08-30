'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TestAnalysisPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testScenarios = [
    {
      name: "基础情感分析",
      message: "团队最近情绪怎么样？",
      type: "sentiment"
    },
    {
      name: "任务提取分析", 
      message: "有什么紧急任务需要处理？",
      type: "tasks"
    },
    {
      name: "综合深度分析",
      message: "分析一下最近团队的工作情况",
      type: "comprehensive"
    },
    {
      name: "团队协作洞察",
      message: "团队协作效率如何？",
      type: "comprehensive"
    }
  ]

  const runTest = async (scenario: any) => {
    setLoading(true)
    setResults(null)
    
    try {
      console.log('🧪 Running test:', scenario.name)
      
      // 测试 Master Agent
      const response = await fetch('/api/agents/master/deep-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextId: 'e7c5aa1e-de00-4327-81dd-cfeba3030081',
          userMessage: scenario.message,
          options: {
            enableDeepAnalysis: true,
            priority: 'NORMAL'
          }
        })
      })
      
      const result = await response.json()
      setResults({ scenario, result })
      
    } catch (error) {
      console.error('Test failed:', error)
      setResults({ scenario, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">🧠 深度分析系统测试</h1>
        <p className="text-muted-foreground">
          测试 Master Agent + Slack SubAgent 深度分析功能
        </p>
      </div>

      {/* 测试场景按钮 */}
      <div className="grid grid-cols-2 gap-4">
        {testScenarios.map((scenario, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{scenario.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">"{scenario.message}"</p>
              <div className="flex justify-between items-center">
                <Badge variant="outline">{scenario.type}</Badge>
                <Button 
                  size="sm" 
                  onClick={() => runTest(scenario)}
                  disabled={loading}
                >
                  {loading ? '分析中...' : '开始测试'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 测试结果显示 */}
      {results && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔬 测试结果: {results.scenario?.name}
              {results.result?.success ? (
                <Badge className="bg-green-500">成功</Badge>
              ) : (
                <Badge variant="destructive">失败</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.error ? (
              <div className="text-red-500">❌ {results.error}</div>
            ) : (
              <div className="space-y-4">
                {/* 基础信息 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>处理时间:</strong> {results.result?.result?.metadata?.processingTime || 0}ms
                  </div>
                  <div>
                    <strong>任务类型:</strong> {results.result?.result?.data?.taskType}
                  </div>
                </div>

                {/* 摘要 */}
                <div>
                  <strong>分析摘要:</strong>
                  <p className="mt-1 p-3 bg-gray-50 rounded text-sm">
                    {results.result?.result?.summary}
                  </p>
                </div>

                {/* 深度分析洞察 */}
                {results.result?.result?.data?.deepAnalysis && (
                  <div>
                    <strong>🧠 深度洞察:</strong>
                    <ul className="mt-2 space-y-1">
                      {results.result.result.data.deepAnalysis.insights.map((insight: string, i: number) => (
                        <li key={i} className="text-sm bg-blue-50 p-2 rounded">• {insight}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 关键指标 */}
                {results.result?.result?.data?.deepAnalysis?.keyMetrics && (
                  <div>
                    <strong>📊 关键指标:</strong>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {Object.entries(results.result.result.data.deepAnalysis.keyMetrics).map(([key, value]) => (
                        <div key={key} className="text-center p-2 bg-gray-100 rounded">
                          <div className="text-xs text-muted-foreground">{key}</div>
                          <div className="font-semibold">{String(value)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 建议 */}
                {results.result?.result?.recommendations && results.result.result.recommendations.length > 0 && (
                  <div>
                    <strong>💡 智能建议:</strong>
                    <ul className="mt-2 space-y-1">
                      {results.result.result.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-sm bg-yellow-50 p-2 rounded">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 原始数据 (折叠) */}
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold">🔍 详细数据 (点击展开)</summary>
                  <pre className="mt-2 p-3 bg-gray-900 text-green-400 text-xs overflow-auto rounded max-h-96">
                    {JSON.stringify(results.result, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 使用说明 */}
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">💡 如何测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. 点击测试按钮</strong> - 选择不同的分析场景</p>
          <p><strong>2. 查看结果</strong> - 观察深度分析的洞察和建议</p>
          <p><strong>3. 对比不同类型</strong> - 情感分析 vs 任务分析 vs 综合分析</p>
          <p><strong>4. 验证性能</strong> - 查看处理时间和准确度</p>
          <div className="mt-3 p-2 bg-white rounded border-l-4 border-blue-500">
            <p className="font-semibold">💡 提示</p>
            <p>当前使用现有的Slack消息数据进行分析，你可以先发送一些测试消息到Slack增加样本数据。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}