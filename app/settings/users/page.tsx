import { redirect } from 'next/navigation'
import { getCurrentUserWithProfile } from '../../../lib/auth'
import { createSupabaseServerClient } from '../../../lib/supabase-server'

export default async function UsersSettingsPage() {
  const { user, profile } = await getCurrentUserWithProfile()

  if (!user) {
    redirect('/auth/login')
  }

  if (!profile?.school_id) {
    redirect('/auth/register-school')
  }

  if (profile.role !== 'owner') {
    redirect('/dashboard')
  }

  const supabase = await createSupabaseServerClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('school_id', profile.school_id)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
      <p className="text-sm text-gray-600">
        Basic user list for this school. Invitation and management workflows will
        be added later.
      </p>
      <div className="overflow-hidden rounded-lg bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Role
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {(users || []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 text-sm text-gray-900">{u.email}</td>
                <td className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-gray-700">
                  {u.role}
                </td>
              </tr>
            ))}
            {(!users || users.length === 0) && (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
