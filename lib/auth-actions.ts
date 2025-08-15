'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { isMockMode, mockLogin, mockSignup, mockLogout, mockOAuthLogin } from '@/lib/mock-auth'

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址 / Please enter a valid email'),
  password: z.string().min(6, '密码至少需要6位字符 / Password must be at least 6 characters'),
})

const signupSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址 / Please enter a valid email'),
  password: z.string().min(6, '密码至少需要6位字符 / Password must be at least 6 characters'),
  name: z.string().min(1, '请输入姓名 / Please enter your name'),
  confirmPassword: z.string().min(6, '请确认密码 / Please confirm password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密码不匹配 / Passwords do not match",
  path: ["confirmPassword"],
})

export async function login(prevState: { message?: string; errors?: any } | null, formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const validatedFields = loginSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '登录信息有误，请检查输入 / Invalid login information',
    }
  }

  const { email, password } = validatedFields.data

  // 使用模拟认证
  if (isMockMode()) {
    try {
      const result = await mockLogin(email, password)
      
      if (result.error) {
        return {
          message: result.error,
        }
      }

      // 成功登录，返回成功状态和用户数据，让客户端处理localStorage
      if (result.user) {
        // 设置服务端 cookie 给 middleware 使用
        const { cookies } = await import('next/headers')
        const cookieStore = await cookies()
        cookieStore.set('mock-auth-user', JSON.stringify(result.user), {
          httpOnly: false,
          secure: false, 
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: '/'
        })
        
        return {
          success: true,
          user: result.user,
        }
      }

      revalidatePath('/', 'layout')
      redirect('/')
    } catch (error) {
      return {
        message: '模拟登录失败 / Mock login failed',
      }
    }
  }

  // 使用真实 Supabase 认证
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        message: '登录失败 / Login failed: ' + error.message,
      }
    }

    revalidatePath('/', 'layout')
    redirect('/')
  } catch (error) {
    return {
      message: '登录服务暂时不可用，请使用演示账号 / Login service unavailable, please use demo account',
    }
  }
}

export async function signup(prevState: { message?: string; errors?: any } | null, formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    name: formData.get('name') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const validatedFields = signupSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: '注册信息有误，请检查输入 / Invalid signup information',
    }
  }

  const { email, password, name } = validatedFields.data

  // 使用模拟认证
  if (isMockMode()) {
    try {
      const result = await mockSignup(email, password, name)
      
      if (result.error) {
        return {
          message: result.error,
        }
      }

      // 成功注册，返回成功状态和用户数据，让客户端处理localStorage
      if (result.user) {
        return {
          success: true,
          user: result.user,
        }
      }

      revalidatePath('/', 'layout')
      redirect('/')
    } catch (error) {
      return {
        message: '模拟注册失败 / Mock signup failed',
      }
    }
  }

  // 使用真实 Supabase 认证
  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (error) {
      return {
        message: '注册失败 / Signup failed: ' + error.message,
      }
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=请检查邮箱并点击确认链接完成注册 / Please check your email to confirm')
  } catch (error) {
    return {
      message: '注册服务暂时不可用 / Signup service unavailable',
    }
  }
}

export async function signOut() {
  // 使用模拟认证
  if (isMockMode()) {
    await mockLogout()
    // 同时清除服务端 cookie
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.delete('mock-auth-user')
    
    revalidatePath('/', 'layout')
    redirect('/login?logout=true')
    return
  }

  // 使用真实 Supabase 认证
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (error) {
    console.error('Logout error:', error)
  }
  
  revalidatePath('/', 'layout')
  redirect('/login?logout=true')
}

export async function signInWithProvider(provider: 'google' | 'github') {
  // 使用模拟认证
  if (isMockMode()) {
    try {
      const result = await mockOAuthLogin(provider)
      
      if (result.error) {
        return { error: result.error }
      }

      redirect('/')
    } catch (error) {
      return { error: '模拟 OAuth 登录失败 / Mock OAuth login failed' }
    }
  }

  // 使用真实 Supabase 认证
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
      },
    })

    if (error) {
      console.error('OAuth error:', error)
      return { error: error.message }
    }

    if (data.url) {
      redirect(data.url)
    }
  } catch (error) {
    console.error('OAuth error:', error)
    return { error: '暂时无法使用社交登录 / Social login temporarily unavailable' }
  }
}