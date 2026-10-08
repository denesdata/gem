'use client'

import { publicUrl } from '@/lib/basePath'
import { panelUrl } from '@/lib/panelHost'
import type { UnstackedRow } from '@/lib/useUnstacked'
import { labelsById } from '@/lib/useUnstacked'
import { ChoroplethMap, valuesByCountyCode, valuesByGeoId } from './ChoroplethMap'

const WORLD = panelUrl('countries-110m-fixed.json')
const COUNTIES = publicUrl('/data/romania-counties.json')
const NUTS = panelUrl('romania-regio.json')

export function WorldChoropleth({
  rows,
  year,
  indicator,
  height = 450,
}: {
  rows: UnstackedRow[]
  year: string | number | null
  indicator: string
  height?: number
}) {
  return (
    <ChoroplethMap
      geography={WORLD}
      values={valuesByGeoId(rows, year, indicator)}
      labels={labelsById(rows)}
      projection="geoEqualEarth"
      height={height}
    />
  )
}

export function CountyChoropleth({
  rows,
  year,
  indicator,
  height = 420,
}: {
  rows: UnstackedRow[]
  year: string | number | null
  indicator: string
  height?: number
}) {
  return (
    <ChoroplethMap
      geography={COUNTIES}
      values={valuesByCountyCode(rows, year, indicator)}
      labels={labelsById(rows)}
      projection="geoMercator"
      projectionConfig={{ center: [25, 46], scale: 4500 }}
      height={height}
    />
  )
}

export function NutsChoropleth({
  rows,
  year,
  indicator,
  height = 420,
}: {
  rows: UnstackedRow[]
  year: string | number | null
  indicator: string
  height?: number
}) {
  return (
    <ChoroplethMap
      geography={NUTS}
      values={valuesByGeoId(rows, year, indicator)}
      labels={labelsById(rows)}
      projection="geoMercator"
      projectionConfig={{ center: [25, 46], scale: 2800 }}
      height={height}
    />
  )
}

export function MapSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div
      className="animate-pulse bg-[var(--color-bg-elevated)] rounded-lg"
      style={{ height }}
    />
  )
}
