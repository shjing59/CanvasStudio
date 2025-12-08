import type { ImageMetadata } from '../../types/image'
import { SCALE, CANVAS } from './constants'

// Re-export constants for backward compatibility
export const DEFAULT_BASE_WIDTH = CANVAS.DEFAULT_BASE_WIDTH
export const MAX_SCALE = SCALE.MAX

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max)

/**
 * Compute the scale needed to fit an image inside a canvas while maintaining aspect ratio.
 * The image will be fully visible (letterboxed if needed).
 */
export function computeFitScale(
  image: ImageMetadata,
  canvasWidth: number,
  canvasHeight: number
): number {
  if (canvasWidth <= 0 || canvasHeight <= 0 || image.width <= 0 || image.height <= 0) {
    return SCALE.MIN
  }
  const scaleByWidth = canvasWidth / image.width
  const scaleByHeight = canvasHeight / image.height
  return Math.min(scaleByWidth, scaleByHeight)
}

/**
 * Compute default scale for initial image fit (slightly smaller than fit to show border).
 */
export function computeDefaultScale(
  image: ImageMetadata,
  canvasWidth: number,
  canvasHeight: number
): number {
  const fitScale = computeFitScale(image, canvasWidth, canvasHeight)
  return Math.max(fitScale * SCALE.DEFAULT_MULTIPLIER, SCALE.MIN)
}
