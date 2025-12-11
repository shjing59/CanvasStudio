/**
 * Pure functions for crop calculations.
 * All coordinates are normalized (0-1) unless otherwise specified.
 */

import type { CropState, TransformState } from '../../types/canvas'
import type { ImageMetadata } from '../../types/image'

/**
 * Create a default crop state (full image, no constraints).
 */
export function createDefaultCrop(): CropState {
  return {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
    aspectLock: false,
  }
}

/**
 * Compute a crop region that fits a target aspect ratio centered in the image.
 * @param imageAspect - The source image aspect ratio (width/height)
 * @param targetAspect - The desired crop aspect ratio (width/height)
 * @returns CropState with the largest centered crop matching targetAspect
 */
export function computeCropFromAspect(
  imageAspect: number,
  targetAspect: number
): CropState {
  let width: number
  let height: number

  if (targetAspect > imageAspect) {
    // Target is wider than image - constrained by width
    width = 1
    height = imageAspect / targetAspect
  } else {
    // Target is taller than image - constrained by height
    height = 1
    width = targetAspect / imageAspect
  }

  // Center the crop
  const x = (1 - width) / 2
  const y = (1 - height) / 2

  return {
    x,
    y,
    width,
    height,
    aspectLock: true,
    lockedAspect: targetAspect,
  }
}

/**
 * Constrain a crop region to maintain a specific aspect ratio.
 * Adjusts dimensions while keeping the center point fixed.
 * @param crop - Current crop state
 * @param aspect - Target aspect ratio (width/height)
 * @returns New crop state with constrained dimensions
 */
export function constrainCropToAspect(
  crop: CropState,
  aspect: number
): CropState {
  const currentAspect = crop.width / crop.height

  let newWidth = crop.width
  let newHeight = crop.height

  if (currentAspect > aspect) {
    // Current crop is too wide - reduce width
    newWidth = crop.height * aspect
  } else {
    // Current crop is too tall - reduce height
    newHeight = crop.width / aspect
  }

  // Keep centered on the same point
  const centerX = crop.x + crop.width / 2
  const centerY = crop.y + crop.height / 2

  return {
    ...crop,
    x: centerX - newWidth / 2,
    y: centerY - newHeight / 2,
    width: newWidth,
    height: newHeight,
    aspectLock: true,
    lockedAspect: aspect,
  }
}

/**
 * Convert normalized crop coordinates to image pixel coordinates.
 */
export function cropToImageCoords(
  crop: CropState,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  return {
    x: crop.x * imageWidth,
    y: crop.y * imageHeight,
    width: crop.width * imageWidth,
    height: crop.height * imageHeight,
  }
}

/**
 * Convert normalized crop coordinates to canvas coordinates.
 * Takes into account the image transform (position and scale).
 */
export function cropToCanvasCoords(
  crop: CropState,
  image: ImageMetadata,
  transform: TransformState,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } {
  // First get crop in image pixel coordinates
  const cropInImage = cropToImageCoords(crop, image.width, image.height)

  // Calculate the image position on canvas (same logic as ImageLayer)
  const displayWidth = image.width * transform.scale
  const displayHeight = image.height * transform.scale
  const imageLeft = canvasWidth / 2 - displayWidth / 2 + transform.x
  const imageTop = canvasHeight / 2 - displayHeight / 2 + transform.y

  // Scale crop coordinates to display size and offset to canvas position
  return {
    x: imageLeft + cropInImage.x * transform.scale,
    y: imageTop + cropInImage.y * transform.scale,
    width: cropInImage.width * transform.scale,
    height: cropInImage.height * transform.scale,
  }
}

/**
 * Clamp crop region to stay within image bounds (0-1 range).
 * When aspect is locked, maintains the aspect ratio while clamping by scaling uniformly.
 */
export function clampCropToBounds(crop: CropState): CropState {
  const minSize = 0.05
  let width = crop.width
  let height = crop.height

  // If aspect is locked, scale uniformly to maintain aspect ratio
  if (crop.aspectLock && crop.lockedAspect) {
    // Clamp maximum: scale down uniformly if either dimension exceeds 1
    if (width > 1 || height > 1) {
      const scale = Math.min(1 / width, 1 / height)
      width = width * scale
      height = height * scale
    }
    
    // Clamp minimum: scale up uniformly if either dimension is below minSize
    if (width < minSize || height < minSize) {
      const scale = Math.max(minSize / width, minSize / height)
      width = width * scale
      height = height * scale
    }
  } else {
    // Free aspect: clamp independently
    width = Math.max(minSize, Math.min(1, width))
    height = Math.max(minSize, Math.min(1, height))
  }

  // Clamp position to keep crop within bounds
  const x = Math.max(0, Math.min(1 - width, crop.x))
  const y = Math.max(0, Math.min(1 - height, crop.y))

  return { ...crop, x, y, width, height }
}

