'use client'

import { useState, useTransition } from 'react'
import BillFileUpload from './BillFileUpload'

interface Bill {
  id: string
  receipt_no: string
  bill_date: string
  party_name: string
  category: string | null
  description: string | null
  amount: number | null
  file_url: string | null
  file_name: string | null
  notes: string | null
  financial_year: string
  school_id: string
}

interface Props {
  bill: Bill
  lang: string
  schoolId: string
  updateAction: (formData: FormData) => Promise<void>
  deleteAction: (formData: FormData) => Promise<void>
}

const PRESET_EN = ['Electricity', 'Water', 'Telephone', 'Printing / Stationery', 'Salary', 'Sanitation', 'Construction', 'Other']
const PRESET_GU = ['વીજળી', 'પાણી', 'ટેલિફ઼ોન', 'છાપો / સ્ટેશનરી', 'પગાર', 'સ્વચ્છતા', 'બાંધકામ', 'અન્ય']

export default function BillEditForm({ bill, lang, schoolId, updateAction, deleteAction }: Props) {
  const isGu = lang === 'gu'
  const PRESETS = isGu ? PRESET_GU : PRESET_EN

  // Determine if the saved category is a preset or custom
  const savedCat = bill.category ?? ''
  const isCustom  = savedCat !== '' && !PRESETS.includes(savedCat)

  const [receiptNo,   setReceiptNo]   = useState(bill.receipt_no)
  const [billDate,    setBillDate]    = useState(bill.bill_date?.slice(0, 10) ?? '')
  const [partyName,   setPartyName]   = useState(bill.party_name)
  const [category,    setCategory]    = useState(isCustom ? '__custom__' : savedCat)
  const [customCat,   setCustomCat]   = useState(isCustom ? savedCat : '')
  const [description, setDescription] = useState(bill.description ?? '')
  const [amount,      setAmount]      = useState(bill.amount != null ? String(bill.amount) : '')
  const [notes,       setNotes]       = useState(bill.notes ?? '')
  const [fileUrl,     setFileUrl]     = useState<string | null>(bill.file_url)
  const [fileName,    setFileName]    = useState<string | null>(bill.file_name)
  const [showDelete,  setShowDelete]  = useState(false)

  const [updatePending, startUpdate] = useTransition()
  const [deletePending, startDelete] = useTransition()

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    // Inject fields not in hidden inputs
    fd.set('id',          bill.id)
    fd.set('receipt_no',  receiptNo)
    fd.set('bill_date',   billDate)
    fd.set('party_name',  partyName)
    fd.set('category',    category === '__custom__' ? customCat.trim() : category)
    fd.set('description', description)
    fd.set('amount',      amount)
    fd.set('notes',       notes)
    fd.set('file_url',    fileUrl ?? '')
    fd.set('file_name',   fileName ?? '')
    startUpdate(() => updateAction(fd))
  }

  function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('id', bill.id)
    startDelete(() => deleteAction(fd))
  }

  return (
    <div className="space-y-6">
      {/* Edit card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-gray-700">{isGu ? 'પાવતી વિગત' : 'Bill Details'}</p>
        </div>

        <form onSubmit={handleUpdate} className="p-5 space-y-5">

          {/* Receipt No + Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                {isGu ? 'પાવતી નં.' : 'Receipt No.'}
                <span className="ml-1 text-red-400">*</span>
              </label>
              <input
                type="text" required
                value={receiptNo} onChange={e => setReceiptNo(e.target.value)}
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
              {isGu ? 'પક્ષ / નામ' : 'Party Name'}
              <span className="ml-1 text-red-400">*</span>
            </label>
            <input
              type="text" required
              value={partyName} onChange={e => setPartyName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">
              {isGu ? 'વર્ગ' : 'Category'}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map(c => (
                <button key={c} type="button"
                  onClick={() => { setCategory(c === category ? '' : c); setCustomCat('') }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors ${
                    category === c
                      ? 'bg-violet-600 text-white border-violet-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-700'
                  }`}>
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
              schoolId={schoolId}
              financialYear={bill.financial_year}
              existingUrl={fileUrl ?? undefined}
              existingName={fileName ?? undefined}
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

          {/* Save */}
          <button type="submit" disabled={updatePending}
            className="w-full rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60">
            {updatePending
              ? (isGu ? 'સાચવ્યો…' : 'Saving…')
              : (isGu ? 'ફ઼ેરફ઼ાર સાચવો' : 'Save Changes')}
          </button>
        </form>
      </div>

      {/* Delete card */}
      <div className="rounded-2xl border border-red-100 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-red-50 bg-red-50/60 px-5 py-3.5">
          <p className="text-sm font-semibold text-red-700">{isGu ? 'પાવતી કાઢો' : 'Delete Bill'}</p>
        </div>
        <div className="p-5">
          {!showDelete ? (
            <button type="button" onClick={() => setShowDelete(true)}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              {isGu ? 'પાવતી કાઢી નાખો…' : 'Delete this bill…'}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {isGu
                  ? 'શું તમે ખરેખર આ પાવતી (#' + bill.receipt_no + ') કાઢી નાખવા માંગો છો? આ ક્રિયા પૂર્વવત્ ન કરી શકાય.'
                  : `Are you sure you want to delete bill #${bill.receipt_no}? This action cannot be undone.`}
              </p>
              <div className="flex gap-3">
                <form onSubmit={handleDelete}>
                  <button type="submit" disabled={deletePending}
                    className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                    {deletePending
                      ? (isGu ? 'કાઢ્યો…' : 'Deleting…')
                      : (isGu ? 'હા, કાઢો' : 'Yes, Delete')}
                  </button>
                </form>
                <button type="button" onClick={() => setShowDelete(false)}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  {isGu ? 'રદ' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
