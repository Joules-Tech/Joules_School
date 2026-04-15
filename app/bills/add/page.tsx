'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowserClient } from '../../../lib/supabase-client'
import BillFileUpload from '../../components/BillFileUpload'
import Sidebar from '../../components/Sidebar'

// ── This page is client-side because file upload requires browser APIs ─────────

interface Props {
  // passed via server layout / searchParams if needed
}

// We fetch the user's profile on the client side via Supabase
export default function AddBillPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [receiptNo,   setReceiptNo]   = useState('')
  const [billDate,    setBillDate]    = useState(new Date().toISOString().slice(0, 10))
  const [partyName,   setPartyName]   = useState('')
  const [category,    setCategory]    = useState('')
  const [customCat,   setCustomCat]   = useState('')
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [notes,       setNotes]       = useState('')
  const [fileUrl,     setFileUrl]     = useState<string | null>(null)
  const [fileName,    setFileName]    = useState<string | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [success,     setSuccess]     = useState(false)
  const [profile,     setProfile]     = useState<any>(null)
  const [lang,        setLangState]   = useState<'en' | 'gu'>('en')

  // Load profile on mount
  useEffect(() => {
    supabaseBrowserClient.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return }
      const { data: p } = await supabaseBrowserClient
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
    })
    // lang from cookie (browser-only)
    if (typeof document !== 'undefined') {
      const l = document.cookie.match(/lang=([^;]+)/)?.[1]
      if (l === 'gu') setLangState('gu')
    }
  }, [])

  const isGu = lang === 'gu'
  const PRESET_CATEGORIES = isGu
    ? ['વીજળી', 'પાણી', 'ટેલિફ઼ોન', 'છાપો / સ્ટેશનરી', 'પગાર', 'સ્વચ્છતા', 'બાંધકામ', 'અન્ય']
    : ['Electricity', 'Water', 'Telephone', 'Printing / Stationery', 'Salary', 'Sanitation', 'Construction', 'Other']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.school_id) return
    setError(null)

    const finalCategory = category === '__custom__' ? customCat.trim() : category

    // Get current FY
    const now = new Date()
    const m   = now.getMonth() + 1
    const y   = now.getFullYear()
    const fy  = m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`

    startTransition(async () => {
      const { error: dbErr } = await supabaseBrowserClient
        .from('bills')
        .insert({
          school_id:      profile.school_id,
          receipt_no:     receiptNo.trim(),
          financial_year: fy,
          bill_date:      billDate,
          party_name:     partyName.trim(),
          category:       finalCategory || null,
          description:    description.trim() || null,
          amount:         amount ? Number(amount) : null,
          file_url:       fileUrl,
          file_name:      fileName,
          notes:          notes.trim() || null,
          created_by:     profile.id,
        })

      if (dbErr) {
        setError(dbErr.message)
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/bills'), 1200)
    })
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9C43A6] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={{ email: profile?.email }} role={profile?.role ?? 'viewer'} lang={lang} active="/bills/add" />

      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/bills"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {isGu ? 'પાવતી ઉમેરો' : 'Add Bill'}
            </h1>
            <p className="mt-0.5 text-xs text-gray-400">
              {isGu ? 'નવી પાવતી ડિજિટલ ફ઼ાઇલ કરો' : 'File a new bill digitally'}
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {isGu ? 'પાવતી સફળતાપૂર્વક સાચવ્યું! રીડાયરેક્ટ…' : 'Bill saved! Redirecting…'}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">

          {/* Receipt No + Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                {isGu ? 'પાવતી નં.' : 'Receipt No. (પાવતી નં.)'}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <input
                type="text" required
                value={receiptNo} onChange={e => setReceiptNo(e.target.value)}
                placeholder={isGu ? 'ઉદા. 1, 2, 42…' : 'e.g. 1, 2, 42…'}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                {isGu ? 'પાવતી તારીખ' : 'Bill Date'}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <input
                type="date" required
                value={billDate} onChange={e => setBillDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              />
            </div>
          </div>

          {/* Party Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              {isGu ? 'પક્ષ / નામ (કોણ પાસેથી)' : 'Party Name (From whom)'}
              <span className="ml-1 text-red-400">*</span>
            </label>
            <input
              type="text" required
              value={partyName} onChange={e => setPartyName(e.target.value)}
              placeholder={isGu ? 'ઉદા. ગુજ. ઇ. બોર્ડ, મ્યુ. કોર્પ…' : 'e.g. GUVNL, Municipality…'}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              {isGu ? 'વર્ગ' : 'Category'}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_CATEGORIES.map(c => (
                <button key={c} type="button"
                  onClick={() => { setCategory(c === category ? '' : c); setCustomCat('') }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === c
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700'
                  }`}
                >
                  {c}
                </button>
              ))}
              <button type="button"
                onClick={() => { setCategory('__custom__'); setCustomCat('') }}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === '__custom__'
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700'
                }`}>
                {isGu ? '+ કસ્ટમ' : '+ Custom'}
              </button>
            </div>
            {category === '__custom__' && (
              <input type="text" value={customCat} onChange={e => setCustomCat(e.target.value)}
                placeholder={isGu ? 'વર્ગ નામ…' : 'Category name…'}
                className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              />
            )}
          </div>

          {/* Description + Amount */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                {isGu ? 'વિગત' : 'Description'}
              </label>
              <input type="text"
                value={description} onChange={e => setDescription(e.target.value)}
                placeholder={isGu ? 'ટૂંકી વિગત…' : 'Short description…'}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                {isGu ? 'રકમ (₹)' : 'Amount (₹)'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₹</span>
                <input type="number" step="0.01" min="0"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-gray-300 py-2.5 pl-7 pr-4 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                />
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              {isGu ? 'પાવતી ફ઼ાઇલ (PDF / ફ઼ોટો)' : 'Bill File (PDF / Image)'}
            </label>
            <BillFileUpload
              schoolId={profile.school_id}
              financialYear={(() => {
                const now = new Date(); const m = now.getMonth() + 1; const y = now.getFullYear()
                return m >= 4 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`
              })()}
              lang={lang}
              onUpload={(url, name) => { setFileUrl(url); setFileName(name) }}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              {isGu ? 'નોંધ (વૈકલ્પિક)' : 'Notes (optional)'}
            </label>
            <textarea rows={2}
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={isGu ? 'વધારાની નોંધ…' : 'Additional notes…'}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm resize-none focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending || success}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] py-3.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
              {isPending ? (isGu ? 'સાચવ્યો…' : 'Saving…') : (isGu ? 'પાવતી સાચવો' : 'Save Bill')}
            </button>
            <Link href="/bills"
              className="flex-1 rounded-xl border border-gray-200 bg-white py-3.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50">
              {isGu ? 'રદ' : 'Cancel'}
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
