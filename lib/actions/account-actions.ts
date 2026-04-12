'use server'

import { createSupabaseServerClient } from '../supabase-server'

export async function quickCreateAccount(account_number: string, account_name: string) {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id || !['owner', 'accountant'].includes(profile.role)) {
    return { error: 'Not authorized' }
  }

  const { data, error } = await supabase
    .from('accounts')
    .insert({ school_id: profile.school_id, account_name, account_number })
    .select('id, account_name, account_number')
    .single()

  if (error) {
    const friendly = error.message.includes('unique constraint')
      ? `Account number "${account_number}" already exists.`
      : error.message
    return { error: friendly }
  }

  return { data }
}
