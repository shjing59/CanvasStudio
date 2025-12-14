import { useRef, useState, useCallback, useEffect } from 'react'
import { useCanvasStore, selectFitScale } from '../../state/canvasStore'
import { SCALE } from '../../lib/canvas/constants'
import { cropToCanvasCoords } from '../../lib/canvas/crop'
import { renderScene } from '../../lib/canvas/render'
import type { ImageMetadata } from '../../types/image'
import type { TransformState, CropState } from '../../types/canvas'
import type { FilterState } from '../../types/filter'

interface ImageLayerProps {
  image: ImageMetadata
  transform: TransformState
  crop: CropState | null
  filter: FilterState | null
  canvasWidth: number
  canvasHeight: number
  /** When true, crop clipping is not applied (used during crop editing) */
  disableCropClip?: boolean
}

/**
 * ImageLayer component - renders the user-imported image.
 *
 * This is a PURE display component:
 * - Renders the image based on transform passed as prop
 * - Handles drag and zoom gestures
 * - Applies crop clipping when crop is defined (unless disableCropClip is true)
 * - Does NOT initialize or calculate scale (that's the store's job)
 */
export const ImageLayer = ({ image, transform, crop, filter, canvasWidth, canvasHeight, disableCropClip = false }: ImageLayerProps) => {
  const updateTransform = useCanvasStore((state) => state.updateTransform)
  const fitScale = useCanvasStore(selectFitScale)
  const background = useCanvasStore((state) => state.background)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
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

  // Render to canvas when filter is present
  // Use requestAnimationFrame to batch updates and prevent lag during resize
  useEffect(() => {
    if (!filter?.lutData || !canvasRef.current) return

    let rafId: number | null = null
    let cancelled = false

    const render = () => {
      if (cancelled) return
      
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d', { colorSpace: 'srgb' })
      if (!ctx) return

      // Set canvas size to match container
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvasWidth * dpr
      canvas.height = canvasHeight * dpr
      canvas.style.width = `${canvasWidth}px`
      canvas.style.height = `${canvasHeight}px`
      ctx.scale(dpr, dpr)

      // Clear canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight)

      // Render scene with filter
      renderScene({
        ctx,
        width: canvasWidth,
        height: canvasHeight,
        background,
        transform,
        crop: disableCropClip ? null : crop,
        filter,
        image,
        borders: { top: 0, bottom: 0 },
      })
    }

    // Schedule render on next frame to batch rapid updates (e.g., during resize)
    rafId = requestAnimationFrame(render)

    return () => {
      cancelled = true
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [image, transform, crop, filter, canvasWidth, canvasHeight, background, disableCropClip])

  // Don't render if canvas dimensions aren't available or we don't have image dimensions
  if (canvasWidth <= 0 || canvasHeight <= 0 || imgNaturalWidth <= 0 || imgNaturalHeight <= 0) {
    return null
  }

  const displayWidth = imgNaturalWidth * transform.scale
  const displayHeight = imgNaturalHeight * transform.scale
  const offsetLeft = canvasWidth / 2 - displayWidth / 2 + transform.x
  const offsetTop = canvasHeight / 2 - displayHeight / 2 + transform.y

  // Calculate crop clipping if crop is defined and clipping is enabled
  const shouldClip = crop && !disableCropClip
  let clipPath: string | undefined
  
  if (shouldClip) {
    const cropRect = cropToCanvasCoords(crop, image, transform, canvasWidth, canvasHeight)
    // Create an inset clip-path based on crop rectangle
    // inset(top right bottom left) - distances from edges
    const top = cropRect.y
    const right = canvasWidth - (cropRect.x + cropRect.width)
    const bottom = canvasHeight - (cropRect.y + cropRect.height)
    const left = cropRect.x
    clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`
  }

  // Use canvas when filter is present, otherwise use img tag
  const hasFilter = filter?.lutData

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden touch-none select-none"
      style={{
        cursor: isDragging ? 'grabbing' : 'grab',
        pointerEvents: 'auto',
        clipPath,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {hasFilter ? (
        <canvas
          ref={canvasRef}
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: canvasWidth,
            height: canvasHeight,
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      ) : (
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
      )}
    </div>
  )
}
