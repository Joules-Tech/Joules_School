import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../../lib/supabase-admin'
import { getCurrentUserWithProfile } from '../../../lib/auth'
import { getLang } from '../../../lib/get-lang'
import { t } from '../../../lib/translations'
import LanguageToggle from '../../components/LanguageToggle'
import Sidebar from '../../components/Sidebar'
import AccountSelectorWithAdd from '../../components/AccountSelectorWithAdd'
import LiveEntriesPanel from '../../components/LiveEntriesPanel'
import DeleteEntryButton from '../../components/DeleteEntryButton'

// ─── INSERT ────────────────────────────────────────────────────────────────────

async function insertEntry(formData: FormData): Promise<{ entry_type: string; entry_date: string } | never> {
  'use server'
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/auth/register-school')
  if (!['owner', 'accountant'].includes(profile.role)) redirect('/rojmel')

  const entry_date         = String(formData.get('entry_date')         || '')
  const description        = String(formData.get('description')        || '')
  const description_detail = String(formData.get('description_detail') || '')
  const amount             = Number(formData.get('amount')             || 0)
  const entry_type         = String(formData.get('entry_type')         || 'IN') as 'IN' | 'OUT'
  const payment_mode       = String(formData.get('payment_mode')       || 'CASH') as 'CASH' | 'BANK' | 'UPI'
  const page_no            = String(formData.get('page_no')            || '')
  const account_no         = String(formData.get('account_no')         || '')

  const { error } = await supabase.from('rojmel_entries').insert({
    school_id: profile.school_id,
    entry_date, description, description_detail, amount, entry_type, payment_mode, page_no, account_no,
    created_by: user.id,
  })

  if (error) {
    redirect(`/rojmel/add?error=${encodeURIComponent(error.message)}&type=${entry_type}&date=${entry_date}`)
  }

  return { entry_type, entry_date }
}

async function addRojmelEntry(formData: FormData) {
  'use server'
  const result = await insertEntry(formData)
  redirect(`/rojmel/add?type=${result.entry_type}&date=${result.entry_date}&added=1`)
}

async function addRojmelEntryAndAnother(formData: FormData) {
  'use server'
  const result = await insertEntry(formData)
  redirect(`/rojmel/add?type=${result.entry_type}&date=${result.entry_date}&added=1`)
}

// ─── UPDATE ────────────────────────────────────────────────────────────────────

async function updateRojmelEntry(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'accountant'].includes(profile.role)) redirect('/rojmel/add')

  const id = String(formData.get('id') || '')
  if (!id) redirect('/rojmel/add')

  const admin = createSupabaseAdminClient()

  const { data: existing } = await admin
    .from('rojmel_entries')
    .select('school_id, entry_type, entry_date')
    .eq('id', id)
    .single()

  if (!existing || existing.school_id !== profile.school_id) redirect('/rojmel/add')

  const entry_date         = String(formData.get('entry_date')         || '')
  const description        = String(formData.get('description')        || '')
  const description_detail = String(formData.get('description_detail') || '')
  const amount             = Number(formData.get('amount')             || 0)
  const entry_type         = String(formData.get('entry_type')         || 'IN') as 'IN' | 'OUT'
  const payment_mode       = String(formData.get('payment_mode')       || 'CASH') as 'CASH' | 'BANK' | 'UPI'
  const page_no            = String(formData.get('page_no')            || '')
  const account_no         = String(formData.get('account_no')         || '')

  const { error } = await admin
    .from('rojmel_entries')
    .update({ entry_date, description, description_detail, amount, entry_type, payment_mode, page_no, account_no })
    .eq('id', id)

  if (error) {
    redirect(`/rojmel/add?edit=${id}&error=${encodeURIComponent(error.message)}`)
  }

  redirect(`/rojmel/add?type=${entry_type}&date=${entry_date}&updated=1`)
}

// ─── DELETE ────────────────────────────────────────────────────────────────────

async function deleteRojmelEntryInline(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'accountant'].includes(profile.role)) redirect('/rojmel/add')

  const id = String(formData.get('id') || '')
  if (!id) redirect('/rojmel/add')

  const admin = createSupabaseAdminClient()

  const { data: existing } = await admin
    .from('rojmel_entries')
    .select('school_id, entry_type, entry_date')
    .eq('id', id)
    .single()

  if (!existing || existing.school_id !== profile.school_id) redirect('/rojmel/add')

  await admin.from('rojmel_entries').delete().eq('id', id)

  redirect(`/rojmel/add?type=${existing.entry_type}&date=${existing.entry_date}&deleted=1`)
}

// ─── PAGE ──────────────────────────────────────────────────────────────────────

