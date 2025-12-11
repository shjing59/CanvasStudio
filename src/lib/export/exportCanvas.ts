import type { CanvasSnapshot, CropState, ExportOptions, RatioOptionId, TransformState } from '../../types/canvas'
import type { ImageMetadata } from '../../types/image'
import { createImageSnapshot } from '../canvas/transform'
import { renderScene } from '../canvas/render'

export interface ExportResponse {
  blob: Blob
  fileName: string
}

/**
 * Export a canvas snapshot to an image blob.
 * This is the core export function used by all export paths.
 */
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
  // Crop coordinates are normalized (0-1) and don't need scaling
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
    crop: snapshot.crop,
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

/**
 * Build the output filename from original name and format.
 */
const buildFileName = (base: string, format: ExportOptions['format']): string => {
  const clean = base.replace(/\.[^.]+$/, '')
  return `${clean || 'canvas'}-framed.${format === 'png' ? 'png' : 'jpg'}`
}

// ============================================================================
// PURE EXPORT FUNCTIONS (for filmstrip queue)
// ============================================================================

/**
 * Canvas settings needed for export.
 */
export interface ExportCanvasSettings {
  background: string
  ratioId: RatioOptionId
  customRatio: { width: number; height: number }
  previewSize: { width: number; height: number }
  exportOptions: ExportOptions
}

/**
 * Pure function: Export a single image with given transform, crop, and canvas settings.
 * This doesn't depend on store state and can be used to export any image in the queue.
 */
export async function exportSingleImage(
  image: ImageMetadata,
  transform: TransformState,
  crop: CropState | null,
  settings: ExportCanvasSettings
): Promise<ExportResponse> {
  const snapshot = createImageSnapshot({
    image,
    transform,
    crop,
    canvasWidth: settings.previewSize.width,
    canvasHeight: settings.previewSize.height,
    background: settings.background,
    ratioId: settings.ratioId,
    customRatio: settings.customRatio,
  })

  return exportComposite(snapshot, settings.exportOptions)
}

/**
 * Export multiple images with the same canvas settings.
 * Returns array of export results.
 */
export async function exportMultipleImages(
  images: Array<{ image: ImageMetadata; transform: TransformState; crop: CropState | null }>,
  settings: ExportCanvasSettings,
  onProgress?: (completed: number, total: number) => void
): Promise<ExportResponse[]> {
  const results: ExportResponse[] = []
  const total = images.length

  for (let i = 0; i < images.length; i++) {
    const { image, transform, crop } = images[i]
    const result = await exportSingleImage(image, transform, crop, settings)
    results.push(result)
    onProgress?.(i + 1, total)
  }

  return results
}
