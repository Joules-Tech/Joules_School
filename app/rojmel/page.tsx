import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../lib/auth'

export default async function RojmelPage(props: any) {
  const { user, profile } = await getCurrentUserWithProfile()

  if (!user) {
    redirect('/auth/login')
  }

  if (!profile?.school_id) {
    redirect('/auth/register-school')
  }

  const supabase = await createSupabaseServerClient()

  const from = props.searchParams?.from as string | undefined
  const to = props.searchParams?.to as string | undefined

  let query = supabase
    .from('rojmel_entries')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('entry_date', { ascending: false })

  if (from) {
    query = query.gte('entry_date', from)
  }
  if (to) {
    query = query.lte('entry_date', to)
  }

  const { data: entries } = await query

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Rojmel</h1>

      <form className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1">
          <label htmlFor="from" className="block text-sm font-medium text-gray-700">
            From date
          </label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label htmlFor="to" className="block text-sm font-medium text-gray-700">
            To date
          </label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Apply filters
        </button>
      </form>

      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Date
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Description
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                IN
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                OUT
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Mode
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {(entries || []).map((e) => {
              const date = new Date(e.entry_date)
              const inAmount = e.entry_type === 'IN' ? Number(e.amount) : 0
              const outAmount = e.entry_type === 'OUT' ? Number(e.amount) : 0
              return (
                <tr key={e.id}>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                    {date.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{e.description}</td>
                  <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-emerald-700">
                    {inAmount ? `₹${inAmount.toFixed(2)}` : ''}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right text-sm text-red-700">
                    {outAmount ? `₹${outAmount.toFixed(2)}` : ''}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-700">
                    {e.payment_mode}
                  </td>
                </tr>
              )
            })}
            {(!entries || entries.length === 0) && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
