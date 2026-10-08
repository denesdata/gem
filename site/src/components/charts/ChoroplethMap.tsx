'use client'

import { useMemo, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { scaleQuantize } from 'd3-scale'
import { useThemeToken } from '@/lib/useGemColors'
import { formatStat } from '@/lib/useUnstacked'

const STEPS = 5

function parseRgb(input: string): [number, number, number] | null {
  const hex = input.trim().match(/^#([0-9a-f]{6})$/i)
  if (hex) {
    const n = parseInt(hex[1], 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const rgb = input.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i)
  if (!rgb) return null
  return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
}

function mix(from: [number, number, number], to: [number, number, number], t: number) {
  const u = Math.min(1, Math.max(0, t))
  const channel = from.map((value, i) => Math.round(value + (to[i] - value) * u))
  return `rgb(${channel[0]}, ${channel[1]}, ${channel[2]})`
}

function sequentialRamp(primary: string, steps: number) {
  const ink = parseRgb(primary) ?? [61, 139, 112]
  return Array.from({ length: steps }, (_, i) => mix([255, 255, 255], ink, 0.22 + (0.78 * i) / (steps - 1)))
}

function legendTick(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`
  if (abs >= 1000) return `${(value / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`
  if (abs >= 10) return String(Math.round(value))
  return formatStat(value, 1)
}

interface ChoroplethMapProps {
  geography: string
  values: Record<string, number>
  labels?: Record<string, string>
  projection?: string
  projectionConfig?: { center?: [number, number]; scale?: number }
  height?: number
  missingFill?: string
}

export function ChoroplethMap({
  geography,
  values,
  labels = {},
  projection = 'geoMercator',
  projectionConfig,
  height = 420,
  missingFill = 'var(--color-border-subtle)',
}: ChoroplethMapProps) {
  const primary = useThemeToken('--color-primary', '#3D8B70')
  const [tooltip, setTooltip] = useState<{ name: string; value: number; x: number; y: number } | null>(null)

  const colorScale = useMemo(() => {
    const nums = Object.values(values).filter((v) => Number.isFinite(v))
    if (nums.length < 2) return null
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    if (min === max) return null
    const scale = scaleQuantize<string>().domain([min, max]).range(sequentialRamp(primary, STEPS))
    const breaks = scale.thresholds()
    const edges = [min, ...breaks, max]
    const bins = sequentialRamp(primary, STEPS).map((color, i) => ({
      color,
      lo: edges[i],
      hi: edges[i + 1],
    }))
    return { scale, bins }
  }, [values, primary])

  return (
    <div className="flex flex-col" style={{ height }}>
      <div className="relative min-h-0 flex-1">
      <ComposableMap
        projection={projection}
        projectionConfig={projectionConfig}
        className="h-full w-full"
      >
        <Geographies geography={geography}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const key = String(geo.id ?? geo.properties.id ?? geo.properties.NUTS_ID ?? geo.properties.ISO_A3 ?? '')
              const value = values[key] ?? values[String(geo.properties.id ?? '')]
              const name = labels[key] || geo.properties.name || geo.properties.NAME_1 || geo.properties.NUTS_NAME || key
              const fill = value != null && colorScale ? colorScale.scale(value) : missingFill
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="var(--color-bg-card)"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover: { outline: 'none', fill: 'var(--color-primary)', cursor: 'pointer' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={(event) => {
                    if (value == null) return
                    setTooltip({ name, value, x: event.clientX, y: event.clientY })
                  }}
                  onMouseMove={(event) => {
                    if (value == null) return
                    setTooltip({ name, value, x: event.clientX, y: event.clientY })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>
      </div>
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none rounded-sm border px-2.5 py-1.5"
          style={{
            left: tooltip.x + 12,
            top: tooltip.y - 12,
            transform: 'translateY(-100%)',
            background: 'var(--color-bg-card)',
            borderColor: 'var(--color-border-subtle)',
            color: 'var(--color-text-primary)',
          }}
        >
          <div className="text-[11px] leading-tight text-[var(--color-text-secondary)]">{tooltip.name}</div>
          <div className="font-display text-base leading-tight tabular text-[var(--color-text-primary)]">
            {formatStat(tooltip.value, 1)}
          </div>
        </div>
      )}
      {colorScale && (
        <div className="px-4 pb-1 pt-2">
          <div className="relative mx-auto" style={{ width: STEPS * 36 }}>
            <div className="flex">
              {colorScale.bins.map((bin) => (
                <div key={bin.lo} className="h-1.5 flex-1" style={{ background: bin.color }} />
              ))}
            </div>
            <div className="relative mt-1 h-3">
              {[colorScale.bins[0].lo, ...colorScale.bins.map((bin) => bin.hi)].map((edge, i, edges) => (
                <span
                  key={i}
                  className="absolute font-display text-[9px] tabular leading-none text-[var(--color-text-muted)]"
                  style={{
                    left: `${(i / (edges.length - 1)) * 100}%`,
                    transform: i === 0 ? 'none' : i === edges.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                  }}
                >
                  {legendTick(edge)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function valuesByGeoId(
  rows: Array<{ id?: string | number; year?: string | number; country?: string; [key: string]: unknown }>,
  year: string | number | null,
  indicator: string
): Record<string, number> {
  const out: Record<string, number> = {}
  if (year == null) return out
  const wanted = String(year)
  for (const row of rows) {
    if (String(row.year) !== wanted) continue
    const value = row[indicator]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    const raw = String(row.id ?? '')
    if (!raw || raw === 'undefined') continue
    out[raw] = value
    out[raw.replace(/^0+/, '') || raw] = value
    if (row.country) out[String(row.country)] = value
  }
  return out
}

export function valuesByCountyCode(
  rows: Array<{ county?: string; country?: string; id?: string | number; year?: string | number; [key: string]: unknown }>,
  year: string | number | null,
  indicator: string
): Record<string, number> {
  const out: Record<string, number> = {}
  if (year == null) return out
  const wanted = String(year)
  for (const row of rows) {
    if (String(row.year) !== wanted) continue
    const value = row[indicator]
    if (typeof value !== 'number' || !Number.isFinite(value)) continue
    if (row.county) out[String(row.county)] = value
    if (row.country) out[String(row.country)] = value
    if (row.id != null) out[String(row.id)] = value
  }
  return out
}
