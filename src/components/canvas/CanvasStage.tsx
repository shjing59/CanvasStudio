import { useState, useRef, useEffect } from 'react'
import { useCanvasStore } from '../../state/canvasStore'
import { findRatioValue } from '../../lib/canvas/ratios'
import { Workspace } from '../workspace/Workspace'
import { Canvas } from './Canvas'
import { ImageLayer } from '../image/ImageLayer'

/**
 * CanvasStage component - orchestrates the three-layer architecture:
 * 1. Workspace (checkerboard background, full screen)
 * 2. Canvas (white rectangle, export area)
 * 3. ImageLayer (user-imported image, draggable/scalable)
 */
export const CanvasStage = () => {
  const image = useCanvasStore((state) => state.image)
  const ratioId = useCanvasStore((state) => state.ratioId)
  const customRatio = useCanvasStore((state) => state.customRatio)
  const setPreviewSize = useCanvasStore((state) => state.setPreviewSize)
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null)

  // Calculate aspect ratio
  const aspectRatio = findRatioValue(ratioId, { custom: customRatio, image })

  // Handle canvas size changes from Canvas component
  const handleCanvasSizeChange = (size: { width: number; height: number }) => {
    setCanvasSize(size)
    setPreviewSize(size)
  }

  return (
    <Workspace>
      <Canvas aspectRatio={aspectRatio} onSizeChange={handleCanvasSizeChange}>
        <div 
          className="relative w-full h-full"
          style={{ pointerEvents: 'auto' }}
        >
          {image && canvasSize && (
            <ImageLayer
              image={image}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
            />
          )}
          {!image && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400 pointer-events-none">
              Import an image to begin
            </div>
          )}
        </div>
      </Canvas>
    </Workspace>
  )
}
