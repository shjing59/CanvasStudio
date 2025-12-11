import type { ImageMetadata } from '../../types/image'
import type { CropState } from '../../types/canvas'
import { SCALE, CANVAS } from './constants'
import { getEffectiveDimensions } from './crop'

// Re-export constants for backward compatibility
export const DEFAULT_BASE_WIDTH = CANVAS.DEFAULT_BASE_WIDTH
export const MAX_SCALE = SCALE.MAX

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/**
 * Compute the scale needed to fit an image (or cropped region) inside a canvas.
 * When crop is provided, calculates based on the cropped dimensions.
 * The image/crop will be fully visible (letterboxed if needed).
 */
export function computeFitScale(
  image: ImageMetadata,
  canvasWidth: number,
  canvasHeight: number,
  crop?: CropState | null
): number {
  const { width, height } = getEffectiveDimensions(image, crop ?? null)
  
  if (canvasWidth <= 0 || canvasHeight <= 0 || width <= 0 || height <= 0) {
    return SCALE.MIN
  }
  const scaleByWidth = canvasWidth / width
  const scaleByHeight = canvasHeight / height
  return Math.min(scaleByWidth, scaleByHeight)
}

/**
 * Compute default scale for initial image/crop fit (slightly smaller than fit to show border).
 */
export function computeDefaultScale(
  image: ImageMetadata,
  canvasWidth: number,
  canvasHeight: number,
  crop?: CropState | null
): number {
  const fitScale = computeFitScale(image, canvasWidth, canvasHeight, crop)
  return Math.max(fitScale * SCALE.DEFAULT_MULTIPLIER, SCALE.MIN)
}
