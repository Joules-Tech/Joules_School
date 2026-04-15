'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Utilities ─────────────────────────────────────────────────────────────────

function colLabel(idx: number): string {
  let s = '', i = idx
  do { s = String.fromCharCode(65 + (i % 26)) + s; i = Math.floor(i / 26) - 1 } while (i >= 0)
  return s
}

function colIndex(label: string): number {
  let n = 0
  for (const ch of label.toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64
  return n - 1
}

// ─── Formula Engine ────────────────────────────────────────────────────────────

function resolveCell(raw: string, grid: string[][], depth: number): number {
  if (depth > 10 || !raw) return 0
  if (!raw.startsWith('=')) return parseFloat(raw) || 0
  return parseFloat(evalFormula(raw, grid, depth + 1)) || 0
}

function evalFormula(raw: string, grid: string[][], depth = 0): string {
  if (!raw.startsWith('=') || depth > 10) return raw
  try {
    let expr = raw.slice(1).trim()
    // SUM(A1:B3)
    expr = expr.replace(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/gi, (_, a, b) => {
      const am = a.toUpperCase().match(/^([A-Z]+)(\d+)$/)!
      const bm = b.toUpperCase().match(/^([A-Z]+)(\d+)$/)!
      const c1 = colIndex(am[1]), r1 = parseInt(am[2]) - 1
      const c2 = colIndex(bm[1]), r2 = parseInt(bm[2]) - 1
      let sum = 0
      for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++)
        for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++)
          if (r >= 0 && r < grid.length && c >= 0 && c < (grid[0]?.length ?? 0))
            sum += resolveCell(grid[r][c], grid, depth + 1)
      return String(sum)
    })
    // Cell refs A1, B2
    expr = expr.replace(/\b([A-Z]+\d+)\b/gi, ref => {
      const m = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/)!
      const c = colIndex(m[1]), r = parseInt(m[2]) - 1
      if (r >= 0 && r < grid.length && c >= 0 && c < (grid[0]?.length ?? 0))
        return String(resolveCell(grid[r][c], grid, depth + 1))
      return '0'
    })
    if (/^[0-9\s+\-*/().]+$/.test(expr)) {
      // eslint-disable-next-line no-new-func
      const v = new Function(`"use strict"; return (${expr})`)()
      if (typeof v === 'number' && isFinite(v))
        return v % 1 === 0 ? String(v) : v.toFixed(2)
    }
    return '#ERR'
  } catch { return '#ERR' }
}

// ─── Storage (JSON-based) ──────────────────────────────────────────────────────

type Mode = 'text' | 'sheet' | 'both'

interface StoredDetail {
  v: 1
  text?: string
  headers: string[]
  rows: string[][]
}

// Serialise as JSON when table has content; plain text otherwise.
// Mode is display-only — it never affects what is saved.
function serialise(textPart: string, headers: string[], rows: string[][]): string {
  const hasContent = rows.some(r => r.some(c => c.trim()))
  if (!hasContent) return textPart.trim()          // no table data → plain text
  const data: StoredDetail = { v: 1, headers, rows }
  if (textPart.trim()) data.text = textPart.trim()
  return JSON.stringify(data)
}

// Parse stored value — handles JSON (new), legacy [[SPREADSHEET]] marker, or plain text.
function parseStored(raw: string): { textPart: string; headers: string[] | null; rows: string[][] | null } {
  if (!raw || !raw.trim()) return { textPart: '', headers: null, rows: null }

  // ── 1. New JSON format ───────────────────────────────────────────────────────
  if (raw.trimStart().startsWith('{')) {
    try {
      const d = JSON.parse(raw) as StoredDetail
      if (d && d.v === 1 && Array.isArray(d.headers)) {
        return {
          textPart: d.text ?? '',
          headers: d.headers.length ? d.headers : null,
          rows: d.rows?.length ? d.rows : null,
        }
      }
    } catch { /* not valid JSON — fall through */ }
  }

  // ── 2. Legacy [[SPREADSHEET]] marker format (backward compat) ────────────────
  const MARKER = '[[SPREADSHEET]]'
  const idx = raw.indexOf(MARKER)
  if (idx !== -1) {
    const textPart = raw.slice(0, idx).trimEnd()
    const rest     = raw.slice(idx + MARKER.length).replace(/^\n/, '')
    const lines    = rest.split('\n')
    const headers  = lines[0]?.split('\t') ?? []
    const dataLines = lines.slice(1).filter((l, i, arr) => {
      if (l.trim()) return true
      return arr.slice(i + 1).some(x => x.trim())
    })
    const rows = dataLines.map(l => l.split('\t'))
    return {
      textPart,
      headers: headers.length ? headers : null,
      rows: rows.length ? rows : null,
    }
  }

  // ── 3. Plain text ────────────────────────────────────────────────────────────
  return { textPart: raw, headers: null, rows: null }
}

