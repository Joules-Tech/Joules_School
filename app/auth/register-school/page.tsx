import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../../lib/auth'

async function registerSchool(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()

  const school_name = String(formData.get('school_name') || '')
  const address = String(formData.get('address') || '')
  const phone = String(formData.get('phone') || '')
  const email = String(formData.get('email') || '')
  const opening_cash = Number(formData.get('opening_cash') || 0)
  const opening_bank = Number(formData.get('opening_bank') || 0)

  const { error } = await supabase.from('schools').insert({
    school_name,
    address,
    phone,
    email,
    opening_cash,
    opening_bank,
  })

  if (error) {
    const params = new URLSearchParams({ error: error.message })
    redirect(`/auth/register-school?${params.toString()}`)
  }

  redirect('/dashboard')
}

export default async function RegisterSchoolPage(props: any) {
  const { user, profile } = await getCurrentUserWithProfile()

  if (!user) {
    redirect('/auth/login')
  }

  if (profile?.school_id) {
    redirect('/dashboard')
  }

  const error = props.searchParams?.error as string | undefined

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Register School</h1>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      <form action={registerSchool} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="school_name" className="block text-sm font-medium text-gray-700">
            School name
          </label>
          <input
            id="school_name"
            name="school_name"
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="opening_cash" className="block text-sm font-medium text-gray-700">
              Opening cash
            </label>
            <input
              id="opening_cash"
              name="opening_cash"
              type="number"
              step="0.01"
              defaultValue={0}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="opening_bank" className="block text-sm font-medium text-gray-700">
              Opening bank
            </label>
            <input
              id="opening_bank"
              name="opening_bank"
              type="number"
              step="0.01"
              defaultValue={0}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create school
        </button>
      </form>
    </div>
  )
}
