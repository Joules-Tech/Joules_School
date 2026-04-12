import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../lib/auth'
import { getLang } from '../../lib/get-lang'
import { t, currentFY } from '../../lib/translations'
import LanguageToggle from '../components/LanguageToggle'
import Sidebar from '../components/Sidebar'

async function logout() {
  'use server'
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}

export default async function DashboardPage() {
  const [{ user, profile }, lang] = await Promise.all([
    getCurrentUserWithProfile(),
    getLang(),
  ])

  if (!user) redirect('/auth/login')

  const tr = t(lang)
  const supabase = await createSupabaseServerClient()

  const fy = currentFY()

  let cashBalance = 0
  let bankBalance = 0
  let loanBalance = 0
  let hasOpeningBalances = false

  if (profile?.school_id) {
    // Fetch balances via RPC
    const { data: balances } = await supabase.rpc('get_school_balances', {
      p_school_id: profile.school_id,
    })
    cashBalance = balances?.cash_balance ?? 0
    bankBalance = balances?.bank_balance ?? 0
    loanBalance = balances?.loan_balance ?? 0

    // Check if opening balances set for current FY
    const { data: yob } = await supabase
      .from('year_opening_balances')
      .select('id')
      .eq('school_id', profile.school_id)
      .eq('financial_year', fy)
      .maybeSingle()

    hasOpeningBalances = !!yob
  }

  const showOpeningBalBanner = profile?.school_id && !hasOpeningBalances
  const isOwner = profile?.role === 'owner'

  return (
    <div className="flex h-full flex-1 min-h-screen">
      <Sidebar user={user} role={profile?.role || 'viewer'} lang={lang} active="/dashboard" />

      {/* ── Main content ── */}
      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="mb-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{tr.dashboardTitle}</h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {tr.financialYear}: <span className="font-medium text-gray-700">FY {fy}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <LanguageToggle />
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
                {tr.logout}
              </button>
            </form>
          </div>
        </div>

        {/* Opening balances banner */}
        {showOpeningBalBanner && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-4 w-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">{tr.openingBalBannerTitle}</p>
              <p className="mt-0.5 text-xs text-amber-700">
                {isOwner
                  ? tr.openingBalBannerDesc(fy)
                  : tr.openingBalReadOnly(fy)}
              </p>
            </div>
            {isOwner && (
              <Link
                href="/settings/year-balances"
                className="flex-shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
              >
                {tr.openingBalBannerBtn}
              </Link>
            )}
          </div>
        )}

        {/* Balance cards — Cash, Bank, Loan */}
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          {/* Cash */}
          <div className="relative overflow-hidden rounded-2xl bg-white/90 p-5 shadow-sm">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-tr from-[#9C43A6] to-[#DB515E] opacity-10" />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{tr.cashBalance}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">₹{cashBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="mt-1 text-[11px] text-gray-400">{tr.closingCash}</p>
          </div>

          {/* Bank */}
          <div className="relative overflow-hidden rounded-2xl bg-white/90 p-5 shadow-sm">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-tr from-[#DB515E] to-[#FFA86A] opacity-10" />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{tr.bankBalance}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">₹{bankBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="mt-1 text-[11px] text-gray-400">{tr.closingBank}</p>
          </div>

          {/* Loan */}
          <div className="relative overflow-hidden rounded-2xl bg-white/90 p-5 shadow-sm">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-tr from-[#FFA86A] to-[#9C43A6] opacity-10" />
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{tr.loanBalance}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">₹{loanBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="mt-1 text-[11px] text-gray-400">{tr.currentLoan}</p>
          </div>
        </div>

        {/* Lower grid */}
        <div className="grid flex-1 gap-4 lg:grid-cols-3">
          {/* Analytics placeholder */}
          <section className="col-span-2 rounded-2xl bg-white/90 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between text-sm">
              <p className="font-medium text-gray-900">{tr.analytics}</p>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">{tr.thisWeek}</span>
            </div>
            <div className="flex h-40 items-end justify-between gap-2 rounded-xl bg-gradient-to-br from-[#FFF3F6] to-[#FFF9F2] px-4 pb-4 pt-3 text-[10px] text-gray-400">
              {[40, 60, 35, 70, 45, 55, 80].map((h, i) => {
                const days = [
                  tr.apr, tr.may, tr.jun, tr.jul, tr.aug, tr.sep,
                ].slice(0, 7)
                return (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
                    <div className="flex w-7 items-end gap-1">
                      <div className="h-8 w-1.5 rounded-full bg-[#FFA86A]/70" />
                      <div className="w-1.5 rounded-full bg-[#9C43A6]/70" style={{ height: `${h}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400">Day {i + 1}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Quick Actions */}
          <section className="flex flex-col gap-3 rounded-2xl bg-white/90 p-4 shadow-sm">
            <div>
              <p className="text-sm font-medium text-gray-900">{tr.recentActivity}</p>
            </div>
            <div className="space-y-2 text-xs">
              <Link
                href="/rojmel/add"
                className="flex items-center justify-between rounded-xl bg-[#FFF3F6] px-3 py-2.5 text-gray-800 hover:bg-[#FFE7F0]"
              >
                <span>{tr.addNewEntry}</span>
                <span className="text-[#9C43A6]">→</span>
              </Link>
              <Link
                href="/rojmel"
                className="flex items-center justify-between rounded-xl bg-[#FFF9F2] px-3 py-2.5 text-gray-800 hover:bg-[#FFEFD9]"
              >
                <span>{tr.viewAllEntries}</span>
                <span className="text-[#DB515E]">→</span>
              </Link>
              {isOwner && (
                <Link
                  href="/settings/year-balances"
                  className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5 text-gray-800 hover:bg-amber-100"
                >
                  <span>{tr.setOpeningBal}</span>
                  <span className="text-amber-600">→</span>
                </Link>
              )}
              <Link
                href="/settings/users"
                className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-gray-800 hover:bg-gray-100"
              >
                <span>{tr.manageUsers}</span>
                <span className="text-gray-500">→</span>
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
