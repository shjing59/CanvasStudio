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

// Shared renderer so the preview canvas and the export pipeline stay pixel identical.
export function renderScene({
  ctx,
  width,
  height,
  background,
  transform,
  borders,
  image,
}: SceneParams) {
  ctx.save()
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  if (!image) {
    return
  }

  const visibleHeight = Math.max(16, height - borders.top - borders.bottom)
  const centerY = borders.top + visibleHeight / 2

  const drawWidth = image.width * transform.scale
  const drawHeight = image.height * transform.scale

  const originX = width / 2 + transform.x
  const originY = centerY + transform.y

  ctx.save()
  ctx.translate(originX, originY)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image.element, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
  ctx.restore()
}

