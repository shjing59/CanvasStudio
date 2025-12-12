/**
 * Centralized constants for canvas calculations.
 * Single source of truth for magic numbers used across the codebase.
 */

export const SCALE = {
  /** Default scale is 95% of fit (leaves a small border visible) */
  DEFAULT_MULTIPLIER: 0.95,
  /** Minimum allowed scale */
  MIN: 0.05,
  /** Maximum allowed scale */
  MAX: 8,
} as const

export const CANVAS = {
  /** Default base width when no image is loaded */
  DEFAULT_BASE_WIDTH: 1600,
  /** Minimum canvas width in pixels */
  MIN_WIDTH: 240,
  /** Maximum canvas width in pixels */
  MAX_WIDTH: 1400,
  /** Minimum canvas width on mobile */
  MOBILE_MIN_WIDTH: 200,
  /** Maximum canvas width ratio on mobile (percentage of viewport) */
  MOBILE_MAX_WIDTH_RATIO: 0.9,
  /** Available width ratio on mobile (percentage of viewport) */
  MOBILE_AVAILABLE_RATIO: 0.95,
} as const

export const RESIZE = {
  /** Minimum aspect ratio change to trigger automatic refit */
  ASPECT_RATIO_THRESHOLD: 0.01,
} as const

export const CUSTOM_RATIO = {
  /** Minimum value for custom ratio width/height */
  MIN: 1,
  /** Maximum value for custom ratio width/height */
  MAX: 100,
} as const

export const SNAP = {
  /** Pixels threshold for center snapping */
  THRESHOLD: 2,
} as const

