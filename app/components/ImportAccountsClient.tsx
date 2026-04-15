'use client'

import { useState, useCallback, useRef } from 'react'
import { importAccounts, type ImportAccountRow } from '../../lib/actions/import-actions'

type Lang = 'en' | 'gu'

type ParsedRow = {
  rowNum: number
  account_number: string
  account_name: string
  errors: string[]
}

// ── Template download ──────────────────────────────────────────────────────────

function downloadTemplate() {
  const header = 'account_number,account_name'
  const ex1    = 'F-01,Fees Account'
  const ex2    = 'F-02,Salary Account'
  const ex3    = 'F-03,Building Fund'
  const csv    = [header, ex1, ex2, ex3].join('\n')
  const blob   = new Blob([csv], { type: 'text/csv' })
  const url    = URL.createObjectURL(blob)
  const a      = document.createElement('a')
  a.href       = url
  a.download   = 'accounts_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Validation ─────────────────────────────────────────────────────────────────

function validateRow(row: ParsedRow): string[] {
  const errors: string[] = []
  if (!row.account_number.trim()) errors.push('Account number required')
  if (!row.account_name.trim())   errors.push('Account name required')
  return errors
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ImportAccountsClient({ lang }: { lang: Lang }) {
  const [step, setStep]             = useState<'upload' | 'preview' | 'done'>('upload')
  const [rows, setRows]             = useState<ParsedRow[]>([])
  const [fileName, setFileName]     = useState('')
  const [dragging, setDragging]     = useState(false)
  const [parseError, setParseError] = useState('')
  const [importing, setImporting]   = useState(false)
  const [result, setResult]         = useState<{ created: number; skipped: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const gu = lang === 'gu'

  // ── Parse file ──────────────────────────────────────────────────────────────

  const parseFile = useCallback(async (file: File) => {
    setParseError('')
    setFileName(file.name)

    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    let wb: ReturnType<typeof XLSX.read>

    try {
      wb = XLSX.read(buffer, { type: 'array' })
    } catch {
      setParseError(gu ? 'ફ઼ાઇલ વાંચી શકાઈ નહીં.' : 'Could not read file. Make sure it is a valid .xlsx or .csv.')
      return
    }

    const ws   = wb.Sheets[wb.SheetNames[0]]
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

    if (!data.length) {
      setParseError(gu ? 'ફ઼ાઇલ ખાલી છે.' : 'File is empty or has no data rows.')
      return
    }

    const get = (raw: Record<string, unknown>, ...keys: string[]) => {
      for (const k of keys) {
        if (raw[k] !== undefined && raw[k] !== '') return String(raw[k])
      }
      return ''
    }

    // Deduplicate account_numbers within the file itself
    const seenNums = new Set<string>()
    const parsed: ParsedRow[] = data.map((raw, idx) => {
      const account_number = get(raw, 'account_number', 'Account No', 'Account No.', 'number', 'Number', 'No').trim()
      const account_name   = get(raw, 'account_name', 'Account Name', 'name', 'Name').trim()

      const row: ParsedRow = {
        rowNum: idx + 2,
        account_number,
        account_name,
        errors: [],
      }
      row.errors = validateRow(row)

      const key = account_number.toLowerCase()
      if (key && seenNums.has(key)) {
        row.errors.push('Duplicate in this file')
      } else if (key) {
        seenNums.add(key)
      }

      return row
    })

    setRows(parsed)
    setStep('preview')
  }, [gu])

  // ── Drop handlers ──────────────────────────────────────────────────────────

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) parseFile(file)
  }, [parseFile])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  // ── Confirm import ─────────────────────────────────────────────────────────

  const handleImport = async () => {
    const valid = rows.filter(r => r.errors.length === 0)
    if (!valid.length) return

    setImporting(true)
    const payload: ImportAccountRow[] = valid.map(r => ({
      account_number: r.account_number,
      account_name:   r.account_name,
    }))

    const res = await importAccounts(payload)
    setImporting(false)

    if (res.error) {
      setParseError(res.error)
    } else {
      setResult({ created: res.created, skipped: res.skipped })
      setStep('done')
    }
  }

  const reset = () => {
    setStep('upload'); setRows([]); setFileName('')
    setParseError(''); setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const validCount   = rows.filter(r => r.errors.length === 0).length
  const invalidCount = rows.filter(r => r.errors.length > 0).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── STEP 1: Upload ────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-5">

          {/* Instructions */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 space-y-2">
            <p className="text-sm font-semibold text-violet-800">
              {gu ? 'કેવી રીતે ઉપયોગ કરવો' : 'How to use'}
            </p>
            <ol className="list-decimal list-inside text-xs text-violet-700 space-y-1">
              <li>{gu ? 'ટેમ્પ્લેટ ડાઉનલોડ કરો' : 'Download the template'}</li>
              <li>{gu ? 'ખાતા નં. અને ખાતા નામ ભરો' : 'Fill in account number and account name for each account'}</li>
              <li>{gu ? 'ઉદ. પંક્તિ ભૂંસો, ફ઼ાઇલ અહીં અપલોડ કરો' : 'Delete example rows, then upload the file here'}</li>
              <li>{gu ? 'પ્રીવ્યૂ ચકાસો અને "આયાત" ક્લિક કરો' : 'Review the preview and click Import'}</li>
            </ol>
            <p className="text-[10px] text-violet-500 pt-1">
              {gu
                ? 'પહેલેથી અસ્તિત્વ ધરાવતા ખાતા નં. આપોઆપ છોડવામાં આવશે.'
                : 'Accounts that already exist (same account number) will be skipped automatically.'}
            </p>
          </div>

          {/* Template download */}
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {gu ? 'ટેમ્પ્લેટ ડાઉનલોડ (.csv)' : 'Download Template (.csv)'}
          </button>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 transition-all ${
              dragging
                ? 'border-violet-400 bg-violet-50'
                : 'border-gray-200 bg-white/70 hover:border-violet-300 hover:bg-violet-50/30'
            }`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-500">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">
                {gu ? 'ક્લિક કરો અથવા ફ઼ાઇલ ખેંચો' : 'Click to upload or drag & drop'}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {gu ? '.xlsx, .xls, .csv ટેકો' : 'Supports .xlsx, .xls, .csv'}
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={onFileChange}
            />
          </div>

          {parseError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {parseError}
            </p>
          )}
        </div>
      )}

      {/* ── STEP 2: Preview ───────────────────────────────────────────────── */}
      {step === 'preview' && (
        <div className="space-y-4">

          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600 truncate max-w-xs">{fileName}</span>
            <div className="flex items-center gap-2 ml-auto">
              {validCount > 0 && (
                <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {gu ? `${validCount} સાચા` : `${validCount} valid`}
                </span>
              )}
              {invalidCount > 0 && (
                <span className="rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {gu ? `${invalidCount} ભૂલ` : `${invalidCount} errors`}
                </span>
              )}
              <button type="button" onClick={reset}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50">
                {gu ? 'બીજી ફ઼ાઇલ' : 'Choose another file'}
              </button>
            </div>
          </div>

          {parseError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{parseError}</p>
          )}

          {/* Preview table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="grid grid-cols-[40px_120px_1fr_100px] gap-0 border-b border-gray-100 bg-gray-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              <span>{gu ? 'પં.' : 'Row'}</span>
              <span>{gu ? 'ખાતા નં.' : 'Account No.'}</span>
              <span>{gu ? 'ખાતા નામ' : 'Account Name'}</span>
              <span>{gu ? 'સ્થિતિ' : 'Status'}</span>
            </div>

            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
              {rows.map((row, idx) => {
                const hasError = row.errors.length > 0
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-[40px_120px_1fr_100px] gap-0 px-4 py-2.5 text-xs ${
                      hasError ? 'bg-red-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 self-center">{row.rowNum}</span>
                    <span className="font-mono font-semibold text-violet-700 self-center">
                      {row.account_number || '—'}
                    </span>
                    <span className="text-gray-800 self-center truncate pr-2">
                      {row.account_name || '—'}
                    </span>
                    <div className="self-center">
                      {hasError ? (
                        <div className="space-y-0.5">
                          {row.errors.map((e, i) => (
                            <p key={i} className="text-[10px] text-red-600 leading-snug">{e}</p>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {gu ? 'ઠીક' : 'OK'}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-3 pt-1">
            {validCount > 0 ? (
              <button
                type="button"
                disabled={importing}
                onClick={handleImport}
                className="rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
              >
                {importing
                  ? (gu ? 'ઉમેરી રહ્યા છીએ…' : 'Creating accounts…')
                  : (gu ? `${validCount} ખાતા ઉમેરો` : `Create ${validCount} account${validCount === 1 ? '' : 's'}`)}
              </button>
            ) : (
              <p className="text-sm text-red-600">
                {gu ? 'કોઈ સાચા ખાતા નથી.' : 'No valid accounts to import. Fix errors and re-upload.'}
              </p>
            )}
            {invalidCount > 0 && validCount > 0 && (
              <p className="text-xs text-gray-400">
                {gu
                  ? `(${invalidCount} ભૂલ સાથેની પંક્તિ છોડવામાં આવશે)`
                  : `(${invalidCount} row${invalidCount === 1 ? '' : 's'} with errors will be skipped)`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ──────────────────────────────────────────────────── */}
      {step === 'done' && result && (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 py-16 px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-800">
              {gu ? `${result.created} ખાતા સફળ!` : `${result.created} account${result.created === 1 ? '' : 's'} created!`}
            </p>
            {result.skipped > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                {gu
                  ? `${result.skipped} ખાતા પહેલેથી હતા, છોડ્યા.`
                  : `${result.skipped} skipped — already existed.`}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <a
              href="/khatavahi"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {gu ? 'ખાતાવહી જુઓ' : 'View Khatavahi'}
            </a>
            <a
              href="/khatavahi/add-account"
              className="rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              {gu ? 'ખાતા સૂચિ' : 'Manage Accounts'}
            </a>
            <button
              type="button"
              onClick={reset}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {gu ? 'બીજી ફ઼ાઇલ' : 'Import another file'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
