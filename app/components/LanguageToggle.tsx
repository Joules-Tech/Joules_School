'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function LanguageToggle() {
  const router = useRouter()
  const [lang, setLang] = useState<'en' | 'gu'>('en')

  // Read current lang from cookie on mount
  useEffect(() => {
    const match = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('lang='))
    const saved = match?.split('=')[1]
    if (saved === 'gu' || saved === 'en') setLang(saved)
  }, [])

  const toggle = () => {
    const next: 'en' | 'gu' = lang === 'en' ? 'gu' : 'en'
    // Persist for 1 year
    document.cookie = `lang=${next}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
    setLang(next)
    router.refresh() // Re-render server components with new lang
  }

  return (
    <button
      onClick={toggle}
      title={lang === 'en' ? 'Switch to Gujarati' : 'Switch to English'}
      className="flex items-center gap-1 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all hover:bg-white hover:shadow"
    >
      <span
        className={`transition-colors ${
          lang === 'en' ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        EN
      </span>
      <span className="text-gray-300 font-light">|</span>
      <span
        className={`transition-colors ${
          lang === 'gu' ? 'text-blue-600' : 'text-gray-400'
        }`}
      >
        ગુ
      </span>
    </button>
  )
}
