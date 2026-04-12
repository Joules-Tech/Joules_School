import { cookies } from 'next/headers'
import type { Lang } from './translations'

/**
 * Server-side helper: reads the `lang` cookie set by LanguageToggle.
 * Falls back to 'en' if not set or invalid.
 */
export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies()
  const value = cookieStore.get('lang')?.value
  return value === 'gu' ? 'gu' : 'en'
}
