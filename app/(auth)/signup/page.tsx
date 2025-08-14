'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { signup, signInWithProvider } from '@/lib/auth-actions'
import { Github } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/language-context'
import { LanguageSwitcher } from '@/components/language-switcher'

const initialState = {
  message: '',
  errors: {},
}

export default function SignupPage() {
  const [state, formAction] = useActionState(signup, initialState)
  const { t } = useLanguage()

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    await signInWithProvider(provider)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <Card className="w-full max-w-md ai-shadow">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
          <CardTitle className="text-2xl gradient-text">AI Brain</CardTitle>
          <p className="text-muted-foreground">
            {t.auth.signupTitle}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {state?.message && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {state.message}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Input 
                id="name"
                name="name"
                type="text" 
                placeholder={t.auth.name}
                className="w-full"
                required
              />
              {state?.errors?.name && (
                <p className="text-sm text-red-600">{state.errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Input 
                id="email"
                name="email"
                type="email" 
                placeholder={t.auth.email}
                className="w-full"
                required
              />
              {state?.errors?.email && (
                <p className="text-sm text-red-600">{state.errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Input 
                id="password"
                name="password"
                type="password" 
                placeholder={t.auth.password}
                className="w-full"
                required
              />
              {state?.errors?.password && (
                <p className="text-sm text-red-600">{state.errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Input 
                id="confirmPassword"
                name="confirmPassword"
                type="password" 
                placeholder={t.auth.confirmPassword}
                className="w-full"
                required
              />
              {state?.errors?.confirmPassword && (
                <p className="text-sm text-red-600">{state.errors.confirmPassword}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              {t.auth.createAccount}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t.common.or}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleOAuthLogin('google')}
              type="button"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t.auth.signupWithGoogle}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleOAuthLogin('github')}
              type="button"
            >
              <Github className="w-4 h-4 mr-2" />
              {t.auth.signupWithGithub}
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {t.auth.hasAccount}{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t.auth.loginNow}
            </Link>
          </div>

          <div className="flex justify-center">
            <Badge variant="outline">
              <Link href="/ui-demo" className="text-xs hover:text-primary">
                {t.dashboard.actions.viewComponents}
              </Link>
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}