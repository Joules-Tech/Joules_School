'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'

type Mode = 'total' | 'cash' | 'bank'
type Lang = 'en' | 'gu'

const OPTIONS: { value: Mode; en: string; gu: string; color: string; active: string }[] = [
  {
    value: 'total',
    en: 'Total',
    gu: 'કુલ',
    color: 'border-gray-300 text-gray-700 hover:border-violet-300 hover:bg-violet-50',
    active: 'border-violet-400 bg-violet-50 text-violet-800 shadow-sm',
  },
  {
    value: 'cash',
    en: 'Cash',
    gu: 'રોકડ',
    color: 'border-gray-300 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50',
    active: 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm',
  },
  {
    value: 'bank',
    en: 'Bank / UPI',
    gu: 'બૅન્ક / UPI',
    color: 'border-gray-300 text-gray-700 hover:border-blue-300 hover:bg-blue-50',
    active: 'border-blue-400 bg-blue-50 text-blue-800 shadow-sm',
  },
]

export default function BalanceModeToggle({ current, lang }: { current: Mode; lang: Lang }) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (mode: Mode) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('mode', mode)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
        {lang === 'gu' ? 'શિલક:' : 'Balance:'}
      </span>
      <div className="flex gap-1.5">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
              current === opt.value ? opt.active : opt.color
            }`}
          >
            {lang === 'gu' ? opt.gu : opt.en}
          </button>
        ))}
      </div>
    </div>
  )
}
