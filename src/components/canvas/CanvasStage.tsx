import { useState } from 'react'
import { useCanvasStore, selectActiveImage } from '../../state/canvasStore'
import { findRatioValue } from '../../lib/canvas/ratios'
import { Workspace } from '../workspace/Workspace'
import { Canvas } from './Canvas'
import { ImageLayer } from '../image/ImageLayer'
import { CropOverlay } from '../image/CropOverlay'

/**
 * CanvasStage component - orchestrates the three-layer architecture:
 * 1. Workspace (checkerboard background, full screen)
 * 2. Canvas (white rectangle, export area)
 * 3. ImageLayer (user-imported image, draggable/scalable)
 * 4. CropOverlay (shown when crop mode is active)
 * 
 * Now supports multiple images via the queue - shows the active image.
 */
export const CanvasStage = () => {
  const activeImageState = useCanvasStore(selectActiveImage)
  const images = useCanvasStore((state) => state.images)
  const ratioId = useCanvasStore((state) => state.ratioId)
  const customRatio = useCanvasStore((state) => state.customRatio)
  const cropMode = useCanvasStore((state) => state.cropMode)
  const setPreviewSize = useCanvasStore((state) => state.setPreviewSize)
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null)

  // Calculate aspect ratio using active image (and crop if exists)
  const aspectRatio = findRatioValue(ratioId, {
    custom: customRatio,
    image: activeImageState?.image,
    crop: activeImageState?.crop,
  })

  // Handle canvas size changes from Canvas component
  const handleCanvasSizeChange = (size: { width: number; height: number }) => {
    setCanvasSize(size)
    setPreviewSize(size)
  }

  const hasImages = images.length > 0

  return (
    <Workspace>
      <Canvas aspectRatio={aspectRatio} onSizeChange={handleCanvasSizeChange}>
        <div
          className="relative w-full h-full"
          style={{ pointerEvents: 'auto' }}
        >
          {activeImageState && canvasSize && (
            <ImageLayer
              image={activeImageState.image}
              transform={activeImageState.transform}
              crop={activeImageState.crop}
              filter={activeImageState.filter}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
              disableCropClip={cropMode} // Don't clip during crop editing
            />
          )}
          {/* Crop overlay - shown when crop mode is active */}
          {cropMode && activeImageState && activeImageState.crop && canvasSize && (
            <CropOverlay
              image={activeImageState.image}
              crop={activeImageState.crop}
              transform={activeImageState.transform}
              canvasWidth={canvasSize.width}
              canvasHeight={canvasSize.height}
            />
          )}
          {!hasImages && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-sm text-slate-400 pointer-events-none gap-2">
              <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Drop images here or click Import</span>
            </div>
          )}
        </div>
      </Canvas>
    </Workspace>
  )
}
