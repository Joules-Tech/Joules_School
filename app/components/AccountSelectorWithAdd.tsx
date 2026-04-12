'use client'

import { useState, useTransition } from 'react'
import { quickCreateAccount } from '../../lib/actions/account-actions'

type Account = { id: string; account_name: string; account_number: string }
type Lang = 'en' | 'gu'

export default function AccountSelectorWithAdd({
  initialAccounts,
  defaultValue = '',
  lang,
}: {
  initialAccounts: Account[]
  defaultValue?: string
  lang: Lang
}) {
  const [accounts, setAccounts]   = useState<Account[]>(initialAccounts)
  const [selected, setSelected]   = useState(defaultValue)
  const [showAdd, setShowAdd]     = useState(initialAccounts.length === 0) // auto-open if no accounts
  const [newNum, setNewNum]       = useState('')
  const [newName, setNewName]     = useState('')
  const [addError, setAddError]   = useState('')
  const [isPending, startTransition] = useTransition()

  const handleAdd = () => {
    if (!newNum.trim() || !newName.trim()) {
      setAddError(lang === 'gu' ? 'બંને ક્ષેત્ર જરૂરી છે.' : 'Both fields are required.')
      return
    }
    setAddError('')
    startTransition(async () => {
      const result = await quickCreateAccount(newNum.trim(), newName.trim())
      if (result.error) {
        setAddError(result.error)
      } else if (result.data) {
        const newAccount = result.data
        setAccounts(prev =>
          [...prev, newAccount].sort((a, b) => a.account_number.localeCompare(b.account_number))
        )
        setSelected(newAccount.account_number)
        setNewNum('')
        setNewName('')
        setShowAdd(false)
      }
    })
  }

  return (
    <div className="space-y-2">
      {/* Dropdown row */}
      <div className="flex gap-2">
        <select
          name="account_no"
          value={selected}
          onChange={e => setSelected(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 pl-4 pr-10 py-3 text-sm shadow-sm focus:border-[#9C43A6] focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
        >
          <option value="">{lang === 'gu' ? '— કોઈ નહીં —' : '— None —'}</option>
          {accounts.map(a => (
            <option key={a.id} value={a.account_number}>
              {a.account_number} — {a.account_name}
            </option>
          ))}
        </select>

        {/* Toggle add form */}
        <button
          type="button"
          onClick={() => { setShowAdd(v => !v); setAddError('') }}
          title={lang === 'gu' ? 'નવું ખાતું ઉમેરો' : 'Add new account'}
          className={`rounded-xl border px-3.5 py-2 text-base font-bold transition-all ${
            showAdd
              ? 'border-violet-300 bg-violet-100 text-violet-700'
              : 'border-gray-200 bg-white text-gray-500 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-600'
          }`}
        >
          {showAdd ? '✕' : '+'}
        </button>
      </div>

      {/* Inline add form */}
      {showAdd && (
        <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-3 space-y-2.5">
          <p className="text-xs font-semibold text-violet-700">
            {lang === 'gu' ? 'નવું ખાતું ઉમેરો' : 'Quick Add Account'}
          </p>

          {addError && (
            <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs text-red-600">
              {addError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                value={newNum}
                onChange={e => setNewNum(e.target.value)}
                placeholder={lang === 'gu' ? 'ખાતા નં. (F-12)' : 'Account No. (F-12)'}
                className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
              />
            </div>
            <div>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
                placeholder={lang === 'gu' ? 'ખાતા નામ (ઉદા. ફી ખાતું)' : 'Account Name (e.g. Fees)'}
                className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs placeholder:text-gray-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={handleAdd}
              className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60 transition-opacity"
            >
              {isPending
                ? (lang === 'gu' ? 'સાચવી રહ્યા…' : 'Saving…')
                : (lang === 'gu' ? '+ ઉમેરો' : '+ Add')}
            </button>
            <span className="text-[10px] text-violet-500">
              {lang === 'gu'
                ? 'ઉમેર્યા પછી આ ડ્રોપડાઉનમાં આવશે'
                : 'Will appear in dropdown after adding'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
