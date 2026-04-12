'use server'

import { createSupabaseServerClient } from '../supabase-server'

export type EntryRow = {
  id: string
  entry_date: string
  description: string
  description_detail: string
  amount: number
  entry_type: 'IN' | 'OUT'
  payment_mode: string
  page_no: string
  account_no: string
}

export async function getEntriesForDate(
  date: string,
  entryType: 'IN' | 'OUT'
): Promise<{ data: EntryRow[] | null; error: string | null }> {
  const supabase = await createSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { data: null, error: 'No school found' }

  const { data, error } = await supabase
    .from('rojmel_entries')
    .select('id, entry_date, description, description_detail, amount, entry_type, payment_mode, page_no, account_no')
    .eq('school_id', profile.school_id)
    .eq('entry_date', date)
    .eq('entry_type', entryType)
    .order('created_at', { ascending: true })

  if (error) return { data: null, error: error.message }
  return { data: data as EntryRow[], error: null }
}
