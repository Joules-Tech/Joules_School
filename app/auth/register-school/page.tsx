import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../../lib/supabase-admin'

async function registerSchool(formData: FormData) {
  'use server'

  // 1. Get the authenticated user
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) redirect('/auth/login')

  const school_name = String(formData.get('school_name') || '').trim()
  if (!school_name) {
    redirect('/auth/register-school?error=School+name+is+required')
  }

  const address      = String(formData.get('address') || '')
  const phone        = String(formData.get('phone') || '')
  const email        = String(formData.get('email') || '')
  const opening_cash = Number(formData.get('opening_cash') || 0)
  const opening_bank = Number(formData.get('opening_bank') || 0)

  // 2. Use admin client — bypasses ALL RLS so nothing can silently fail
  const admin = createSupabaseAdminClient()

  // 3. Ensure the profile row exists for this user
  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id, school_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingProfile) {
    // Create missing profile (happens when DB trigger wasn't in place at signup)
    const { error: profileCreateError } = await admin.from('profiles').insert({
      id: user.id,
      full_name:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        '',
      role: 'viewer',
      school_id: null,
    })
    if (profileCreateError) {
      const msg = encodeURIComponent('Failed to create profile: ' + profileCreateError.message)
      redirect(`/auth/register-school?error=${msg}`)
    }
  }

  // 4. If already linked to a school, go straight to dashboard
  if (existingProfile?.school_id) redirect('/dashboard')

  // 5. Insert the school
  const { data: school, error: schoolError } = await admin
    .from('schools')
    .insert({
      school_name,
      address,
      phone,
      email,
      opening_cash,
      opening_bank,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (schoolError || !school) {
    const msg = encodeURIComponent(schoolError?.message || 'Failed to create school')
    redirect(`/auth/register-school?error=${msg}`)
  }

  // 6. Link the profile to the school and make user the owner
  const { error: linkError } = await admin
    .from('profiles')
    .update({ school_id: school.id, role: 'owner' })
    .eq('id', user.id)

  if (linkError) {
    const msg = encodeURIComponent('School created but profile link failed: ' + linkError.message)
    redirect(`/auth/register-school?error=${msg}`)
  }

  redirect('/dashboard')
}

export default async function RegisterSchoolPage(props: any) {
  // Check if already has a school
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.school_id) redirect('/dashboard')

  const searchParams = await props.searchParams
  const error = searchParams?.error as string | undefined

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Register Your School</h1>
          <p className="mt-1 text-sm text-gray-500">Set up your school to start using Joules Rojmel</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form action={registerSchool} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="school_name" className="block text-sm font-semibold text-gray-700">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              id="school_name"
              name="school_name"
              required
              placeholder="e.g. Joules English Medium School"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="address" className="block text-sm font-semibold text-gray-700">Address</label>
            <textarea
              id="address"
              name="address"
              rows={2}
              placeholder="School address"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Contact number"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="school@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="opening_cash" className="block text-sm font-semibold text-gray-700">
                Opening Cash (₹)
              </label>
              <input
                id="opening_cash"
                name="opening_cash"
                type="number"
                step="0.01"
                min="0"
                defaultValue={0}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="opening_bank" className="block text-sm font-semibold text-gray-700">
                Opening Bank (₹)
              </label>
              <input
                id="opening_bank"
                name="opening_bank"
                type="number"
                step="0.01"
                min="0"
                defaultValue={0}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          >
            Create School & Continue →
          </button>
        </form>
      </div>
    </div>
  )
}
