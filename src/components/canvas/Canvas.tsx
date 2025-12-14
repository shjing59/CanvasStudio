import { useMemo, useEffect, useRef, type ReactNode, forwardRef, useImperativeHandle } from 'react'
import { useCanvasStore } from '../../state/canvasStore'
import { useResponsive } from '../../hooks/useResponsive'
import { CANVAS } from '../../lib/canvas/constants'

interface CanvasProps {
  aspectRatio: number // width / height
  children: ReactNode
  onSizeChange?: (size: { width: number; height: number }) => void
}

/**
 * Canvas component - white rectangle representing the export area.
 * Keeps the selected aspect ratio, responsive to screen but maintains aspect ratio.
 * Positioned at the center of the workspace.
 */
export const Canvas = forwardRef<HTMLDivElement, CanvasProps>(({ aspectRatio, children, onSizeChange }, ref) => {
  const { isMobile, windowSize: effectiveWindowSize } = useResponsive()
  const background = useCanvasStore((state) => state.background)
  const canvasRef = useRef<HTMLDivElement>(null)

  // Expose the ref
  useImperativeHandle(ref, () => canvasRef.current as HTMLDivElement)

  const canvasSize = useMemo(() => {
    // Mobile-specific sizing
    if (isMobile) {
      // Account for mobile nav bar (64px) and some padding
      const mobileNavHeight = 64
      const mobilePadding = 16
      const availableWidth = effectiveWindowSize.width > 0 
        ? effectiveWindowSize.width * CANVAS.MOBILE_AVAILABLE_RATIO 
        : CANVAS.MOBILE_MIN_WIDTH
      const availableHeight = effectiveWindowSize.height > 0
        ? (effectiveWindowSize.height - mobileNavHeight - mobilePadding) * CANVAS.MOBILE_AVAILABLE_RATIO
        : CANVAS.MOBILE_MIN_WIDTH / aspectRatio

      // Calculate width that fits within available space
      let width = Math.min(availableWidth, effectiveWindowSize.width * CANVAS.MOBILE_MAX_WIDTH_RATIO)
      let height = width / aspectRatio

      // If height exceeds available space, scale down
      if (height > availableHeight) {
        height = availableHeight
        width = height * aspectRatio
      }

      // Ensure minimum size
      if (width < CANVAS.MOBILE_MIN_WIDTH) {
        width = CANVAS.MOBILE_MIN_WIDTH
        height = width / aspectRatio
      }

      return { width, height }
    }

    // Desktop sizing (original logic)
    const availableWidth = effectiveWindowSize.width > 0 
      ? effectiveWindowSize.width * 0.8 
      : CANVAS.MIN_WIDTH
    const availableHeight = effectiveWindowSize.height > 0 
      ? effectiveWindowSize.height * 0.8 
      : CANVAS.MIN_WIDTH / aspectRatio

    // Calculate width that fits within available space while maintaining aspect ratio
    let width = Math.min(availableWidth, CANVAS.MAX_WIDTH)
    let height = width / aspectRatio

    // If height exceeds available space, scale down
    if (height > availableHeight) {
      height = availableHeight
      width = height * aspectRatio
    }

    // Ensure minimum size
    if (width < CANVAS.MIN_WIDTH) {
      width = CANVAS.MIN_WIDTH
      height = width / aspectRatio
    }

    return { width, height }
  }, [isMobile, effectiveWindowSize.width, effectiveWindowSize.height, aspectRatio])

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
