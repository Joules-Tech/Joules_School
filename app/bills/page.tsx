import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../lib/auth'
import { getLang } from '../../lib/get-lang'
import { t, currentFY, availableFYs } from '../../lib/translations'
import Sidebar from '../components/Sidebar'
import LanguageToggle from '../components/LanguageToggle'

export default async function BillsPage(props: any) {
  const [{ user, profile }, lang] = await Promise.all([
    getCurrentUserWithProfile(),
    getLang(),
  ])

  if (!user) redirect('/auth/login')
  if (!profile?.school_id) redirect('/auth/register-school')

  const tr  = t(lang)
  const supabase = await createSupabaseServerClient()

  const searchParams  = await props.searchParams
  const selectedFY    = (searchParams?.fy       as string) || currentFY()
  const filterCat     = (searchParams?.category as string) || ''
  const filterSearch  = (searchParams?.q        as string) || ''

  const isOwnerOrAccountant = ['owner', 'accountant'].includes(profile.role)
  const fys = availableFYs(5)

  // Fetch bills
  let query = supabase
    .from('bills')
    .select('*')
    .eq('school_id', profile.school_id)
    .eq('financial_year', selectedFY)
    .order('receipt_no', { ascending: true })

  if (filterCat)    query = query.eq('category', filterCat)
  if (filterSearch) query = query.ilike('party_name', `%${filterSearch}%`)

  const { data: bills } = await query

  // Fetch distinct categories for filter dropdown
  const { data: catRows } = await supabase
    .from('bills')
    .select('category')
    .eq('school_id', profile.school_id)
    .eq('financial_year', selectedFY)
    .not('category', 'is', null)

  const categories = [...new Set((catRows ?? []).map(r => r.category).filter(Boolean))] as string[]

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 })

  const totalAmount = (bills ?? []).reduce((s, b) => s + Number(b.amount || 0), 0)

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/bills" />

      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{tr.billsTitle}</h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {lang === 'gu' ? 'ડિજિટલ પાવતી ફ઼ાઇલ' : 'Digital bill filing system'} · FY {selectedFY}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            {isOwnerOrAccountant && (
              <Link
                href="/bills/add"
                className="rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
              >
                + {tr.addBill}
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <form method="GET" className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl bg-white/90 p-4 shadow-sm border border-gray-100">
          {/* FY */}
          <div className="space-y-1 min-w-[130px]">
            <label className="block text-xs font-medium text-gray-600">{tr.billFilterFY}</label>
            <select name="fy" defaultValue={selectedFY}
              className="w-full rounded-xl border border-gray-200 pl-3 pr-8 py-2 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20">
              {fys.map(fy => <option key={fy} value={fy}>{fy}</option>)}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-600">{tr.billFilterCategory}</label>
            <select name="category" defaultValue={filterCat}
              className="w-full rounded-xl border border-gray-200 pl-3 pr-8 py-2 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20">
              <option value="">{lang === 'gu' ? 'બધા વર્ગ' : 'All categories'}</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Search */}
          <div className="space-y-1 flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-600">{lang === 'gu' ? 'પક્ષ / નામ શોધો' : 'Search party'}</label>
            <input name="q" type="text" defaultValue={filterSearch}
              placeholder={lang === 'gu' ? 'નામ…' : 'Party name…'}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20" />
          </div>

          <button type="submit"
            className="rounded-xl bg-[#9C43A6] px-5 py-2 text-sm font-medium text-white hover:bg-[#8a3593]">
            {lang === 'gu' ? 'ફ઼િલ્ટર' : 'Filter'}
          </button>
          <Link href="/bills"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            {lang === 'gu' ? 'સાફ' : 'Clear'}
          </Link>
        </form>

        {/* Summary bar */}
        {(bills ?? []).length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs">
              <span className="text-violet-600 font-medium">{lang === 'gu' ? 'કુલ પાવતી:' : 'Total bills:'}</span>
              <span className="font-bold text-violet-800">{(bills ?? []).length}</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs">
              <span className="text-emerald-600 font-medium">{lang === 'gu' ? 'કુલ રકમ:' : 'Total amount:'}</span>
              <span className="font-bold font-mono text-emerald-800">₹{fmt(totalAmount)}</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {(bills ?? []).length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white/60">
            <div className="py-16 text-center px-8">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-300">
                <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-500">{tr.noBills}</p>
              {isOwnerOrAccountant && (
                <Link href="/bills/add"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90">
                  + {tr.addBill}
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Bills table */}
        {(bills ?? []).length > 0 && (
          <div className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

            {/* Column headers */}
            <div className="grid grid-cols-[64px_90px_1fr_120px_100px_90px_40px] gap-0 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              <span>{tr.billReceiptNo}</span>
              <span>{tr.billDate}</span>
              <span>{tr.billParty}</span>
              <span>{tr.billCategory}</span>
              <span className="text-right">{tr.billAmount}</span>
              <span className="text-center">{lang === 'gu' ? 'ફ઼ાઇલ' : 'File'}</span>
              <span />
            </div>

            <div className="divide-y divide-gray-50 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 340px)' }}>
              {(bills ?? []).map((bill, idx) => (
                <div key={bill.id}
                  className={`grid grid-cols-[64px_90px_1fr_120px_100px_90px_40px] gap-0 px-4 py-3 text-sm items-center group ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                  }`}
                >
                  {/* Receipt No */}
                  <span className="text-xs font-bold text-violet-700 font-mono">#{bill.receipt_no}</span>

                  {/* Date */}
                  <span className="text-xs text-gray-500 font-mono">{formatDate(bill.bill_date)}</span>

                  {/* Party + description */}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{bill.party_name}</p>
                    {bill.description && (
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{bill.description}</p>
                    )}
                  </div>

                  {/* Category */}
                  {bill.category ? (
                    <span className="inline-flex w-fit items-center rounded-lg bg-violet-50 border border-violet-200 px-2 py-0.5 text-[10px] font-medium text-violet-700 truncate">
                      {bill.category}
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-300">—</span>
                  )}

                  {/* Amount */}
                  <span className="text-right text-xs font-bold font-mono text-gray-800">
                    {bill.amount ? `₹${fmt(Number(bill.amount))}` : '—'}
                  </span>

                  {/* File indicator */}
                  <span className="text-center">
                    {bill.file_url ? (
                      <a href={bill.file_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
                        title={bill.file_name ?? 'View file'}>
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </a>
                    ) : (
                      <span className="text-gray-200 text-[10px]">—</span>
                    )}
                  </span>

                  {/* Edit */}
                  <span className="flex justify-end">
                    {isOwnerOrAccountant && (
                      <Link href={`/bills/${bill.id}/edit`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 hover:bg-violet-50 text-gray-400 hover:text-violet-600"
                        title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer total */}
            <div className="grid grid-cols-[64px_90px_1fr_120px_100px_90px_40px] gap-0 border-t-2 border-gray-200 bg-gray-50 px-4 py-3">
              <span className="col-span-4 text-xs font-bold text-gray-600">
                {lang === 'gu' ? 'કુલ સરવાળો' : 'Total'} ({(bills ?? []).length} {lang === 'gu' ? 'પાવતી' : 'bills'})
              </span>
              <span className="text-right text-xs font-bold text-gray-800 font-mono">₹{fmt(totalAmount)}</span>
              <span /><span />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
