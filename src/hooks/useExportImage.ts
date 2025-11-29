import { useCallback, useState } from 'react'
import { exportComposite } from '../lib/export/exportCanvas'
import { useCanvasStore } from '../state/canvasStore'

// Check if device supports Web Share API (iOS Safari, Chrome on iOS/Android, etc.)
const canShare = typeof navigator !== 'undefined' && 'share' in navigator && 'canShare' in navigator

// Small hook that wires the exporter to UI elements & keyboard shortcuts.
export function useExportImage() {
  const snapshot = useCanvasStore((state) => state.snapshot)
  const exportOptions = useCanvasStore((state) => state.exportOptions)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          } catch (shareErr) {
            // User cancelled or share failed, fall back to download
            console.log('Share cancelled or failed, using download instead')
          }
        }
      }
      
      // Fallback: traditional download (desktop browsers)
      const url = URL.createObjectURL(result.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = result.fileName
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsExporting(false)
    }
  }, [exportOptions, snapshot])

  return { exportImage, isExporting, error, canShare }
}

