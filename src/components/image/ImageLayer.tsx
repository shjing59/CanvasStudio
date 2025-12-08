import { useRef, useState, useCallback } from 'react'
import { useCanvasStore, selectFitScale } from '../../state/canvasStore'
import { SCALE } from '../../lib/canvas/constants'
import type { ImageMetadata } from '../../types/image'
import type { TransformState } from '../../types/canvas'

interface ImageLayerProps {
  image: ImageMetadata
  transform: TransformState
  canvasWidth: number
  canvasHeight: number
}

/**
 * ImageLayer component - renders the user-imported image.
 *
 * This is a PURE display component:
 * - Renders the image based on transform passed as prop
 * - Handles drag and zoom gestures
 * - Does NOT initialize or calculate scale (that's the store's job)
 */
export const ImageLayer = ({ image, transform, canvasWidth, canvasHeight }: ImageLayerProps) => {
  const updateTransform = useCanvasStore((state) => state.updateTransform)
  const fitScale = useCanvasStore(selectFitScale)

  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{
    x: number
    y: number
    startX: number
    startY: number
  } | null>(null)

  // Use the HTMLImageElement provided by the store
  const imgNaturalWidth = image.width || 0
  const imgNaturalHeight = image.height || 0

  // Handle pointer down for dragging
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        startX: transform.x,
        startY: transform.y,
      })
      if (containerRef.current) {
        containerRef.current.setPointerCapture(e.pointerId)
      }
    },
    [transform.x, transform.y]
  )

  // Handle pointer move for dragging
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragStart) return
      e.preventDefault()
      e.stopPropagation()

      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y

      // If Shift is held, use vertical drag for zoom (centered zoom)
      if (e.shiftKey) {
        const zoomFactor = 1 - dy * 0.002 // Negative dy zooms in
        const minScale = fitScale || SCALE.MIN
        const newScale = Math.max(
          minScale * SCALE.DEFAULT_MULTIPLIER,
          Math.min(transform.scale * zoomFactor, SCALE.MAX)
        )

        // Keep zoom centered on canvas center
        updateTransform({ scale: newScale, x: 0, y: 0 })
      } else {
        // Regular drag for position
        updateTransform({
          x: dragStart.startX + dx,
          y: dragStart.startY + dy,
        })
      }
    },
    [isDragging, dragStart, transform.scale, updateTransform, fitScale]
  )

  // Handle pointer up for dragging
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        setDragStart(null)
        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId)
        }
      }
    },
    [isDragging]
  )

  // Don't render if canvas dimensions aren't available or we don't have image dimensions
  if (canvasWidth <= 0 || canvasHeight <= 0 || imgNaturalWidth <= 0 || imgNaturalHeight <= 0) {
    return null
  }

  const displayWidth = imgNaturalWidth * transform.scale
  const displayHeight = imgNaturalHeight * transform.scale
  const offsetLeft = canvasWidth / 2 - displayWidth / 2 + transform.x
  const offsetTop = canvasHeight / 2 - displayHeight / 2 + transform.y

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden touch-none select-none"
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        src={image.element.src}
        alt="Canvas image"
        draggable={false}
        style={{
          width: displayWidth,
          height: displayHeight,
          position: 'absolute',
          left: offsetLeft,
          top: offsetTop,
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
