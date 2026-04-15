import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../lib/auth'
import { getLang } from '../../lib/get-lang'
import { t, currentFY, availableFYs, fyDateRange } from '../../lib/translations'
import LanguageToggle from '../components/LanguageToggle'
import Sidebar from '../components/Sidebar'

export default async function KhatavahiPage(props: any) {
  const [{ user, profile }, lang] = await Promise.all([
    getCurrentUserWithProfile(),
    getLang(),
  ])

  if (!user) redirect('/auth/login')
  if (!profile?.school_id) redirect('/auth/register-school')

  const tr = t(lang)
  const supabase = await createSupabaseServerClient()

  const searchParams = await props.searchParams
  const selectedFY      = (searchParams?.fy      as string) || currentFY()
  const selectedAcctId  = (searchParams?.account as string) || ''

  // Fetch accounts for this school
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, account_name, account_number')
    .eq('school_id', profile.school_id)
    .order('account_number', { ascending: true })

  // Fetch entries for selected account + FY
  let entries: any[] = []
  let selectedAccount: { id: string; account_name: string; account_number: string } | null = null

  if (selectedAcctId && accounts) {
    selectedAccount = accounts.find(a => a.id === selectedAcctId) || null

    if (selectedAccount) {
      const { start, end } = fyDateRange(selectedFY)

      const { data } = await supabase
        .from('rojmel_entries')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('account_no', selectedAccount.account_number)
        .gte('entry_date', start)
        .lte('entry_date', end)
        .order('entry_date', { ascending: true })
        .order('created_at', { ascending: true })

      entries = data || []
    }
  }

  const totalJama  = entries.filter(e => e.entry_type === 'IN' ).reduce((s, e) => s + Number(e.amount), 0)
  const totalUdhar = entries.filter(e => e.entry_type === 'OUT').reduce((s, e) => s + Number(e.amount), 0)
  const rows = entries.map(e => ({ ...e, amount: Number(e.amount) }))

  const fys   = availableFYs(5)
  const isOwnerOrAccountant = ['owner', 'accountant'].includes(profile.role)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const fmt = (n: number) => Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  return (
    <div className="flex h-full flex-1 min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/khatavahi" />

      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{tr.khatavahiTitle}</h1>
            {selectedAccount && (
              <p className="mt-0.5 text-xs text-gray-500">
                <span className="font-mono font-semibold text-violet-700">{selectedAccount.account_number}</span>
                {' — '}{selectedAccount.account_name}
                {' · '}{lang === 'gu' ? 'નાણાકીય વર્ષ' : 'FY'} {selectedFY}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            {isOwnerOrAccountant && (
              <Link
                href="/khatavahi/add-account"
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                + {tr.addAccount}
              </Link>
            )}
          </div>
        </div>

        {/* Selectors */}
        <form method="GET" className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl bg-white/90 p-4 shadow-sm border border-gray-100">
          {/* FY selector */}
          <div className="space-y-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-600">{tr.selectYear}</label>
            <select
              name="fy"
              defaultValue={selectedFY}
              className="w-full rounded-xl border border-gray-200 pl-3 pr-10 py-2 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
            >
              {fys.map(fy => (
                <option key={fy} value={fy}>{fy}</option>
              ))}
            </select>
          </div>

          {/* Account selector */}
          <div className="space-y-1 flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600">
              {lang === 'gu' ? 'ખાતું' : 'Account'}
            </label>
            {(!accounts || accounts.length === 0) ? (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-400 flex-1">{tr.noAccountsYet}</span>
                {isOwnerOrAccountant && (
                  <Link href="/khatavahi/add-account" className="text-xs font-medium text-[#9C43A6] hover:underline whitespace-nowrap">
                    + {tr.addAccount}
                  </Link>
                )}
              </div>
            ) : (
              <select
                name="account"
                defaultValue={selectedAcctId}
                className="w-full rounded-xl border border-gray-200 pl-3 pr-10 py-2 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              >
                <option value="">{tr.selectAccount}</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.account_number} — {a.account_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <button
            type="submit"
            className="rounded-xl bg-[#9C43A6] px-5 py-2 text-sm font-medium text-white hover:bg-[#8a3593]"
          >
            {lang === 'gu' ? 'જુઓ' : 'View'}
          </button>
        </form>

        {/* No account selected */}
        {!selectedAcctId && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60">
            <div className="text-center py-16 px-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-400">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-600">
                {lang === 'gu' ? 'ખાતું અને વર્ષ પસંદ કરો' : 'Select an account and year to view the ledger'}
              </p>
              {(!accounts || accounts.length === 0) && isOwnerOrAccountant && (
                <Link
                  href="/khatavahi/add-account"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                >
                  + {tr.addAccount}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Account selected but no entries */}
        {selectedAcctId && selectedAccount && rows.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60">
            <p className="text-sm text-gray-400 py-16">{tr.noEntriesForAccount}</p>
          </div>
        )}

        {/* Ledger table */}
        {selectedAcctId && selectedAccount && rows.length > 0 && (
          <div className="flex flex-1 flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

            {/* Account title bar */}
            <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-3 border-b border-violet-100">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-violet-100 px-3 py-1 text-sm font-bold text-violet-800 font-mono">
                  {selectedAccount.account_number}
                </span>
                <span className="text-base font-semibold text-gray-800">{selectedAccount.account_name}</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">{lang === 'gu' ? 'નાણાકીય વર્ષ' : 'FY'} {selectedFY}</span>
            </div>

            {/* Summary pills */}
            <div className="flex gap-3 border-b border-gray-100 bg-gray-50/50 px-5 py-2.5">
              {[
                { label: lang === 'gu' ? 'કુલ જમા' : 'Total Jama', value: `₹${fmt(totalJama)}`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { label: lang === 'gu' ? 'કુલ ઉધાર' : 'Total Udhar', value: `₹${fmt(totalUdhar)}`, color: 'text-red-700 bg-red-50 border-red-200' },
                { label: lang === 'gu' ? 'કુલ નોંધ' : 'Entries', value: String(rows.length), color: 'text-violet-700 bg-violet-50 border-violet-200' },
              ].map(p => (
                <div key={p.label} className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs ${p.color}`}>
                  <span className="font-medium opacity-75">{p.label}:</span>
                  <span className="font-bold font-mono">{p.value}</span>
                </div>
              ))}
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[70px_1fr_80px_100px_100px] gap-0 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              <span>{tr.date}</span>
              <span>{tr.description}</span>
              <span className="text-center">{tr.pageNo}</span>
              <span className="text-right text-red-500">{tr.debitCol}</span>
              <span className="text-right text-emerald-600">{tr.creditCol}</span>
            </div>

            {/* Entries */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {rows.map((e, idx) => {
                const isCredit = e.entry_type === 'IN'
                return (
                  <div
                    key={e.id}
                    className={`grid grid-cols-[70px_1fr_80px_100px_100px] gap-0 px-4 py-2.5 text-sm ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                    }`}
                  >
                    <span className="text-xs text-gray-500 font-mono self-start pt-0.5">{formatDate(e.entry_date)}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate leading-snug">{e.description || '—'}</p>
                      {e.description_detail && (
                        <p className="text-[10px] text-gray-500 italic truncate mt-0.5">{e.description_detail}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">{e.payment_mode}</p>
                    </div>
                    <span className="text-center text-xs text-gray-400 self-start pt-0.5">{e.page_no || ''}</span>
                    <span className="text-right text-xs self-start pt-0.5 font-mono">
                      {!isCredit
                        ? <span className="font-semibold text-red-600">{fmt(e.amount)}</span>
                        : <span className="text-gray-200">—</span>}
                    </span>
                    <span className="text-right text-xs self-start pt-0.5 font-mono">
                      {isCredit
                        ? <span className="font-semibold text-emerald-600">{fmt(e.amount)}</span>
                        : <span className="text-gray-200">—</span>}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Totals footer */}
            <div className="grid grid-cols-[70px_1fr_80px_100px_100px] gap-0 border-t-2 border-gray-200 bg-gray-50 px-4 py-3">
              <span className="text-xs font-bold text-gray-600 col-span-3">
                {lang === 'gu' ? 'કુલ સરવાળો' : 'Total'}
              </span>
              <span className="text-right text-xs font-bold text-red-700 font-mono">{fmt(totalUdhar)}</span>
              <span className="text-right text-xs font-bold text-emerald-700 font-mono">{fmt(totalJama)}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
