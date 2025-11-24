import type { CanvasSnapshot, ExportOptions } from '../../types/canvas'
import { convertBorderToBasePx } from '../canvas/math'
import { renderScene } from '../canvas/render'

interface ExportResponse {
  blob: Blob
  fileName: string
}

export async function exportComposite(
  snapshot: CanvasSnapshot,
  options: ExportOptions
): Promise<ExportResponse> {
  if (!snapshot.image) {
    throw new Error('Import an image before exporting.')
  }

  const baseWidth = snapshot.dimensions.baseWidth
  const baseHeight = snapshot.dimensions.baseHeight
  const ratio = snapshot.dimensions.ratio

  const previewWidth = snapshot.previewSize?.width ?? baseWidth

  const targetWidth =
    options.mode === 'original' ? snapshot.image.width : Math.round(previewWidth)
  const targetHeight = Math.round(targetWidth / ratio)

  const widthScale = targetWidth / baseWidth
  const heightScale = targetHeight / baseHeight

  const canvas = document.createElement('canvas')
  const dpr = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.round(targetWidth * dpr))
  canvas.height = Math.max(1, Math.round(targetHeight * dpr))
  const ctx = canvas.getContext('2d', { colorSpace: 'srgb' })
  if (!ctx) {
    throw new Error('Unable to prepare export context.')
  }
  ctx.scale(dpr, dpr)

  renderScene({
    ctx,
    width: targetWidth,
    height: targetHeight,
    background: snapshot.background,
    transform: {
      x: snapshot.transform.x * widthScale,
      y: snapshot.transform.y * heightScale,
      scale: snapshot.transform.scale,
    },
    borders: {
      top: convertBorderToBasePx(snapshot.borders.top, baseHeight) * heightScale,
      bottom: convertBorderToBasePx(snapshot.borders.bottom, baseHeight) * heightScale,
    },
    image: snapshot.image,
  })

  const mime = options.format === 'png' ? 'image/png' : 'image/jpeg'
  const quality = options.format === 'png' ? undefined : options.quality

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (!result) {
          reject(new Error('Unable to finalize export.'))
          return
        }
        resolve(result)
      },
      mime,
      quality
    )
  })

  return {
    blob,
    fileName: buildFileName(snapshot.image.fileName, options.format),
  }
}

const buildFileName = (base: string, format: ExportOptions['format']): string => {
  const clean = base.replace(/\.[^.]+$/, '')
  return `${clean || 'canvas'}-framed.${format === 'png' ? 'png' : 'jpg'}`
}

