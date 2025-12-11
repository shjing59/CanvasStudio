import { useRef, useState, useCallback } from 'react'
import { useCanvasStore } from '../../state/canvasStore'
import { cropToCanvasCoords, resizeCropFromHandle, moveCrop } from '../../lib/canvas/crop'
import type { CropState } from '../../types/canvas'
import type { ImageMetadata } from '../../types/image'

type HandlePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

interface CropOverlayProps {
  image: ImageMetadata
  crop: CropState
  transform: { x: number; y: number; scale: number }
  canvasWidth: number
  canvasHeight: number
}

/**
 * CropOverlay component - renders the crop frame with resize handles.
 * 
 * Shows a semi-transparent overlay outside the crop region and
 * provides 8 handles for resizing the crop area.
 */
export const CropOverlay = ({
  image,
  crop,
  transform,
  canvasWidth,
  canvasHeight,
}: CropOverlayProps) => {
  const setCrop = useCanvasStore((state) => state.setCrop)

  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [activeHandle, setActiveHandle] = useState<HandlePosition | 'move' | null>(null)
  const [dragStart, setDragStart] = useState<{
    clientX: number
    clientY: number
    crop: CropState
  } | null>(null)

  // Convert crop to canvas coordinates for display
  const cropRect = cropToCanvasCoords(crop, image, transform, canvasWidth, canvasHeight)

  // Calculate the scale factor from canvas coords to normalized image coords
  // Used for converting drag deltas
  const displayWidth = image.width * transform.scale
  const displayHeight = image.height * transform.scale

  // Handle pointer down on a resize handle
  const handleHandlePointerDown = useCallback(
    (e: React.PointerEvent, handle: HandlePosition) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setActiveHandle(handle)
      setDragStart({
        clientX: e.clientX,
        clientY: e.clientY,
        crop: { ...crop },
      })
      if (containerRef.current) {
        containerRef.current.setPointerCapture(e.pointerId)
      }
    },
    [crop]
  )

  // Handle pointer down on the crop area (for moving)
  const handleCropAreaPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setActiveHandle('move')
      setDragStart({
        clientX: e.clientX,
        clientY: e.clientY,
        crop: { ...crop },
      })
      if (containerRef.current) {
        containerRef.current.setPointerCapture(e.pointerId)
      }
    },
    [crop]
  )

  // Handle pointer move
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragStart || !activeHandle) return
      e.preventDefault()
      e.stopPropagation()

      const dx = e.clientX - dragStart.clientX
      const dy = e.clientY - dragStart.clientY

      // Convert pixel delta to normalized image coordinates
      const normalizedDx = dx / displayWidth
      const normalizedDy = dy / displayHeight

      if (activeHandle === 'move') {
        // Move the crop region itself (not the image)
        const newCrop = moveCrop(dragStart.crop, { dx: normalizedDx, dy: normalizedDy })
        setCrop(newCrop)
      } else {
        // Resizing the crop - pass image aspect ratio for proper aspect locking
        const imageAspect = image.width / image.height
        const newCrop = resizeCropFromHandle(
          dragStart.crop,
          activeHandle,
          { dx: normalizedDx, dy: normalizedDy },
          imageAspect
        )
        setCrop(newCrop)
      }
    },
    [isDragging, dragStart, activeHandle, displayWidth, displayHeight, setCrop]
  )

  // Handle pointer up
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (isDragging) {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        setActiveHandle(null)
        setDragStart(null)
        if (containerRef.current) {
          containerRef.current.releasePointerCapture(e.pointerId)
        }
      }
    },
    [isDragging]
  )

  // Cursor based on active handle
  const getCursor = (handle: HandlePosition | 'move' | null): string => {
    if (!handle) return 'default'
    if (handle === 'move') return 'move'
    const cursors: Record<HandlePosition, string> = {
      nw: 'nwse-resize',
      n: 'ns-resize',
      ne: 'nesw-resize',
      e: 'ew-resize',
      se: 'nwse-resize',
      s: 'ns-resize',
      sw: 'nesw-resize',
      w: 'ew-resize',
    }
    return cursors[handle]
  }

  // Render a resize handle
  const renderHandle = (position: HandlePosition) => {
    const handleSize = 12
    const halfSize = handleSize / 2

    // Calculate position based on crop rect
    let left = 0
    let top = 0

    switch (position) {
      case 'nw':
        left = cropRect.x - halfSize
        top = cropRect.y - halfSize
        break
      case 'n':
        left = cropRect.x + cropRect.width / 2 - halfSize
        top = cropRect.y - halfSize
        break
      case 'ne':
        left = cropRect.x + cropRect.width - halfSize
        top = cropRect.y - halfSize
        break
      case 'e':
        left = cropRect.x + cropRect.width - halfSize
        top = cropRect.y + cropRect.height / 2 - halfSize
        break
      case 'se':
        left = cropRect.x + cropRect.width - halfSize
        top = cropRect.y + cropRect.height - halfSize
        break
      case 's':
        left = cropRect.x + cropRect.width / 2 - halfSize
        top = cropRect.y + cropRect.height - halfSize
        break
      case 'sw':
        left = cropRect.x - halfSize
        top = cropRect.y + cropRect.height - halfSize
        break
      case 'w':
        left = cropRect.x - halfSize
        top = cropRect.y + cropRect.height / 2 - halfSize
        break
    }

    return (
      <div
        key={position}
        className="absolute bg-white border-2 border-blue-500 rounded-sm"
        style={{
          left,
          top,
          width: handleSize,
          height: handleSize,
          cursor: getCursor(position),
          pointerEvents: 'auto',
        }}
        onPointerDown={(e) => handleHandlePointerDown(e, position)}
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 touch-none select-none"
      style={{ cursor: getCursor(activeHandle) }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Dark overlay outside crop area */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <mask id="cropMask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={cropRect.x}
              y={cropRect.y}
              width={cropRect.width}
              height={cropRect.height}
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.5)"
          mask="url(#cropMask)"
        />
      </svg>

      {/* Crop frame border */}
      <div
        className="absolute border-2 border-white"
        style={{
          left: cropRect.x,
          top: cropRect.y,
          width: cropRect.width,
          height: cropRect.height,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
        }}
      >
        {/* Rule of thirds grid */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute bg-white/30"
            style={{ left: '33.33%', top: 0, width: 1, height: '100%' }}
          />
          <div
            className="absolute bg-white/30"
            style={{ left: '66.66%', top: 0, width: 1, height: '100%' }}
          />
          <div
            className="absolute bg-white/30"
            style={{ left: 0, top: '33.33%', width: '100%', height: 1 }}
          />
          <div
            className="absolute bg-white/30"
            style={{ left: 0, top: '66.66%', width: '100%', height: 1 }}
          />
        </div>
      </div>

      {/* Draggable crop area (for moving image behind) */}
      <div
        className="absolute"
        style={{
          left: cropRect.x,
          top: cropRect.y,
          width: cropRect.width,
          height: cropRect.height,
          cursor: 'move',
          pointerEvents: 'auto',
        }}
        onPointerDown={handleCropAreaPointerDown}
      />

      {/* Resize handles */}
      {renderHandle('nw')}
      {renderHandle('n')}
      {renderHandle('ne')}
      {renderHandle('e')}
      {renderHandle('se')}
      {renderHandle('s')}
      {renderHandle('sw')}
      {renderHandle('w')}
    </div>
  )
}
