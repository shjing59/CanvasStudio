import { useMemo, useState, useEffect, useRef, type ReactNode, forwardRef, useImperativeHandle } from 'react'
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
  const { isMobile, windowSize: responsiveWindowSize } = useResponsive()
  const background = useCanvasStore((state) => state.background)
  // Initialize with actual window size if available, otherwise use defaults
  const [windowSize, setWindowSize] = useState(() => {
    if (typeof window !== 'undefined') {
      return { width: window.innerWidth, height: window.innerHeight }
    }
    return { width: 0, height: 0 }
  })
  const canvasRef = useRef<HTMLDivElement>(null)

  // Use responsive hook's windowSize (it's always updated), fallback to local state for initial render
  const effectiveWindowSize = responsiveWindowSize.width > 0 && responsiveWindowSize.height > 0 
    ? responsiveWindowSize 
    : windowSize

  // Expose the ref
  useImperativeHandle(ref, () => canvasRef.current as HTMLDivElement)

  // Keep local windowSize in sync as fallback (responsive hook handles primary updates)
  // Note: We still need this for initial render before useResponsive updates
  useEffect(() => {
    const updateSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
    }
    // Update immediately in case window size changed
    updateSize()
    // Use passive listener and throttle via requestAnimationFrame
    let rafId: number | null = null
    let ticking = false
    
    const handleResize = () => {
      if (!ticking) {
        ticking = true
        rafId = requestAnimationFrame(() => {
          updateSize()
          ticking = false
        })
      }
    }
    
    window.addEventListener('resize', handleResize, { passive: true })
    return () => {
      window.removeEventListener('resize', handleResize)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

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
