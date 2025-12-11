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
  // Use cached filtered image if available, otherwise use original
  const imageToDraw = filter?.filteredImage || image.element
  
  ctx.save()
  ctx.translate(originX, originY)
  ctx.scale(transform.scale, transform.scale)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(imageToDraw, -imgNaturalWidth / 2, -imgNaturalHeight / 2, imgNaturalWidth, imgNaturalHeight)
  ctx.restore()

  // Restore from crop clipping
  if (crop) {
    ctx.restore()
  }
}

