import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../lib/auth'

async function logout() {
  'use server'
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}

export default async function DashboardPage() {
  const { user, profile } = await getCurrentUserWithProfile()

  if (!user) {
    redirect('/auth/login')
  }

  const supabase = await createSupabaseServerClient()

  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  let todayIn = 0
  let todayOut = 0
  let cashBalance = 0
  let bankBalance = 0

  if (profile?.school_id) {
    const { data: todayEntries } = await supabase
      .from('rojmel_entries')
      .select('amount, entry_type, payment_mode')
      .eq('school_id', profile.school_id)
      .gte('entry_date', startOfDay.toISOString())

    const { data: balances } = await supabase.rpc('get_school_balances', {
      p_school_id: profile.school_id,
    })

    for (const e of todayEntries || []) {
      if (e.entry_type === 'IN') {
        todayIn += Number(e.amount)
      } else if (e.entry_type === 'OUT') {
        todayOut += Number(e.amount)
      }
    }

    cashBalance = balances?.cash_balance ?? 0
    bankBalance = balances?.bank_balance ?? 0
  }

  return (
    <div className="flex h-full flex-1">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-white/60 bg-white/70 px-6 py-6 md:flex md:flex-col">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#9C43A6] via-[#DB515E] to-[#FFA86A] text-white shadow-md">
            <span className="text-lg font-semibold">JR</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Joules Rojmel</p>
            <p className="text-xs text-gray-500">School finance</p>
          </div>
        </div>

        <nav className="space-y-1 text-sm font-medium text-gray-500">
          <a
            href="/dashboard"
            className="flex items-center justify-between rounded-xl bg-gradient-to-r from-[#FFE4ED] to-[#FFEFE4] px-3 py-2 text-[#9C43A6] shadow-sm"
          >
            <span>Dashboard</span>
            <span className="h-2 w-2 rounded-full bg-[#9C43A6]" />
          </a>
          <a href="/rojmel" className="flex items-center rounded-xl px-3 py-2 hover:bg-gray-100">
            Rojmel
          </a>
          <a href="/rojmel/add" className="flex items-center rounded-xl px-3 py-2 hover:bg-gray-100">
            Add Entry
          </a>
          <a href="/settings/users" className="flex items-center rounded-xl px-3 py-2 hover:bg-gray-100">
            Users
          </a>
        </nav>

        <div className="mt-auto space-y-2 text-xs text-gray-400">
          <p>Logged in as</p>
          <p className="truncate text-[11px] font-medium text-gray-600">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Dashboard</h1>
            <p className="mt-1 text-xs text-gray-500">Overview of today&apos;s rojmel activity and balances.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right text-xs sm:block">
              <p className="font-medium text-gray-900">{user.email}</p>
              {profile?.role && (
                <p className="text-[11px] uppercase tracking-wide text-gray-500">{profile.role}</p>
              )}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#9C43A6] via-[#DB515E] to-[#FFA86A] text-xs font-semibold text-white shadow-md">
              {user.email?.[0]?.toUpperCase()}
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-white/60 bg-white/80 px-4 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-white"
              >
                Logout
              </button>
            </form>
          </div>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl bg-white/90 p-4 shadow-sm">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-tr from-[#9C43A6] via-[#DB515E] to-[#FFA86A] opacity-20" />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Today IN</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">₹{todayIn.toFixed(2)}</p>
            <p className="mt-1 text-[11px] text-gray-500">Total amount received today</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white/90 p-4 shadow-sm">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-tr from-[#DB515E] to-[#FFA86A] opacity-20" />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Today OUT</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">₹{todayOut.toFixed(2)}</p>
            <p className="mt-1 text-[11px] text-gray-500">Total amount spent today</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white/90 p-4 shadow-sm">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-tr from-[#9C43A6] to-[#DB515E] opacity-20" />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Cash balance</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">₹{cashBalance.toFixed(2)}</p>
            <p className="mt-1 text-[11px] text-gray-500">Closing cash position</p>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-white/90 p-4 shadow-sm">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-tr from-[#FFA86A] to-[#9C43A6] opacity-20" />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Bank balance</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">₹{bankBalance.toFixed(2)}</p>
            <p className="mt-1 text-[11px] text-gray-500">Closing bank position</p>
          </div>
        </div>

        {/* Lower grid: analytics + quick actions */}
        <div className="grid flex-1 gap-4 lg:grid-cols-3">
          <section className="col-span-2 rounded-2xl bg-white/90 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between text-sm">
              <p className="font-medium text-gray-900">Analytics</p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">This week</span>
            </div>
            <div className="flex h-40 items-end justify-between gap-2 rounded-xl bg-gradient-to-br from-[#FFF3F6] to-[#FFF9F2] px-4 pb-4 pt-3 text-[10px] text-gray-400">
              {[40, 60, 35, 70, 45, 55].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="flex w-7 items-end gap-1">
                    <div className="h-8 w-1.5 rounded-full bg-[#FFA86A]/70" />
                    <div className="w-1.5 rounded-full bg-[#9C43A6]/70" style={{ height: `${h}%` }} />
                  </div>
                  <span className="text-[9px] text-gray-400">Day {i + 1}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl bg-white/90 p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-900">Recent activity</p>
              <p className="text-xs text-gray-500">Quick shortcuts</p>
            </div>
            <div className="space-y-2 text-xs">
              <a
                href="/rojmel/add"
                className="flex items-center justify-between rounded-xl bg-[#FFF3F6] px-3 py-2 text-gray-800 hover:bg-[#FFE7F0]"
              >
                <span>Add new rojmel entry</span>
                <span className="text-[11px] text-[#9C43A6]">→</span>
              </a>
              <a
                href="/rojmel"
                className="flex items-center justify-between rounded-xl bg-[#FFF9F2] px-3 py-2 text-gray-800 hover:bg-[#FFEFD9]"
              >
                <span>View all entries</span>
                <span className="text-[11px] text-[#DB515E]">→</span>
              </a>
              <a
                href="/settings/users"
                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-gray-800 hover:bg-gray-100"
              >
                <span>Manage users</span>
                <span className="text-[11px] text-gray-500">→</span>
              </a>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}