import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useCanvasStore } from '../../state/canvasStore'
import { MAX_SCALE } from '../../lib/canvas/math'
import type { ImageMetadata } from '../../types/image'

interface ImageLayerProps {
  image: ImageMetadata
  canvasWidth: number
  canvasHeight: number
}

/**
 * ImageLayer component - user-imported image that is movable and scalable.
 * Uses CSS transform with center origin for consistent centering.
 */
export const ImageLayer = ({ image, canvasWidth, canvasHeight }: ImageLayerProps) => {
  const transform = useCanvasStore((state) => state.transform)
  const updateTransform = useCanvasStore((state) => state.updateTransform)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number; startX: number; startY: number } | null>(null)
  const initialFitScale = useRef<number | null>(null)
  const lastImageId = useRef<string | null>(null)
  const hasInitialized = useRef(false)

  // Use the HTMLImageElement provided by the store (already loaded during import)
  const imgElement = image.element
  const userScale = useCanvasStore((state) => state.imageScale)
  const imgNaturalWidth = useMemo(() => {
    if (!imgElement) return image.width || 0
    return userScale.width || imgElement.naturalWidth || image.width || 0
  }, [imgElement, image.width, userScale.width])
  const imgNaturalHeight = useMemo(() => {
    if (!imgElement) return image.height || 0
    return userScale.height || imgElement.naturalHeight || image.height || 0
  }, [imgElement, image.height, userScale.height])

  // Reset initialization when a new image is loaded
  useEffect(() => {
    const currentImageId = image.element.src
    const imageChanged = lastImageId.current !== currentImageId

    if (imageChanged) {
      lastImageId.current = currentImageId
      hasInitialized.current = false
      initialFitScale.current = null
    }
  }, [image])

  // Compute the initial scale so the image fits the canvas while keeping its aspect ratio
  useEffect(() => {
    if (canvasWidth <= 0 || canvasHeight <= 0 || imgNaturalWidth <= 0 || imgNaturalHeight <= 0) {
      return
    }

    if (!hasInitialized.current) {
      const scaleByWidth = canvasWidth / imgNaturalWidth
      const scaleByHeight = canvasHeight / imgNaturalHeight
      const isPortrait = imgNaturalHeight > imgNaturalWidth
      const scale = isPortrait
        ? Math.min(scaleByHeight, scaleByWidth)
        : Math.min(scaleByWidth, scaleByHeight)

      initialFitScale.current = scale
      hasInitialized.current = true
      // Default scale is -5% relative to fit scale
      const defaultScale = scale * 0.95
      updateTransform({ scale: defaultScale, x: 0, y: 0 })
    }
  }, [canvasWidth, canvasHeight, imgNaturalWidth, imgNaturalHeight, updateTransform])

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
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStart) return
    e.preventDefault()
    e.stopPropagation()

    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y

    // If Shift is held, use vertical drag for zoom (centered zoom)
    if (e.shiftKey) {
      const zoomFactor = 1 - dy * 0.002 // Negative dy zooms in
      const minScale = initialFitScale.current || 0.1
      const newScale = Math.max(
        minScale,
        Math.min(transform.scale * zoomFactor, MAX_SCALE)
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
  }, [isDragging, dragStart, transform.scale, updateTransform])

  // Handle pointer up for dragging
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (isDragging) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      setDragStart(null)
      if (containerRef.current) {
        containerRef.current.releasePointerCapture(e.pointerId)
      }
    }
  }, [isDragging])

  // Handle wheel for zooming
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const delta = -e.deltaY * 0.001 // Negative to zoom in on scroll up
    const minScale = initialFitScale.current || 0.1
    const newScale = Math.max(
      minScale, // Don't go below initial fit scale
      Math.min(transform.scale * (1 + delta), MAX_SCALE)
    )

    // If scale didn't change, don't update
    if (Math.abs(newScale - transform.scale) < 0.001) return

    // Get mouse position relative to canvas container
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Current image center in screen space (before transform)
    // The image is positioned at canvas center, so its center is at (canvasWidth/2, canvasHeight/2)
    // Then translate(x, y) moves it from there
    const currentCenterX = canvasWidth / 2 + transform.x
    const currentCenterY = canvasHeight / 2 + transform.y

    // Point in image space (relative to image center, before scale)
    const pointInImageX = (mouseX - currentCenterX) / transform.scale
    const pointInImageY = (mouseY - currentCenterY) / transform.scale

    // After zoom, this point should still be at (mouseX, mouseY) in screen space
    // New center = mouse position - (point in image space * new scale)
    const newCenterX = mouseX - pointInImageX * newScale
    const newCenterY = mouseY - pointInImageY * newScale

    // Convert back to transform coordinates
    const newX = newCenterX - canvasWidth / 2
    const newY = newCenterY - canvasHeight / 2

    updateTransform({ scale: newScale, x: newX, y: newY })
  }, [transform, canvasWidth, canvasHeight, updateTransform])

  // Clamp scale to max (but not below initial fit scale)
  useEffect(() => {
    if (transform.scale > MAX_SCALE) {
      updateTransform({ scale: MAX_SCALE })
    }
  }, [transform.scale, updateTransform])

  // Don't render if canvas dimensions aren't available or we don't have any image dimensions
  // Note: We render even if image hasn't fully loaded yet - we use metadata dimensions initially
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
      onWheel={handleWheel}
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
