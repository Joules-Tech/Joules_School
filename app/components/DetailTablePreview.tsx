'use client'

// ─── Shared display component for description_detail ──────────────────────────
// Used in: rojmel list page, live entries panel, anywhere entries are rendered.
// Parses JSON (new format) or legacy [[SPREADSHEET]] marker, evaluates formulas,
// and renders a clean mini-table. Never shows raw JSON or formula strings.

// ── Formula engine (mirrors SpreadsheetDescriptionEditor) ─────────────────────

function colIndex(label: string): number {
  let n = 0
  for (const ch of label.toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64
  return n - 1
}

function resolveCell(raw: string, grid: string[][], depth: number): number {
  if (depth > 10 || !raw) return 0
  if (!raw.startsWith('=')) return parseFloat(raw) || 0
  return parseFloat(evalFormula(raw, grid, depth + 1)) || 0
}

function evalFormula(raw: string, grid: string[][], depth = 0): string {
  if (!raw.startsWith('=') || depth > 10) return raw
  try {
    let expr = raw.slice(1).trim()
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

/** Evaluate all formulas in a grid and return display-ready values. */
function evalGrid(rows: string[][]): string[][] {
  return rows.map(row => row.map(cell => (cell.startsWith('=') ? evalFormula(cell, rows) : cell)))
}

// ── Parser ─────────────────────────────────────────────────────────────────────

interface ParsedDetail {
  textPart: string
  headers: string[] | null
  rows: string[][] | null      // already formula-evaluated
}

function parseDetail(raw: string): ParsedDetail {
  if (!raw || !raw.trim()) return { textPart: '', headers: null, rows: null }

  // 1. JSON format (new)
  if (raw.trimStart().startsWith('{')) {
    try {
      const d = JSON.parse(raw) as { v: number; text?: string; headers: string[]; rows: string[][] }
      if (d.v === 1 && Array.isArray(d.headers)) {
        const rows = d.rows?.length ? evalGrid(d.rows) : null
        return {
          textPart: d.text ?? '',
          headers: d.headers.length ? d.headers : null,
          rows,
        }
      }
    } catch { /* fall through */ }
  }

  // 2. Legacy [[SPREADSHEET]] marker (backward compat)
  const MARKER = '[[SPREADSHEET]]'
  const idx = raw.indexOf(MARKER)
  if (idx !== -1) {
    const textPart  = raw.slice(0, idx).trimEnd()
    const rest      = raw.slice(idx + MARKER.length).replace(/^\n/, '')
    const lines     = rest.split('\n')
    const headers   = (lines[0] ?? '').split('\t').filter(h => h.trim())
    const dataLines = lines.slice(1).filter(l => l.trim())
    const rawRows   = dataLines.map(l => l.split('\t'))
    const rows      = rawRows.length ? evalGrid(rawRows) : null
    return { textPart, headers: headers.length ? headers : null, rows }
  }

  // 3. Plain text
  return { textPart: raw, headers: null, rows: null }
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  detail: string
  lang: string
  /** Maximum data rows to show before "+N more" indicator. Default 3. */
  maxRows?: number
}

export default function DetailTablePreview({ detail, lang, maxRows = 3 }: Props) {
  const { textPart, headers, rows } = parseDetail(detail)

  // No table — show plain text (or nothing)
  if (!headers || headers.length === 0) {
    if (!textPart) return null
    return (
      <p className="text-[10px] text-gray-500 truncate mt-0.5 leading-tight italic">
        {textPart}
      </p>
    )
  }

  const displayRows = rows ?? []

  return (
    <div className="mt-0.5 space-y-0.5">
      {textPart ? (
        <p className="text-[10px] text-gray-500 leading-tight italic">{textPart}</p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="border-collapse" style={{ fontSize: '9px', lineHeight: '1.4' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-violet-700 font-semibold whitespace-nowrap text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.slice(0, maxRows).map((row, ri) => (
              <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50/60' : ''}>
                {headers.map((_, ci) => (
                  <td
                    key={ci}
                    className="border border-gray-200 px-1.5 py-0.5 text-gray-700 whitespace-nowrap"
                  >
                    {row[ci] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
            {displayRows.length > maxRows && (
              <tr>
                <td
                  colSpan={headers.length}
                  className="border border-gray-200 px-1.5 py-0.5 text-center text-gray-400 italic"
                >
                  +{displayRows.length - maxRows}{' '}
                  {lang === 'gu' ? 'વધુ હરોળ' : 'more rows'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