/**
 * Resize crop from a specific handle while maintaining aspect ratio if locked.
 * When aspect is locked, keeps the opposite corner/edge fixed as anchor point.
 * @param crop - Current crop state
 * @param handle - Which handle is being dragged ('nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w')
 * @param delta - Movement delta in normalized coordinates { dx, dy }
 * @param imageAspect - The source image aspect ratio (width/height), needed for aspect-locked resize
 * @returns New crop state
 */
export function resizeCropFromHandle(
  crop: CropState,
  handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
  delta: { dx: number; dy: number },
  imageAspect: number = 1
): CropState {
  if (!crop.aspectLock || !crop.lockedAspect) {
    // Free resize - no aspect lock
    return resizeCropFree(crop, handle, delta)
  }

  // Convert target pixel aspect to normalized aspect
  // normalizedAspect = targetPixelAspect / imageAspect
  const normalizedAspect = crop.lockedAspect / imageAspect

  // Aspect-locked resize using normalized aspect
  return resizeCropAspectLocked(crop, handle, delta, normalizedAspect)
}

/**
 * Free resize without aspect ratio constraints.
 */
function resizeCropFree(
  crop: CropState,
  handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
  delta: { dx: number; dy: number }
): CropState {
  let { x, y, width, height } = crop
  const { dx, dy } = delta

  switch (handle) {
    case 'nw':
      x += dx
      y += dy
      width -= dx
      height -= dy
      break
    case 'n':
      y += dy
      height -= dy
      break
    case 'ne':
      y += dy
      width += dx
      height -= dy
      break
    case 'e':
      width += dx
      break
    case 'se':
      width += dx
      height += dy
      break
    case 's':
      height += dy
      break
    case 'sw':
      x += dx
      width -= dx
      height += dy
      break
    case 'w':
      x += dx
      width -= dx
      break
  }

  return clampCropToBounds({ ...crop, x, y, width, height })
}

/**
 * Aspect-locked resize keeping opposite corner/edge as anchor.
 * Uses a simple approach: calculate new size from the dragged edge/corner,
 * then derive the other dimension from the aspect ratio.
 */
function resizeCropAspectLocked(
  crop: CropState,
  handle: 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w',
  delta: { dx: number; dy: number },
  aspect: number
): CropState {
  const { dx, dy } = delta
  
  // Start with current dimensions
  let newWidth = crop.width
  let newHeight = crop.height
  let newX = crop.x
  let newY = crop.y
  
  // Determine how the handle affects each dimension
  // For aspect-locked, we pick ONE dimension to drive the resize based on handle type
  
  switch (handle) {
    case 'e':
      // Right edge: width changes, height follows
      newWidth = crop.width + dx
      newHeight = newWidth / aspect
      // Anchor: left edge (x stays), center vertically
      newY = crop.y + (crop.height - newHeight) / 2
      break
      
    case 'w':
      // Left edge: width changes, height follows
      newWidth = crop.width - dx
      newHeight = newWidth / aspect
      newX = crop.x + crop.width - newWidth
      // Center vertically
      newY = crop.y + (crop.height - newHeight) / 2
      break
      
    case 's':
      // Bottom edge: height changes, width follows
      newHeight = crop.height + dy
      newWidth = newHeight * aspect
      // Anchor: top edge (y stays), center horizontally
      newX = crop.x + (crop.width - newWidth) / 2
      break
      
    case 'n':
      // Top edge: height changes, width follows
      newHeight = crop.height - dy
      newWidth = newHeight * aspect
      newY = crop.y + crop.height - newHeight
      // Center horizontally
      newX = crop.x + (crop.width - newWidth) / 2
      break
      
    case 'se':
      // Bottom-right corner: use combined delta, anchor top-left
      {
        const widthFromDx = crop.width + dx
        const heightFromDy = crop.height + dy
        const widthFromHeight = heightFromDy * aspect
        
        // Pick the dimension that gives smaller result (more restrictive)
        if (widthFromDx < widthFromHeight) {
          newWidth = Math.max(0.05, widthFromDx)
          newHeight = newWidth / aspect
        } else {
          newHeight = Math.max(0.05, heightFromDy)
          newWidth = newHeight * aspect
        }
        // Anchor: top-left (x, y stay)
      }
      break
      
    case 'sw':
      // Bottom-left corner: anchor top-right
      {
        const widthFromDx = crop.width - dx
        const heightFromDy = crop.height + dy
        const widthFromHeight = heightFromDy * aspect
        
        if (widthFromDx < widthFromHeight) {
          newWidth = Math.max(0.05, widthFromDx)
          newHeight = newWidth / aspect
        } else {
          newHeight = Math.max(0.05, heightFromDy)
          newWidth = newHeight * aspect
        }
        newX = crop.x + crop.width - newWidth
        // y stays (top edge anchored)
      }
      break
      
    case 'ne':
      // Top-right corner: anchor bottom-left
      {
        const widthFromDx = crop.width + dx
        const heightFromDy = crop.height - dy
        const widthFromHeight = heightFromDy * aspect
        
        if (widthFromDx < widthFromHeight) {
          newWidth = Math.max(0.05, widthFromDx)
          newHeight = newWidth / aspect
        } else {
          newHeight = Math.max(0.05, heightFromDy)
          newWidth = newHeight * aspect
        }
        // x stays (left edge anchored)
        newY = crop.y + crop.height - newHeight
      }
      break
      
    case 'nw':
      // Top-left corner: anchor bottom-right
      {
        const widthFromDx = crop.width - dx
        const heightFromDy = crop.height - dy
        const widthFromHeight = heightFromDy * aspect
        
        if (widthFromDx < widthFromHeight) {
          newWidth = Math.max(0.05, widthFromDx)
          newHeight = newWidth / aspect
        } else {
          newHeight = Math.max(0.05, heightFromDy)
          newWidth = newHeight * aspect
        }
        newX = crop.x + crop.width - newWidth
        newY = crop.y + crop.height - newHeight
      }
      break
  }
  
  // Ensure positive dimensions
  newWidth = Math.max(0.05, newWidth)
  newHeight = Math.max(0.05, newHeight)
  
  // Preserve the original lockedAspect from the crop (which is the target pixel aspect)
  // Don't overwrite with the normalized aspect used for calculations
  return clampCropToBounds({
    ...crop,
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  })
}

