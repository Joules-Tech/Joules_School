import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'

async function signup(formData: FormData) {
  'use server'
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    const params = new URLSearchParams({ error: error.message })
    redirect(`/auth/signup?${params.toString()}`)
  }

  const user = data.user

  if (user) {
    await supabase.from('profiles').insert({
      id: user.id,
      full_name: null,
      role: 'viewer',
      school_id: null,
    })
  }

  const params = new URLSearchParams({
    info: 'Verification email sent. Please check your inbox and confirm your email before logging in.',
  })
  redirect(`/auth/login?${params.toString()}`)
}

export default function SignupPage(props: any) {
  const error = props.searchParams?.error as string | undefined

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Sign up</h1>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      <form action={signup} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create account
        </button>
      </form>
    </div>
  )
}
