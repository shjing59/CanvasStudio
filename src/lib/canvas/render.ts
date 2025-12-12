import type { TransformState, CropState } from '../../types/canvas'
import type { ImageMetadata } from '../../types/image'
import type { FilterState } from '../../types/filter'
import { cropToCanvasCoords } from './crop'

interface SceneParams {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  background: string
  transform: TransformState
  crop?: CropState | null
  filter?: FilterState | null
  borders: { top: number; bottom: number }
  image?: ImageMetadata
  visibleCenterOffset?: number
}

/**
 * Render the canvas scene (canvas background + image).
 * This is used for both preview and export - workspace is never included.
 * Uses the same transform logic as ImageLayer: translate(x, y) scale(scale) with center origin.
 * When crop is provided, only the cropped region of the image is visible.
 */
export function renderScene({
  ctx,
  width,
  height,
  background,
  transform,
  crop,
  filter,
  image,
}: SceneParams) {
  // Fill canvas background (white by default)
  ctx.save()
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  if (!image) {
    return
  }

  // Use exact natural dimensions
  const imgNaturalWidth = image.width
  const imgNaturalHeight = image.height

  // Calculate position (centered in canvas, with transform offset)
  const originX = width / 2 + transform.x
  const originY = height / 2 + transform.y

  // Apply crop clipping if crop is defined
  if (crop) {
    const cropRect = cropToCanvasCoords(crop, image, transform, width, height)
    ctx.save()
    ctx.beginPath()
    ctx.rect(cropRect.x, cropRect.y, cropRect.width, cropRect.height)
    ctx.clip()
  }

  // Draw image (filtered or original) with transforms
  ctx.save()
  ctx.translate(originX, originY)
  ctx.scale(transform.scale, transform.scale)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  
  // If filter exists and intensity > 0, blend between original and fully filtered image
  if (filter?.filteredImageFull && filter.intensity > 0) {
    if (filter.intensity >= 1.0) {
      // Full intensity - just draw filtered image
      ctx.drawImage(filter.filteredImageFull, -imgNaturalWidth / 2, -imgNaturalHeight / 2, imgNaturalWidth, imgNaturalHeight)
    } else {
      // Partial intensity - blend original and filtered
      // Draw original first
      ctx.drawImage(image.element, -imgNaturalWidth / 2, -imgNaturalHeight / 2, imgNaturalWidth, imgNaturalHeight)
      // Blend filtered image on top
      ctx.globalAlpha = filter.intensity
      ctx.drawImage(filter.filteredImageFull, -imgNaturalWidth / 2, -imgNaturalHeight / 2, imgNaturalWidth, imgNaturalHeight)
      ctx.globalAlpha = 1.0
    }
  } else {
    // No filter or intensity is 0 - draw original image
    ctx.drawImage(image.element, -imgNaturalWidth / 2, -imgNaturalHeight / 2, imgNaturalWidth, imgNaturalHeight)
  }
  
  ctx.restore()

  // Restore from crop clipping
  if (crop) {
    ctx.restore()
  }
}

