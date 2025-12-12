import type { ImageMetadata, FilterState, LUTData } from '../../types/filter'
import { applyLUTToCanvas } from './processor'

/**
 * Generate a fully filtered image (intensity = 1.0) from the original image and filter.
 * This is expensive, so we cache it and only regenerate when the filter changes.
 * For intensity adjustments, we blend between original and this cached image.
 */
export function generateFilteredImageFull(
  image: ImageMetadata,
  lutData: LUTData
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext('2d', { colorSpace: 'srgb' })
  
  if (!ctx) {
    throw new Error('Failed to create canvas context for filtered image')
  }

  // Draw the original image
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image.element, 0, 0, image.width, image.height)
  
  // Apply filter at full intensity (1.0)
  applyLUTToCanvas(ctx, lutData, 1.0, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  })
  
  return canvas
}

/**
 * Get or generate the filtered image for a filter state.
 * Returns cached version if available and still valid, otherwise generates new one.
 */
export function getFilteredImage(
  image: ImageMetadata,
  filter: FilterState
): HTMLCanvasElement | null {
  // If no filter data, return null
  if (!filter.lutData || filter.intensity === 0) {
    return null
  }

  // Check if cached image exists and is still valid
  // We regenerate if intensity changed (cached image might have different intensity)
  // For now, we'll always regenerate to ensure correctness
  // In the future, we could add a cache key based on filterId + intensity
  
  // Generate filtered image
  return generateFilteredImage(image, filter.lutData, filter.intensity)
}
