import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useCanvasStore } from '../../state/canvasStore'

// Handles drag-and-drop plus metadata preview so the canvas always receives rich input.
export const ImportPanel = () => {
  const loadImage = useCanvasStore((state) => state.loadImage)
  const image = useCanvasStore((state) => state.image)
  const [error, setError] = useState<string | null>(null)
  const cameraModel =
    image && typeof image.exif?.['Model'] === 'string'
      ? (image.exif['Model'] as string)
      : undefined

  const handleFiles = useCallback(
    async (files: File[]) => {
      const file = files[0]
      if (!file) return
      try {
        setError(null)
        await loadImage(file)
      } catch (err) {
        setError((err as Error).message)
      }
    },
    [loadImage]
  )

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { 'image/*': [] },
    multiple: false,
    onDropAccepted: handleFiles,
    onDropRejected: () => setError('Unsupported file. Please drop a single image.'),
    noClick: true,
    noKeyboard: true,
  })

  return (
    <section className="space-y-3 rounded-2xl bg-canvas-control/60 p-4 text-sm text-slate-200 shadow-inner shadow-black/20">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-white">1. Import</p>
          <p className="text-xs text-slate-400">Drop or upload a high-res photo</p>
        </div>
        <button
          type="button"
          onClick={open}
          className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-white transition hover:border-white hover:bg-white/10"
        >
          Upload
        </button>
      </header>
      <div
        {...getRootProps()}
        className={`flex min-h-[140px] items-center justify-center rounded-xl border border-dashed px-4 text-center transition ${
          isDragActive
            ? 'border-white/80 bg-white/10 text-white'
            : 'border-white/20 bg-white/5 text-slate-300'
        }`}
      >
        <input {...getInputProps()} />
        <div>
          <p className="text-sm font-medium">
            {isDragActive ? 'Release to import' : 'Drag & drop image here'}
          </p>
          <p className="text-xs text-slate-400 mt-1">Reads complete EXIF metadata</p>
        </div>
      </div>
      {image && (
        <div className="rounded-xl bg-white/5 p-3 text-xs text-slate-300">
          <p className="font-semibold text-white">{image.fileName}</p>
          <p>
            {image.width} × {image.height}px
          </p>
          {cameraModel && <p className="text-slate-400">Shot on {cameraModel}</p>}
        </div>
      )}
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </section>
  )
}

