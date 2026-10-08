'use client'

import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { useThemeToken } from '@/lib/useGemColors'
import { formatStat } from '@/lib/useUnstacked'

export interface ScatterPoint {
  id: string
  name: string
  x: number
  y: number
}

interface ScatterChartProps {
  points: ScatterPoint[]
  xLabel: string
  yLabel: string
  highlightId?: string
  height?: number
}

const SERIF = 'var(--font-display), Georgia, serif'

export function ScatterChart({
  points,
  xLabel,
  yLabel,
  highlightId = 'RO',
  height = 360,
}: ScatterChartProps) {
  const axis = useThemeToken('--color-text-muted', '#6B7D77')
  const [hover, setHover] = useState<ScatterPoint | null>(null)
  const width = 520
  const margin = { top: 16, right: 20, bottom: 40, left: 48 }
  const innerW = width - margin.left - margin.right
  const innerH = height - margin.top - margin.bottom

  const x = useMemo(() => {
    const xs = points.map((p) => p.x)
    return scaleLinear().domain([0, Math.max(...xs, 1) * 1.08]).range([0, innerW]).nice()
  }, [points, innerW])
  const y = useMemo(() => {
    const ys = points.map((p) => p.y)
    return scaleLinear().domain([0, Math.max(...ys, 1) * 1.08]).range([innerH, 0]).nice()
  }, [points, innerH])
  const ordered = useMemo(
    () => points.slice().sort((a, b) => Number(a.id === highlightId) - Number(b.id === highlightId)),
    [points, highlightId]
  )

  if (!points.length) {
    return <EmptyChart />
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" role="img">
      <g transform={`translate(${margin.left},${margin.top})`}>
        {y.ticks(5).map((tick) => (
          <g key={tick}>
            <line
              x1={0}
              x2={innerW}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--color-border-subtle)"
              strokeWidth={tick === 0 ? 1 : 0.5}
              vectorEffect="non-scaling-stroke"
            />
            <text x={-8} y={y(tick)} dy="0.32em" textAnchor="end" fill={axis} fontSize={9.5} fontFamily={SERIF}>{tick}</text>
          </g>
        ))}
        {x.ticks(5).map((tick) => (
          <text key={tick} x={x(tick)} y={innerH + 16} textAnchor="middle" fill={axis} fontSize={9.5} fontFamily={SERIF}>{tick}</text>
        ))}
        {ordered.map((p) => {
          const isHi = p.id === highlightId
          const cx = x(p.x)
          const cy = y(p.y)
          return (
            <g key={p.id} onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}>
              <circle
                cx={cx}
                cy={cy}
                r={isHi ? 4.5 : 3}
                fill={isHi ? 'var(--color-primary)' : axis}
                fillOpacity={isHi ? 1 : 0.55}
                stroke={isHi ? 'var(--color-text-primary)' : 'none'}
                strokeWidth={isHi ? 0.75 : 0}
              />
              <text
                x={cx + (isHi ? 7 : 5)}
                y={cy}
                dy="0.32em"
                fill={isHi ? 'var(--color-primary)' : axis}
                fillOpacity={isHi ? 1 : 0.85}
                fontSize={isHi ? 10 : 9}
                fontWeight={isHi ? 600 : 400}
                letterSpacing="0.04em"
                style={{ pointerEvents: 'none' }}
              >
                {p.id}
              </text>
              <title>{`${p.name}: ${formatStat(p.x, 1)} / ${formatStat(p.y, 1)}`}</title>
            </g>
          )
        })}
        <text x={innerW / 2} y={innerH + 34} textAnchor="middle" fill={axis} fontSize={10}>{xLabel}</text>
        <text transform={`translate(-36,${innerH / 2}) rotate(-90)`} textAnchor="middle" fill={axis} fontSize={10}>{yLabel}</text>
        {hover && (
          <text
            x={x(hover.x) + 8}
            y={y(hover.y) - 10}
            fill="var(--color-text-primary)"
            fontSize={11}
            fontFamily={SERIF}
            stroke="var(--color-bg-card)"
            strokeWidth={3}
            paintOrder="stroke"
            style={{ pointerEvents: 'none' }}
          >
            {hover.name} ({formatStat(hover.x, 1)}, {formatStat(hover.y, 1)})
          </text>
        )}
      </g>
    </svg>
  )
}

export function EmptyChart({ label = 'No data for this selection.' }: { label?: string }) {
  return (
    <div className="h-full min-h-[160px] flex items-center justify-center text-sm text-[var(--color-text-muted)]">
      {label}
    </div>
  )
}
