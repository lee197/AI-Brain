'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

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
    redirect('/contexts')
  } catch (error) {
    // 如果是重定向错误，不要捕获它
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      throw error
    }
    return {
      message: '登录失败，请检查邮箱和密码 / Login failed, please check email and password',
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

  try {
    const supabase = await createClient()
    
    // 检查用户是否已存在
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id, email, email_confirmed_at')
      .eq('email', email)
      .single()

    // 注册新用户
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
      },
    })

    console.log('Signup attempt:', { 
      email, 
      signUpData: signUpData ? 'present' : 'null',
      error: signUpError?.message 
    })

    if (signUpError) {
      // 处理常见错误，提供更友好的消息
      let errorMessage = signUpError.message
      
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already been taken')) {
        errorMessage = '该邮箱已被注册，请直接登录或使用其他邮箱 / This email is already registered, please login or use a different email'
      } else if (signUpError.message.includes('password')) {
        errorMessage = '密码不符合要求：至少6位字符 / Password requirements: at least 6 characters'
      } else if (signUpError.message.includes('email')) {
        errorMessage = '邮箱格式不正确，请检查输入 / Invalid email format'
      }
      
      return {
        message: '注册失败 / Signup failed: ' + errorMessage,
      }
    }

    // 检查是否需要邮箱验证
    if (signUpData.user && !signUpData.user.email_confirmed_at) {
      console.log('User created but needs email confirmation:', {
        userId: signUpData.user.id,
        email: signUpData.user.email,
        emailConfirmed: false
      })
    }

  } catch (error) {
    console.error('Signup error:', error)
    // 如果是重定向错误，不要捕获它
    if (error && typeof error === 'object' && 'digest' in error && 
        typeof error.digest === 'string' && error.digest.includes('NEXT_REDIRECT')) {
      throw error
    }
    return {
      message: '注册服务暂时不可用，请稍后重试 / Signup service temporarily unavailable, please try again later',
    }
  }

  // 注册成功，需要邮箱确认
  revalidatePath('/', 'layout')
  redirect('/login?message=' + encodeURIComponent('🎉 注册成功！请检查邮箱并点击确认链接完成验证 / Registration successful! Please check your email and click the confirmation link to complete verification'))
}

export async function signOut() {
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