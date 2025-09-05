import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 处理Supabase邮箱验证回调
 * 用户点击邮箱中的验证链接后会到达这里
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/contexts'

  console.log('Email verification callback:', { 
    code: code ? 'present' : 'missing', 
    error, 
    errorDescription 
  })

  // 如果URL中包含错误信息，直接处理
  if (error) {
    console.error('Auth callback error:', { error, errorDescription })
    return NextResponse.redirect(
      `${origin}/login?error=${error}&message=${encodeURIComponent(
        errorDescription || '邮箱验证出现问题 / Email verification error'
      )}`
    )
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!exchangeError && data.user) {
        console.log('Email verification successful:', {
          userId: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at
        })
        
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'
        
        const successUrl = `${next}?verified=true&message=${encodeURIComponent(
          '邮箱验证成功！欢迎使用AI Brain / Email verified successfully! Welcome to AI Brain'
        )}`
        
        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${successUrl}`)
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${successUrl}`)
        } else {
          return NextResponse.redirect(`${origin}${successUrl}`)
        }
      } else {
        console.error('Code exchange failed:', exchangeError)
        return NextResponse.redirect(
          `${origin}/login?error=exchange_failed&message=${encodeURIComponent(
            exchangeError?.message || '验证码交换失败 / Code exchange failed'
          )}`
        )
      }
    } catch (error) {
      console.error('Callback processing error:', error)
      return NextResponse.redirect(
        `${origin}/login?error=callback_error&message=${encodeURIComponent(
          '验证处理出错，请重试 / Verification processing error'
        )}`
      )
    }
  }

  // 没有code参数和错误参数，可能是无效的回调
  console.error('Invalid callback - no code or error parameter')
  return NextResponse.redirect(
    `${origin}/login?error=invalid_callback&message=${encodeURIComponent(
      '无效的验证链接，请重新注册 / Invalid verification link'
    )}`
  )
}