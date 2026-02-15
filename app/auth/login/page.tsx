import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'

async function login(formData: FormData) {
  'use server'
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')

  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const message =
      error.message === 'Email not confirmed'
        ? 'Email not confirmed. Please check your inbox and verify your email before logging in.'
        : error.message

    const params = new URLSearchParams({ error: message })
    redirect(`/auth/login?${params.toString()}`)
  }
  redirect('/dashboard')
}

export default function LoginPage(props: any) {
  const error = props.searchParams?.error as string | undefined
  const info = props.searchParams?.info as string | undefined

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Login</h1>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          {info}
        </div>
      )}
      <form action={login} className="space-y-4">
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
          Sign in
        </button>
      </form>
    </div>
  )
}
