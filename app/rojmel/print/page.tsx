import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '../../../lib/supabase-server'
import { createSupabaseAdminClient } from '../../../lib/supabase-admin'
import { getCurrentUserWithProfile } from '../../../lib/auth'
import { getLang } from '../../../lib/get-lang'
import { t, currentFY, fyStartDate } from '../../../lib/translations'
import PrintTrigger from '../../components/PrintTrigger'

export default async function PrintRojmelPage(props: any) {
  const [{ user, profile }, lang] = await Promise.all([
    getCurrentUserWithProfile(),
    getLang(),
  ])

  if (!user) redirect('/auth/login')
  if (!profile?.school_id) redirect('/auth/register-school')

  const tr = t(lang)
  const fy  = currentFY()
  const fyStart = fyStartDate()

  const searchParams = await props.searchParams
  const from    = (searchParams?.from  as string) || fyStart
  const to      = (searchParams?.to    as string) || ''
  const rawMode = searchParams?.mode as string
  const mode: 'total' | 'cash' | 'bank' =
    rawMode === 'cash' ? 'cash' : rawMode === 'bank' ? 'bank' : 'total'

  const admin = createSupabaseAdminClient()

  // Fetch school name
  const { data: school } = await admin
    .from('schools')
    .select('school_name')
    .eq('id', profile.school_id)
    .single()

  // Opening balance for this FY
  const { data: openingBal } = await admin
    .from('year_opening_balances')
    .select('opening_cash, opening_bank')
    .eq('school_id', profile.school_id)
    .eq('financial_year', fy)
    .single()

  const fyOpenForMode =
    mode === 'cash' ? Number(openingBal?.opening_cash || 0) :
    mode === 'bank' ? Number(openingBal?.opening_bank || 0) :
    Number(openingBal?.opening_cash || 0) + Number(openingBal?.opening_bank || 0)

  // Balance carried forward to the start of the selected period
  let openingForPeriod = fyOpenForMode
  if (from && from > fyStart) {
    const dayBefore = new Date(from)
    dayBefore.setDate(dayBefore.getDate() - 1)
    const dayBeforeStr = dayBefore.toISOString().split('T')[0]

    let priorQuery = admin
      .from('rojmel_entries')
      .select('entry_type, amount')
      .eq('school_id', profile.school_id)
      .gte('entry_date', fyStart)
      .lte('entry_date', dayBeforeStr)

    if (mode === 'cash') priorQuery = priorQuery.eq('payment_mode', 'CASH')
    if (mode === 'bank') priorQuery = priorQuery.in('payment_mode', ['BANK', 'UPI'])

    const { data: priorEntries } = await priorQuery

    const priorIn  = (priorEntries || []).filter(e => e.entry_type === 'IN' ).reduce((s, e) => s + Number(e.amount), 0)
    const priorOut = (priorEntries || []).filter(e => e.entry_type === 'OUT').reduce((s, e) => s + Number(e.amount), 0)
    openingForPeriod = fyOpenForMode + priorIn - priorOut
  }

  // Entries in the selected period
  const supabase = await createSupabaseServerClient()
  let query = supabase
    .from('rojmel_entries')
    .select('*')
    .eq('school_id', profile.school_id)
    .order('entry_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (from) query = query.gte('entry_date', from)
  if (to)   query = query.lte('entry_date', to)
  if (mode === 'cash') query = query.eq('payment_mode', 'CASH')
  if (mode === 'bank') query = query.in('payment_mode', ['BANK', 'UPI'])

  const { data: entries } = await query

  const jama  = (entries || []).filter(e => e.entry_type === 'IN')
  const udhar = (entries || []).filter(e => e.entry_type === 'OUT')

  const jamaTotal  = jama.reduce((s, e)  => s + Number(e.amount), 0)
  const udharTotal = udhar.reduce((s, e) => s + Number(e.amount), 0)

  // Grand Jama = opening balance + all credits in period
  const grandJamaTotal   = openingForPeriod + jamaTotal
  // Closing balance = Grand Jama - Total Udhar (balance carried to next period)
  const closingBalance   = grandJamaTotal - udharTotal

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })

  const fmt = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 })

  const dateLabel = from && to
    ? `${from}  →  ${to}`
    : from
    ? `${from === fyStart ? `FY ${fy}` : from}  →  ${lang === 'gu' ? 'આજ સુધી' : 'onwards'}`
    : `FY ${fy}`

  // Column widths for the entry grid
  const colGrid = '50px 1fr 60px 36px 36px'

  return (
    <>
      <PrintTrigger />

      <style>{`
        @page { size: A4 landscape; margin: 10mm 8mm; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body {
          font-family: 'Noto Sans', 'Noto Sans Gujarati', 'Segoe UI', Arial, sans-serif;
          font-size: 8.5pt;
          color: #1e293b;
          background: #fff;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print { display: block; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      {/* Back button */}
      <div className="no-print" style={{ position: 'fixed', top: 16, left: 16, zIndex: 50 }}>
        <a href="/rojmel" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'linear-gradient(90deg,#9C43A6,#DB515E)',
          color: '#fff', padding: '8px 16px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, textDecoration: 'none',
        }}>
          ← {lang === 'gu' ? 'પાછા જાઓ' : 'Back'}
        </a>
      </div>

      <div style={{ width: '100%', padding: '0 2mm' }}>

        {/* ── HEADER ── */}
        <div style={{
          background: 'linear-gradient(135deg,#f5e6f8 0%,#fde8ec 50%,#fff3ea 100%)',
          border: '1.5px solid #e9d5f5',
          borderRadius: 12,
          padding: '12px 18px',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg,#9C43A6,#DB515E,#FFA86A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0,
            }}>JR</div>
            <div>
              <div style={{ fontSize: '14pt', fontWeight: 800, color: '#6b21a8', letterSpacing: '-0.2px' }}>
                {school?.school_name || 'Joules School'}
              </div>
              <div style={{ fontSize: '7.5pt', color: '#9333ea', opacity: 0.8, marginTop: 2 }}>
                {lang === 'gu' ? 'રોજમેળ — નાણાકીય વર્ષ ' : 'Rojmel — Financial Year '}{fy}
                {' '}
                <span style={{
                  background: mode === 'cash' ? '#d1fae5' : mode === 'bank' ? '#dbeafe' : '#ede9fe',
                  color:      mode === 'cash' ? '#065f46' : mode === 'bank' ? '#1e3a8a' : '#4c1d95',
                  padding: '1px 7px', borderRadius: 20, fontSize: '6.5pt', fontWeight: 700,
                }}>
                  {mode === 'cash'
                    ? (lang === 'gu' ? 'રોકડ' : 'Cash')
                    : mode === 'bank'
                    ? (lang === 'gu' ? 'બૅન્ક / UPI' : 'Bank / UPI')
                    : (lang === 'gu' ? 'કુલ (રોકડ + બૅન્ક)' : 'Total (Cash + Bank)')}
                </span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '8pt', fontWeight: 700, color: '#7c3aed' }}>
              {lang === 'gu' ? 'સમયગાળો' : 'Period'}
            </div>
            <div style={{ fontSize: '7.5pt', color: '#6b7280', marginTop: 2 }}>{dateLabel}</div>
            <div style={{ fontSize: '6.5pt', color: '#9ca3af', marginTop: 3 }}>
              {lang === 'gu' ? 'છાપ્યું:' : 'Printed:'} {new Date().toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        {/* ── SUMMARY PILLS ── */}
        <div style={{ display: 'flex', gap: 7, marginBottom: 10 }}>
          {[
            { label: lang === 'gu' ? 'ચાલુ શિલક (શરૂ)' : 'Opening Balance', value: `₹${fmt(openingForPeriod)}`, bg: '#f5f3ff', border: '#ddd6fe', text: '#4c1d95' },
            { label: lang === 'gu' ? 'કુલ જમા'  : 'Total Jama',    value: `₹${fmt(jamaTotal)}`,       bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
            { label: lang === 'gu' ? 'કુલ ઉધાર' : 'Total Udhar',   value: `₹${fmt(udharTotal)}`,      bg: '#fff1f2', border: '#fecaca', text: '#9f1239' },
            { label: lang === 'gu' ? 'ચાલુ શિલક (અંત)' : 'Closing Balance', value: `₹${fmt(closingBalance)}`, bg: closingBalance >= 0 ? '#f0fdf4' : '#fff1f2', border: closingBalance >= 0 ? '#86efac' : '#fca5a5', text: closingBalance >= 0 ? '#14532d' : '#7f1d1d' },
            { label: lang === 'gu' ? 'કુલ નોંધ' : 'Total Entries', value: `${jama.length + udhar.length}`, bg: '#eff6ff', border: '#bfdbfe', text: '#1e3a8a' },
          ].map(pill => (
            <div key={pill.label} style={{ flex: 1, background: pill.bg, border: `1px solid ${pill.border}`, borderRadius: 8, padding: '6px 10px' }}>
              <div style={{ fontSize: '6.5pt', color: pill.text, opacity: 0.7, fontWeight: 600 }}>{pill.label}</div>
              <div style={{ fontSize: '9pt', color: pill.text, fontWeight: 800, marginTop: 1 }}>{pill.value}</div>
            </div>
          ))}
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>

          {/* ── JAMA (Credit / Left) ── */}
          <div style={{ border: '1.5px solid #a7f3d0', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>

            {/* Section header */}
            <div style={{
              background: 'linear-gradient(90deg,#d1fae5,#a7f3d0)',
              padding: '6px 10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid #6ee7b7',
            }}>
              <span style={{ color: '#065f46', fontWeight: 800, fontSize: '9.5pt' }}>
                {tr.jama} &nbsp;<span style={{ fontWeight: 400, fontSize: '7.5pt', opacity: 0.75 }}>({lang === 'gu' ? 'ક્રેડિટ / આવક' : 'Credit / Income'})</span>
              </span>
              <span style={{ background: '#fff', color: '#047857', fontSize: '7.5pt', fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid #a7f3d0' }}>
                ₹{fmt(jamaTotal)}
              </span>
            </div>

            {/* Column labels */}
            <ColHeader colGrid={colGrid} tr={tr} bg="#f0fdf4" textColor="#166534" borderColor="#bbf7d0" />

            {/* ── Opening / current balance row ── */}
            <EntryRow
              colGrid={colGrid}
              date="—"
              desc={lang === 'gu' ? 'ચાલુ શિલક' : 'Current Balance (B/F)'}
              mode=""
              amount={fmt(openingForPeriod)}
              pageNo=""
              acNo=""
              rowBg="#faf5ff"
              amtColor="#6d28d9"
              bold
            />

            {/* Jama entries */}
            {jama.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '7.5pt' }}>{tr.noEntries}</div>
            ) : (
              jama.map((e, idx) => (
                <EntryRow
                  key={e.id}
                  colGrid={colGrid}
                  date={formatDate(e.entry_date)}
                  desc={e.description || '—'}
                  detail={e.description_detail || ''}
                  mode={e.payment_mode}
                  amount={fmt(Number(e.amount))}
                  pageNo={e.page_no || ''}
                  acNo={e.account_no || ''}
                  rowBg={idx % 2 === 0 ? '#fff' : '#f0fdf4'}
                  amtColor="#065f46"
                />
              ))
            )}

            {/* Total: કુલ જમા સરવાળો */}
            <TotalRow
              colGrid={colGrid}
              label={lang === 'gu' ? 'કુલ જમા સરવાળો' : 'Total Jama (Grand)'}
              amount={fmt(grandJamaTotal)}
              bg="#d1fae5"
              borderColor="#6ee7b7"
              textColor="#064e3b"
            />
          </div>

          {/* ── UDHAR (Debit / Right) ── */}
          <div style={{ border: '1.5px solid #fca5a5', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>

            {/* Section header */}
            <div style={{
              background: 'linear-gradient(90deg,#fee2e2,#fecaca)',
              padding: '6px 10px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid #fca5a5',
            }}>
              <span style={{ color: '#9f1239', fontWeight: 800, fontSize: '9.5pt' }}>
                {tr.udhar} &nbsp;<span style={{ fontWeight: 400, fontSize: '7.5pt', opacity: 0.75 }}>({lang === 'gu' ? 'ડેબિટ / ખર્ચ' : 'Debit / Expense'})</span>
              </span>
              <span style={{ background: '#fff', color: '#be123c', fontSize: '7.5pt', fontWeight: 700, padding: '2px 8px', borderRadius: 20, border: '1px solid #fca5a5' }}>
                ₹{fmt(udharTotal)}
              </span>
            </div>

            {/* Column labels */}
            <ColHeader colGrid={colGrid} tr={tr} bg="#fff1f2" textColor="#9f1239" borderColor="#fecaca" />

            {/* Udhar entries */}
            {udhar.length === 0 ? (
              <div style={{ padding: '12px', textAlign: 'center', color: '#9ca3af', fontSize: '7.5pt' }}>{tr.noEntries}</div>
            ) : (
              udhar.map((e, idx) => (
                <EntryRow
                  key={e.id}
                  colGrid={colGrid}
                  date={formatDate(e.entry_date)}
                  desc={e.description || '—'}
                  detail={e.description_detail || ''}
                  mode={e.payment_mode}
                  amount={fmt(Number(e.amount))}
                  pageNo={e.page_no || ''}
                  acNo={e.account_no || ''}
                  rowBg={idx % 2 === 0 ? '#fff' : '#fff1f2'}
                  amtColor="#9f1239"
                />
              ))
            )}

            {/* Total: કુલ ઉધાર સરવાળો */}
            <TotalRow
              colGrid={colGrid}
              label={lang === 'gu' ? 'કુલ ઉધાર સરવાળો' : 'Total Udhar'}
              amount={fmt(udharTotal)}
              bg="#fee2e2"
              borderColor="#fca5a5"
              textColor="#7f1d1d"
            />

            {/* Closing balance row: ચાલુ શિલક */}
            <EntryRow
              colGrid={colGrid}
              date="—"
              desc={lang === 'gu' ? 'ચાલુ શિલક' : 'Closing Balance (C/F)'}
              mode=""
              amount={fmt(closingBalance)}
              pageNo=""
              acNo=""
              rowBg="#faf5ff"
              amtColor="#6d28d9"
              bold
            />

            {/* Grand total: કુલ જમા નવો સરવાળો = Udhar Total + Closing Balance = Grand Jama */}
            <TotalRow
              colGrid={colGrid}
              label={lang === 'gu' ? 'કુલ જમા નવો સરવાળો' : 'Total (Udhar + Balance)'}
              amount={fmt(grandJamaTotal)}
              bg="#ede9fe"
              borderColor="#c4b5fd"
              textColor="#4c1d95"
            />
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          marginTop: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid #e5e7eb',
          paddingTop: 5,
          fontSize: '6.5pt',
          color: '#9ca3af',
        }}>
          <span>{school?.school_name || 'Joules School'} &nbsp;|&nbsp; {lang === 'gu' ? 'રોજમેળ' : 'Rojmel'} &nbsp;|&nbsp; FY {fy}</span>
          <span style={{
            padding: '2px 10px', borderRadius: 20, fontWeight: 700, fontSize: '7.5pt',
            background: closingBalance >= 0 ? '#d1fae5' : '#fee2e2',
            color:      closingBalance >= 0 ? '#065f46' : '#7f1d1d',
          }}>
            {lang === 'gu' ? 'ચાલુ શિલક:' : 'Balance:'} ₹{fmt(Math.abs(closingBalance))}{' '}
            {closingBalance >= 0
              ? (lang === 'gu' ? '(જમા)' : '(Surplus)')
              : (lang === 'gu' ? '(ઉધાર)' : '(Deficit)')}
          </span>
          <span>{lang === 'gu' ? 'Joules Rojmel દ્વારા' : 'Generated by Joules Rojmel'}</span>
        </div>
      </div>
    </>
  )
}

/* ── Shared sub-components (inline, no separate files needed) ── */

function ColHeader({ colGrid, tr, bg, textColor, borderColor }: {
  colGrid: string; tr: any; bg: string; textColor: string; borderColor: string
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: colGrid,
      background: bg, padding: '3px 8px',
      fontSize: '6.5pt', fontWeight: 700, color: textColor,
      textTransform: 'uppercase', letterSpacing: '0.4px',
      borderBottom: `1px solid ${borderColor}`,
    }}>
      <span>{tr.date}</span>
      <span>{tr.description}</span>
      <span style={{ textAlign: 'right' }}>{tr.amountCol}</span>
      <span style={{ textAlign: 'center' }}>{tr.pageNo}</span>
      <span style={{ textAlign: 'center' }}>{tr.accountNo}</span>
    </div>
  )
}

function EntryRow({ colGrid, date, desc, detail, mode, amount, pageNo, acNo, rowBg, amtColor, bold }: {
  colGrid: string; date: string; desc: string; detail?: string; mode: string
  amount: string; pageNo: string; acNo: string
  rowBg: string; amtColor: string; bold?: boolean
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: colGrid,
      padding: '3.5px 8px', fontSize: '7.5pt',
      background: rowBg, borderBottom: '1px solid #f3f4f6',
    }}>
      <span style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: '7pt' }}>{date}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#111827', fontWeight: bold ? 700 : 600 }}>{desc}</div>
        {detail && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '6pt', color: '#6b7280', fontStyle: 'italic', marginTop: 1 }}>{detail}</div>}
        {mode && <div style={{ fontSize: '6pt', color: '#9ca3af', marginTop: 1 }}>{mode}</div>}
      </div>
      <span style={{ textAlign: 'right', color: amtColor, fontFamily: 'monospace', fontWeight: bold ? 800 : 600 }}>{amount}</span>
      <span style={{ textAlign: 'center', color: '#6b7280', fontSize: '7pt' }}>{pageNo}</span>
      <span style={{ textAlign: 'center', color: '#6b7280', fontSize: '7pt' }}>{acNo}</span>
    </div>
  )
}

function TotalRow({ colGrid, label, amount, bg, borderColor, textColor }: {
  colGrid: string; label: string; amount: string
  bg: string; borderColor: string; textColor: string
}) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: colGrid,
      padding: '4px 8px', fontSize: '7.5pt', fontWeight: 800,
      background: bg, borderTop: `2px solid ${borderColor}`,
    }}>
      <span style={{ gridColumn: '1 / 3', color: textColor }}>{label}</span>
      <span style={{ textAlign: 'right', color: textColor, fontFamily: 'monospace' }}>{amount}</span>
      <span /><span />
    </div>
  )
}
