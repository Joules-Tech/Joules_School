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
    <aside className="hidden w-60 flex-shrink-0 md:flex md:flex-col sticky top-0 h-screen overflow-y-auto border-r border-white/60 bg-white/80 backdrop-blur-xl px-4 py-5">

      {/* Brand */}
      <div className="mb-6 flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#9C43A6] via-[#DB515E] to-[#FFA86A] text-white shadow-md shadow-violet-200">
          <span className="text-xs font-bold tracking-tight">JR</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-900">{tr.appName}</p>
          <p className="truncate text-[10px] text-gray-400">{tr.schoolFinance}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 text-sm font-medium">

        {/* Main */}
        {item('/dashboard', tr.dashboard)}

        {/* Rojmel section */}
        <p className="mt-4 mb-1 px-3 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
          {lang === 'gu' ? 'રોજમેળ' : 'Rojmel'}
        </p>
        {item('/rojmel', tr.rojmel)}
        {isOwnerOrAccountant && item('/rojmel/add', tr.addEntry)}
        {isOwnerOrAccountant && item('/rojmel/import', tr.importEntry)}

        {/* Khatavahi section */}
        <p className="mt-4 mb-1 px-3 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
          {lang === 'gu' ? 'ખાતાવહી' : 'Khatavahi'}
        </p>
        {item('/khatavahi', tr.khatavahi)}
        {isOwnerOrAccountant && item('/khatavahi/add-account', tr.addAccount)}
        {isOwnerOrAccountant && item('/khatavahi/import', tr.importAccounts)}

        {/* Bills section */}
        <p className="mt-4 mb-1 px-3 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
          {lang === 'gu' ? 'પાવતી' : 'Bills'}
        </p>
        {item('/bills', tr.bills)}
        {isOwnerOrAccountant && item('/bills/add', tr.addBill)}

        {/* Settings section */}
        <p className="mt-4 mb-1 px-3 text-[9px] font-semibold uppercase tracking-widest text-gray-400">
          {lang === 'gu' ? 'સેટિંગ' : 'Settings'}
        </p>
        {item('/settings/users', tr.users)}
        {item('/settings/year-balances', tr.openingBalances)}
      </nav>

      {/* Footer */}
      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
        <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">{tr.loggedInAs}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-gray-700">{user.email}</p>
      </div>
    </aside>
  )
}
