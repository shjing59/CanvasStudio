import { useCallback, useState } from 'react'
import { exportComposite, exportSingleImage, type ExportCanvasSettings } from '../lib/export/exportCanvas'
import { useCanvasStore } from '../state/canvasStore'

// Check if device supports Web Share API (iOS Safari, Chrome on iOS/Android, etc.)
const canShare =
  typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator

/**
 * Hook that provides export functionality for single and batch image export.
 */
export function useExportImage() {
  const snapshot = useCanvasStore((state) => state.snapshot)
  const images = useCanvasStore((state) => state.images)
  const exportOptions = useCanvasStore((state) => state.exportOptions)
  const background = useCanvasStore((state) => state.background)
  const ratioId = useCanvasStore((state) => state.ratioId)
  const customRatio = useCanvasStore((state) => state.customRatio)
  const previewSize = useCanvasStore((state) => state.previewSize)

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Export the current active image.
   */
  const exportImage = useCallback(async () => {
    const data = snapshot()
    if (!data.image) {
      setError('Import an image before exporting.')
      return
    }
    try {
      setIsExporting(true)
      setError(null)
      const result = await exportComposite(data, exportOptions)

      // Try Web Share API first (for iOS/mobile - allows saving to Photos)
      if (canShare) {
        const file = new File([result.blob], result.fileName, { type: result.blob.type })

        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Exported Image',
            })
            return // Success! User shared or saved the image
          } catch {
            // User cancelled or share failed, fall back to download
            console.log('Share cancelled or failed, using download instead')
          }
        }
      }

      // Fallback: traditional download (desktop browsers)
      downloadBlob(result.blob, result.fileName)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsExporting(false)
    }
  }, [exportOptions, snapshot])

  /**
   * Export all images in the queue with the same canvas settings.
   */
  const exportAllImages = useCallback(async () => {
    if (images.length === 0) {
      setError('No images to export.')
      return
    }

    if (!previewSize) {
      setError('Canvas not ready.')
      return
    }

    try {
      setIsExporting(true)
      setError(null)
      setExportProgress({ current: 0, total: images.length })

      const settings: ExportCanvasSettings = {
        background,
        ratioId,
        customRatio,
        previewSize,
        exportOptions,
      }

      const results: Array<{ blob: Blob; fileName: string }> = []

      // Export each image sequentially
      for (let i = 0; i < images.length; i++) {
        const imageState = images[i]
        setExportProgress({ current: i + 1, total: images.length })

        const result = await exportSingleImage(imageState.image, imageState.transform, imageState.crop, imageState.filter || null, settings)
        results.push(result)
      }

      // Download all results
      // For multiple files, download them sequentially with a small delay
      for (let i = 0; i < results.length; i++) {
        const result = results[i]
        
        // Try share API for single file (mobile)
        if (results.length === 1 && canShare) {
          const file = new File([result.blob], result.fileName, { type: result.blob.type })
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: 'Exported Images' })
              return
            } catch {
              // Fall through to download
            }
          }
        }

        // Download
        downloadBlob(result.blob, result.fileName)

        // Small delay between downloads to prevent browser blocking
        if (i < results.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsExporting(false)
      setExportProgress(null)
    }
  }, [images, previewSize, background, ratioId, customRatio, exportOptions])

  return {
    exportImage,
    exportAllImages,
    isExporting,
    exportProgress,
    error,
    canShare,
  }
}

/**
 * Helper to download a blob as a file.
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
