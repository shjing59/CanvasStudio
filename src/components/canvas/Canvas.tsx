import { useMemo, useState, useEffect, useRef, type ReactNode, forwardRef, useImperativeHandle } from 'react'
import { useCanvasStore } from '../../state/canvasStore'

interface CanvasProps {
  aspectRatio: number // width / height
  children: ReactNode
  onSizeChange?: (size: { width: number; height: number }) => void
}

const MIN_CANVAS_WIDTH = 240
const MAX_CANVAS_WIDTH = 1400

/**
 * Canvas component - white rectangle representing the export area.
 * Keeps the selected aspect ratio, responsive to screen but maintains aspect ratio.
 * Positioned at the center of the workspace.
 */
export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ aspectRatio, children, onSizeChange }, ref) => {
  const background = useCanvasStore((state) => state.background)
  // Initialize with actual window size if available, otherwise use defaults
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight }
    }
    return { width: 0, height: 0 }
  })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Expose the ref
  useImperativeHandle(ref, () => canvasRef.current as HTMLDivElement)

  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    // Update immediately in case window size changed
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const canvasSize = useMemo(() => {
    // Use viewport dimensions for responsive sizing (leave some margin)
    const availableWidth = windowSize.width > 0 ? windowSize.width * 0.8 : MIN_CANVAS_WIDTH
    const availableHeight = windowSize.height > 0 ? windowSize.height * 0.8 : MIN_CANVAS_WIDTH / aspectRatio

    // Calculate width that fits within available space while maintaining aspect ratio
    let width = Math.min(availableWidth, MAX_CANVAS_WIDTH)
    let height = width / aspectRatio

    // If height exceeds available space, scale down
    if (height > availableHeight) {
      height = availableHeight
      width = height * aspectRatio
    }

    // Ensure minimum size
    if (width < MIN_CANVAS_WIDTH) {
      width = MIN_CANVAS_WIDTH
      height = width / aspectRatio
    }

    return { width, height }
  }, [windowSize.width, windowSize.height, aspectRatio])

  // Notify parent of size changes
  useEffect(() => {
    if (onSizeChange) {
      onSizeChange(canvasSize)
    }
  }, [canvasSize, onSizeChange])

  return (
    <div
      ref={canvasRef}
      className="relative shadow-2xl"
      style={{
        width: canvasSize.width,
        height: canvasSize.height,
        backgroundColor: background,
      }}
    >
      {children}
    </div>
  )
})

