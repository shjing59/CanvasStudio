/**
 * Filter-related type definitions for LUT (Look-Up Table) support.
 */

/**
 * Supported filter formats
 */
export type FilterFormat = 'cube' | '3dl' | 'png' | 'json'

/**
 * Normalized LUT data structure (3D RGB lookup table)
 * All values are normalized 0-1, regardless of source format
 */
export interface LUTData {
  /** LUT size (e.g., 32 for 32x32x32 cube) */
  size: number
  /** RGB values in [R, G, B] format, length = size^3 * 3 */
  data: Float32Array
  /** Optional metadata from source file */
  metadata?: {
    title?: string
    domainMin?: [number, number, number]
    domainMax?: [number, number, number]
  }
}

/**
 * Filter state stored per image
 */
export interface FilterState {
  /** Unique filter ID (null = no filter) */
  filterId: string | null
  /** Cached LUT data (null if not loaded) */
  lutData: LUTData | null
  /** Filter intensity (0-1, default 1.0) */
  intensity: number
  /** Cached fully filtered image (intensity = 1.0) - only regenerated when filter changes */
  filteredImageFull?: HTMLCanvasElement | null
}

/**
 * Filter metadata (for UI display)
 */
export interface FilterMetadata {
  id: string
  name: string
  format: FilterFormat
  source: 'builtin' | 'user'
  filePath?: string
  thumbnail?: string
  description?: string
  /** Recommended default intensity (0-1). If not provided, defaults to 1.0 */
  recommendedIntensity?: number
  /** Filter category for organization */
  category?: string
}

/**
 * Loader result
 */
export interface LoaderResult {
  lutData: LUTData
  metadata?: Partial<FilterMetadata>
}
