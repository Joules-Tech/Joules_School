import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import AuthLayout from '../../components/AuthLayout'
import Link from 'next/link'

async function signup(formData: FormData) {
  'use server'
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')
  const fullName = String(formData.get('fullName') || '')

  const supabase = await createSupabaseServerClient()

  // Create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    const params = new URLSearchParams({ error: error.message })
    redirect(`/auth/signup?${params.toString()}`)
  }

  const user = data.user

  // Create profile entry
  if (user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      full_name: fullName,
      role: 'viewer', // Default role
      school_id: null, // Will be set when they create/join a school
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Continue anyway - the user is created in auth
    }
  }

  const params = new URLSearchParams({
    info: 'Account created! Please check your email to verify your account before logging in.',
  })
  redirect(`/auth/login?${params.toString()}`)
}

export default async function SignupPage(props: any) {
  const searchParams = await props.searchParams
  const error = searchParams?.error as string | undefined

  return (
    <AuthLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600">Join Joules School Rojmel System</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 animate-fade-in">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Signup Form */}
        <form action={signup} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 characters"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm transition-all duration-200 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full btn-primary py-3.5 text-base mt-2"
          >
            Create Account
          </button>
        </form>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white/80 text-gray-500">Already have an account?</span>
          </div>
        </div>

        {/* Login Link */}
        <Link
          href="/auth/login"
          className="block w-full text-center btn-secondary py-3.5 text-base"
        >
          Sign In
        </Link>
      </div>
    </AuthLayout>
  )
}
