'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  Search, 
  Clock,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { generateSalesforceData } from '@/lib/data-sources/mock-data-generator'

export default function SalesforceMessagesPage({ params }: { params: { id: string } }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTab, setSelectedTab] = useState('leads')
  
  const salesforceData = useMemo(() => generateSalesforceData(), [])

  const filteredLeads = useMemo(() => {
    return salesforceData.leads.filter(lead =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [salesforceData.leads, searchTerm])

  const filteredOpportunities = useMemo(() => {
    return salesforceData.opportunities.filter(opp =>
      opp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.owner.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [salesforceData.opportunities, searchTerm])

  const filteredAccounts = useMemo(() => {
    return salesforceData.accounts.filter(account =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.owner.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [salesforceData.accounts, searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'qualified': return 'bg-green-100 text-green-800'
      case 'working': return 'bg-yellow-100 text-yellow-800'
      case 'converted': return 'bg-purple-100 text-purple-800'
      case 'closed_won': return 'bg-green-100 text-green-800'
      case 'closed_lost': return 'bg-red-100 text-red-800'
      case 'negotiation': return 'bg-orange-100 text-orange-800'
      case 'proposal': return 'bg-blue-100 text-blue-800'
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'new': '新建',
      'qualified': '已验证',
      'working': '跟进中',
      'converted': '已转化',
      'closed_won': '成交',
      'closed_lost': '失败',
      'negotiation': '谈判中',
      'proposal': '提案阶段'
    }
    return statusMap[status] || status
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Salesforce</h1>
            <p className="text-gray-600">销售管理系统</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {salesforceData.leads.length + salesforceData.opportunities.length + salesforceData.accounts.length} 记录
        </Badge>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="搜索潜在客户、商机或客户..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leads" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>潜在客户 ({salesforceData.leads.length})</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>商机 ({salesforceData.opportunities.length})</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>客户 ({salesforceData.accounts.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="space-y-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${lead.name}`} />
                      <AvatarFallback>{lead.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{lead.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{lead.company}</span>
                        <Badge className={getStatusColor(lead.status)}>
                          {getStatusText(lead.status)}
                        </Badge>
                        {lead.priority && (
                          <AlertCircle className={`w-4 h-4 ${getPriorityColor(lead.priority)}`} />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(lead.createdDate)}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{lead.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{lead.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{lead.location}</span>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <Users className="w-4 h-4 mr-1" />
                      查看详情
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-4">
          {filteredOpportunities.map((opp) => (
            <Card key={opp.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{opp.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span>{opp.account}</span>
                        <Badge className={getStatusColor(opp.stage)}>
                          {getStatusText(opp.stage)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(opp.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      概率: {opp.probability}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>负责人: {opp.owner}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>预计成交: {formatDate(opp.closeDate)}</span>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      查看商机
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          {filteredAccounts.map((account) => (
            <Card key={account.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Badge variant="outline">{account.industry}</Badge>
                        <Badge variant="outline">{account.type}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatCurrency(account.annualRevenue)}
                    </div>
                    <div className="text-sm text-gray-500">
                      年收入
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>负责人: {account.owner}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{account.location}</span>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <Building2 className="w-4 h-4 mr-1" />
                      查看客户
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