import type { CanvasSnapshot, ExportOptions } from '../../types/canvas'
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

  // Use fixed dimensions based on image and ratio, not screen-responsive preview size
  // This ensures consistent export dimensions regardless of screen size
  const targetWidth = snapshot.dimensions.baseWidth
  const targetHeight = snapshot.dimensions.baseHeight

  // Calculate scale factor from preview to export dimensions
  // Use uniform scale factor to maintain proportions correctly
  const previewWidth = snapshot.previewSize?.width ?? targetWidth
  const previewHeight = snapshot.previewSize?.height ?? targetHeight

  // Since both preview and export maintain the same aspect ratio,
  // we use uniform scaling to transform coordinates correctly
  const scaleFactor = targetWidth / previewWidth

  const canvas = document.createElement('canvas')
  // Export at exact resolution - no DPR multiplier for consistent file sizes
  canvas.width = Math.max(1, Math.round(targetWidth))
  canvas.height = Math.max(1, Math.round(targetHeight))
  const ctx = canvas.getContext('2d', { colorSpace: 'srgb' })
  if (!ctx) {
    throw new Error('Unable to prepare export context.')
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Render only the canvas + image (workspace is never exported)
  // Transform coordinates from preview space to export space
  renderScene({
    ctx,
    width: targetWidth,
    height: targetHeight,
    background: snapshot.background,
    transform: {
      // Position offset scales uniformly
      x: snapshot.transform.x * scaleFactor,
      y: snapshot.transform.y * scaleFactor,
      // Scale also scales uniformly to maintain visual appearance
      scale: snapshot.transform.scale * scaleFactor,
    },
    borders: {
      top: 0,
      bottom: 0,
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
