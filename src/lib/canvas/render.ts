import type { TransformState } from '../../types/canvas'
import type { ImageMetadata } from '../../types/image'

interface SceneParams {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  background: string
  transform: TransformState
  borders: { top: number; bottom: number }
  image?: ImageMetadata
  visibleCenterOffset?: number
}

/**
 * Render the canvas scene (canvas background + image).
 * This is used for both preview and export - workspace is never included.
 * Uses the same transform logic as ImageLayer: translate(x, y) scale(scale) with center origin.
 */
export function renderScene({
  ctx,
  width,
  height,
  background,
  transform,
  borders,
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

  // Draw image with transform: translate(x, y) scale(scale)
  ctx.save()
  ctx.translate(originX, originY)
  ctx.scale(transform.scale, transform.scale)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image.element, -imgNaturalWidth / 2, -imgNaturalHeight / 2, imgNaturalWidth, imgNaturalHeight)
  ctx.restore()
}

