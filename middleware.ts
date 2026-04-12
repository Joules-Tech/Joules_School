import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Redirect authenticated users away from these pages
const authPaths = ['/auth/login', '/auth/signup']

// Always accessible without authentication (no redirects either way)
const publicPaths = [
  '/',
  '/about',
  '/contact',
  '/careers',
  '/privacy',
  '/terms',
  '/security',
  '/support',
]

// Auth utility pages: accessible without a session but NOT redirected for authenticated users
// (e.g. /auth/callback must run even after session is established inside the handler)
const authUtilityPaths = [
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/register-school',
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = req.nextUrl
  const isAuthPath = authPaths.some((p) => url.pathname.startsWith(p))
  const isPublicPath = publicPaths.some((p) => url.pathname === p)
  const isAuthUtilityPath = authUtilityPaths.some((p) => url.pathname.startsWith(p))

  // Unauthenticated users can only access public, auth, or utility pages
  if (!user && !isAuthPath && !isPublicPath && !isAuthUtilityPath) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Authenticated users are bounced away from login/signup
  if (user && isAuthPath) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