/**
 * Move crop region by a delta while keeping it within bounds.
 */
export function moveCrop(
  crop: CropState,
  delta: { dx: number; dy: number }
): CropState {
  const newX = crop.x + delta.dx
  const newY = crop.y + delta.dy

  return clampCropToBounds({
    ...crop,
    x: newX,
    y: newY,
  })
}

/**
 * Check if a point (in normalized image coords) is inside the crop region.
 */
export function isPointInCrop(
  crop: CropState,
  point: { x: number; y: number }
): boolean {
  return (
    point.x >= crop.x &&
    point.x <= crop.x + crop.width &&
    point.y >= crop.y &&
    point.y <= crop.y + crop.height
  )
}

/**
 * Get the aspect ratio of a crop region.
 */
export function getCropAspect(crop: CropState): number {
  return crop.width / crop.height
}

/**
 * Calculate the effective (cropped) dimensions of an image.
 * When crop is null, returns original dimensions.
 * This is used to treat the cropped region as the "new image" for all calculations.
 */
export function getEffectiveDimensions(
  image: ImageMetadata,
  crop: CropState | null
): { width: number; height: number } {
  if (!crop) {
    return { width: image.width, height: image.height }
  }
  return {
    width: image.width * crop.width,
    height: image.height * crop.height,
  }
}

/**
 * Get the center offset of the crop region relative to the image center.
 * Returns the offset in image pixel coordinates.
 * Used to adjust positioning so the cropped region is centered.
 */
export function getCropCenterOffset(
  image: ImageMetadata,
  crop: CropState | null
): { x: number; y: number } {
  if (!crop) {
    return { x: 0, y: 0 }
  }
  // Crop center in normalized coordinates
  const cropCenterX = crop.x + crop.width / 2
  const cropCenterY = crop.y + crop.height / 2
  
  // Image center is at (0.5, 0.5) in normalized coordinates
  // Calculate offset from image center to crop center
  const offsetX = (cropCenterX - 0.5) * image.width
  const offsetY = (cropCenterY - 0.5) * image.height
  
  return { x: offsetX, y: offsetY }
}

/**
 * Common aspect ratio presets for cropping.
 */
export const CROP_ASPECT_PRESETS = [
  { id: 'free', label: 'Free', value: null },
  { id: '1:1', label: '1:1', value: 1 },
  { id: '3:2', label: '3:2', value: 3 / 2 },
  { id: '2:3', label: '2:3', value: 2 / 3 },
  { id: '4:5', label: '4:5', value: 4 / 5 },
  { id: '5:4', label: '5:4', value: 5 / 4 },
  { id: '16:9', label: '16:9', value: 16 / 9 },
  { id: '9:16', label: '9:16', value: 9 / 16 },
] as const

export type CropAspectPresetId = (typeof CROP_ASPECT_PRESETS)[number]['id']
