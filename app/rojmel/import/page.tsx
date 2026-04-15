import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { getLang } from '../../../lib/get-lang'
import { t } from '../../../lib/translations'
import LanguageToggle from '../../components/LanguageToggle'
import Sidebar from '../../components/Sidebar'
import ImportRojmelClient from '../../components/ImportRojmelClient'

export default async function ImportPage() {
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

  const tr = t(lang)

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} role={profile.role} lang={lang} active="/rojmel/import" />

      <main className="flex flex-1 flex-col bg-[#FFF7F4]/80 px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              {tr.importTitle}
            </h1>
            <p className="mt-0.5 text-xs text-gray-500">
              {tr.importSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link
              href="/rojmel"
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              ← {lang === 'gu' ? 'રોજમેળ' : 'Back to Rojmel'}
            </Link>
          </div>
        </div>

        <ImportRojmelClient lang={lang} />
      </main>
    </div>
  )
}
