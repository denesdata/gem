'use client'

import { useEffect, useMemo, useState } from 'react'
import { panelUrl } from './panelHost'
import type { Locale } from './types'

export type UnstackedKind = 'aps' | 'nes' | 'ro_stats' | 'regio' | 'regio2' | 'legal'

export interface UnstackedRow {
  year: number | string
  country?: string
  county?: string
  langcountry?: string
  iso3?: string
  id?: string | number
  [key: string]: string | number | null | undefined
}

export interface UnstackedFile {
  data: UnstackedRow[]
  meta: Record<string, string>
}

const FILE_PREFIX: Record<UnstackedKind, string> = {
  aps: 'aps_unstacked',
  nes: 'nes_unstacked',
  ro_stats: 'rostats_unstacked',
  regio: 'regio_unstacked',
  regio2: 'regio2_unstacked',
  legal: 'legal_unstacked',
}

export function useUnstacked(kind: UnstackedKind, lang: Locale) {
  const [file, setFile] = useState<UnstackedFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const url = panelUrl(`${FILE_PREFIX[kind]}_${lang.toUpperCase()}.json`)
    let cancelled = false
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${url}`)
        return res.json()
      })
      .then((json) => {
        if (!cancelled) setFile(json)
      })
      .catch((err) => {
        if (!cancelled) setError(String(err))
      })
    return () => {
      cancelled = true
    }
  }, [kind, lang])

  return { file, error }
}

export function latestYear(rows: UnstackedRow[]): number | null {
  const years = rows
    .map((r) => Number(r.year))
    .filter((n) => Number.isFinite(n) && n > 1900 && n < 3000)
  if (!years.length) return null
  return Math.max(...years)
}

export function latestPeriod(rows: UnstackedRow[]): string | number | null {
  const year = latestYear(rows)
  if (year != null) return year
  const periods = Array.from(new Set(rows.map((r) => String(r.year || '')))).filter(Boolean).sort()
  return periods.at(-1) ?? null
}

export function yearsOf(rows: UnstackedRow[]): number[] {
  return Array.from(new Set(rows.map((r) => Number(r.year)).filter((n) => Number.isFinite(n) && n > 1900)))
    .sort((a, b) => a - b)
}

export function num(row: UnstackedRow | null | undefined, key: string): number | null {
  if (!row) return null
  const value = row[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function labelsById(rows: UnstackedRow[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const row of rows) {
    const name = String(row.langcountry || row.country || '')
    if (!name) continue
    if (row.id != null) out[String(row.id)] = name
    if (row.country) out[String(row.country)] = name
  }
  return out
}

export function sumByYear(rows: UnstackedRow[], indicator: string): Array<{ year: number; value: number }> {
  const totals = new Map<number, number>()
  for (const row of rows) {
    const year = Number(row.year)
    const value = row[indicator]
    if (!Number.isFinite(year) || typeof value !== 'number') continue
    totals.set(year, (totals.get(year) || 0) + value)
  }
  return Array.from(totals.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([year, value]) => ({ year, value }))
}

export function scatterGdp(
  rows: UnstackedRow[],
  yKey: string
): Array<{ id: string; name: string; x: number; y: number }> {
  const latest = new Map<string, { year: number; id: string; name: string; x: number; y: number }>()
  for (const row of rows) {
    const x = num(row, 'GDP2020')
    const y = num(row, yKey)
    const year = Number(row.year)
    const code = String(row.country || '')
    if (x == null || y == null || !code || !Number.isFinite(year)) continue
    const prev = latest.get(code)
    if (!prev || year > prev.year) {
      latest.set(code, { year, id: code, name: String(row.langcountry || code), x, y })
    }
  }
  return Array.from(latest.values())
}

export function bubblesFor(
  rows: UnstackedRow[],
  year: number | null,
  xKey: string,
  yKey: string,
  rKey: string
): Array<{ id: string; name: string; x: number; y: number; r: number }> {
  if (year == null) return []
  return rows
    .filter((row) => Number(row.year) === year)
    .map((row) => {
      const x = num(row, xKey)
      const y = num(row, yKey)
      const r = num(row, rKey)
      const code = String(row.country || row.id || '')
      if (x == null || y == null || r == null || !code) return null
      return { id: code, name: String(row.langcountry || code), x, y, r }
    })
    .filter((row): row is { id: string; name: string; x: number; y: number; r: number } => Boolean(row))
}

export function romaniaRows(rows: UnstackedRow[]): UnstackedRow[] {
  return rows.filter((r) => r.country === 'RO' || r.iso3 === 'ROU')
}

export function latestRomania(rows: UnstackedRow[]): UnstackedRow | null {
  const mine = romaniaRows(rows)
  const year = latestYear(mine)
  if (year == null) return null
  return mine.find((r) => r.year === year) || null
}

export function formatStat(value: unknown, digits = 1): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toFixed(digits)
}

export function rankAmong(
  rows: UnstackedRow[],
  year: number,
  indicator: string,
  country = 'RO'
): { rank: number; total: number; value: number } | null {
  const scored = rows
    .filter((r) => r.year === year && typeof r[indicator] === 'number')
    .map((r) => ({ country: String(r.country || ''), value: Number(r[indicator]) }))
    .sort((a, b) => b.value - a.value)
  const total = scored.length
  const idx = scored.findIndex((r) => r.country === country)
  if (idx < 0) return null
  return { rank: idx + 1, total, value: scored[idx].value }
}

export function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

export const EUROPE_CODES = [
  'RO', 'HU', 'PL', 'CZ', 'BG', 'HR', 'SK', 'SI', 'DE', 'AT',
  'IT', 'ES', 'FR', 'GB', 'NL', 'BE', 'GR', 'PT', 'SE', 'DK',
  'FI', 'EE', 'LT', 'LV', 'IE',
]

export function comparisonCountries(rows: UnstackedRow[], year: number, indicator: string) {
  const wanted = ['RO', 'HU', 'PL', 'HR', 'CZ', 'BG']
  return wanted
    .map((code) => rows.find((r) => r.year === year && r.country === code))
    .filter((r): r is UnstackedRow => Boolean(r && typeof r[indicator] === 'number'))
    .map((r, i) => ({
      code: String(r.country),
      name: String(r.langcountry || r.country),
      value: Number(r[indicator]),
      accentNum: (i % 6) + 1,
    }))
}

export function seriesForCountry(
  rows: UnstackedRow[],
  country: string,
  indicator: string
): Array<{ year: number; value: number }> {
  return rows
    .filter((r) => r.country === country && typeof r[indicator] === 'number')
    .map((r) => ({ year: Number(r.year), value: Number(r[indicator]) }))
    .sort((a, b) => a.year - b.year)
}

export function useMemoLatestRomania(file: UnstackedFile | null) {
  return useMemo(() => (file ? latestRomania(file.data) : null), [file])
}
