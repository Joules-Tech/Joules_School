import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { getLang } from '../../../lib/get-lang'
import { t } from '../../../lib/translations'
import LanguageToggle from '../../components/LanguageToggle'
import Sidebar from '../../components/Sidebar'
import ImportAccountsClient from '../../components/ImportAccountsClient'

export default async function ImportAccountsPage() {
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
  if (!['owner', 'accountant'].includes(profile.role)) redirect('/khatavahi')

  const tr = t(lang)

  return (
    <div className="flex h-full flex-1 min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/khatavahi/import" />

      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {tr.importAccountsTitle}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {tr.importAccountsSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href="/khatavahi/add-account"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              ← {lang === 'gu' ? 'ખાતા સૂચિ' : 'Back to Accounts'}
            </Link>
          </div>
        </div>

        <ImportAccountsClient lang={lang} />
      </main>
    </div>
  )
}
