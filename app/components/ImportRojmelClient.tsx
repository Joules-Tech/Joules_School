'use client'

import { useState, useCallback, useRef } from 'react'
import { importRojmelEntries, type ImportRow } from '../../lib/actions/import-actions'

type Lang = 'en' | 'gu'

// ── Types ──────────────────────────────────────────────────────────────────────

type ParsedRow = {
  rowNum: number
  entry_date: string
  entry_type: 'IN' | 'OUT' | ''
  description: string
  description_detail: string
  amount: number | null
  payment_mode: 'CASH' | 'BANK' | 'UPI'
  page_no: string
  account_no: string
  errors: string[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = String(val).trim()
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  // Excel serial number (days since 1900-01-00, with 1900 leap-year bug)
  const num = Number(str)
  if (!isNaN(num) && num > 40000 && num < 60000) {
    const date = new Date((num - 25569) * 86400 * 1000)
    const iso = date.toISOString().split('T')[0]
    return iso
  }
  return str
}

function parseEntryType(val: unknown): 'IN' | 'OUT' | '' {
  const v = String(val ?? '').trim().toLowerCase()
  if (['in', 'jama', 'credit', 'income', 'cr', 'જમા'].includes(v)) return 'IN'
  if (['out', 'udhar', 'debit', 'expense', 'dr', 'ઉધાર'].includes(v)) return 'OUT'
  return ''
}

function parsePaymentMode(val: unknown): 'CASH' | 'BANK' | 'UPI' {
  const v = String(val ?? '').trim().toUpperCase()
  if (v === 'BANK') return 'BANK'
  if (v === 'UPI') return 'UPI'
  return 'CASH'
}

function parseAmount(val: unknown): number | null {
  const n = Number(String(val ?? '').replace(/[₹,]/g, '').trim())
  if (isNaN(n) || n <= 0) return null
  return n
}

function validateRow(row: ParsedRow): string[] {
  const errors: string[] = []
  if (!row.entry_date) {
    errors.push('Date required')
  } else {
    const d = new Date(row.entry_date)
    if (isNaN(d.getTime())) errors.push('Invalid date (use YYYY-MM-DD or DD/MM/YYYY)')
  }
  if (!row.entry_type) errors.push('Type must be IN/OUT or Jama/Udhar')
  if (!row.description.trim()) errors.push('Description required')
  if (row.amount === null) errors.push('Amount must be a positive number')
  return errors
}

// ── Template download ─────────────────────────────────────────────────────────

function downloadTemplate() {
  const header = 'entry_date,entry_type,description,description_detail,amount,payment_mode,page_no,account_no'
  const ex1   = '2024-04-01,IN,Fees Collection,Class 10 fees,5000,CASH,42,F-01'
  const ex2   = '2024-04-01,OUT,Salary Payment,Teacher salary April,25000,BANK,,F-05'
  const csv   = [header, ex1, ex2].join('\n')
  const blob  = new Blob([csv], { type: 'text/csv' })
  const url   = URL.createObjectURL(blob)
  const a     = document.createElement('a')
  a.href      = url
  a.download  = 'rojmel_import_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ImportRojmelClient({ lang }: { lang: Lang }) {
  const [step, setStep]           = useState<'upload' | 'preview' | 'done'>('upload')
  const [rows, setRows]           = useState<ParsedRow[]>([])
  const [fileName, setFileName]   = useState('')
  const [dragging, setDragging]   = useState(false)
  const [parseError, setParseError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState(0)
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
      wb = XLSX.read(buffer, { type: 'array', cellDates: false })
    } catch {
      setParseError(gu ? 'ફ઼ાઇલ વાંચી શકાઈ નહીં.' : 'Could not read file. Make sure it is a valid .xlsx or .csv.')
      return
    }

    const ws    = wb.Sheets[wb.SheetNames[0]]
    const data  = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

    if (!data.length) {
      setParseError(gu ? 'ફ઼ાઇલ ખાલી છે.' : 'File is empty or has no data rows.')
      return
    }

    const parsed: ParsedRow[] = data.map((raw, idx) => {
      // Support both exact column names and common variants
      const get = (...keys: string[]) => {
        for (const k of keys) {
          if (raw[k] !== undefined && raw[k] !== '') return raw[k]
        }
        return ''
      }

      const entry_date        = parseDate(get('entry_date', 'date', 'Date', 'Entry Date'))
      const entry_type        = parseEntryType(get('entry_type', 'type', 'Type', 'Entry Type'))
      const description       = String(get('description', 'Description', 'desc') ?? '').trim()
      const description_detail = String(get('description_detail', 'detail', 'Detail', 'Notes') ?? '').trim()
      const amount            = parseAmount(get('amount', 'Amount', 'amt'))
      const payment_mode      = parsePaymentMode(get('payment_mode', 'mode', 'Mode', 'Payment Mode'))
      const page_no           = String(get('page_no', 'page', 'Page', 'Receipt No', 'receipt_no', 'Receipt No.') ?? '').trim()
      const account_no        = String(get('account_no', 'account', 'Account', 'A/C', 'Account No.') ?? '').trim()

      const row: ParsedRow = {
        rowNum: idx + 2, // +2 because row 1 is header
        entry_date, entry_type, description, description_detail,
        amount, payment_mode, page_no, account_no, errors: [],
      }
      row.errors = validateRow(row)
      return row
    })

    setRows(parsed)
    setStep('preview')
  }, [gu])

  // ── Drag & drop handlers ───────────────────────────────────────────────────

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

  // ── Import confirmed ───────────────────────────────────────────────────────

  const handleImport = async () => {
    const valid = rows.filter(r => r.errors.length === 0)
    if (!valid.length) return

    setImporting(true)
    const payload: ImportRow[] = valid.map(r => ({
      entry_date:        r.entry_date,
      entry_type:        r.entry_type as 'IN' | 'OUT',
      description:       r.description,
      description_detail: r.description_detail,
      amount:            r.amount!,
      payment_mode:      r.payment_mode,
      page_no:           r.page_no,
      account_no:        r.account_no,
    }))

    const result = await importRojmelEntries(payload)
    setImporting(false)

    if (result.error) {
      setParseError(result.error)
    } else {
      setImportedCount(result.imported)
      setStep('done')
    }
  }

  // ── Counts ─────────────────────────────────────────────────────────────────

  const validCount   = rows.filter(r => r.errors.length === 0).length
  const invalidCount = rows.filter(r => r.errors.length > 0).length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── STEP 1: Upload ──────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="space-y-5">

          {/* Instructions card */}
          <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-5 space-y-2">
            <p className="text-sm font-semibold text-violet-800">
              {gu ? 'કેવી રીતે ઉપયોગ કરવો' : 'How to use'}
            </p>
            <ol className="list-decimal list-inside text-xs text-violet-700 space-y-1">
              <li>{gu ? 'નીચે ટેમ્પ્લેટ ડાઉનલોડ કરો' : 'Download the template below'}</li>
              <li>{gu ? 'Excel/CSV માં ડેટા ભરો (ઉદાહરણ પંક્તિ ભૂંસો)' : 'Fill in your data in Excel / CSV (delete example rows)'}</li>
              <li>{gu ? 'ફ઼ાઇલ અહીં અપલોડ કરો' : 'Upload the file here'}</li>
              <li>{gu ? 'પ્રીવ્યૂ ચકાસો અને "આયાત" ક્લિક કરો' : 'Review the preview and click Import'}</li>
            </ol>
            <div className="pt-1">
              <p className="text-[10px] text-violet-500 font-mono">
                {gu
                  ? 'entry_type: IN = જમા, OUT = ઉધાર  |  payment_mode: CASH / BANK / UPI'
                  : 'entry_type: IN = Jama/Credit, OUT = Udhar/Debit  |  payment_mode: CASH / BANK / UPI'}
              </p>
            </div>
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

      {/* ── STEP 2: Preview ────────────────────────────────────────────────── */}
      {step === 'preview' && (
        <div className="space-y-4">

          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600 truncate max-w-xs">{fileName}</span>
            <div className="flex items-center gap-2 ml-auto">
              {validCount > 0 && (
                <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {gu ? `${validCount} સાચી` : `${validCount} valid`}
                </span>
              )}
              {invalidCount > 0 && (
                <span className="rounded-xl border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                  {gu ? `${invalidCount} ભૂલ` : `${invalidCount} errors`}
                </span>
              )}
              <button
                type="button"
                onClick={() => { setStep('upload'); setRows([]); setFileName(''); if (fileRef.current) fileRef.current.value = '' }}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50"
              >
                {gu ? 'બીજી ફ઼ાઇલ' : 'Choose another file'}
              </button>
            </div>
          </div>

          {parseError && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {parseError}
            </p>
          )}

          {/* Preview table */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[40px_90px_50px_1fr_80px_62px_60px_70px_80px] gap-0 border-b border-gray-100 bg-gray-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              <span>{gu ? 'પં.' : 'Row'}</span>
              <span>{gu ? 'તારીખ' : 'Date'}</span>
              <span>{gu ? 'પ્ર.' : 'Type'}</span>
              <span>{gu ? 'વિગત' : 'Description'}</span>
              <span className="text-right">{gu ? 'રકમ' : 'Amount'}</span>
              <span>{gu ? 'ચૂ.' : 'Mode'}</span>
              <span>{gu ? 'પા.નં.' : 'Page'}</span>
              <span>{gu ? 'ખા.નં.' : 'A/C'}</span>
              <span>{gu ? 'સ્થિતિ' : 'Status'}</span>
            </div>

            <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-50">
              {rows.map((row, idx) => {
                const hasError = row.errors.length > 0
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-[40px_90px_50px_1fr_80px_62px_60px_70px_80px] gap-0 px-3 py-2 text-xs ${
                      hasError ? 'bg-red-50/60' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                    }`}
                  >
                    <span className="text-[10px] text-gray-400 self-center">{row.rowNum}</span>
                    <span className="font-mono text-gray-700 self-center text-[11px]">{row.entry_date || '—'}</span>
                    <span className={`self-center font-semibold text-[11px] ${row.entry_type === 'IN' ? 'text-emerald-600' : row.entry_type === 'OUT' ? 'text-red-600' : 'text-gray-400'}`}>
                      {row.entry_type || '—'}
                    </span>
                    <div className="min-w-0 self-center">
                      <p className="truncate text-gray-800">{row.description || '—'}</p>
                      {row.description_detail && (
                        <p className="truncate text-[10px] text-gray-400 italic">{row.description_detail}</p>
                      )}
                    </div>
                    <span className={`text-right self-center font-mono ${row.amount !== null ? 'text-gray-800' : 'text-red-400'}`}>
                      {row.amount !== null ? `₹${row.amount.toLocaleString('en-IN')}` : '—'}
                    </span>
                    <span className="self-center text-[10px] text-gray-500">{row.payment_mode}</span>
                    <span className="self-center text-gray-500">{row.page_no || ''}</span>
                    <span className="self-center text-gray-500">{row.account_no || ''}</span>
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
                  ? (gu ? 'આયાત થઈ રહ્યું છે…' : 'Importing…')
                  : (gu ? `${validCount} નોંધ આયાત કરો` : `Import ${validCount} entr${validCount === 1 ? 'y' : 'ies'}`)}
              </button>
            ) : (
              <p className="text-sm text-red-600">
                {gu ? 'કોઈ સાચી નોંધ નથી.' : 'No valid rows to import. Fix errors in your file and re-upload.'}
              </p>
            )}
            {invalidCount > 0 && validCount > 0 && (
              <p className="text-xs text-gray-400">
                {gu
                  ? `(${invalidCount} ભૂલ સાથેની નોંધ છોડવામાં આવશે)`
                  : `(${invalidCount} row${invalidCount === 1 ? '' : 's'} with errors will be skipped)`}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── STEP 3: Done ───────────────────────────────────────────────────── */}
      {step === 'done' && (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 py-16 px-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100">
            <svg className="h-8 w-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold text-emerald-800">
              {gu ? `${importedCount} નોંધ સફળ!` : `${importedCount} entries imported!`}
            </p>
            <p className="mt-1 text-sm text-emerald-600">
              {gu ? 'બધી નોંધ રોજમેળમાં ઉમેરાઈ ગઈ.' : 'All entries have been added to Rojmel.'}
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href="/rojmel"
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {gu ? 'રોજમેળ જુઓ' : 'View Rojmel'}
            </a>
            <button
              type="button"
              onClick={() => { setStep('upload'); setRows([]); setFileName(''); setImportedCount(0); if (fileRef.current) fileRef.current.value = '' }}
              className="rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              {gu ? 'બીજી ફ઼ાઇલ' : 'Import another file'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
