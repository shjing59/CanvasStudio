/**
 * Pure functions for image transform calculations.
 * These functions don't depend on store state and can be used with any image.
 */

import type { ImageMetadata } from '../../types/image'
import type { TransformState, CanvasSnapshot, RatioOptionId, CropState } from '../../types/canvas'
import type { FilterState } from '../../types/filter'
import { computeDefaultScale, computeFitScale } from './math'
import { findRatioValue } from './ratios'
import { SNAP } from './constants'
import { getCropCenterOffset, getEffectiveDimensions } from './crop'

/**
 * Pure function: Calculate initial transform for any image in any canvas size.
 * When crop is provided, calculates scale and offset to fit and center the cropped region.
 */
export function computeInitialTransform(
  image: ImageMetadata,
  canvasWidth: number,
  canvasHeight: number,
  crop?: CropState | null
): TransformState {
  const scale = computeDefaultScale(image, canvasWidth, canvasHeight, crop)
  
  // If crop exists, offset the transform so the cropped region is centered
  const cropOffset = getCropCenterOffset(image, crop ?? null)
  
  return { 
    x: -cropOffset.x * scale, 
    y: -cropOffset.y * scale, 
    scale 
  }
}

/**
 * Pure function: Calculate fit scale for any image (or cropped region) in any canvas size.
 */
export function computeImageFitScale(
  image: ImageMetadata,
  canvasWidth: number,
  canvasHeight: number,
  crop?: CropState | null
): number {
  return computeFitScale(image, canvasWidth, canvasHeight, crop)
}

/**
 * Pure function: Apply center snapping to a transform.
 */
export function applySnapToTransform(
  transform: TransformState,
  centerSnap: boolean
): TransformState {
  if (!centerSnap) return transform
  return {
    ...transform,
    x: Math.abs(transform.x) < SNAP.THRESHOLD ? 0 : transform.x,
    y: Math.abs(transform.y) < SNAP.THRESHOLD ? 0 : transform.y,
  }
}

/**
 * Pure function: Create a snapshot for any image with any transform.
 * Decouples snapshot creation from store.
 * When crop exists, uses cropped dimensions for export baseWidth/baseHeight.
 */
export function createImageSnapshot(params: {
  image: ImageMetadata
  transform: TransformState
  crop: CropState | null
  filter: FilterState | null
  canvasWidth: number
  canvasHeight: number
  background: string
  ratioId: RatioOptionId
  customRatio: { width: number; height: number }
}): CanvasSnapshot {
  const { image, transform, crop, filter, canvasWidth, canvasHeight, background, ratioId, customRatio } = params
  // Use effective (cropped) dimensions for export
  const effectiveDims = getEffectiveDimensions(image, crop)
  const ratio = findRatioValue(ratioId, { custom: customRatio, image, crop })
  const baseWidth = effectiveDims.width
  const baseHeight = baseWidth / ratio

  return {
    image,
    transform,
    crop,
    filter,
    borders: { top: { value: 0, unit: 'px' }, bottom: { value: 0, unit: 'px' } },
    background,
    dimensions: { baseWidth, baseHeight, ratio },
    ratioId,
    previewSize: { width: canvasWidth, height: canvasHeight },
  }
}

/**
 * Pure function: Merge partial transform with existing transform.
 */
export function mergeTransform(
  current: TransformState,
  partial: Partial<TransformState>
): TransformState {
  return { ...current, ...partial }
}

/**
 * Pure function: Apply position delta to transform.
 */
export function applyPositionDelta(
  transform: TransformState,
  delta: { x: number; y: number }
): TransformState {
  return {
    ...transform,
    x: transform.x + delta.x,
    y: transform.y + delta.y,
  }
}

