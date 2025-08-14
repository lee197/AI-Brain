'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { isMockMode, DEMO_USERS, MockUser } from '@/lib/mock-auth'
import { signOut as authSignOut } from '@/lib/auth-actions'

// Extended User type to support mock users
type ExtendedUser = User | (MockUser & { 
  user_metadata?: { 
    full_name?: string; 
    avatar_url?: string 
  } 
})

export function useAuth() {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isMockMode()) {
          // Mock authentication mode - check localStorage for client-side session
          const getMockUserFromStorage = (): MockUser | null => {
            if (typeof window === 'undefined') return null
            try {
              const stored = localStorage.getItem('mock-auth-user')
              return stored ? JSON.parse(stored) : null
            } catch {
              return null
            }
          }

          const mockUser = getMockUserFromStorage()
          if (mockUser) {
            // Convert MockUser to extended User format
            const extendedUser: ExtendedUser = {
              ...mockUser,
              user_metadata: {
                full_name: mockUser.name,
                avatar_url: mockUser.avatar
              }
            }
            setUser(extendedUser)
          } else {
            setUser(null)
          }
        } else {
          // Real Supabase authentication
          const { data: { session } } = await supabase.auth.getSession()
          setUser(session?.user ?? null)
          
          // Listen for auth changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              setUser(session?.user ?? null)
              setLoading(false)

              if (event === 'SIGNED_IN') {
                console.log('User signed in:', session?.user?.email)
              } else if (event === 'SIGNED_OUT') {
                console.log('User signed out')
              }
            }
          )

          return () => {
            subscription.unsubscribe()
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for storage changes in mock mode (for cross-tab sync)
    if (isMockMode()) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'mock-auth-user') {
          if (e.newValue) {
            try {
              const mockUser: MockUser = JSON.parse(e.newValue)
              const extendedUser: ExtendedUser = {
                ...mockUser,
                user_metadata: {
                  full_name: mockUser.name,
                  avatar_url: mockUser.avatar
                }
              }
              setUser(extendedUser)
            } catch {
              setUser(null)
            }
          } else {
            setUser(null)
          }
        }
      }

      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [supabase.auth])

  const signOut = async () => {
    try {
      setLoading(true)
      if (isMockMode()) {
        await authSignOut()
        setUser(null)
      } else {
        await supabase.auth.signOut()
      }
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}