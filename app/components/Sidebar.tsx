import Link from 'next/link'
import { t } from '../../lib/translations'

type Lang = 'en' | 'gu'

interface SidebarProps {
  user: { email?: string | null }
  role: string
  lang: Lang
  active: string   // pathname like '/rojmel', '/khatavahi', etc.
}

export default function Sidebar({ user, role, lang, active }: SidebarProps) {
  const tr = t(lang)
  const isOwnerOrAccountant = ['owner', 'accountant'].includes(role)

  const item = (href: string, label: string) => {
    const isActive = active === href
    return (
      <Link
        href={href}
        className={`flex items-center justify-between rounded-xl px-3 py-2 transition-colors ${
          isActive
            ? 'bg-gradient-to-r from-[#FFE4ED] to-[#FFEFE4] text-[#9C43A6] shadow-sm font-semibold'
            : 'text-gray-500 hover:bg-gray-100'
        }`}
      >
        <span>{label}</span>
        {isActive && <span className="h-2 w-2 rounded-full bg-[#9C43A6]" />}
      </Link>
    )
  }

  return (
    <aside className="hidden w-60 flex-shrink-0 border-r border-white/60 bg-white/70 px-5 py-6 md:flex md:flex-col">
      {/* Brand */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#9C43A6] via-[#DB515E] to-[#FFA86A] text-white shadow-md">
          <span className="text-sm font-bold">JR</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{tr.appName}</p>
          <p className="text-xs text-gray-500">{tr.schoolFinance}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-1 text-sm font-medium">
        {item('/dashboard', tr.dashboard)}
        {item('/rojmel', tr.rojmel)}
        {isOwnerOrAccountant && item('/rojmel/add', tr.addEntry)}
        {isOwnerOrAccountant && item('/rojmel/import', tr.importEntry)}

        {/* Divider */}
        <div className="my-1.5 border-t border-gray-100" />

        {item('/khatavahi', tr.khatavahi)}
        {isOwnerOrAccountant && item('/khatavahi/add-account', tr.addAccount)}
        {isOwnerOrAccountant && item('/khatavahi/import', tr.importAccounts)}

        {/* Divider */}
        <div className="my-1.5 border-t border-gray-100" />

        {item('/settings/users', tr.users)}
        {item('/settings/year-balances', tr.openingBalances)}
      </nav>

      {/* Footer */}
      <div className="mt-auto space-y-1 text-xs text-gray-400">
        <p>{tr.loggedInAs}</p>
        <p className="truncate text-[11px] font-medium text-gray-600">{user.email}</p>
      </div>
    </aside>
  )
}
