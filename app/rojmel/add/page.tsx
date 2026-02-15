import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../../lib/auth'

async function addRojmelEntry(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) {
    redirect('/auth/register-school')
  }

  if (!['owner', 'accountant'].includes(profile.role)) {
    redirect('/rojmel?error=Not%20authorized')
  }

  const entry_date = String(formData.get('entry_date') || '')
  const description = String(formData.get('description') || '')
  const amount = Number(formData.get('amount') || 0)
  const entry_type = String(formData.get('entry_type') || 'IN') as 'IN' | 'OUT'
  const payment_mode = String(formData.get('payment_mode') || 'CASH') as
    | 'CASH'
    | 'BANK'
    | 'UPI'

  const { error } = await supabase.from('rojmel_entries').insert({
    school_id: profile.school_id,
    entry_date,
    description,
    amount,
    entry_type,
    payment_mode,
  })

  if (error) {
    const params = new URLSearchParams({ error: error.message })
    redirect(`/rojmel/add?${params.toString()}`)
  }

  redirect('/rojmel')
}

export default async function AddRojmelPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const resolvedParams = await searchParams
  const { user, profile } = await getCurrentUserWithProfile()

  if (!user) {
    redirect('/auth/login')
  }

  if (!profile?.school_id) {
    redirect('/auth/register-school')
  }

  if (!['owner', 'accountant'].includes(profile.role)) {
    redirect('/rojmel')
  }

  const today = new Date().toISOString().slice(0, 10)
  const error = resolvedParams?.error

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Add rojmel entry</h1>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}
      <form action={addRojmelEntry} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="entry_date" className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            id="entry_date"
            name="entry_date"
            type="date"
            defaultValue={today}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="entry_type" className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              id="entry_type"
              name="entry_type"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </div>
          <div className="space-y-1">
            <label
              htmlFor="payment_mode"
              className="block text-sm font-medium text-gray-700"
            >
              Payment mode
            </label>
            <select
              id="payment_mode"
              name="payment_mode"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="CASH">CASH</option>
              <option value="BANK">BANK</option>
              <option value="UPI">UPI</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save entry
        </button>
      </form>
    </div>
  )
}
