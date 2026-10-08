declare module 'react-simple-maps' {
  import { ComponentType, ReactNode } from 'react'

  export interface ComposableMapProps {
    projection?: string
    projectionConfig?: {
      center?: [number, number]
      scale?: number
      rotate?: [number, number, number]
    }
    width?: number
    height?: number
    className?: string
    children?: ReactNode
  }

  export interface ZoomableGroupProps {
    center?: [number, number]
    zoom?: number
    minZoom?: number
    maxZoom?: number
    translateExtent?: [[number, number], [number, number]]
    onMoveStart?: (event: any) => void
    onMove?: (event: any) => void
    onMoveEnd?: (event: any) => void
    children?: ReactNode
  }

  export interface GeographiesProps {
    geography: string | object
    children: (context: { geographies: Geography[] }) => ReactNode
  }

  export interface Geography {
    rsmKey: string
    id?: string | number
    properties: Record<string, any>
    geometry: any
  }

  export interface GeographyProps {
    geography: Geography
    fill?: string
    stroke?: string
    strokeWidth?: number
    style?: {
      default?: React.CSSProperties
      hover?: React.CSSProperties
      pressed?: React.CSSProperties
    }
    onMouseEnter?: (event: React.MouseEvent) => void
    onMouseMove?: (event: React.MouseEvent) => void
    onMouseLeave?: (event: React.MouseEvent) => void
    onClick?: (event: React.MouseEvent) => void
    className?: string
  }

  export const ComposableMap: ComponentType<ComposableMapProps>
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>
  export const Geographies: ComponentType<GeographiesProps>
  export const Geography: ComponentType<GeographyProps>
}
