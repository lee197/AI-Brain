'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useLanguage } from '@/lib/i18n/language-context'
import { User, Settings, LogOut, Loader2 } from 'lucide-react'

export function UserMenu() {
  const { user, loading, signOut, isAuthenticated } = useAuth()
  const { t } = useLanguage()

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline">{t.userMenu.notLoggedIn}</Badge>
        <Button variant="outline" size="sm" asChild>
          <a href="/login">{t.userMenu.login}</a>
        </Button>
      </div>
    )
  }

  const userInitials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user?.user_metadata?.avatar_url && user.user_metadata.avatar_url.startsWith('http') ? user.user_metadata.avatar_url : undefined} 
              alt={user?.user_metadata?.full_name || user?.email || ''} 
            />
            <AvatarFallback className="gradient-bg">
              {userInitials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            {user?.user_metadata?.full_name && (
              <p className="font-medium">{user.user_metadata.full_name}</p>
            )}
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>{t.userMenu.profile}</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>{t.userMenu.settings}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t.userMenu.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}