function normalizeGrid(rows: string[][], cols: number): string[][] {
  return rows.map(row =>
    row.length === cols ? row
    : row.length > cols ? row.slice(0, cols)
    : [...row, ...Array(cols - row.length).fill('')]
  )
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type CellPos = [number, number]

interface Props {
  defaultValue?: string
  name: string
  lang: 'en' | 'gu'
  placeholder?: string
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SpreadsheetDescriptionEditor({ defaultValue = '', name, lang, placeholder }: Props) {
  const stored   = parseStored(defaultValue)
  const hasTable = stored.headers !== null
  const hasBoth  = hasTable && stored.textPart.length > 0
  const initMode: Mode = hasBoth ? 'both' : hasTable ? 'sheet' : 'text'

  const [mode,      setMode]      = useState<Mode>(initMode)
  const [textPart,  setTextPart]  = useState(stored.textPart)
  const [headers,   setHeaders]   = useState<string[]>(stored.headers ?? ['', '', ''])
  const [grid,      setGrid]      = useState<string[][]>(
    stored.rows != null
      ? normalizeGrid(stored.rows, stored.headers?.length ?? 3)
      : [['','',''],['','',''],['','','']]
  )
  const [editCell,  setEditCell]  = useState<CellPos | null>(null)
  const [selStart,  setSelStart]  = useState<CellPos | null>(null)
  const [selEnd,    setSelEnd]    = useState<CellPos | null>(null)
  const [fullscreen, setFullscreen] = useState(false)

  // Stable refs
  const dragging   = useRef(false)
  const dragOrigin = useRef<CellPos | null>(null)
  const selEndRef  = useRef<CellPos | null>(null)
  const inputRefs  = useRef<Map<string, HTMLInputElement>>(new Map())
  const headersRef = useRef(headers)
  const gridRef    = useRef(grid)

  // Keep refs in sync with state
  useEffect(() => { selEndRef.current = selEnd },   [selEnd])
  useEffect(() => { headersRef.current = headers }, [headers])
  useEffect(() => { gridRef.current = grid },       [grid])

  // Auto-focus when editCell changes
  useEffect(() => {
    if (!editCell) return
    const el = inputRefs.current.get(`${editCell[0]},${editCell[1]}`)
    if (el) { el.focus(); el.select() }
  }, [editCell])

  // Trap Escape in fullscreen
  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen])

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    document.body.style.overflow = fullscreen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [fullscreen])

  // Global mouseup to end drag
  useEffect(() => {
    function onUp() {
      if (!dragging.current) return
      dragging.current = false
      const origin = dragOrigin.current
      const end    = selEndRef.current
      dragOrigin.current = null
      if (origin && end && origin[0] === end[0] && origin[1] === end[1]) {
        setEditCell([origin[0], origin[1]])
        setSelStart(null)
        setSelEnd(null)
      }
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  const cols       = headers.length
  const serialised = serialise(textPart, headers, grid)

  // Selection
  const normSel = selStart && selEnd ? {
    r1: Math.min(selStart[0], selEnd[0]), r2: Math.max(selStart[0], selEnd[0]),
    c1: Math.min(selStart[1], selEnd[1]), c2: Math.max(selStart[1], selEnd[1]),
  } : null
  const inSel       = (r: number, c: number) => !!normSel && r >= normSel.r1 && r <= normSel.r2 && c >= normSel.c1 && c <= normSel.c2
  const hasRangeSel = !!normSel && (normSel.r2 > normSel.r1 || normSel.c2 > normSel.c1)

  // ── Grid mutations ────────────────────────────────────────────────────────────

  const updateCell = useCallback((r: number, c: number, val: string) =>
    setGrid(g => g.map((row, ri) => ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row))
  , [])

  const updateHeader = useCallback((c: number, val: string) =>
    setHeaders(h => h.map((x, i) => i === c ? val : x))
  , [])

  const addRowAfter = useCallback((afterIdx?: number) => {
    setGrid(g => {
      const cols = headersRef.current.length
      const newRow = Array(cols).fill('')
      if (afterIdx === undefined) return [...g, newRow]
      const next = [...g]; next.splice(afterIdx + 1, 0, newRow); return next
    })
  }, [])

  const removeRow = useCallback((r: number) => {
    setGrid(g => { if (g.length <= 1) return g; return g.filter((_, i) => i !== r) })
    setEditCell(prev => (prev?.[0] === r) ? null : prev)
  }, [])

  const addCol = useCallback(() => {
    setHeaders(h => [...h, ''])
    setGrid(g => g.map(row => [...row, '']))
  }, [])

  const removeCol = useCallback((c: number) => {
    setHeaders(h => { if (h.length <= 1) return h; return h.filter((_, i) => i !== c) })
    setGrid(g => { if ((g[0]?.length ?? 0) <= 1) return g; return g.map(row => row.filter((_, i) => i !== c)) })
    setEditCell(prev => (prev?.[1] === c) ? null : prev)
  }, [])

  // ── Navigation — uses refs so never stale ────────────────────────────────────

  const goTo = useCallback((r: number, c: number) => {
    const currentCols = headersRef.current.length
    const nc = Math.max(0, Math.min(c, currentCols - 1))
    if (r < 0) { setEditCell([0, nc]); return }
    if (r >= gridRef.current.length) {
      setGrid(g => [...g, Array(currentCols).fill('')])
    }
    setEditCell([r, nc])
    setSelStart(null); setSelEnd(null)
  }, [])

  // ── Display value ─────────────────────────────────────────────────────────────

  const displayVal = (raw: string): string => raw.startsWith('=') ? evalFormula(raw, grid) : raw


  // ── Operation toolbar ─────────────────────────────────────────────────────────

  function applyOp(op: 'sum' | 'sub' | 'mul' | 'div' | 'pct') {
    if (!normSel) return
    const { r1, r2, c1, c2 } = normSel
    const allRefs: string[] = []
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        allRefs.push(`${colLabel(c)}${r + 1}`)
    const startRef = `${colLabel(c1)}${r1 + 1}`, endRef = `${colLabel(c2)}${r2 + 1}`
    let formula: string
    switch (op) {
      case 'sum': formula = `=SUM(${startRef}:${endRef})`; break
      case 'sub': formula = `=${allRefs.join('-')}`; break
      case 'mul': formula = `=${allRefs.join('*')}`; break
      case 'div': formula = allRefs.length === 2 ? `=${allRefs[0]}/${allRefs[1]}` : `=SUM(${startRef}:${endRef})`; break
      case 'pct': formula = allRefs.length === 2 ? `=${allRefs[0]}/${allRefs[1]}*100` : '#ERR'; break
      default: return
    }
    const isSingleRow = r1 === r2
    let targetR = isSingleRow ? r1 : r2 + 1
    let targetC = isSingleRow ? c2 + 1 : c1
    // Expand columns if needed
    if (targetC >= cols) {
      const extra = targetC - cols + 1
      setHeaders(h => [...h, ...Array(extra).fill('')])
      setGrid(g => g.map(row => [...row, ...Array(extra).fill('')]))
      targetC = cols
    }
    // Expand rows if needed, then write formula
    setGrid(g => {
      let ng = [...g]
      while (ng.length <= targetR) ng = [...ng, Array(headersRef.current.length).fill('')]
      return ng.map((row, r) => r === targetR ? row.map((cell, c) => c === targetC ? formula : cell) : row)
    })
    setSelStart(null); setSelEnd(null)
    setEditCell([targetR, targetC])
  }

  // ── Mouse handlers ────────────────────────────────────────────────────────────

  const onCellMouseDown = useCallback((r: number, c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    setEditCell(null)
    dragging.current = true
    dragOrigin.current = [r, c]
    setSelStart([r, c])
    setSelEnd([r, c])
  }, [])

  const onCellMouseEnter = useCallback((r: number, c: number) => {
    if (dragging.current) setSelEnd([r, c])
  }, [])

  // ─── renderSheet — plain function, NOT a React component ─────────────────────
  // IMPORTANT: called as {renderSheet(compact)}, never as <RenderSheet/>.
  // Defining it as a component inside the parent would cause React to unmount
  // and remount the entire subtree (destroying focused inputs) on every render.

  function renderSheet(compact: boolean) {
    return (
      <div className={`flex flex-col ${compact ? '' : 'h-full'}`}>
        {/* Operation toolbar — slides in when a range is selected */}
        <div className={`transition-all overflow-hidden ${hasRangeSel ? 'max-h-20' : 'max-h-0'}`}>
          <div className="flex flex-wrap items-center gap-1.5 border-b border-violet-100 bg-violet-50 px-3 py-2">
            <span className="text-[11px] font-semibold text-violet-500 tabular-nums">
              {normSel ? `${colLabel(normSel.c1)}${normSel.r1+1} → ${colLabel(normSel.c2)}${normSel.r2+1}` : ''}
            </span>
            <div className="h-3 w-px bg-violet-200" />
            <span className="text-[11px] text-violet-400">{lang === 'gu' ? 'ક્રિયા:' : 'Apply:'}</span>
            {([
              ['sum', '∑ Sum', lang === 'gu' ? 'સરવાળો' : 'Sum selected'],
              ['sub', '− Sub', lang === 'gu' ? 'બાદ'     : 'Subtract'],
              ['mul', '× Mul', lang === 'gu' ? 'ગુણો'   : 'Multiply'],
              ['div', '÷ Div', lang === 'gu' ? 'ભાગ'    : 'Divide (2 cells)'],
              ['pct', '% Pct', lang === 'gu' ? 'ટકા'    : 'Percentage (2 cells)'],
            ] as const).map(([op, lbl, title]) => (
              <button key={op} type="button" onClick={() => applyOp(op as Parameters<typeof applyOp>[0])}
                title={title}
                className="rounded-lg border border-violet-200 bg-white px-2.5 py-0.5 text-xs font-bold text-violet-700 hover:bg-violet-100 active:scale-95 transition-all">
                {lbl}
              </button>
            ))}
          </div>
        </div>


        {/* Scrollable table */}
        <div className={`overflow-auto ${compact ? 'p-2' : 'flex-1 p-3'}`}>
          <table className="border-collapse text-xs w-max" style={{ userSelect: 'none' }}>
            <thead>
              {/* Column letters */}
              <tr>
                <th className="w-8 border border-gray-100 bg-gray-50 px-1 py-1 text-[10px] text-gray-300 text-center sticky left-0 z-10" />
                {headers.map((_, c) => (
                  <th key={c} className="border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-400 text-center min-w-[120px]">
                    {colLabel(c)}
                  </th>
                ))}
                <th className="w-5 border-0" />
              </tr>
              {/* Editable column headers */}
              <tr>
                <td className="border border-gray-100 bg-violet-100 text-[10px] text-violet-400 font-bold text-center px-1 sticky left-0 z-10">H</td>
                {headers.map((h, c) => (
                  <td key={c} className="border border-violet-300 bg-violet-50 p-0">
                    <div className="flex items-center">
                      <input
                        value={h}
                        onChange={e => updateHeader(c, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                        placeholder={`Col ${c + 1}`}
                        style={{ userSelect: 'text' }}
                        className="min-w-[120px] w-full bg-transparent px-2 py-1.5 text-xs font-semibold text-violet-800 placeholder:text-violet-300 focus:outline-none"
                      />
                      {cols > 1 && (
                        <button type="button" onClick={() => removeCol(c)}
                          title={lang === 'gu' ? 'કૉલ ભૂંસો' : 'Remove column'}
                          className="pr-1.5 text-violet-200 hover:text-red-400 text-sm leading-none flex-shrink-0">×</button>
                      )}
                    </div>
                  </td>
                ))}
                <td className="border-0 pl-2 align-middle">
                  <button type="button" onClick={addCol}
                    title={lang === 'gu' ? 'કૉલ ઉમેરો' : 'Add column'}
                    className="text-violet-400 hover:text-violet-600 text-xl leading-none font-light">+</button>
                </td>
              </tr>
            </thead>

            <tbody>
              {grid.map((row, r) => (
                <tr key={r}>
                  <td className="border border-gray-100 bg-gray-50 px-1 text-[10px] text-gray-400 text-center font-medium select-none sticky left-0 z-10">
                    {r + 1}
                  </td>
                  {row.map((cell, c) => {
                    const isEdit  = editCell?.[0] === r && editCell?.[1] === c
                    const inRange = inSel(r, c)
                    const dv      = displayVal(cell)
                    const isForm  = cell.startsWith('=')
                    const isErr   = dv === '#ERR'
                    return (
                      <td key={c}
                        onMouseDown={e => onCellMouseDown(r, c, e)}
                        onMouseEnter={() => onCellMouseEnter(r, c)}
                        className={`border p-0 cursor-cell relative transition-colors ${
                          isEdit  ? 'border-[#9C43A6] z-20' :
                          inRange ? 'border-blue-400 bg-blue-50' :
                          isErr   ? 'border-red-200 bg-red-50' :
                                    'border-gray-200 hover:border-violet-200 hover:bg-violet-50/40'
                        }`}
                      >
                        {isEdit ? (
                          <input
                            ref={el => {
                              const key = `${r},${c}`
                              if (el) inputRefs.current.set(key, el)
                              else    inputRefs.current.delete(key)
                            }}
                            value={cell}
                            onChange={e => updateCell(r, c, e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault(); e.stopPropagation()
                                goTo(r + 1, c)
                              } else if (e.key === 'Tab') {
                                e.preventDefault()
                                if (!e.shiftKey) {
                                  if (c < headersRef.current.length - 1) goTo(r, c + 1)
                                  else goTo(r + 1, 0)
                                } else {
                                  if (c > 0) goTo(r, c - 1)
                                  else if (r > 0) goTo(r - 1, headersRef.current.length - 1)
                                }
                              } else if (e.key === 'Escape') {
                                setEditCell(null)
                              } else if (e.key === 'ArrowDown' && e.altKey) {
                                e.preventDefault(); goTo(r + 1, c)
                              } else if (e.key === 'ArrowUp' && e.altKey) {
                                e.preventDefault(); if (r > 0) goTo(r - 1, c)
                              }
                            }}
                            onBlur={() => setEditCell(prev => (prev?.[0] === r && prev?.[1] === c) ? null : prev)}
                            style={{ userSelect: 'text' }}
                            className="min-w-[120px] w-full bg-white px-2 py-1.5 text-xs text-gray-900 focus:outline-none ring-2 ring-inset ring-[#9C43A6]/50"
                          />
                        ) : (
                          <div className={`min-w-[120px] px-2 py-1.5 text-xs overflow-hidden whitespace-nowrap ${
                            isErr  ? 'text-red-500 font-medium' :
                            isForm ? 'text-blue-700 font-medium text-right' :
                                     'text-gray-800'
                          }`}>
                            {dv || <span className="text-gray-200 text-[10px] select-none">──</span>}
                          </div>
                        )}
                      </td>
                    )
                  })}
                  <td className="border-0 pl-1 align-middle">
                    {grid.length > 1 && (
                      <button type="button" onClick={() => removeRow(r)}
                        title={lang === 'gu' ? 'હરોળ ભૂંસો' : 'Remove row'}
                        className="text-gray-200 hover:text-red-400 text-sm leading-none">×</button>
                    )}
                  </td>
                </tr>
              ))}

            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-violet-100 bg-violet-50/40 px-3 py-2 flex-shrink-0">
          <button type="button" onClick={() => addRowAfter()}
            className="flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50 transition-colors">
            <span className="text-sm leading-none">+</span>
            {lang === 'gu' ? 'હરોળ ઉમેરો' : 'Add Row'}
          </button>
          <span className="text-[10px] text-gray-400 hidden sm:inline">
            {lang === 'gu'
              ? 'ક્લિક = edit · ખેંચો = range · Enter = આગળ'
              : 'Click = edit · Drag = select range · Enter = next row'}
          </span>
        </div>
      </div>
    )
  }

  // ─── Fullscreen modal ─────────────────────────────────────────────────────────

  const showTable = mode === 'sheet' || mode === 'both'

  return (
    <div className="space-y-2">
      {/* Fullscreen overlay (fixed-position, rendered in same React tree) */}
      {fullscreen && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-5 py-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              <svg className="h-5 w-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {lang === 'gu' ? 'વિગત કોઠો' : 'Detail Spreadsheet'}
                </p>
                <p className="text-[11px] text-gray-400">
                  {lang === 'gu' ? 'Esc અથવા "થઈ ગયું" દબાવો' : 'Press Esc or Done to close'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">
                {grid.length}r × {cols}c
              </span>
              <button type="button" onClick={() => setFullscreen(false)}
                className="rounded-xl bg-gradient-to-r from-[#9C43A6] to-[#DB515E] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                {lang === 'gu' ? '✓ થઈ ગયું' : '✓ Done'}
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {renderSheet(false)}
          </div>
        </div>
      )}

      {/* Label row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="block text-sm font-medium text-gray-500">
          {lang === 'gu' ? 'વિગતવાર વર્ણન (વૈકલ્પિક)' : 'Detailed Description (Optional)'}
        </label>

        <div className="flex items-center gap-1.5">
          {/* Expand button (only when table is visible) */}
          {showTable && (
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              title={lang === 'gu' ? 'પૂર્ણ સ્ક્રીન ખોલો' : 'Open fullscreen'}
              className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-600 hover:bg-violet-100 transition-colors"
            >
              {/* Expand icon */}
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
              {lang === 'gu' ? 'મોટો' : 'Expand'}
            </button>
          )}

          {/* 3-way mode toggle — plain buttons, no nested component */}
          <div className="flex items-center gap-0.5 rounded-xl border border-gray-200 bg-gray-50 p-0.5">
            {(['text', 'sheet', 'both'] as Mode[]).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  mode === m ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}>
                {m === 'text'  ? (lang === 'gu' ? '✏ ટેક્સ્ટ' : '✏ Text')
                : m === 'sheet' ? (lang === 'gu' ? '⊞ કોઠો'   : '⊞ Table')
                :                 (lang === 'gu' ? '⊞✏ બંને'  : '⊞✏ Both')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden field for form submission */}
      <input type="hidden" name={name} value={serialised} />

      {/* Text area */}
      {(mode === 'text' || mode === 'both') && (
        <textarea
          rows={mode === 'both' ? 2 : 3}
          value={textPart}
          onChange={e => setTextPart(e.target.value)}
          placeholder={placeholder ?? (lang === 'gu' ? 'વધુ વિગત (વૈકલ્પિક)…' : 'Additional details (optional)…')}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#9C43A6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9C43A6]/20"
        />
      )}

      {/* Inline table — called as a plain function, never as <Component/> */}
      {showTable && (
        <div className="rounded-xl border border-violet-200 bg-white shadow-sm flex flex-col">
          {renderSheet(true)}
        </div>
      )}
    </div>
  )
}
