import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { getCurrentUserWithProfile } from '../../../lib/auth'
import { getLang } from '../../../lib/get-lang'
import { t } from '../../../lib/translations'
import LanguageToggle from '../../components/LanguageToggle'
import Sidebar from '../../components/Sidebar'

async function saveAccount(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id, role').eq('id', user.id).single()

  if (!profile?.school_id) redirect('/auth/register-school')
  if (!['owner', 'accountant'].includes(profile.role)) redirect('/khatavahi')

  const account_name   = String(formData.get('account_name')   || '').trim()
  const account_number = String(formData.get('account_number') || '').trim()

  if (!account_name || !account_number) {
    redirect('/khatavahi/add-account?error=Both+fields+are+required')
  }

  const { error } = await supabase.from('accounts').insert({
    school_id: profile.school_id,
    account_name,
    account_number,
  })

  if (error) {
    const friendly = error.message.includes('unique constraint')
      ? `Account number "${account_number}" already exists. Please use a different account number.`
      : error.message
    redirect(`/khatavahi/add-account?error=${encodeURIComponent(friendly)}`)
  }

  redirect('/khatavahi/add-account?success=1')
}

async function updateAccount(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id, role').eq('id', user.id).single()

  if (!profile?.school_id || !['owner', 'accountant'].includes(profile.role)) {
    redirect('/khatavahi')
  }

  const id           = String(formData.get('id')           || '').trim()
  const account_name = String(formData.get('account_name') || '').trim()

  if (!id || !account_name) {
    redirect('/khatavahi/add-account?error=Account+name+cannot+be+empty')
  }

  const { error } = await supabase
    .from('accounts')
    .update({ account_name })
    .eq('id', id)
    .eq('school_id', profile.school_id)

  if (error) {
    redirect(`/khatavahi/add-account?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/khatavahi/add-account?updated=1')
}

async function deleteAccount(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id, role').eq('id', user.id).single()

  if (!profile?.school_id || !['owner', 'accountant'].includes(profile.role)) {
    redirect('/khatavahi')
  }

  const id = String(formData.get('id') || '')
  if (!id) redirect('/khatavahi/add-account')

  await supabase.from('accounts').delete().eq('id', id).eq('school_id', profile.school_id)
  redirect('/khatavahi/add-account?deleted=1')
}

export default async function AddAccountPage(props: any) {
  const [{ user, profile }, lang] = await Promise.all([
    getCurrentUserWithProfile(),
    getLang(),
  ])

  if (!user) redirect('/auth/login')
  if (!profile?.school_id) redirect('/auth/register-school')
  if (!['owner', 'accountant'].includes(profile.role)) redirect('/khatavahi')

  const tr = t(lang)
  const searchParams = await props.searchParams
  const error   = searchParams?.error   as string | undefined
  const success = searchParams?.success as string | undefined
  const deleted = searchParams?.deleted as string | undefined
  const updated = searchParams?.updated as string | undefined
  const editId  = searchParams?.edit    as string | undefined  // which account is being edited

  const supabase = await createSupabaseServerClient()
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, account_name, account_number, created_at')
    .eq('school_id', profile.school_id)
    .order('account_number', { ascending: true })

  const editingAccount = editId ? (accounts || []).find(a => a.id === editId) : null

  return (
    <div className="flex h-full flex-1 min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/khatavahi/add-account" />

      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {lang === 'gu' ? 'નોંધ ખાતું' : 'Manage Accounts'}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {lang === 'gu' ? 'ખાતાવહી માટે ખાતાઓ ઉમેરો' : 'Add accounts used in Khatavahi'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/khatavahi/import"
              className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
            >
              ↑ {lang === 'gu' ? 'ખાતા આયાત' : 'Bulk Import'}
            </a>
            <LanguageToggle />
          </div>
        </div>

        {/* Toast messages */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {decodeURIComponent(error)}
          </div>
        )}
        {(success || deleted || updated) && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {deleted
              ? (lang === 'gu' ? 'ખાતું કાઢ્યું.' : 'Account deleted.')
              : updated
              ? (lang === 'gu' ? 'ખાતાનું નામ સુધાર્યું.' : 'Account name updated.')
              : tr.accountSaved}
          </div>
        )}

        <div className="max-w-2xl space-y-6">

          {/* ── Edit form (shown when ?edit=<id> is in URL) ── */}
          {editingAccount && (
            <div className="rounded-2xl bg-white/90 p-5 shadow-sm border border-violet-200">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-lg bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700 font-mono">
                  {editingAccount.account_number}
                </span>
                <h2 className="text-sm font-semibold text-violet-800">
                  {lang === 'gu' ? 'ખાતાનું નામ સુધારો' : 'Edit Account Name'}
                </h2>
              </div>
              <form action={updateAccount} className="flex gap-3 items-end">
                <input type="hidden" name="id" value={editingAccount.id} />
                <div className="flex-1 space-y-1.5">
                  <label htmlFor="edit_account_name" className="block text-sm font-medium text-gray-700">
                    {tr.accountName}
                  </label>
                  <input
                    id="edit_account_name"
                    name="account_name"
                    type="text"
                    required
                    defaultValue={editingAccount.account_name}
                    className="w-full rounded-xl border border-violet-300 px-4 py-2.5 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                  >
                    {lang === 'gu' ? 'સાચવો' : 'Save'}
                  </button>
                  <a
                    href="/khatavahi/add-account"
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    {lang === 'gu' ? 'રદ' : 'Cancel'}
                  </a>
                </div>
              </form>
            </div>
          )}

          {/* ── Add new account form ── */}
          {!editingAccount && (
            <div className="rounded-2xl bg-white/90 p-5 shadow-sm border border-gray-100">
              <h2 className="mb-4 text-sm font-semibold text-gray-700">
                {lang === 'gu' ? 'નવું ખાતું ઉમેરો' : 'Add New Account'}
              </h2>
              <form action={saveAccount} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="account_number" className="block text-sm font-medium text-gray-700">
                      {tr.accountNumber}
                    </label>
                    <input
                      id="account_number" name="account_number" type="text" required
                      placeholder={lang === 'gu' ? 'ઉદા. F-12' : 'e.g. F-12'}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="account_name" className="block text-sm font-medium text-gray-700">
                      {tr.accountName}
                    </label>
                    <input
                      id="account_name" name="account_name" type="text" required
                      placeholder={lang === 'gu' ? 'ઉદા. ફી ખાતું' : 'e.g. Fees Account'}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                >
                  + {tr.saveAccount}
                </button>
              </form>
            </div>
          )}

          {/* ── Account list ── */}
          <div className="rounded-2xl bg-white/90 shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                {lang === 'gu' ? 'ખાતાઓની યાદી' : 'Account List'}
              </h2>
              <span className="text-xs text-gray-400">
                {(accounts || []).length} {lang === 'gu' ? 'ખાતા' : 'accounts'}
              </span>
            </div>

            {(!accounts || accounts.length === 0) ? (
              <div className="px-5 py-10 text-center text-sm text-gray-400">{tr.noAccountsYet}</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {accounts.map(a => (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between px-5 py-3 transition-colors ${
                      editId === a.id ? 'bg-violet-50/60' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="rounded-lg bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-700 font-mono shrink-0">
                        {a.account_number}
                      </span>
                      <span className="text-sm font-medium text-gray-800 truncate">{a.account_name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {/* Edit button — links to ?edit=<id> */}
                      <a
                        href={editId === a.id ? '/khatavahi/add-account' : `/khatavahi/add-account?edit=${a.id}`}
                        className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                          editId === a.id
                            ? 'bg-violet-100 text-violet-700'
                            : 'text-violet-600 hover:bg-violet-50'
                        }`}
                      >
                        {editId === a.id
                          ? (lang === 'gu' ? 'સંપાદન...' : 'Editing…')
                          : (lang === 'gu' ? 'સુધારો' : 'Edit')}
                      </a>
                      {/* Delete button */}
                      <form action={deleteAccount}>
                        <input type="hidden" name="id" value={a.id} />
                        <button
                          type="submit"
                          className="rounded-lg px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          {tr.deleteAccount}
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
