import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../lib/auth'
import { getLang } from '../../lib/get-lang'
import { t, currentFY, fyStartDate } from '../../lib/translations'
import LanguageToggle from '../components/LanguageToggle'
import Sidebar from '../components/Sidebar'
import BalanceModeToggle from '../components/BalanceModeToggle'
import DetailTablePreview from '../components/DetailTablePreview'

export default async function RojmelPage(props: any) {
  const [{ user, profile }, lang] = await Promise.all([
    getCurrentUserWithProfile(),
    getLang(),
  ])

  if (!user) redirect('/auth/login')
  if (!profile?.school_id) redirect('/auth/register-school')

  const tr = t(lang)
  const supabase = await createSupabaseServerClient()
  const fy      = currentFY()
  const fyStart = fyStartDate()

  const searchParams = await props.searchParams
  const from = (searchParams?.from as string) || fyStart
  const to   = (searchParams?.to   as string) || ''
  const rawMode = searchParams?.mode as string
  const mode: 'total' | 'cash' | 'bank' =
    rawMode === 'cash' ? 'cash' : rawMode === 'bank' ? 'bank' : 'total'

  // ── Opening balance for the FY ──────────────────────────────
  const { data: openingBal } = await supabase
    .from('year_opening_balances')
    .select('opening_cash, opening_bank')
    .eq('school_id', profile.school_id)
    .eq('financial_year', fy)
    .single()

  const fyOpenForMode =
    mode === 'cash'  ? Number(openingBal?.opening_cash || 0) :
    mode === 'bank'  ? Number(openingBal?.opening_bank || 0) :
    Number(openingBal?.opening_cash || 0) + Number(openingBal?.opening_bank || 0)

  // ── Balance carried forward to the start of the selected period
  let openingForPeriod = fyOpenForMode
  if (from && from > fyStart) {
    const dayBefore = new Date(from)
    dayBefore.setDate(dayBefore.getDate() - 1)
    const dayBeforeStr = dayBefore.toISOString().split('T')[0]

    let priorQuery = supabase
      .from('rojmel_entries')
      .select('entry_type, amount')
      .eq('school_id', profile.school_id)
      .gte('entry_date', fyStart)
      .lte('entry_date', dayBeforeStr)

    if (mode === 'cash') priorQuery = priorQuery.eq('payment_mode', 'CASH')
    if (mode === 'bank') priorQuery = priorQuery.in('payment_mode', ['BANK', 'UPI'])

    const { data: priorEntries } = await priorQuery

    const priorIn  = (priorEntries || []).filter(e => e.entry_type === 'IN' ).reduce((s, e) => s + Number(e.amount), 0)
    const priorOut = (priorEntries || []).filter(e => e.entry_type === 'OUT').reduce((s, e) => s + Number(e.amount), 0)
    openingForPeriod = fyOpenForMode + priorIn - priorOut
  }

  // ── Entries in selected period ──────────────────────────────
  let query = supabase
    .from('rojmel_entries')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (from) query = query.gte('entry_date', from)
  if (to)   query = query.lte('entry_date', to)
  if (mode === 'cash') query = query.eq('payment_mode', 'CASH')
  if (mode === 'bank') query = query.in('payment_mode', ['BANK', 'UPI'])

  const { data: entries } = await query

  const jama  = (entries || []).filter(e => e.entry_type === 'IN')
  const udhar = (entries || []).filter(e => e.entry_type === 'OUT')

  const jamaTotal    = jama.reduce((s, e)  => s + Number(e.amount), 0)
  const udharTotal   = udhar.reduce((s, e) => s + Number(e.amount), 0)
  const grandJama    = openingForPeriod + jamaTotal   // shown as "કુલ જમા સરવાળો"
  const closingBal   = grandJama - udharTotal         // shown as "ચાલુ શિલક" in Udhar section

  const isOwnerOrAccountant = ['owner', 'accountant'].includes(profile.role)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 })

  return (
    <div className="flex h-full flex-1 min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/rojmel" />

      {/* Main */}
      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{tr.rojmelTitle}</h1>
            <p className="mt-0.5 text-xs text-gray-500">FY {fy}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <BalanceModeToggle current={mode} lang={lang} />
            <LanguageToggle />
            <Link
              href={(() => {
                const p = new URLSearchParams()
                if (from) p.set('from', from)
                if (to)   p.set('to', to)
                if (mode !== 'total') p.set('mode', mode)
                const qs = p.toString()
                return `/rojmel/print${qs ? `?${qs}` : ''}`
              })()}
              target="_blank"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {lang === 'gu' ? 'PDF ડાઉનલોડ' : 'Download PDF'}
            </Link>
            {isOwnerOrAccountant && (
              <Link
                href="/rojmel/add"
                className="rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
              >
                + {tr.addEntry}
              </Link>
            )}
          </div>
        </div>

        {/* Date filter */}
        <form method="GET" className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl bg-white/90 p-4 shadow-sm">
          <div className="flex-1 min-w-[130px] space-y-1">
            <label className="block text-xs font-medium text-gray-600">{tr.filterFrom}</label>
            <input
              name="from" type="date" defaultValue={from}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
            />
          </div>
          <div className="flex-1 min-w-[130px] space-y-1">
            <label className="block text-xs font-medium text-gray-600">{tr.filterTo}</label>
            <input
              name="to" type="date" defaultValue={to}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
            />
          </div>
          <button type="submit" className="rounded-xl bg-[#9C43A6] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a3593]">
            {tr.applyFilters}
          </button>
          <Link href="/rojmel" className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            {tr.clearFilters}
          </Link>
        </form>

        {/* ── Two-column Rojmel book ── */}
        <div className="flex flex-col lg:flex-row gap-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* ── JAMA (Credit / Left) ── */}
          <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200">

            {/* Section header */}
            <div className="flex items-center justify-between bg-emerald-50 px-4 py-3 border-b border-emerald-100">
              <div>
                <span className="text-base font-bold text-emerald-800">{tr.jama}</span>
                <span className="ml-2 text-xs text-emerald-600">
                  ({lang === 'gu' ? 'ક્રેડિટ / આવક' : 'Credit / Income'})
                </span>
              </div>
              <span className="rounded-full bg-white border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                ₹{fmt(jamaTotal)}
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[70px_1fr_64px_72px_36px_24px] gap-0 border-b border-gray-100 bg-emerald-50/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700/70">
              <span className="whitespace-nowrap">{tr.date}</span>
              <span className="whitespace-nowrap">{tr.description}</span>
              <span className="text-right whitespace-nowrap">{tr.amountCol}</span>
              <span className="text-center whitespace-nowrap">{tr.pageNo}</span>
              <span className="text-center whitespace-nowrap">{tr.accountNo}</span>
              <span />
            </div>

            {/* ── Opening balance row ── */}
            <div className="grid grid-cols-[70px_1fr_64px_72px_36px_24px] gap-0 px-3 py-2.5 bg-violet-50 border-b border-violet-100">
              <span className="text-xs text-violet-400 font-mono">—</span>
              <div>
                <p className="text-xs font-semibold text-violet-700">
                  {lang === 'gu' ? 'ચાલુ શિલક' : 'Current Balance (B/F)'}
                </p>
              </div>
              <span className="text-right text-xs font-bold text-violet-700 font-mono">
                {fmt(openingForPeriod)}
              </span>
              <span /><span /><span />
            </div>

            {/* Jama entries */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {jama.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-gray-400">{tr.noEntries}</div>
              ) : (
                jama.map((e, idx) => (
                  <div
                    key={e.id}
                    className={`grid grid-cols-[70px_1fr_64px_72px_36px_24px] gap-0 px-3 py-2.5 text-sm group ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'
                    }`}
                  >
                    <span className="text-xs text-gray-500 font-mono">{formatDate(e.entry_date)}</span>
                    <div className="min-w-0">
                      <p className="text-gray-900 truncate text-xs font-medium leading-snug">{e.description || '—'}</p>
                      {e.description_detail && (
                        <DetailTablePreview detail={e.description_detail} lang={lang} />
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">{e.payment_mode}</p>
                    </div>
                    <span className="text-right text-xs font-medium text-emerald-700 font-mono">
                      {fmt(Number(e.amount))}
                    </span>
                    <span className="text-center text-xs text-gray-400">{e.page_no || ''}</span>
                    <span className="text-center text-xs text-gray-400">{e.account_no || ''}</span>
                    <span className="flex items-center justify-center">
                      {isOwnerOrAccountant && (
                        <Link
                          href={`/rojmel/${e.id}/edit`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1 hover:bg-emerald-100 text-emerald-600"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* ── Total: કુલ જમા સરવાળો (opening + all credits) ── */}
            <div className="grid grid-cols-[70px_1fr_64px_72px_36px_24px] gap-0 border-t-2 border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <span className="text-xs font-bold text-emerald-800 col-span-2">
                {lang === 'gu' ? 'કુલ જમા સરવાળો' : 'Total Jama (Grand)'}
              </span>
              <span className="text-right text-xs font-bold text-emerald-900 font-mono">
                {fmt(grandJama)}
              </span>
              <span /><span /><span />
            </div>
          </div>

          {/* ── UDHAR (Debit / Right) ── */}
          <div className="flex-1 flex flex-col">

            {/* Section header */}
            <div className="flex items-center justify-between bg-red-50 px-4 py-3 border-b border-red-100">
              <div>
                <span className="text-base font-bold text-red-800">{tr.udhar}</span>
                <span className="ml-2 text-xs text-red-500">
                  ({lang === 'gu' ? 'ડેબિટ / ખર્ચ' : 'Debit / Expense'})
                </span>
              </div>
              <span className="rounded-full bg-white border border-red-200 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                ₹{fmt(udharTotal)}
              </span>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[70px_1fr_64px_72px_36px_24px] gap-0 border-b border-gray-100 bg-red-50/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-red-700/70">
              <span className="whitespace-nowrap">{tr.date}</span>
              <span className="whitespace-nowrap">{tr.description}</span>
              <span className="text-right whitespace-nowrap">{tr.amountCol}</span>
              <span className="text-center whitespace-nowrap">{tr.pageNo}</span>
              <span className="text-center whitespace-nowrap">{tr.accountNo}</span>
              <span />
            </div>

            {/* Udhar entries */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {udhar.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-sm text-gray-400">{tr.noEntries}</div>
              ) : (
                udhar.map((e, idx) => (
                  <div
                    key={e.id}
                    className={`grid grid-cols-[70px_1fr_64px_72px_36px_24px] gap-0 px-3 py-2.5 text-sm group ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-red-50/30'
                    }`}
                  >
                    <span className="text-xs text-gray-500 font-mono">{formatDate(e.entry_date)}</span>
                    <div className="min-w-0">
                      <p className="text-gray-900 truncate text-xs font-medium leading-snug">{e.description || '—'}</p>
                      {e.description_detail && (
                        <DetailTablePreview detail={e.description_detail} lang={lang} />
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">{e.payment_mode}</p>
                    </div>
                    <span className="text-right text-xs font-medium text-red-700 font-mono">
                      {fmt(Number(e.amount))}
                    </span>
                    <span className="text-center text-xs text-gray-400">{e.page_no || ''}</span>
                    <span className="text-center text-xs text-gray-400">{e.account_no || ''}</span>
                    <span className="flex items-center justify-center">
                      {isOwnerOrAccountant && (
                        <Link
                          href={`/rojmel/${e.id}/edit`}
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1 hover:bg-red-100 text-red-500"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                      )}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* ── Total: કુલ ઉધાર સરવાળો ── */}
            <div className="grid grid-cols-[70px_1fr_64px_72px_36px_24px] gap-0 border-t-2 border-red-200 bg-red-50 px-3 py-2.5">
              <span className="text-xs font-bold text-red-800 col-span-2">
                {lang === 'gu' ? 'કુલ ઉધાર સરવાળો' : 'Total Udhar'}
              </span>
              <span className="text-right text-xs font-bold text-red-900 font-mono">
                {fmt(udharTotal)}
              </span>
              <span /><span /><span />
            </div>

            {/* ── Closing balance: ચાલુ શિલક ── */}
            <div className="grid grid-cols-[70px_1fr_64px_72px_36px_24px] gap-0 border-t border-violet-100 bg-violet-50 px-3 py-2.5">
              <span className="text-xs text-violet-400 font-mono">—</span>
              <span className="text-xs font-semibold text-violet-700">
                {lang === 'gu' ? 'ચાલુ શિલક' : 'Closing Balance (C/F)'}
              </span>
              <span className={`text-right text-xs font-bold font-mono ${closingBal >= 0 ? 'text-violet-700' : 'text-red-700'}`}>
                {fmt(closingBal)}
              </span>
              <span /><span /><span />
            </div>

            {/* ── Grand total: કુલ જમા નવો સરવાળો ── */}
            <div className="grid grid-cols-[70px_1fr_64px_72px_36px_24px] gap-0 border-t-2 border-violet-200 bg-violet-50 px-3 py-2.5">
              <span className="text-xs font-bold text-violet-800 col-span-2">
                {lang === 'gu' ? 'કુલ જમા નવો સરવાળો' : 'Total (Udhar + Balance)'}
              </span>
              <span className="text-right text-xs font-bold text-violet-900 font-mono">
                {fmt(grandJama)}
              </span>
              <span /><span /><span />
            </div>
          </div>
        </div>

        {/* ── Closing balance summary bar ── */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/90 px-5 py-3 shadow-sm">
          <div className="flex items-center gap-6 flex-wrap text-xs text-gray-500">
            <span>
              <span className="font-medium text-gray-600">{lang === 'gu' ? 'ચાલુ શિલક (શરૂ):' : 'Opening Balance:'}</span>
              {' '}<span className="font-mono font-semibold text-violet-700">₹{fmt(openingForPeriod)}</span>
            </span>
            <span>
              <span className="font-medium text-emerald-700">{lang === 'gu' ? 'જમા:' : 'Jama:'}</span>
              {' '}<span className="font-mono font-semibold text-emerald-700">+₹{fmt(jamaTotal)}</span>
            </span>
            <span>
              <span className="font-medium text-red-600">{lang === 'gu' ? 'ઉધાર:' : 'Udhar:'}</span>
              {' '}<span className="font-mono font-semibold text-red-600">−₹{fmt(udharTotal)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{lang === 'gu' ? 'ચાલુ શિલક (અંત):' : 'Closing Balance:'}</span>
            <span className={`text-base font-bold font-mono px-3 py-0.5 rounded-full ${
              closingBal >= 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              ₹{fmt(Math.abs(closingBal))}
              <span className="text-xs font-medium ml-1">
                {closingBal >= 0
                  ? (lang === 'gu' ? '(જમા)' : 'surplus')
                  : (lang === 'gu' ? '(ઉધાર)' : 'deficit')}
              </span>
            </span>
          </div>
        </div>
      </main>
    </div>
  )
}
