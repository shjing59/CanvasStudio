import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useExportImage } from '../hooks/useExportImage'
import { useCanvasStore } from '../state/canvasStore'

// Bottom toolbar with Import, Export, and common toggles - always accessible
export const BottomToolbar = () => {
  const loadImage = useCanvasStore((state) => state.loadImage)
  const image = useCanvasStore((state) => state.image)
  const centerSnap = useCanvasStore((state) => state.centerSnap)
  const setCenterSnap = useCanvasStore((state) => state.setCenterSnap)
  const { exportImage, isExporting, canShare } = useExportImage()
  const [error, setError] = useState<string | null>(null)

  // Handle files - ready for multiple files but currently uses first one
  // When filmstrip queue is implemented, this will add all files to the queue
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      
      try {
        setError(null)
        // Currently loads first file only (backwards compatible)
        // Future: Add all files to queue
        await loadImage(files[0])
      } catch (err) {
        setError((err as Error).message)
      }
    },
    [loadImage]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': [] },
    // Ready for multiple files - filmstrip queue will process all
    multiple: true,
    onDropAccepted: handleFiles,
    onDropRejected: () => setError('Unsupported file type. Please drop image files.'),
    noClick: true,
    noKeyboard: true,
  })

  const isReady = Boolean(image) && !isExporting

  return (
    <div
      {...getRootProps()}
      className={`fixed bottom-0 left-0 right-0 z-20 flex flex-wrap items-center gap-3 rounded-3xl border border-white/10 bg-canvas-control/80 p-3 text-xs backdrop-blur transition ${
        isDragActive ? 'bg-white/10' : ''
      }`}
    >
      <input {...getInputProps()} />
      
      {/* Import Button */}
      <button
        type="button"
        onClick={open}
        className="rounded-full border border-white/20 bg-white/5 px-4 py-2 font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
      >
        {image ? 'Replace' : 'Import'}
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
        onClick={exportImage}
        disabled={!isReady}
        className={`ml-auto rounded-full px-5 py-2 font-semibold transition ${
          isReady
            ? 'bg-white text-black hover:bg-slate-100'
            : 'bg-white/10 text-slate-500 cursor-not-allowed'
        }`}
      >
        {isExporting ? 'Exporting…' : canShare ? 'Share' : 'Export'}
      </button>

      {/* Error message */}
      {error && (
        <span className="w-full text-xs text-rose-400">{error}</span>
      )}
      {isDragActive && (
        <span className="w-full text-xs text-white">Drop images to import</span>
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
