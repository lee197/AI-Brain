'use client'

import React, { useState, useEffect, useCallback, createContext, useContext as useReactContext } from 'react'
import { Context, CreateContextRequest, UpdateContextRequest } from '@/types/context'

interface ContextState {
  // 当前Context
  currentContext: Context | null
  
  // Context列表
  contexts: Context[]
  
  // 加载状态
  loading: boolean
  error: string | null
  
  // 操作方法
  setCurrentContext: (context: Context | null) => void
  loadContexts: () => Promise<void>
  createContext: (data: CreateContextRequest) => Promise<Context | null>
  updateContext: (id: string, data: UpdateContextRequest) => Promise<Context | null>
  deleteContext: (id: string) => Promise<boolean>
  
  // 成员管理
  addMember: (contextId: string, userId: string, role: string) => Promise<boolean>
  removeMember: (contextId: string, userId: string) => Promise<boolean>
  updateMemberRole: (contextId: string, userId: string, role: string) => Promise<boolean>
}

// Context API hook
export function useContextManager() {
  const [currentContext, setCurrentContextState] = useState<Context | null>(null)
  const [contexts, setContexts] = useState<Context[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 从localStorage恢复当前Context
  useEffect(() => {
    const savedContextId = localStorage.getItem('ai-brain-current-context')
    if (savedContextId && contexts.length > 0) {
      const savedContext = contexts.find(ctx => ctx.id === savedContextId)
      if (savedContext) {
        setCurrentContextState(savedContext)
      }
    } else if (contexts.length > 0 && !currentContext) {
      // 如果没有保存的Context，自动选择第一个
      setCurrentContextState(contexts[0])
    }
  }, [contexts])

  // 设置当前Context
  const setCurrentContext = useCallback((context: Context | null) => {
    setCurrentContextState(context)
    if (context) {
      localStorage.setItem('ai-brain-current-context', context.id)
    } else {
      localStorage.removeItem('ai-brain-current-context')
    }
  }, [])

  // 加载Context列表
  const loadContexts = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/contexts')
      if (response.ok) {
        const data = await response.json()
        setContexts(data.contexts || [])
      } else {
        throw new Error('Failed to load contexts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error loading contexts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // 创建新Context
  const createContext = useCallback(async (data: CreateContextRequest): Promise<Context | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/contexts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const result = await response.json()
        const newContext = result.context
        
        // 更新Context列表
        setContexts(prev => [...prev, newContext])
        
        // 自动切换到新创建的Context
        setCurrentContext(newContext)
        
        return newContext
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create context')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error creating context:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [setCurrentContext])

  // 更新Context
  const updateContext = useCallback(async (id: string, data: UpdateContextRequest): Promise<Context | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/contexts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (response.ok) {
        const result = await response.json()
        const updatedContext = result.context
        
        // 更新Context列表
        setContexts(prev => prev.map(ctx => 
          ctx.id === id ? updatedContext : ctx
        ))
        
        // 如果更新的是当前Context，也更新当前Context
        if (currentContext?.id === id) {
          setCurrentContext(updatedContext)
        }
        
        return updatedContext
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update context')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error updating context:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [currentContext, setCurrentContext])

  // 删除(归档)Context
  const deleteContext = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/contexts/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // 从列表中移除或标记为归档
        setContexts(prev => prev.filter(ctx => ctx.id !== id))
        
        // 如果删除的是当前Context，清除当前Context
        if (currentContext?.id === id) {
          setCurrentContext(null)
        }
        
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete context')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error deleting context:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [currentContext, setCurrentContext])

  // 添加成员
  const addMember = useCallback(async (contextId: string, userId: string, role: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/contexts/${contextId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      })
      
      if (response.ok) {
        // 重新加载Context列表以获取最新的成员信息
        await loadContexts()
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add member')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error adding member:', err)
      return false
    }
  }, [loadContexts])

  // 移除成员
  const removeMember = useCallback(async (contextId: string, userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/contexts/${contextId}/members?userId=${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await loadContexts()
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove member')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error removing member:', err)
      return false
    }
  }, [loadContexts])

  // 更新成员角色
  const updateMemberRole = useCallback(async (contextId: string, userId: string, role: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/contexts/${contextId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId, role })
      })
      
      if (response.ok) {
        await loadContexts()
        return true
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update member role')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error updating member role:', err)
      return false
    }
  }, [loadContexts])

  // 初始化时加载Context
  useEffect(() => {
    loadContexts()
  }, [loadContexts])

  return {
    currentContext,
    contexts,
    loading,
    error,
    setCurrentContext,
    loadContexts,
    createContext,
    updateContext,
    deleteContext,
    addMember,
    removeMember,
    updateMemberRole,
  }
}

// Context Provider (可选，用于全局状态管理)
const ContextStateContext = createContext<ContextState | null>(null)

export function ContextProvider({ children }: { children: React.ReactNode }) {
  const contextState = useContextManager()
  
  return React.createElement(
    ContextStateContext.Provider,
    { value: contextState },
    children
  )
}

export function useContextState() {
  const context = useReactContext(ContextStateContext)
  if (!context) {
    throw new Error('useContextState must be used within a ContextProvider')
  }
  return context
}