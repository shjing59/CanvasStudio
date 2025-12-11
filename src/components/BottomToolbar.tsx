import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useExportImage } from '../hooks/useExportImage'
import { useCanvasStore } from '../state/canvasStore'
import { ImageQueue } from './queue/ImageQueue'

/**
 * Bottom toolbar with filmstrip queue, Import, Export, and common toggles.
 * Supports multi-image workflow with batch operations.
 */
export const BottomToolbar = () => {
  const loadImages = useCanvasStore((state) => state.loadImages)
  const images = useCanvasStore((state) => state.images)
  const activeImageId = useCanvasStore((state) => state.activeImageId)
  const centerSnap = useCanvasStore((state) => state.centerSnap)
  const setCenterSnap = useCanvasStore((state) => state.setCenterSnap)
  const clearAllImages = useCanvasStore((state) => state.clearAllImages)
  const { exportImage, exportAllImages, isExporting, canShare } = useExportImage()
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const hasImages = images.length > 0
  const hasMultipleImages = images.length > 1

  // Handle file drops - supports multiple files
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      try {
        setError(null)
        await loadImages(files)
      } catch (err) {
        setError((err as Error).message)
      }
    },
    [loadImages]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': [] },
    multiple: true,
    onDropAccepted: handleFiles,
    onDropRejected: () => setError('Unsupported file type. Please drop image files.'),
    noClick: true,
    noKeyboard: true,
  })

  const handleExport = async () => {
    if (hasMultipleImages) {
      await exportAllImages()
    } else {
      await exportImage()
    }
  }

  const isReady = hasImages && activeImageId && !isExporting

  return (
    <div
      {...getRootProps()}
      className={`fixed bottom-0 left-0 right-0 z-20 rounded-t-3xl border border-white/10 bg-canvas-control/90 backdrop-blur transition-all ${
        isDragActive ? 'bg-white/10' : ''
      }`}
    >
      <input {...getInputProps()} />

      {/* Collapse/Expand Toggle */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-t-lg border border-b-0 border-white/10 bg-canvas-control/90 backdrop-blur px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
        title={isCollapsed ? 'Show toolbar' : 'Hide toolbar'}
      >
        <svg
          className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!isCollapsed && (
        <>
          {/* Filmstrip queue */}
          {hasImages && (
            <div className="px-3 pt-3 pb-1 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-slate-400">
                  {images.length} image{images.length !== 1 ? 's' : ''}
                </span>
                {hasMultipleImages && (
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <ImageQueue onAddMore={open} />
            </div>
          )}

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-3 p-3 text-xs">
            {/* Import Button */}
            <button
              type="button"
              onClick={open}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              {hasImages ? 'Add More' : 'Import'}
            </button>

            {/* Toggles */}
            <ToolbarToggle
              label="Center Snap"
              active={centerSnap}
              onClick={() => setCenterSnap(!centerSnap)}
            />

            {/* Export Button */}
            <button
              type="button"
              onClick={handleExport}
              disabled={!isReady}
              className={`ml-auto rounded-full px-5 py-2 font-semibold transition ${
                isReady
                  ? 'bg-white text-black hover:bg-slate-100'
                  : 'bg-white/10 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isExporting
                ? 'Exporting…'
                : hasMultipleImages
                ? `Export All (${images.length})`
                : canShare
                ? 'Share'
                : 'Export'}
            </button>
          </div>

          {/* Error/status messages */}
          {error && <div className="px-3 pb-2 text-xs text-rose-400">{error}</div>}
          {isDragActive && (
            <div className="px-3 pb-2 text-xs text-white">Drop images to add to queue</div>
          )}
        </>
      )}
    </div>
  )
}

const ToolbarToggle = ({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-4 py-2 font-semibold ${
      active ? 'border-white bg-white/10 text-white' : 'border-white/10 text-slate-400'
    }`}
  >
    {label}
  </button>
)
