import { useEffect } from 'react'
import { useExportImage } from '../hooks/useExportImage'
import { useCanvasStore } from '../state/canvasStore'

// Maps the pro-level shortcuts requested in the spec to store actions.
export const KeyboardShortcuts = () => {
  const resetTransform = useCanvasStore((state) => state.resetTransform)
  const adjustScale = useCanvasStore((state) => state.adjustScale)
  const { exportImage } = useExportImage()

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
        event.preventDefault()
        exportImage()
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        resetTransform()
      } else if (event.shiftKey && (event.key === '+' || event.key === '=')) {
        event.preventDefault()
        adjustScale(1.05)
      } else if (event.shiftKey && event.key === '_') {
        event.preventDefault()
        adjustScale(0.95)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [adjustScale, exportImage, resetTransform])

  return null
}

