import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../../../lib/supabase-admin'
import { getLang } from '../../../../lib/get-lang'
import { t } from '../../../../lib/translations'
import LanguageToggle from '../../../components/LanguageToggle'
import DeleteEntryButton from '../../../components/DeleteEntryButton'
import Sidebar from '../../../components/Sidebar'
import AccountSelectorWithAdd from '../../../components/AccountSelectorWithAdd'
import SpreadsheetDescriptionEditor from '../../../components/SpreadsheetDescriptionEditor'

async function updateEntry(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'accountant'].includes(profile.role)) {
    redirect('/rojmel')
  }

  const id = String(formData.get('id') || '')
  if (!id) redirect('/rojmel')

  const admin = createSupabaseAdminClient()

  // Verify this entry belongs to the user's school
  const { data: existing } = await admin
    .from('rojmel_entries')
    .select('school_id')
    .eq('id', id)
    .single()

  if (!existing || existing.school_id !== profile.school_id) {
    redirect('/rojmel')
  }

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
    redirect(`/rojmel/${id}/edit?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/rojmel')
}

async function deleteEntry(formData: FormData) {
  'use server'

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'accountant'].includes(profile.role)) {
    redirect('/rojmel')
  }

  const id = String(formData.get('id') || '')
  if (!id) redirect('/rojmel')

  const admin = createSupabaseAdminClient()

  // Verify ownership before deleting
  const { data: existing } = await admin
    .from('rojmel_entries')
    .select('school_id')
    .eq('id', id)
    .single()

  if (!existing || existing.school_id !== profile.school_id) {
    redirect('/rojmel')
  }

  await admin.from('rojmel_entries').delete().eq('id', id)
  redirect('/rojmel')
}

export default async function EditEntryPage(props: any) {
  const supabase = await createSupabaseServerClient()
  const [{ data: { user } }, lang] = await Promise.all([
    supabase.auth.getUser(),
    getLang(),
  ])

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) redirect('/auth/register-school')
  if (!['owner', 'accountant'].includes(profile.role)) redirect('/rojmel')

  const params = await props.params
  const id = params.id as string
  const tr = t(lang)

  const admin = createSupabaseAdminClient()
  const [{ data: entry }, { data: accounts }] = await Promise.all([
    admin.from('rojmel_entries').select('*').eq('id', id).eq('school_id', profile.school_id).single(),
    supabase.from('accounts').select('id, account_name, account_number').eq('school_id', profile.school_id).order('account_number'),
  ])

  if (!entry) redirect('/rojmel')

  const searchParams = await props.searchParams
  const error = searchParams?.error as string | undefined

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/rojmel" />

      {/* Main */}
      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {lang === 'gu' ? 'નોંધ સુધારો' : 'Edit Entry'}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {lang === 'gu' ? 'માહિતી સુધારીને સાચવો' : 'Update the entry details below'}
            </p>
          </div>
          <LanguageToggle />
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Edit Form */}
        <form action={updateEntry} className="max-w-2xl space-y-5">
          <input type="hidden" name="id" value={id} />

          {/* Entry type */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">{tr.entryTypeLabel}</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="relative flex cursor-pointer flex-col items-center rounded-2xl border-2 p-4 transition-all has-[:checked]:border-emerald-400 has-[:checked]:bg-emerald-50 border-gray-200 hover:border-gray-300">
                <input type="radio" name="entry_type" value="IN" defaultChecked={entry.entry_type === 'IN'} className="sr-only" />
                <span className="text-2xl mb-1">⬅️</span>
                <span className="text-sm font-semibold text-emerald-700">{tr.jama}</span>
                <span className="text-xs text-gray-500 text-center mt-0.5">{lang === 'gu' ? 'ક્રેડિટ / આવક' : 'Credit / Income'}</span>
              </label>
              <label className="relative flex cursor-pointer flex-col items-center rounded-2xl border-2 p-4 transition-all has-[:checked]:border-red-400 has-[:checked]:bg-red-50 border-gray-200 hover:border-gray-300">
                <input type="radio" name="entry_type" value="OUT" defaultChecked={entry.entry_type === 'OUT'} className="sr-only" />
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
              id="entry_date" name="entry_date" type="date" defaultValue={entry.entry_date} required
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
                defaultValue={entry.description || ''}
                placeholder={lang === 'gu' ? 'ટૂંકી વિગત લખો…' : 'Short description…'}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              />
            </div>
            <SpreadsheetDescriptionEditor
              key={id}
              name="description_detail"
              defaultValue={entry.description_detail || ''}
              lang={lang}
            />
          </div>

          {/* Amount + Payment mode */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-semibold text-gray-700">{tr.amountLabel}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">₹</span>
                <input
                  id="amount" name="amount" type="number" step="0.01" min="0.01" defaultValue={entry.amount} required
                  className="w-full rounded-xl border border-gray-300 py-3 pl-7 pr-4 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="payment_mode" className="block text-sm font-semibold text-gray-700">{tr.paymentMode}</label>
              <select
                id="payment_mode" name="payment_mode" defaultValue={entry.payment_mode}
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
                id="page_no" name="page_no" type="text" defaultValue={entry.page_no || ''}
                placeholder={lang === 'gu' ? 'ઉદા. 42' : 'e.g. 42'}
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">{tr.accountNoLabel}</label>
              <AccountSelectorWithAdd
                initialAccounts={accounts || []}
                defaultValue={entry.account_no || ''}
                lang={lang}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] py-3.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              {lang === 'gu' ? 'ફેરફાર સાચવો' : 'Save Changes'}
            </button>
            <Link
              href="/rojmel"
              className="flex-1 rounded-xl border border-gray-200 bg-white py-3.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {tr.cancel}
            </Link>
          </div>
        </form>

        {/* Delete section */}
        <div className="mt-8 max-w-2xl rounded-2xl border border-red-100 bg-red-50/50 p-5">
          <p className="text-sm font-semibold text-red-800">
            {lang === 'gu' ? 'આ નોંધ કાઢી નાખો' : 'Delete this entry'}
          </p>
          <p className="mt-1 text-xs text-red-600">
            {lang === 'gu'
              ? 'આ ક્રિયા પૂર્વવત્ કરી શકાતી નથી. નોંધ કાયમ માટે ભૂંસાઈ જશે.'
              : 'This action cannot be undone. The entry will be permanently deleted.'}
          </p>
          <div className="mt-3">
            <DeleteEntryButton id={id} action={deleteEntry} lang={lang} />
          </div>
        </div>
      </main>
    </div>
  )
}
