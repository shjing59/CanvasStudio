import type { ImageMetadata } from './image'
import type { FilterState } from './filter'

export type RatioOptionId =
  | '1:1'
  | '3:2'
  | '2:3'
  | '5:4'
  | '4:5'
  | '16:9'
  | '9:16'
  | 'original'
  | 'custom'

export interface RatioOption {
  id: RatioOptionId
  label: string
  value: number | null
  description?: string
}

export interface BorderSetting {
  value: number
  unit: 'px' | 'percent'
}

export interface TransformState {
  x: number
  y: number
  scale: number
}

export interface CanvasDimensions {
  baseWidth: number
  baseHeight: number
  ratio: number
}

export interface ExportOptions {
  format: 'png' | 'jpeg'
  quality: number // 0 - 1
}

/**
 * Defines a crop region in normalized image coordinates (0-1).
 * When null, the full image is shown without cropping.
 */
export interface CropState {
  /** Left edge position (0-1 normalized, in image coordinates) */
  x: number
  /** Top edge position (0-1 normalized, in image coordinates) */
  y: number
  /** Width of crop region (0-1 normalized) */
  width: number
  /** Height of crop region (0-1 normalized) */
  height: number
  /** Whether to lock aspect ratio during resize */
  aspectLock: boolean
  /** Locked aspect ratio (width/height), only used when aspectLock is true */
  lockedAspect?: number
}

export interface CanvasSnapshot {
  image?: ImageMetadata
  transform: TransformState
  crop: CropState | null
  filter: FilterState | null
  borders: { top: BorderSetting; bottom: BorderSetting }
  background: string
  dimensions: CanvasDimensions
  ratioId: RatioOptionId
  previewSize: { width: number; height: number } | null
}

