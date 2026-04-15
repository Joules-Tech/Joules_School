'use server'

import { createSupabaseServerClient } from '../supabase-server'
import { createSupabaseAdminClient } from '../supabase-admin'

export type ImportRow = {
  entry_date: string
  entry_type: 'IN' | 'OUT'
  description: string
  description_detail: string
  amount: number
  payment_mode: 'CASH' | 'BANK' | 'UPI'
  page_no: string
  account_no: string
}

export async function importRojmelEntries(
  rows: ImportRow[]
): Promise<{ imported: number; error: string | null }> {
  if (!rows.length) return { imported: 0, error: 'No rows to import' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { imported: 0, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { imported: 0, error: 'No school found' }
  if (!['owner', 'accountant'].includes(profile.role)) {
    return { imported: 0, error: 'Not authorized' }
  }

  const admin = createSupabaseAdminClient()

  const insertData = rows.map(row => ({
    school_id: profile.school_id,
    entry_date: row.entry_date,
    entry_type: row.entry_type,
    description: row.description.trim(),
    description_detail: row.description_detail?.trim() || '',
    amount: row.amount,
    payment_mode: row.payment_mode,
    page_no: row.page_no?.trim() || '',
    account_no: row.account_no?.trim() || '',
  }))

  // Insert in batches of 500 to stay within Supabase limits
  const BATCH = 500
  let totalInserted = 0
  for (let i = 0; i < insertData.length; i += BATCH) {
    const batch = insertData.slice(i, i + BATCH)
    const { error } = await admin.from('rojmel_entries').insert(batch)
    if (error) return { imported: totalInserted, error: error.message }
    totalInserted += batch.length
  }

  return { imported: totalInserted, error: null }
}

export type ImportAccountRow = {
  account_number: string
  account_name: string
}

export async function importAccounts(
  rows: ImportAccountRow[]
): Promise<{ created: number; skipped: number; error: string | null }> {
  if (!rows.length) return { created: 0, skipped: 0, error: 'No rows to import' }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { created: 0, skipped: 0, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.school_id) return { created: 0, skipped: 0, error: 'No school found' }
  if (!['owner', 'accountant'].includes(profile.role)) {
    return { created: 0, skipped: 0, error: 'Not authorized' }
  }

  // Fetch existing account numbers to detect duplicates
  const admin = createSupabaseAdminClient()
  const { data: existing } = await admin
    .from('accounts')
    .select('account_number')
    .eq('school_id', profile.school_id)

  const existingNums = new Set((existing || []).map(a => a.account_number.trim().toLowerCase()))

  const toInsert = rows.filter(r => !existingNums.has(r.account_number.trim().toLowerCase()))
  const skipped  = rows.length - toInsert.length

  if (!toInsert.length) return { created: 0, skipped, error: null }

  const insertData = toInsert.map(row => ({
    school_id:      profile.school_id,
    account_number: row.account_number.trim(),
    account_name:   row.account_name.trim(),
  }))

  const BATCH = 500
  let created = 0
  for (let i = 0; i < insertData.length; i += BATCH) {
    const batch = insertData.slice(i, i + BATCH)
    const { error } = await admin.from('accounts').insert(batch)
    if (error) return { created, skipped, error: error.message }
    created += batch.length
  }

  return { created, skipped, error: null }
}
