import { useCallback, useState } from 'react'
import { exportComposite } from '../lib/export/exportCanvas'
import { useCanvasStore } from '../state/canvasStore'

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

  return { exportImage, isExporting, error }
}

