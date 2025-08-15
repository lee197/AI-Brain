'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/lib/i18n/language-context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { UserMenu } from '@/components/user-menu'
import { useAuth } from '@/hooks/use-auth'
import { 
  MessageSquare, 
  Zap, 
  Brain, 
  Globe, 
  Shield, 
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Users,
  BarChart3
} from 'lucide-react'

export default function LandingPage() {
  const { t } = useLanguage()
  const { user } = useAuth()

  const features = [
    {
      icon: Globe,
      title: t.dashboard.features.multiTool.title,
      description: t.dashboard.features.multiTool.desc,
      badge: null,
      color: "bg-blue-500",
      action: t.dashboard.landing.featureActions.connectTools
    },
    {
      icon: MessageSquare,
      title: t.dashboard.features.naturalLanguage.title,
      description: t.dashboard.features.naturalLanguage.desc,
      badge: t.dashboard.features.naturalLanguage.badge,
      color: "bg-purple-500",
      action: t.dashboard.landing.featureActions.startChat
    },
    {
      icon: Zap,
      title: t.dashboard.features.automation.title,
      description: t.dashboard.features.automation.desc,
      badge: t.dashboard.features.automation.badge,
      color: "bg-green-500",
      action: t.dashboard.landing.featureActions.createWorkflow
    },
    {
      icon: Brain,
      title: t.dashboard.features.contextAware.title,
      description: t.dashboard.features.contextAware.desc,
      badge: t.dashboard.features.contextAware.badge,
      color: "bg-orange-500",
      action: t.dashboard.landing.featureActions.viewInsights
    },
    {
      icon: Clock,
      title: t.dashboard.features.realTimeSync.title,
      description: t.dashboard.features.realTimeSync.desc,
      badge: t.dashboard.features.realTimeSync.badge,
      color: "bg-cyan-500",
      action: t.dashboard.landing.featureActions.realTimeData
    },
    {
      icon: Shield,
      title: t.dashboard.features.security.title,
      description: t.dashboard.features.security.desc,
      badge: t.dashboard.features.security.badge,
      color: "bg-red-500",
      action: t.dashboard.landing.featureActions.securitySettings
    }
  ]

  const quickActions = [
    { icon: MessageSquare, label: t.dashboard.landing.quickActions.aiChat, href: "/chat" },
    { icon: Globe, label: t.dashboard.landing.quickActions.integrations, href: "/integrations" },
    { icon: BarChart3, label: t.dashboard.landing.quickActions.insights, href: "/insights" },
    { icon: Users, label: t.dashboard.landing.quickActions.tasks, href: "/tasks" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">AI Brain</h1>
                <Badge variant="outline" className="text-xs">
                  {t.dashboard.badge}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              {user ? (
                <div className="flex items-center gap-2">
                  <Link href="/dashboard">
                    <Button variant="outline">
                      {t.dashboard.landing.enterDashboard}
                    </Button>
                  </Link>
                  <UserMenu />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="outline">
                      {t.auth.login}
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button>
                      {t.auth.signup}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>{t.dashboard.dashboardBadge}</span>
          </div>
          <h2 className="text-4xl font-bold gradient-text mb-4">
            {t.dashboard.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-lg transition-all duration-300 cursor-pointer group border-2 border-transparent hover:border-primary/20">
              <CardContent className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 ai-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center text-white shadow-lg`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  {feature.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {feature.description}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                >
                  <span>{feature.action}</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="text-center p-8">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold mb-4">
                {t.dashboard.landing.cta.title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t.dashboard.landing.cta.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="group">
                  <Plus className="w-5 h-5 mr-2" />
                  <span>{t.dashboard.landing.cta.connectFirstTool}</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button size="lg" variant="outline">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  <span>{t.dashboard.landing.cta.startAIChat}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="/ui-demo" className="hover:text-primary transition-colors">
              {t.dashboard.landing.footer.viewUIComponents}
            </a>
            <a href="/settings" className="hover:text-primary transition-colors">
              {t.dashboard.landing.footer.settings}
            </a>
            <a href="/help" className="hover:text-primary transition-colors">
              {t.dashboard.landing.footer.help}
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}