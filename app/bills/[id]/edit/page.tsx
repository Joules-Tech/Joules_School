import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../../../lib/supabase-admin'
import { getCurrentUserWithProfile } from '../../../../lib/auth'
import { getLang } from '../../../../lib/get-lang'
import { t, currentFY, availableFYs } from '../../../../lib/translations'
import Sidebar from '../../../components/Sidebar'
import LanguageToggle from '../../../components/LanguageToggle'
import BillEditForm from '../../../components/BillEditForm'

// ── Server actions ─────────────────────────────────────────────────────────────

async function updateBill(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('school_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'accountant'].includes(profile.role)) redirect('/bills')

  const id          = String(formData.get('id') || '')
  const receipt_no  = String(formData.get('receipt_no')  || '')
  const bill_date   = String(formData.get('bill_date')   || '')
  const party_name  = String(formData.get('party_name')  || '')
  const category    = String(formData.get('category')    || '') || null
  const description = String(formData.get('description') || '') || null
  const amountRaw   = formData.get('amount')
  const amount      = amountRaw ? Number(amountRaw) : null
  const file_url    = String(formData.get('file_url')    || '') || null
  const file_name   = String(formData.get('file_name')   || '') || null
  const notes       = String(formData.get('notes')       || '') || null

  const admin = createSupabaseAdminClient()
  const { data: existing } = await admin.from('bills').select('school_id').eq('id', id).single()
  if (!existing || existing.school_id !== profile.school_id) redirect('/bills')

  await admin.from('bills').update({
    receipt_no, bill_date, party_name, category, description, amount, file_url, file_name, notes,
  }).eq('id', id)

  redirect('/bills?updated=1')
}

async function deleteBill(formData: FormData) {
  'use server'
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('school_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'accountant'].includes(profile.role)) redirect('/bills')

  const id    = String(formData.get('id') || '')
  const admin = createSupabaseAdminClient()
  const { data: existing } = await admin.from('bills').select('school_id').eq('id', id).single()
  if (!existing || existing.school_id !== profile.school_id) redirect('/bills')

  await admin.from('bills').delete().eq('id', id)
  redirect('/bills?deleted=1')
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function EditBillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [{ user, profile }, lang] = await Promise.all([getCurrentUserWithProfile(), getLang()])

  if (!user) redirect('/auth/login')
  if (!profile?.school_id) redirect('/auth/register-school')
  if (!['owner', 'accountant'].includes(profile.role)) redirect('/bills')

  const admin = createSupabaseAdminClient()
  const { data: bill } = await admin
    .from('bills')
    .select('*')
    .eq('id', id)
    .eq('school_id', profile.school_id)
    .single()

  if (!bill) redirect('/bills')

  // Linked rojmel entry (match by receipt_no == page_no in same school)
  const supabase = await createSupabaseServerClient()
  const { data: linkedEntries } = await supabase
    .from('rojmel_entries')
    .select('id, entry_date, description, amount, entry_type, payment_mode, page_no')
    .eq('school_id', profile.school_id)
    .eq('page_no', bill.receipt_no)
    .order('entry_date', { ascending: true })

  const tr = t(lang)
  const fmt = (n: number) => Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/bills" />

      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/bills"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                {lang === 'gu' ? 'પાવતી સુધારો' : 'Edit Bill'}
                <span className="ml-2 rounded-lg bg-violet-100 px-2 py-0.5 text-base font-bold text-violet-700">
                  #{bill.receipt_no}
                </span>
              </h1>
              <p className="mt-0.5 text-xs text-gray-400">{bill.party_name} · FY {bill.financial_year}</p>
            </div>
          </div>
          <LanguageToggle />
        </div>

        <div className="flex gap-6 flex-col lg:flex-row items-start">

          {/* ── Left: Edit form (client component) ── */}
          <div className="flex-1 min-w-0 max-w-2xl">
            <BillEditForm
              bill={bill}
              lang={lang}
              schoolId={profile.school_id}
              updateAction={updateBill}
              deleteAction={deleteBill}
            />
          </div>

          {/* ── Right: Linked Rojmel Entries ── */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="rounded-2xl border border-violet-100 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 bg-violet-50 px-4 py-3 border-b border-violet-100">
                <svg className="h-4 w-4 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <p className="text-sm font-semibold text-violet-800">
                  {lang === 'gu' ? 'રોજમેળ નોંધ (પ.નં. ' : 'Rojmel Entries (Receipt #'}{bill.receipt_no})
                </p>
              </div>

              {(!linkedEntries || linkedEntries.length === 0) ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-gray-400">
                    {lang === 'gu'
                      ? `પ.નં. ${bill.receipt_no} વાળી કોઈ રોજમેળ નોંધ નથી.`
                      : `No rojmel entries with Receipt No. ${bill.receipt_no}.`}
                  </p>
                  <Link href={`/rojmel/add`}
                    className="mt-3 inline-block text-xs text-violet-600 hover:underline">
                    {lang === 'gu' ? '+ નોંધ ઉમેરો' : '+ Add entry'}
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {linkedEntries.map(e => {
                    const isJama = e.entry_type === 'IN'
                    return (
                      <div key={e.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-800 truncate">{e.description || '—'}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(e.entry_date)} · {e.payment_mode}</p>
                          </div>
                          <span className={`text-xs font-bold font-mono whitespace-nowrap ${isJama ? 'text-emerald-700' : 'text-red-600'}`}>
                            {isJama ? '+' : '−'}₹{fmt(Number(e.amount))}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${isJama ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            {isJama ? (lang === 'gu' ? 'જમા' : 'Jama') : (lang === 'gu' ? 'ઉધાર' : 'Udhar')}
                          </span>
                          <Link href={`/rojmel/add?edit=${e.id}`}
                            className="text-[9px] text-violet-500 hover:underline">
                            {lang === 'gu' ? 'સુધારો' : 'Edit entry'}
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
