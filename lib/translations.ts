export type Lang = 'en' | 'gu'

export const translations = {
  en: {
    // Brand
    appName: 'Joules Rojmel',
    schoolFinance: 'School Finance',

    // Navigation / sidebar
    dashboard: 'Dashboard',
    rojmel: 'Rojmel',
    addEntry: 'Add Entry',
    users: 'Users',
    settings: 'Settings',
    logout: 'Logout',
    loggedInAs: 'Logged in as',
    openingBalances: 'Opening Balances',

    // Dashboard
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'School finance overview',
    cashBalance: 'Cash Balance',
    bankBalance: 'Bank Balance',
    loanBalance: 'Loan / Liability',
    closingCash: 'Closing cash position',
    closingBank: 'Closing bank position',
    currentLoan: 'Current outstanding loan',
    analytics: 'Analytics',
    thisWeek: 'This week',
    recentActivity: 'Quick Actions',
    addNewEntry: 'Add new rojmel entry',
    viewAllEntries: 'View all entries',
    manageUsers: 'Manage users',
    setOpeningBal: 'Set opening balances',
    financialYear: 'Financial Year',
    academicYear: 'Academic Year',

    // Opening balances banner
    openingBalBannerTitle: 'Opening Balances Not Set',
    openingBalBannerDesc: (fy: string) =>
      `Opening balances for FY ${fy} are not set yet. Set them to get accurate balance calculations.`,
    openingBalBannerBtn: 'Set Opening Balances',
    openingBalReadOnly: (fy: string) =>
      `Opening balances for FY ${fy} have not been set by the owner yet.`,

    // Opening balances page
    setBalTitle: 'Opening Balances',
    setBalSubtitle: (fy: string) => `Financial Year ${fy} (April 1 – March 31)`,
    openingCash: 'Opening Cash (₹)',
    openingBank: 'Opening Bank Balance (₹)',
    openingLoan: 'Loan / Liability (₹)',
    balNotes: 'Notes (optional)',
    saveBalances: 'Save Balances',
    balSavedSuccess: 'Opening balances saved successfully.',
    balAlreadySet: 'Balances already set for this year. Updating…',

    // Rojmel list
    rojmelTitle: 'Rojmel',
    jama: 'Jama',
    jamaFull: 'Jama (Credit / Income)',
    udhar: 'Udhar',
    udharFull: 'Udhar (Debit / Expense)',
    date: 'Date',
    amountCol: 'Ru / Pa',
    description: 'Description',
    pageNo: 'Receipt No.',
    accountNo: 'A/C',
    total: 'Total',
    noEntries: 'No entries found.',
    filterFrom: 'From',
    filterTo: 'To',
    applyFilters: 'Filter',
    clearFilters: 'Clear',

    // Add entry
    addEntryTitle: 'Add Rojmel Entry',
    entryTypeLabel: 'Entry Side',
    jamaOption: 'Jama – Credit / Income',
    udharOption: 'Udhar – Debit / Expense',
    paymentMode: 'Payment Mode',
    cash: 'Cash (રોકડ)',
    bank: 'Bank',
    upi: 'UPI',
    amountLabel: 'Amount (₹)',
    descriptionLabel: 'Description / Details',
    pageNoLabel: 'Receipt No. (પાવતી નં.)',
    accountNoLabel: 'Account No. (A/C No.)',
    descriptionDetailLabel: 'Detailed Description (Optional)',
    saveEntry: 'Save Entry',
    cancel: 'Cancel',

    // Months
    apr: 'April', may: 'May', jun: 'June', jul: 'July',
    aug: 'August', sep: 'September', oct: 'October',
    nov: 'November', dec: 'December', jan: 'January',
    feb: 'February', mar: 'March',

    // Khatavahi
    khatavahi: 'Khatavahi',
    addAccount: 'Add Account',
    khatavahiTitle: 'Khatavahi (Ledger)',
    accountName: 'Account Name',
    accountNumber: 'Account No.',
    saveAccount: 'Save Account',
    selectAccount: '— Select Account —',
    noAccount: '— None —',
    selectYear: 'Financial Year',
    runningBalance: 'Balance',
    debitCol: 'Udhar (Dr)',
    creditCol: 'Jama (Cr)',
    noAccountsYet: 'No accounts yet. Add one from "Add Account".',
    noEntriesForAccount: 'No entries found for this account in the selected year.',
    manageAccounts: 'Manage Accounts',
    deleteAccount: 'Delete',
    accountSaved: 'Account saved.',
    accountDeleted: 'Account deleted.',

    // Common
    loading: 'Loading…',
    error: 'Error',
    success: 'Success',
    role: 'Role',
    owner: 'Owner',
    accountant: 'Accountant',
    viewer: 'Viewer',
  },

  gu: {
    // Brand
    appName: 'જ્યૂલ્સ રોજમેળ',
    schoolFinance: 'શાળા ખાતું',

    // Navigation / sidebar
    dashboard: 'ડૅશબૉર્ડ',
    rojmel: 'રોજમેળ',
    addEntry: 'નોંધ ઉમેરો',
    users: 'વપરાશકર્તા',
    settings: 'સેટિંગ',
    logout: 'લૉગ આઉટ',
    loggedInAs: 'લૉગ ઇન:',
    openingBalances: 'શરૂઆતી શિલક',

    // Dashboard
    dashboardTitle: 'ડૅશબૉર્ડ',
    dashboardSubtitle: 'શાળા નાણાંનો સારાંશ',
    cashBalance: 'રોકડ શિલક',
    bankBalance: 'બૅન્ક શિલક',
    loanBalance: 'લૉન / જવાબદારી',
    closingCash: 'અંતિમ રોકડ સ્થિતિ',
    closingBank: 'અંતિમ બૅન્ક સ્થિતિ',
    currentLoan: 'હાલની બાકી લૉન',
    analytics: 'વિશ્લેષણ',
    thisWeek: 'આ અઠવાડિયે',
    recentActivity: 'ઝડપી ક્રિયા',
    addNewEntry: 'નવી રોજમેળ નોંધ ઉમેરો',
    viewAllEntries: 'બધી નોંધ જુઓ',
    manageUsers: 'વપરાશકર્તા સંચાલન',
    setOpeningBal: 'શરૂઆતી શિલક દાખલ કરો',
    financialYear: 'નાણાકીય વર્ષ',
    academicYear: 'શૈક્ષણિક વર્ષ',

    // Opening balances banner
    openingBalBannerTitle: 'શરૂઆતી શિલક સેટ નથી',
    openingBalBannerDesc: (fy: string) =>
      `FY ${fy} ની શરૂઆતી શિલક હજી સેટ નથી. સચોટ હિસાબ માટે હમણાં સેટ કરો.`,
    openingBalBannerBtn: 'શિલક દાખલ કરો',
    openingBalReadOnly: (fy: string) =>
      `FY ${fy} ની શરૂઆતી શિલક હજી owner દ્વારા સેટ નથી.`,

    // Opening balances page
    setBalTitle: 'શરૂઆતી શિલક',
    setBalSubtitle: (fy: string) => `નાણાકીય વર્ષ ${fy} (૧ એપ્રિલ – ૩૧ માર્ચ)`,
    openingCash: 'શરૂઆતી રોકડ (₹)',
    openingBank: 'શરૂઆતી બૅન્ક શિલક (₹)',
    openingLoan: 'લૉન / જવાબદારી (₹)',
    balNotes: 'નોંધ (વૈકલ્પિક)',
    saveBalances: 'શિલક સાચવો',
    balSavedSuccess: 'શરૂઆતી શિલક સફળતાપૂર્વક સાચવી.',
    balAlreadySet: 'આ વર્ષ માટે શિલક પહેલેથી સેટ છે. અપડેટ થઈ રહ્યું છે…',

    // Rojmel list
    rojmelTitle: 'રોજમેળ',
    jama: 'જમા',
    jamaFull: 'જમા (ક્રેડિટ / આવક)',
    udhar: 'ઉધાર',
    udharFull: 'ઉધાર (ડેબિટ / ખર્ચ)',
    date: 'તારીખ',
    amountCol: 'રૂ / પ.',
    description: 'વિગત',
    pageNo: 'પાવ.નં.',
    accountNo: 'ખા.નં.',
    total: 'કુલ',
    noEntries: 'કોઈ નોંધ મળી નથી.',
    filterFrom: 'તારીખ થી',
    filterTo: 'સુધી',
    applyFilters: 'ફિલ્ટર',
    clearFilters: 'સાફ',

    // Add entry
    addEntryTitle: 'રોજમેળ નોંધ ઉમેરો',
    entryTypeLabel: 'નોંધ બાજુ',
    jamaOption: 'જમા – ક્રેડિટ / આવક',
    udharOption: 'ઉધાર – ડેબિટ / ખર્ચ',
    paymentMode: 'ચુકવણી પ્રકાર',
    cash: 'રોકડ (Cash)',
    bank: 'બૅન્ક (Bank)',
    upi: 'UPI',
    amountLabel: 'રકમ (₹)',
    descriptionLabel: 'વિગત',
    pageNoLabel: 'પાવતી નંબર (Receipt No.)',
    accountNoLabel: 'ખાતું નં. (A/C No.)',
    descriptionDetailLabel: 'વિગત વિગતવાર (વૈકલ્પિક)',
    saveEntry: 'નોંધ સાચવો',
    cancel: 'રદ',

    // Months
    apr: 'એપ્રિલ', may: 'મે', jun: 'જૂન', jul: 'જુલાઈ',
    aug: 'ઑગસ્ટ', sep: 'સપ્ટેમ્બર', oct: 'ઑક્ટોબર',
    nov: 'નવેમ્બર', dec: 'ડિસેમ્બર', jan: 'જાન્યુઆરી',
    feb: 'ફેબ્રુઆરી', mar: 'માર્ચ',

    // Khatavahi
    khatavahi: 'ખાતાવહી',
    addAccount: 'નોંધ ખાતું',
    khatavahiTitle: 'ખાતાવહી',
    accountName: 'ખાતા નામ',
    accountNumber: 'ખાતા નં.',
    saveAccount: 'ખાતું સાચવો',
    selectAccount: '— ખાતું પસંદ કરો —',
    noAccount: '— કોઈ નહીં —',
    selectYear: 'નાણાકીય વર્ષ',
    runningBalance: 'શિલક',
    debitCol: 'ઉધાર (Dr)',
    creditCol: 'જમા (Cr)',
    noAccountsYet: 'કોઈ ખાતું નથી. "નોંધ ખાતું" માંથી ઉમેરો.',
    noEntriesForAccount: 'આ ખાતા માટે પસંદ કરેલ વર્ષમાં કોઈ નોંધ નથી.',
    manageAccounts: 'ખાતા સંચાલન',
    deleteAccount: 'કાઢો',
    accountSaved: 'ખાતું સાચવ્યું.',
    accountDeleted: 'ખાતું કાઢ્યું.',

    // Common
    loading: 'લોડ થઈ રહ્યું છે…',
    error: 'ભૂલ',
    success: 'સફળ',
    role: 'ભૂમિકા',
    owner: 'ઓનર',
    accountant: 'અકાઉન્ટન્ટ',
    viewer: 'દર્શક',
  },
} as const

export type T = typeof translations.en

export function t(lang: Lang): T {
  return translations[lang] as T
}

/** Derive current Indian financial year label, e.g. "2025-26" */
export function currentFY(): string {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-based
  const year = now.getFullYear()
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(-2)}`
  }
  return `${year - 1}-${String(year).slice(-2)}`
}

/** Parse a FY label like "2025-26" into start/end ISO date strings */
export function fyDateRange(fy: string): { start: string; end: string } {
  const startYear = parseInt(fy.split('-')[0], 10)
  return { start: `${startYear}-04-01`, end: `${startYear + 1}-03-31` }
}

/** Return the last `count` financial year labels, newest first */
export function availableFYs(count = 4): string[] {
  const current = currentFY()
  const startYear = parseInt(current.split('-')[0], 10)
  return Array.from({ length: count }, (_, i) => {
    const y = startYear - i
    return `${y}-${String(y + 1).slice(-2)}`
  })
}

/** Financial year start date as ISO string "YYYY-04-01" */
export function fyStartDate(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const startYear = month >= 4 ? year : year - 1
  return `${startYear}-04-01`
}
