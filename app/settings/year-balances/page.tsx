import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../../lib/auth'
import { getLang } from '../../../lib/get-lang'
import { t, currentFY } from '../../../lib/translations'
import LanguageToggle from '../../components/LanguageToggle'
import Sidebar from '../../components/Sidebar'

async function saveOpeningBalances(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/auth/register-school')
  if (profile.role !== 'owner') redirect('/dashboard')

  const financial_year = String(formData.get('financial_year') || currentFY())
  const opening_cash = Number(formData.get('opening_cash') || 0)
  const opening_bank = Number(formData.get('opening_bank') || 0)
  const opening_loan = Number(formData.get('opening_loan') || 0)
  const notes = String(formData.get('notes') || '')

  // Upsert — overwrite if exists for this year
  const { error } = await supabase
    .from('year_opening_balances')
    .upsert(
      {
        school_id: profile.school_id,
        financial_year,
        opening_cash,
        opening_bank,
        opening_loan,
        notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'school_id,financial_year' }
    )

  if (error) {
    const params = new URLSearchParams({ error: error.message })
    redirect(`/settings/year-balances?${params.toString()}`)
  }

  const params = new URLSearchParams({ success: '1' })
  redirect(`/settings/year-balances?${params.toString()}`)
}

export default async function YearBalancesPage(props: any) {
  const [{ user, profile }, lang] = await Promise.all([
    getCurrentUserWithProfile(),
    getLang(),
  ])

  if (!user) redirect('/auth/login')
  if (!profile?.school_id) redirect('/auth/register-school')
  if (profile.role !== 'owner') redirect('/dashboard')

  const tr = t(lang)
  const supabase = await createSupabaseServerClient()
  const fy = currentFY()

  const searchParams = await props.searchParams
  const error = searchParams?.error as string | undefined
  const success = searchParams?.success === '1'

  // Fetch existing opening balances for current FY
  const { data: existing } = await supabase
    .from('year_opening_balances')
    .select('*')
    .eq('school_id', profile.school_id)
    .eq('financial_year', fy)
    .maybeSingle()

  // Fetch school defaults (set during registration)
  const { data: school } = await supabase
    .from('schools')
    .select('school_name, opening_cash, opening_bank')
    .eq('id', profile.school_id)
    .single()

  return (
    <div className="flex h-full flex-1 min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/settings/year-balances" />

      {/* Main */}
      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{tr.setBalTitle}</h1>
            <p className="mt-0.5 text-xs text-gray-500">{tr.setBalSubtitle(fy)}</p>
            {school?.school_name && (
              <p className="mt-0.5 text-xs font-medium text-gray-700">{school.school_name}</p>
            )}
          </div>
          <LanguageToggle />
        </div>

        {/* Success */}
        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <svg className="h-5 w-5 flex-shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-emerald-800">{tr.balSavedSuccess}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {existing && (
          <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {tr.balAlreadySet}
          </div>
        )}

        <form action={saveOpeningBalances} className="max-w-lg space-y-5">
          {/* Hidden FY */}
          <input type="hidden" name="financial_year" value={fy} />

          {/* Cash */}
          <div className="space-y-2">
            <label htmlFor="opening_cash" className="block text-sm font-semibold text-gray-700">
              {tr.openingCash}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₹</span>
              <input
                id="opening_cash"
                name="opening_cash"
                type="number"
                step="0.01"
                min="0"
                defaultValue={existing?.opening_cash ?? school?.opening_cash ?? 0}
                className="w-full rounded-xl border border-gray-300 py-3 pl-7 pr-4 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              />
            </div>
          </div>

          {/* Bank */}
          <div className="space-y-2">
            <label htmlFor="opening_bank" className="block text-sm font-semibold text-gray-700">
              {tr.openingBank}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₹</span>
              <input
                id="opening_bank"
                name="opening_bank"
                type="number"
                step="0.01"
                min="0"
                defaultValue={existing?.opening_bank ?? school?.opening_bank ?? 0}
                className="w-full rounded-xl border border-gray-300 py-3 pl-7 pr-4 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              />
            </div>
          </div>

          {/* Loan */}
          <div className="space-y-2">
            <label htmlFor="opening_loan" className="block text-sm font-semibold text-gray-700">
              {tr.openingLoan}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₹</span>
              <input
                id="opening_loan"
                name="opening_loan"
                type="number"
                step="0.01"
                min="0"
                defaultValue={existing?.opening_loan ?? 0}
                className="w-full rounded-xl border border-gray-300 py-3 pl-7 pr-4 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700">
              {tr.balNotes}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={existing?.notes ?? ''}
              placeholder={lang === 'gu' ? 'ઉદા. ગત વર્ષની રોકડ ₹5000 બચી' : 'e.g. Carried forward from last year…'}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] py-3.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              {tr.saveBalances}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 rounded-xl border border-gray-200 bg-white py-3.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {tr.cancel}
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
