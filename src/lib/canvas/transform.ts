/**
 * Pure functions for image transform calculations.
 * These functions don't depend on store state and can be used with any image.
 */

import type { ImageMetadata } from '../../types/image'
import type { TransformState, CanvasSnapshot, RatioOptionId, CropState } from '../../types/canvas'
import { computeDefaultScale, computeFitScale } from './math'
import { findRatioValue } from './ratios'
import { SNAP } from './constants'

/**
 * Pure function: Calculate initial transform for any image in any canvas size.
 * This is the foundation for per-image transforms.
 */
export function computeInitialTransform(
  image: ImageMetadata,
  canvasWidth: number,
  canvasHeight: number
): TransformState {
  const scale = computeDefaultScale(image, canvasWidth, canvasHeight)
  return { x: 0, y: 0, scale }
}

/**
 * Pure function: Calculate fit scale for any image in any canvas size.
 */
export function computeImageFitScale(
  image: ImageMetadata,
  canvasWidth: number,
  canvasHeight: number
): number {
  return computeFitScale(image, canvasWidth, canvasHeight)
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
 */
export function createImageSnapshot(params: {
  image: ImageMetadata
  transform: TransformState
  crop: CropState | null
  canvasWidth: number
  canvasHeight: number
  background: string
  ratioId: RatioOptionId
  customRatio: { width: number; height: number }
}): CanvasSnapshot {
  const { image, transform, crop, canvasWidth, canvasHeight, background, ratioId, customRatio } = params
  const ratio = findRatioValue(ratioId, { custom: customRatio, image })
  const baseWidth = image.width
  const baseHeight = baseWidth / ratio

  return {
    image,
    transform,
    crop,
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