export default async function AddRojmelPage(props: any) {
  const [{ user, profile }, lang] = await Promise.all([
    getCurrentUserWithProfile(),
    getLang(),
  ])

  if (!user) redirect('/auth/login')
  if (!profile?.school_id) redirect('/auth/register-school')
  if (!['owner', 'accountant'].includes(profile.role)) redirect('/rojmel')

  const tr = t(lang)
  const searchParams = await props.searchParams
  const error    = searchParams?.error   as string | undefined
  const added    = searchParams?.added   === '1'
  const updated  = searchParams?.updated === '1'
  const deleted  = searchParams?.deleted === '1'
  const preType  = (searchParams?.type as string) || 'IN'
  const editId   = searchParams?.edit    as string | undefined

  const today        = new Date().toISOString().slice(0, 10)
  const preDate      = (searchParams?.date as string) || today

  const supabase = await createSupabaseServerClient()

  // Fetch accounts for dropdown
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, account_name, account_number')
    .eq('school_id', profile.school_id)
    .order('account_number', { ascending: true })

  // If editing, fetch the entry
  let editEntry: {
    id: string
    entry_date: string
    description: string
    description_detail: string
    amount: number
    entry_type: 'IN' | 'OUT'
    payment_mode: string
    page_no: string
    account_no: string
  } | null = null

  if (editId) {
    const admin = createSupabaseAdminClient()
    const { data } = await admin
      .from('rojmel_entries')
      .select('id, entry_date, description, description_detail, amount, entry_type, payment_mode, page_no, account_no')
      .eq('id', editId)
      .eq('school_id', profile.school_id)
      .single()

    editEntry = data || null
    if (!editEntry) redirect('/rojmel/add')
  }

  const isEditMode = !!editEntry

  // Panel initial state: if editing use entry's date, otherwise use persisted date from URL
  const panelDate = editEntry?.entry_date || preDate
  const panelType = (editEntry?.entry_type || (preType === 'OUT' ? 'OUT' : 'IN')) as 'IN' | 'OUT'

  return (
    <div className="flex h-full flex-1 min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/rojmel/add" />

      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8 min-h-0">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isEditMode && (
              <Link
                href="/rojmel/add"
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                title={lang === 'gu' ? 'પાછા જાઓ' : 'Back to Add'}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                {isEditMode
                  ? (lang === 'gu' ? 'નોંધ સુધારો' : 'Edit Entry')
                  : tr.addEntryTitle}
              </h1>
              {isEditMode && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {lang === 'gu' ? 'માહિતી બદલો અને સાચવો' : 'Update details below'}
                </p>
              )}
            </div>
          </div>
          <LanguageToggle />
        </div>

        {/* Flash banners */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}
        {added && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {lang === 'gu' ? 'નોંધ સફળતાપૂર્વક ઉમેરાઈ!' : 'Entry added successfully!'}
          </div>
        )}
        {updated && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {lang === 'gu' ? 'નોંધ સફળતાપૂર્વક અપડેટ થઈ!' : 'Entry updated successfully!'}
          </div>
        )}
        {deleted && (
          <div className="mb-4 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {lang === 'gu' ? 'નોંધ ભૂંસાઈ ગઈ.' : 'Entry deleted.'}
          </div>
        )}

        {/* Two-column layout */}
        <div className="flex flex-1 gap-6 min-h-0 items-start">

          {/* ── Left: form ── */}
          <div className="flex-1 min-w-0 max-w-2xl">

            {/* Edit mode indicator */}
            {isEditMode && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5">
                <div className="h-2 w-2 rounded-full bg-violet-400" />
                <span className="text-xs font-medium text-violet-700">
                  {lang === 'gu' ? 'સુધારવા મોડ' : 'Edit mode'}
                </span>
                <Link
                  href="/rojmel/add"
                  className="ml-auto text-xs text-violet-500 hover:text-violet-700 hover:underline"
                >
                  {lang === 'gu' ? 'રદ કરો' : 'Cancel & add new'}
                </Link>
              </div>
            )}

            <form action={isEditMode ? updateRojmelEntry : addRojmelEntry} className="space-y-5">
              {isEditMode && <input type="hidden" name="id" value={editEntry!.id} />}

              {/* Entry type */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">{tr.entryTypeLabel}</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative flex cursor-pointer flex-col items-center rounded-2xl border-2 p-4 transition-all has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50 border-gray-200 hover:border-gray-300">
                    <input
                      type="radio" name="entry_type" value="IN"
                      defaultChecked={isEditMode ? editEntry!.entry_type === 'IN' : panelType === 'IN'}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">⬅️</span>
                    <span className="text-sm font-semibold text-emerald-700">{tr.jama}</span>
                    <span className="text-xs text-gray-500 text-center mt-0.5">{lang === 'gu' ? 'ક્રેડિટ / આવક' : 'Credit / Income'}</span>
                  </label>
                  <label className="relative flex cursor-pointer flex-col items-center rounded-2xl border-2 p-4 transition-all has-[:checked]:border-red-400 has-[:checked]:bg-red-50 border-gray-200 hover:border-gray-300">
                    <input
                      type="radio" name="entry_type" value="OUT"
                      defaultChecked={isEditMode ? editEntry!.entry_type === 'OUT' : panelType === 'OUT'}
                      className="sr-only"
                    />
                    <span className="text-2xl mb-1">➡️</span>
                    <span className="text-sm font-semibold text-red-700">{tr.udhar}</span>
                    <span className="text-xs text-gray-500 text-center mt-0.5">{lang === 'gu' ? 'ડેબિટ / ખર્ચ' : 'Debit / Expense'}</span>
                  </label>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label htmlFor="entry_date" className="block text-sm font-semibold text-gray-700">{tr.date}</label>
                <input
                  id="entry_date" name="entry_date" type="date"
                  defaultValue={isEditMode ? editEntry!.entry_date : preDate}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                />
              </div>

              {/* Description + Detail */}
              <div className="space-y-3 rounded-2xl border border-gray-100 bg-white/60 p-4">
                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                    {tr.descriptionLabel}
                    <span className="ml-1 text-red-400">*</span>
                  </label>
                  <input
                    id="description" name="description" type="text" required
                    defaultValue={isEditMode ? (editEntry!.description || '') : ''}
                    placeholder={lang === 'gu' ? 'ટૂંકી વિગત લખો…' : 'Short description…'}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="description_detail" className="block text-sm font-medium text-gray-500">
                    {tr.descriptionDetailLabel}
                  </label>
                  <textarea
                    id="description_detail" name="description_detail" rows={2}
                    defaultValue={isEditMode ? (editEntry!.description_detail || '') : ''}
                    placeholder={lang === 'gu' ? 'વધુ વિગત (વૈકલ્પિક)…' : 'Additional details (optional)…'}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#9C43A6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                  />
                </div>
              </div>

              {/* Amount + Payment mode */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="amount" className="block text-sm font-semibold text-gray-700">{tr.amountLabel}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₹</span>
                    <input
                      id="amount" name="amount" type="number" step="0.01" min="0.01" required
                      defaultValue={isEditMode ? editEntry!.amount : undefined}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-gray-300 py-3 pl-7 pr-4 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="payment_mode" className="block text-sm font-semibold text-gray-700">{tr.paymentMode}</label>
                  <select
                    id="payment_mode" name="payment_mode"
                    defaultValue={isEditMode ? editEntry!.payment_mode : 'CASH'}
                    className="w-full rounded-xl border border-gray-300 pl-4 pr-10 py-3 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                  >
                    <option value="CASH">{tr.cash}</option>
                    <option value="BANK">{tr.bank}</option>
                    <option value="UPI">{tr.upi}</option>
                  </select>
                </div>
              </div>

              {/* Receipt No. + Account dropdown */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="page_no" className="block text-sm font-semibold text-gray-700">{tr.pageNoLabel}</label>
                  <input
                    id="page_no" name="page_no" type="text"
                    defaultValue={isEditMode ? (editEntry!.page_no || '') : ''}
                    placeholder={lang === 'gu' ? 'ઉદા. 42' : 'e.g. 42'}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{tr.accountNoLabel}</label>
                  <AccountSelectorWithAdd
                    initialAccounts={accounts || []}
                    defaultValue={isEditMode ? (editEntry!.account_no || '') : ''}
                    lang={lang}
                  />
                </div>
              </div>

              {/* ── Action buttons ── */}
              {isEditMode ? (
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] py-3.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                  >
                    {lang === 'gu' ? 'ફેરફાર સાચવો' : 'Save Changes'}
                  </button>
                  <Link
                    href="/rojmel/add"
                    className="flex-1 rounded-xl border border-gray-200 bg-white py-3.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {tr.cancel}
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] py-3.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                    >
                      {tr.saveEntry}
                    </button>
                    <Link
                      href="/rojmel"
                      className="flex-1 rounded-xl border border-gray-200 bg-white py-3.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {tr.cancel}
                    </Link>
                  </div>
                  <button
                    type="submit"
                    formAction={addRojmelEntryAndAnother}
                    className="w-full rounded-xl border border-violet-200 bg-violet-50 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                  >
                    {lang === 'gu' ? '+ સાચવો અને બીજી નોંધ ઉમેરો' : '+ Save & Add Another'}
                  </button>
                </div>
              )}
            </form>

            {/* Delete section — only in edit mode */}
            {isEditMode && (
              <div className="mt-6 rounded-2xl border border-red-100 bg-red-50/50 p-4">
                <p className="text-xs font-semibold text-red-800">
                  {lang === 'gu' ? 'આ નોંધ કાઢી નાખો' : 'Delete this entry'}
                </p>
                <p className="mt-0.5 text-[11px] text-red-500">
                  {lang === 'gu'
                    ? 'આ ક્રિયા પૂર્વવત્ કરી શકાતી નથી.'
                    : 'This action cannot be undone.'}
                </p>
                <div className="mt-3">
                  <DeleteEntryButton id={editEntry!.id} action={deleteRojmelEntryInline} lang={lang} />
                </div>
              </div>
            )}
          </div>

          {/* ── Right: live entries panel ── */}
          <div className="w-[380px] shrink-0 sticky top-5 flex flex-col" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            <div className="mb-2 flex items-center gap-2 px-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-xs font-medium text-gray-500">
                {lang === 'gu' ? 'આ તારીખની નોંધ — લાઇવ' : 'Entries for date — live'}
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <LiveEntriesPanel
                initialDate={panelDate}
                initialType={panelType}
                lang={lang}
                editingId={editId}
              />
            </div>
          </div>

        </div>{/* end two-column */}
      </main>
    </div>
  )
}
