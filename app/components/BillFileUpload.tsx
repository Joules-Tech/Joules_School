'use client'

import { useState, useRef } from 'react'
import { supabaseBrowserClient } from '../../lib/supabase-client'

interface Props {
  schoolId: string
  financialYear: string
  existingUrl?: string
  existingName?: string
  lang: string
  /** Called with (publicUrl, fileName) after successful upload, or (null, null) when cleared */
  onUpload: (url: string | null, name: string | null) => void
}

export default function BillFileUpload({ schoolId, financialYear, existingUrl, existingName, lang, onUpload }: Props) {
  const [fileUrl, setFileUrl]   = useState<string | null>(existingUrl ?? null)
  const [fileName, setFileName] = useState<string | null>(existingName ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError(lang === 'gu' ? 'ફ઼ાઇલ 5 MB કરતાં મોટી છે.' : 'File exceeds 5 MB limit.')
      return
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError(lang === 'gu' ? 'માત્ર PDF, JPG, PNG ટેકો.' : 'Only PDF, JPG, PNG files are supported.')
      return
    }

    setError(null)
    setUploading(true)

    const ext  = file.name.split('.').pop() ?? 'bin'
    const path = `${schoolId}/${financialYear}/${Date.now()}.${ext}`

    const { error: upErr } = await supabaseBrowserClient
      .storage
      .from('bills')
      .upload(path, file, { upsert: true })

    if (upErr) {
      setError(upErr.message)
      setUploading(false)
      return
    }

    const { data } = supabaseBrowserClient.storage.from('bills').getPublicUrl(path)
    setFileUrl(data.publicUrl)
    setFileName(file.name)
    onUpload(data.publicUrl, file.name)
    setUploading(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function clearFile() {
    setFileUrl(null)
    setFileName(null)
    onUpload(null, null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Already have a file ────────────────────────────────────────────────────
  if (fileUrl && fileName) {
    const isPdf = fileName.toLowerCase().endsWith('.pdf')
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
          {isPdf ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-emerald-800 truncate">{fileName}</p>
          <a href={fileUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-emerald-600 hover:underline">
            {lang === 'gu' ? 'ફ઼ાઇલ જુઓ / ડાઉનલોડ' : 'View / Download'}
          </a>
        </div>
        <button type="button" onClick={clearFile}
          className="shrink-0 rounded-lg p-1.5 text-emerald-400 hover:bg-emerald-100 hover:text-red-500 transition-colors"
          title={lang === 'gu' ? 'ફ઼ાઇલ હટાવો' : 'Remove file'}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  // ── Upload area ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors ${
          dragOver
            ? 'border-[#9C43A6] bg-violet-50'
            : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/40'
        }`}
      >
        {uploading ? (
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#9C43A6] border-t-transparent" />
        ) : (
          <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-600">
            {uploading
              ? (lang === 'gu' ? 'અપલોડ થઈ રહ્યું છે…' : 'Uploading…')
              : (lang === 'gu' ? 'ક્લિક કરો અથવા ફ઼ાઇલ ખેંચો' : 'Click to upload or drag & drop')}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">PDF, JPG, PNG — max 5 MB</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={uploading}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
