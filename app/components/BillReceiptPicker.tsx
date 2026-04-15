'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabaseBrowserClient } from '../../lib/supabase-client'

interface Bill {
  id: string
  receipt_no: string
  bill_date: string
  party_name: string
  category: string | null
  description: string | null
  amount: number | null
  financial_year: string
}

type SortKey   = 'receipt_no' | 'bill_date' | 'amount' | 'party_name'
type SortDir   = 'asc' | 'desc'

interface Props {
  name: string
  defaultValue?: string
  lang: string
  schoolId: string
}

function currentFY() {
  const now = new Date(); const m = now.getMonth() + 1; const y = now.getFullYear()
  return m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`
}

const fmt     = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 })
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })

export default function BillReceiptPicker({ name, defaultValue = '', lang, schoolId }: Props) {
  const isGu = lang === 'gu'

  const [value,        setValue]       = useState(defaultValue)
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)
  const [open,         setOpen]         = useState(false)

  // Modal state
  const [allBills,   setAllBills]   = useState<Bill[]>([])   // raw fetch result
  const [bills,      setBills]      = useState<Bill[]>([])   // after client-side filter/sort
  const [loading,    setLoading]    = useState(false)
  const [availFYs,   setAvailFYs]   = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])

  // Filter/sort controls
  const [fy,       setFy]       = useState('')
  const [search,   setSearch]   = useState('')
  const [catFilter,setCatFilter] = useState('')
  const [sortKey,  setSortKey]  = useState<SortKey>('receipt_no')
  const [sortDir,  setSortDir]  = useState<SortDir>('asc')

  const searchRef = useRef<HTMLInputElement>(null)
  const modalRef  = useRef<HTMLDivElement>(null)

  // On mount — resolve defaultValue to a bill
  useEffect(() => {
    if (!defaultValue || !schoolId) return
    supabaseBrowserClient
      .from('bills')
      .select('id,receipt_no,bill_date,party_name,category,description,amount,financial_year')
      .eq('school_id', schoolId)
      .eq('receipt_no', defaultValue)
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setSelectedBill(data as Bill) })
  }, [defaultValue, schoolId])

  // Fetch all bills for current FY when modal opens or FY changes
  useEffect(() => {
    if (!open) return
    setLoading(true)

    // Fetch FY list once
    supabaseBrowserClient
      .from('bills')
      .select('financial_year')
      .eq('school_id', schoolId)
      .then(({ data }) => {
        const fys = [...new Set((data ?? []).map((r: any) => r.financial_year as string))].sort().reverse()
        setAvailFYs(fys)
        setFy(f => f || (fys.includes(currentFY()) ? currentFY() : fys[0] ?? currentFY()))
      })
  }, [open, schoolId])

  // Fetch bills when FY changes
  useEffect(() => {
    if (!open || !fy) return
    setLoading(true)
    supabaseBrowserClient
      .from('bills')
      .select('id,receipt_no,bill_date,party_name,category,description,amount,financial_year')
      .eq('school_id', schoolId)
      .eq('financial_year', fy)
      .then(({ data }) => {
        const rows = (data ?? []) as Bill[]
        setAllBills(rows)
        const cats = [...new Set(rows.map(b => b.category).filter(Boolean))] as string[]
        setCategories(cats)
        setLoading(false)
      })
  }, [open, fy, schoolId])

  // Client-side filter + sort whenever controls change
  useEffect(() => {
    let result = [...allBills]

    // Category filter
    if (catFilter) result = result.filter(b => b.category === catFilter)

    // Search across receipt_no, party_name, description, category
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(b =>
        b.receipt_no.toLowerCase().includes(q)       ||
        b.party_name.toLowerCase().includes(q)       ||
        (b.description ?? '').toLowerCase().includes(q) ||
        (b.category    ?? '').toLowerCase().includes(q)
      )
    }

    // Sort
    result.sort((a, b) => {
      let va: string | number, vb: string | number
      switch (sortKey) {
        case 'bill_date':   va = a.bill_date;   vb = b.bill_date;   break
        case 'amount':      va = a.amount ?? 0; vb = b.amount ?? 0; break
        case 'party_name':  va = a.party_name;  vb = b.party_name;  break
        default:            va = a.receipt_no;  vb = b.receipt_no;  break
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })

    setBills(result)
  }, [allBills, search, catFilter, sortKey, sortDir])

  // Focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60)
  }, [open])

  // Keyboard: Escape closes
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  function closeModal() { setOpen(false); setSearch('') }

  function select(bill: Bill) {
    setValue(bill.receipt_no)
    setSelectedBill(bill)
    closeModal()
  }

  function clear() { setValue(''); setSelectedBill(null) }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <span className="ml-0.5 text-gray-300">↕</span>
    return <span className="ml-0.5 text-violet-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <>
      <input type="hidden" name={name} value={value} />

      {/* ── Trigger ── */}
      {selectedBill ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-violet-200 bg-violet-50/60 px-3 py-2.5 ring-1 ring-violet-100">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-violet-700 font-mono">#{selectedBill.receipt_no}</span>
              {selectedBill.category && (
                <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-600">
                  {selectedBill.category}
                </span>
              )}
            </div>
            <p className="text-[11px] font-medium text-gray-700 truncate">{selectedBill.party_name}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {fmtDate(selectedBill.bill_date)}
              {selectedBill.amount != null && ` · ₹${fmt(Number(selectedBill.amount))}`}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button type="button" onClick={() => setOpen(true)}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-violet-400 hover:bg-violet-100 hover:text-violet-600 transition-colors"
              title={isGu ? 'બદલો' : 'Change'}>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 5H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
            <button type="button" onClick={clear}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
              title={isGu ? 'હટાવો' : 'Clear'}>
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-500 transition-all hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-300/40">
          <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="flex-1 text-left">{isGu ? 'પાવતી પસંદ કરો…' : 'Pick a bill…'}</span>
          <svg className="h-4 w-4 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* ── Modal ── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />

          {/* Sheet */}
          <div ref={modalRef}
            className="relative z-10 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col"
            style={{ maxHeight: '90vh' }}>

            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {isGu ? 'પાવતી પસંદ કરો' : 'Select a Bill'}
                </h3>
                <p className="mt-0.5 text-xs text-gray-400">
                  {isGu ? 'Receipt No. આપોઆપ ભરાઈ જશે' : 'Receipt No. fills automatically on selection'}
                </p>
              </div>
              <button type="button" onClick={closeModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-100 transition-colors">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Filter bar ── */}
            <div className="border-y border-gray-100 bg-gray-50/60 px-4 py-3 space-y-2.5">
              {/* Row 1: Search + FY */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input ref={searchRef} type="text" value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={isGu ? 'નં. / નામ / વર્ગ / વિગત…' : 'Receipt no, party, category, description…'}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300/30"
                  />
                  {search && (
                    <button type="button" onClick={() => setSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                {availFYs.length > 0 && (
                  <select value={fy} onChange={e => { setFy(e.target.value); setCatFilter('') }}
                    className="rounded-xl border border-gray-200 bg-white py-2 pl-3 pr-7 text-sm focus:border-violet-400 focus:outline-none">
                    {availFYs.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                )}
              </div>

              {/* Row 2: Category chips + Sort */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Category filter chips */}
                <div className="flex gap-1.5 flex-wrap flex-1">
                  <button type="button"
                    onClick={() => setCatFilter('')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      !catFilter
                        ? 'bg-violet-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-700'
                    }`}>
                    {isGu ? 'બધા' : 'All'}
                  </button>
                  {categories.map(c => (
                    <button key={c} type="button"
                      onClick={() => setCatFilter(c === catFilter ? '' : c)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        catFilter === c
                          ? 'bg-violet-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-700'
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {isGu ? 'ક્રમ:' : 'Sort:'}
                  </span>
                  {(['receipt_no', 'bill_date', 'amount', 'party_name'] as SortKey[]).map(k => {
                    const labels: Record<SortKey, string> = {
                      receipt_no:  isGu ? 'નં.' : 'No.',
                      bill_date:   isGu ? 'તા.' : 'Date',
                      amount:      isGu ? 'રકમ' : 'Amt',
                      party_name:  isGu ? 'નામ' : 'Party',
                    }
                    return (
                      <button key={k} type="button" onClick={() => toggleSort(k)}
                        className={`flex items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
                          sortKey === k
                            ? 'bg-violet-100 text-violet-700'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}>
                        {labels[k]}<SortIcon k={k} />
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Bills list ── */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                </div>
              ) : bills.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
                    <svg className="h-6 w-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {isGu ? 'કોઈ પાવતી મળી નહીં.' : 'No bills found.'}
                  </p>
                  {(search || catFilter) && (
                    <button type="button"
                      onClick={() => { setSearch(''); setCatFilter('') }}
                      className="mt-2 text-xs text-violet-600 hover:underline">
                      {isGu ? 'ફ઼િલ્ટર સાફ કરો' : 'Clear filters'}
                    </button>
                  )}
                  <a href="/bills/add" target="_blank"
                    className="mt-3 text-xs text-violet-500 hover:underline">
                    {isGu ? '+ નવી પાવતી ઉમેરો' : '+ Add a new bill'}
                  </a>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {bills.map(bill => {
                    const isSelected = bill.receipt_no === value
                    return (
                      <button key={bill.id} type="button" onClick={() => select(bill)}
                        className={`w-full px-4 py-3.5 text-left transition-colors flex items-start gap-3 ${
                          isSelected
                            ? 'bg-violet-50 hover:bg-violet-100/60'
                            : 'hover:bg-gray-50'
                        }`}>
                        {/* Receipt No badge */}
                        <div className={`mt-0.5 flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl text-[11px] font-bold font-mono leading-tight ${
                          isSelected
                            ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className="text-[8px] font-normal opacity-60">#</span>
                          <span>{bill.receipt_no}</span>
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-sm font-semibold truncate ${isSelected ? 'text-violet-900' : 'text-gray-800'}`}>
                              {bill.party_name}
                            </p>
                            {bill.category && (
                              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                                isSelected
                                  ? 'bg-violet-100 text-violet-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {bill.category}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-gray-400">
                            <span>{fmtDate(bill.bill_date)}</span>
                            {bill.description && (
                              <>
                                <span>·</span>
                                <span className="truncate">{bill.description}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount + check */}
                        <div className="shrink-0 text-right">
                          {bill.amount != null ? (
                            <p className={`text-sm font-bold font-mono ${isSelected ? 'text-violet-800' : 'text-gray-700'}`}>
                              ₹{fmt(Number(bill.amount))}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-300">—</p>
                          )}
                          {isSelected && (
                            <span className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-semibold text-violet-600">
                              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                              </svg>
                              {isGu ? 'પસંદ' : 'Selected'}
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 flex items-center justify-between rounded-b-2xl">
              <p className="text-xs text-gray-400">
                {loading ? '…' : bills.length}{' '}
                {isGu ? 'પાવતી' : 'bills'}
                {(search || catFilter) && ` (${isGu ? 'ફ઼િલ્ટર' : 'filtered'})`}
                {fy && <span className="ml-1 text-gray-300">· FY {fy}</span>}
              </p>
              <button type="button" onClick={closeModal}
                className="rounded-xl border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                {isGu ? 'બંધ' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
