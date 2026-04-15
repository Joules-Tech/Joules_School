'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getEntriesForDate, EntryRow } from '../../lib/actions/entry-actions'
import DetailTablePreview from './DetailTablePreview'

type Props = {
  initialDate: string
  initialType: 'IN' | 'OUT'
  lang: string
  editingId?: string
}

const fmt = (n: number) =>
  Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })

export default function LiveEntriesPanel({ initialDate, initialType, lang, editingId }: Props) {
  const router = useRouter()
  const [entries, setEntries] = useState<EntryRow[]>([])
  const [date, setDate] = useState(initialDate)
  const [entryType, setEntryType] = useState<'IN' | 'OUT'>(initialType)
  const [isPending, startTransition] = useTransition()

  const fetchEntries = useCallback((d: string, t: 'IN' | 'OUT') => {
    startTransition(async () => {
      const { data } = await getEntriesForDate(d, t)
      setEntries(data || [])
    })
  }, [])

  // Initial load
  useEffect(() => {
    fetchEntries(date, entryType)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen to form changes via DOM events
  useEffect(() => {
    const dateInput = document.getElementById('entry_date') as HTMLInputElement | null
    const typeRadios = document.querySelectorAll<HTMLInputElement>('input[name="entry_type"]')

    const onDateChange = (e: Event) => {
      const val = (e.target as HTMLInputElement).value
      if (val) {
        setDate(val)
        fetchEntries(val, entryType)
      }
    }

    const onTypeChange = (e: Event) => {
      const val = (e.target as HTMLInputElement).value as 'IN' | 'OUT'
      setEntryType(val)
      fetchEntries(date, val)
    }

    dateInput?.addEventListener('change', onDateChange)
    typeRadios.forEach(r => r.addEventListener('change', onTypeChange))

    return () => {
      dateInput?.removeEventListener('change', onDateChange)
      typeRadios.forEach(r => r.removeEventListener('change', onTypeChange))
    }
  }, [date, entryType, fetchEntries])

  // Re-fetch when editingId is cleared (after save/delete) to show updated list
  useEffect(() => {
    if (!editingId) {
      fetchEntries(date, entryType)
    }
  }, [editingId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditClick = (id: string) => {
    router.push(`/rojmel/add?edit=${id}`)
  }

  const total = entries.reduce((s, e) => s + Number(e.amount), 0)
  const isJama = entryType === 'IN'

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Panel header */}
      <div className={`flex items-center justify-between rounded-t-2xl px-4 py-3 border-b ${
        isJama
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-100'
          : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-100'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold ${
            isJama ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {isJama ? '⬅' : '➡'}
          </span>
          <div>
            <p className={`text-sm font-semibold ${isJama ? 'text-emerald-800' : 'text-red-800'}`}>
              {isJama
                ? (lang === 'gu' ? 'જમા નોંધ' : 'Jama Entries')
                : (lang === 'gu' ? 'ઉધાર નોંધ' : 'Udhar Entries')}
            </p>
            <p className="text-[10px] text-gray-400 font-mono">{date ? formatDate(date) : '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPending && (
            <div className={`h-4 w-4 rounded-full border-2 border-t-transparent animate-spin ${
              isJama ? 'border-emerald-400' : 'border-red-400'
            }`} />
          )}
          <span className={`rounded-xl px-2.5 py-0.5 text-xs font-bold font-mono ${
            isJama ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}>
            {entries.length} {lang === 'gu' ? 'નોંધ' : 'entries'}
          </span>
        </div>
      </div>

      {/* Entries list */}
      <div className="flex-1 overflow-y-auto rounded-b-2xl bg-white border border-t-0 border-gray-100 divide-y divide-gray-50">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${
              isJama ? 'bg-emerald-50 text-emerald-300' : 'bg-red-50 text-red-300'
            }`}>
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-xs font-medium text-gray-400 text-center">
              {lang === 'gu'
                ? `${date ? formatDate(date) : 'આ તારીખ'} ના ${isJama ? 'જમા' : 'ઉધાર'} નોંધ નથી`
                : `No ${isJama ? 'jama' : 'udhar'} entries for ${date ? formatDate(date) : 'this date'}`}
            </p>
          </div>
        ) : (
          <>
            {entries.map((e, idx) => {
              const isEditing = e.id === editingId
              return (
                <div
                  key={e.id}
                  className={`group flex items-start gap-3 px-4 py-3 text-xs transition-colors ${
                    isEditing
                      ? 'bg-violet-50 border-l-2 border-l-violet-400'
                      : idx % 2 === 0 ? 'bg-white hover:bg-gray-50/80' : 'bg-gray-50/30 hover:bg-gray-50/80'
                  }`}
                >
                  {/* Left: content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className={`font-semibold leading-snug truncate ${isEditing ? 'text-violet-800' : 'text-gray-800'}`}>
                          {e.description || '—'}
                        </p>
                        {e.description_detail && (
                          <DetailTablePreview detail={e.description_detail} lang={lang} />
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                            e.payment_mode === 'CASH'
                              ? 'bg-amber-50 text-amber-600'
                              : e.payment_mode === 'BANK'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-violet-50 text-violet-600'
                          }`}>
                            {e.payment_mode}
                          </span>
                          {e.account_no && (
                            <span className="text-[9px] font-mono text-gray-400">#{e.account_no}</span>
                          )}
                          {e.page_no && (
                            <span className="text-[9px] text-gray-400">p.{e.page_no}</span>
                          )}
                        </div>
                      </div>
                      {/* Amount */}
                      <span className={`font-bold font-mono text-sm whitespace-nowrap ${
                        isJama ? 'text-emerald-700' : 'text-red-600'
                      }`}>
                        ₹{fmt(e.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Edit button */}
                  {isEditing ? (
                    <span className="shrink-0 flex h-7 items-center px-2 rounded-lg bg-violet-100 text-[9px] font-semibold text-violet-600 whitespace-nowrap">
                      {lang === 'gu' ? 'સુધારાઈ રહ્યું' : 'editing'}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEditClick(e.id)}
                      className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 opacity-0 transition-opacity group-hover:opacity-100 hover:border-violet-300 hover:text-violet-600"
                      title={lang === 'gu' ? 'સુધારો' : 'Edit'}
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Footer total */}
      {entries.length > 0 && (
        <div className={`mt-2 flex items-center justify-between rounded-xl px-4 py-2.5 border ${
          isJama
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
            : 'bg-red-50 border-red-100 text-red-800'
        }`}>
          <span className="text-xs font-medium opacity-75">
            {lang === 'gu' ? 'કુલ' : 'Total for'} {date ? formatDate(date) : ''}
          </span>
          <span className="text-sm font-bold font-mono">₹{fmt(total)}</span>
        </div>
      )}
    </div>
  )
}
