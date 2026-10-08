'use client'

import { useMemo } from 'react'
import { scaleLinear } from 'd3-scale'
import { useGemColors, useThemeToken } from '@/lib/useGemColors'
import { formatStat } from '@/lib/useUnstacked'
import { EmptyChart } from './ScatterChart'

const SERIF = 'var(--font-display), Georgia, serif'
const PRIMARY = 'var(--color-primary)'
const HAIRLINE = 'var(--color-border-subtle)'

export interface RadarAxis {
  key: string
  label: string
  value: number
}

export function RadarChart({ axes, max = 9, height = 380 }: { axes: RadarAxis[]; max?: number; height?: number }) {
  const muted = useThemeToken('--color-text-muted', '#6B7D77')
  const cx = 220
  const cy = height / 2
  const radius = Math.min(cx, cy) - 40
  const n = axes.length

  const points = useMemo(() => {
    return axes.map((axis, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2
      const r = (Math.max(0, axis.value) / max) * radius
      return {
        ...axis,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        ex: cx + Math.cos(angle) * radius,
        ey: cy + Math.sin(angle) * radius,
        lx: cx + Math.cos(angle) * (radius + 18),
        ly: cy + Math.sin(angle) * (radius + 18),
      }
    })
  }, [axes, max, n, radius, cx, cy])

  if (!n) return <EmptyChart />

  const rings = [0.25, 0.5, 0.75, 1]
  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 440 ${height}`} className="w-full h-full">
      {rings.map((ring) => (
        <circle
          key={ring}
          cx={cx}
          cy={cy}
          r={radius * ring}
          fill="none"
          stroke={HAIRLINE}
          strokeWidth={0.75}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {points.map((p) => (
        <line
          key={p.key}
          x1={cx}
          y1={cy}
          x2={p.ex}
          y2={p.ey}
          stroke={HAIRLINE}
          strokeWidth={0.75}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <polygon points={polygon} fill={PRIMARY} fillOpacity={0.1} stroke={PRIMARY} strokeWidth={1.25} strokeLinejoin="round" />
      {points.map((p) => (
        <g key={p.key}>
          <circle cx={p.x} cy={p.y} r={2} fill={PRIMARY} />
          <text
            x={p.lx}
            y={p.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={muted}
            fontSize={9}
            letterSpacing="0.06em"
          >
            {p.key}
          </text>
        </g>
      ))}
    </svg>
  )
}

export function HorizontalBars({
  items,
}: {
  items: Array<{ label: string; value: number; accent?: number }>
}) {
  const colors = useGemColors()
  const max = Math.max(...items.map((i) => i.value), 1)
  if (!items.length) return <EmptyChart />
  return (
    <ul className="divide-y divide-[var(--color-border-subtle)]">
      {items.map((item) => (
        <li key={item.label} className="py-2.5 first:pt-0 last:pb-0">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[13px] text-[var(--color-text-secondary)]">{item.label}</span>
            <span className="font-display text-[15px] tabular text-[var(--color-text-primary)]">
              {formatStat(item.value, 1)}
            </span>
          </div>
          <div className="mt-1.5 h-px bg-[var(--color-bg-tertiary)]">
            <div
              className="h-px"
              style={{
                width: `${Math.max(0, (item.value / max) * 100)}%`,
                background: item.accent != null ? colors[item.accent % colors.length] : PRIMARY,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export interface SeriesLine {
  id: string
  label: string
  color?: string
  points: Array<{ year: number; value: number }>
}

export function MultiLineChart({ series, height = 240 }: { series: SeriesLine[]; height?: number }) {
  const colors = useGemColors()
  const axis = useThemeToken('--color-text-muted', '#6B7D77')
  const width = 640
  const margin = { top: 12, right: 12, bottom: 26, left: 36 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  const drawn = series.filter((s) => s.points.length > 1)
  const all = drawn.flatMap((s) => s.points)
  if (!all.length) return <EmptyChart />

  const x = scaleLinear()
    .domain([Math.min(...all.map((p) => p.year)), Math.max(...all.map((p) => p.year))])
    .range([0, innerW])
  const y = scaleLinear()
    .domain([0, Math.max(...all.map((p) => p.value)) * 1.1])
    .range([innerH, 0])
    .nice()
  const colorOf = (s: SeriesLine, i: number) => s.color || (i === 0 ? PRIMARY : colors[i % colors.length])

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {y.ticks(4).map((tick) => (
            <g key={tick}>
              <line
                x1={0}
                x2={innerW}
                y1={y(tick)}
                y2={y(tick)}
                stroke={HAIRLINE}
                strokeWidth={tick === 0 ? 1 : 0.5}
                vectorEffect="non-scaling-stroke"
              />
              <text x={-6} y={y(tick)} dy="0.32em" textAnchor="end" fill={axis} fontSize={9.5} fontFamily={SERIF}>
                {tick}
              </text>
            </g>
          ))}
          {x.ticks(6).map((tick) => (
            <text key={tick} x={x(tick)} y={innerH + 16} textAnchor="middle" fill={axis} fontSize={9.5} fontFamily={SERIF}>
              {tick}
            </text>
          ))}
          {drawn.map((s, i) => {
            const d = s.points
              .slice()
              .sort((a, b) => a.year - b.year)
              .map((p, idx) => `${idx === 0 ? 'M' : 'L'}${x(p.year)},${y(p.value)}`)
              .join(' ')
            return (
              <path
                key={s.id}
                d={d}
                fill="none"
                stroke={colorOf(s, i)}
                strokeWidth={1.75}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )
          })}
        </g>
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {drawn.map((s, i) => (
          <div key={s.id} className="flex items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            <span className="inline-block h-0.5 w-3.5" style={{ background: colorOf(s, i) }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function BubbleChart({
  points,
  xLabel,
  yLabel,
  height = 320,
}: {
  points: Array<{ id: string; name: string; x: number; y: number; r: number }>
  xLabel: string
  yLabel: string
  height?: number
}) {
  const axis = useThemeToken('--color-text-muted', '#6B7D77')
  const width = 480
  const margin = { top: 16, right: 16, bottom: 36, left: 44 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom
  if (!points.length) return <EmptyChart />

  const x = scaleLinear().domain([0, Math.max(...points.map((p) => p.x), 1) * 1.1]).range([0, innerW]).nice()
  const y = scaleLinear().domain([0, Math.max(...points.map((p) => p.y), 1) * 1.1]).range([innerH, 0]).nice()
  const r = scaleLinear().domain([0, Math.max(...points.map((p) => p.r), 1)]).range([2.5, 14])
  const ordered = points.slice().sort((a, b) => (a.id === 'RO' ? 1 : b.id === 'RO' ? -1 : b.r - a.r))

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
      <g transform={`translate(${margin.left},${margin.top})`}>
        {y.ticks(4).map((tick) => (
          <g key={tick}>
            <line
              x1={0}
              x2={innerW}
              y1={y(tick)}
              y2={y(tick)}
              stroke={HAIRLINE}
              strokeWidth={tick === 0 ? 1 : 0.5}
              vectorEffect="non-scaling-stroke"
            />
            <text x={-6} y={y(tick)} dy="0.32em" textAnchor="end" fill={axis} fontSize={9.5} fontFamily={SERIF}>
              {tick}
            </text>
          </g>
        ))}
        {x.ticks(5).map((tick) => (
          <text key={tick} x={x(tick)} y={innerH + 14} textAnchor="middle" fill={axis} fontSize={9.5} fontFamily={SERIF}>
            {tick}
          </text>
        ))}
        {ordered.map((p) => {
          const isRo = p.id === 'RO'
          return (
            <circle
              key={p.id}
              cx={x(p.x)}
              cy={y(p.y)}
              r={r(p.r)}
              fill={isRo ? PRIMARY : axis}
              fillOpacity={isRo ? 0.85 : 0.22}
              stroke={isRo ? 'var(--color-text-primary)' : axis}
              strokeOpacity={isRo ? 1 : 0.45}
              strokeWidth={isRo ? 1 : 0.5}
            >
              <title>{`${p.name}: ${formatStat(p.x, 1)} / ${formatStat(p.y, 1)}`}</title>
            </circle>
          )
        })}
        <text x={innerW / 2} y={innerH + 30} textAnchor="middle" fill={axis} fontSize={10}>{xLabel}</text>
        <text transform={`translate(-34,${innerH / 2}) rotate(-90)`} textAnchor="middle" fill={axis} fontSize={10}>{yLabel}</text>
      </g>
    </svg>
  )
}
