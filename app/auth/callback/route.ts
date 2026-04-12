import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(
      new URL('/auth/login?error=Authentication+failed.+Please+try+again.', origin)
    )
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error?.message || 'Authentication failed')}`, origin)
    )
  }

  // Password reset flow — redirect to set new password
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/auth/reset-password', origin))
  }

  // OAuth / magic link flow — ensure a profile row exists
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, school_id')
    .eq('id', data.user.id)
    .single()

  if (!profile) {
    // First-time OAuth user: create profile then onboard
    const fullName =
      data.user.user_metadata?.full_name ||
      data.user.user_metadata?.name ||
      data.user.email?.split('@')[0] ||
      ''

    await supabase.from('profiles').insert({
      id: data.user.id,
      full_name: fullName,
      role: 'viewer',
      school_id: null,
    })

    return NextResponse.redirect(new URL('/auth/register-school', origin))
  }

  if (!profile.school_id) {
    return NextResponse.redirect(new URL('/auth/register-school', origin))
  }

  return NextResponse.redirect(new URL('/dashboard', origin))
}
