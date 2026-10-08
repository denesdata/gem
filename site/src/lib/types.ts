// GEM Data Types

export interface CountyData {
  year: number
  county: string
  id: number | null
  lang: string
  langcounty: string
  [key: string]: string | number | null // Dynamic indicator columns
}

export interface GEMDataset {
  data: CountyData[]
  meta: Record<string, string> // Indicator key -> description
}

export interface APSData extends GEMDataset {
  // Adult Population Survey specific fields
}

export interface NESData extends GEMDataset {
  // National Expert Survey specific fields
}

export interface RoStatsData extends GEMDataset {
  // Romanian Statistics data
}

// County codes
export type CountyCode = 
  | 'AB' | 'AR' | 'AG' | 'BC' | 'BH' | 'BN' | 'BT' | 'BV' | 'BR' | 'BZ'
  | 'CS' | 'CL' | 'CJ' | 'CT' | 'CV' | 'DB' | 'DJ' | 'GL' | 'GR' | 'GJ'
  | 'HR' | 'HD' | 'IL' | 'IS' | 'IF' | 'MM' | 'MH' | 'MS' | 'NT' | 'OT'
  | 'PH' | 'SM' | 'SJ' | 'SB' | 'SV' | 'TR' | 'TM' | 'TL' | 'VS' | 'VL'
  | 'VN' | 'B' // Bucharest

export interface Report {
  id: number
  title: string
  subtitle?: string
  year: number
  image: string
  pdf: string
  lang?: string
}

export interface KeyMetric {
  id: string
  name: string
  value: number
  change: number
  description: string
  year?: number
}

// Color schemes
export type ColorScheme = 'colorful' | 'green'

// Layout styles
export type LayoutStyle = 'compact' | 'airy'

// Content mode - Simple (streamlined) vs Expert (all sections)
export type ContentMode = 'simple' | 'expert'

// Grafana dashboard template variables cloned into the Next.js site
export type GrafanaStudy = 'aps' | 'nes' | 'rostats'

export const GRAFANA_DEFAULTS = {
  aps: 'Opport',
  nes: 'EFC2a',
  rostats: 'TEMPO_INT101O_3_2_2022',
} as const

// Translations
export type Locale = 'en' | 'ro' | 'hu'

export interface Translation {
  [key: string]: string | Translation
}

export type Translations = Record<Locale, Translation>
