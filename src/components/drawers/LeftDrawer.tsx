import { useCallback, useState, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { useExportImage } from '../../hooks/useExportImage'
import { useCanvasStore } from '../../state/canvasStore'
import { ImageQueue } from '../queue/ImageQueue'
import { PresetButtons } from '../ui/PresetButtons'
import { QUALITY_PRESETS } from '../../constants/presets'

/**
 * Left drawer with image import/queue and export controls.
 * Replaces functionality from BottomToolbar and ExportSettingsPanel.
 */
export const LeftDrawer = () => {
  const leftDrawerOpen = useCanvasStore((state) => state.leftDrawerOpen)
  const toggleLeftDrawer = useCanvasStore((state) => state.toggleLeftDrawer)
  const loadImages = useCanvasStore((state) => state.loadImages)
  const images = useCanvasStore((state) => state.images)
  const activeImageId = useCanvasStore((state) => state.activeImageId)
  const clearAllImages = useCanvasStore((state) => state.clearAllImages)
  const exportOptions = useCanvasStore((state) => state.exportOptions)
  const setExportOptions = useCanvasStore((state) => state.setExportOptions)
  const { exportImage, exportAllImages, isExporting, canShare } = useExportImage()
  const [error, setError] = useState<string | null>(null)

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

  const qualityLabel = useMemo(
    () => Math.round(exportOptions.quality * 100),
    [exportOptions.quality]
  )

  return (
    <>
      {/* Toggle button on right edge */}
      <button
        type="button"
        onClick={toggleLeftDrawer}
        className={`fixed top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-8 h-16 rounded-r-lg bg-canvas-control/80 backdrop-blur border border-l-0 border-white/10 text-white/60 hover:text-white hover:bg-canvas-control transition-all ${
          leftDrawerOpen ? 'left-[300px]' : 'left-0'
        }`}
        title={leftDrawerOpen ? 'Hide import/export panel' : 'Show import/export panel'}
      >
        <svg
          className={`w-4 h-4 transition-transform ${leftDrawerOpen ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Drawer */}
      <div
        className={`fixed left-0 top-0 z-20 h-screen w-[300px] bg-canvas-control/90 backdrop-blur border-r border-white/10 transition-transform duration-300 ease-in-out overflow-y-auto overflow-x-hidden ${
          leftDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 lg:p-6 space-y-6 min-w-0">
          {/* Import Section */}
          <div {...getRootProps()} className={isDragActive ? 'opacity-50' : ''}>
            <input {...getInputProps()} />
            <div className="space-y-3 min-w-0">
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">Import</h2>
                <p className="text-xs text-slate-400 break-words">Add images to your canvas</p>
              </div>

              <button
                type="button"
                onClick={open}
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                {hasImages ? 'Add More Images' : 'Import Images'}
              </button>

              {isDragActive && (
                <div className="text-xs text-white text-center py-2">
                  Drop images to add to queue
                </div>
              )}

              {error && <div className="text-xs text-rose-400">{error}</div>}
            </div>
          </div>

          {/* Image Queue Section */}
          {hasImages && (
            <div className="space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-white">Queue</h2>
                  <p className="text-xs text-slate-400 truncate">
                    {images.length} image{images.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {hasMultipleImages && (
                  <button
                    type="button"
                    onClick={clearAllImages}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors flex-shrink-0 whitespace-nowrap"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <ImageQueue onAddMore={open} />
            </div>
          )}

          {/* Export Settings Section */}
          <div className="space-y-3 min-w-0">
            <div>
              <h2 className="text-sm font-semibold text-white mb-1">Export Settings</h2>
              <p className="text-xs text-slate-400 break-words">Configure output format and quality</p>
            </div>

            {/* Format Selection */}
            <div className="space-y-2 rounded-2xl border border-white/10 p-3 text-xs">
              <legend className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                Format
              </legend>
              <div className="flex gap-2">
                {(['png', 'jpeg'] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setExportOptions({ format })}
                    className={`flex-1 rounded-lg border px-3 py-2 font-semibold capitalize ${
                      exportOptions.format === format
                        ? 'border-white bg-white/10 text-white'
                        : 'border-white/10 text-slate-400'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Selection */}
            <div className="space-y-3 rounded-2xl border border-white/10 p-3 text-xs min-w-0">
              <PresetButtons
                presets={QUALITY_PRESETS}
                currentValue={exportOptions.quality}
                onChange={(quality) => setExportOptions({ quality })}
              />
              <span className="block text-center text-slate-500 whitespace-nowrap">or fine tune</span>
              <label className="flex flex-col gap-1 min-w-0">
                <span className="whitespace-nowrap">Custom quality: {qualityLabel}%</span>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={exportOptions.quality}
                  onChange={(event) => setExportOptions({ quality: Number(event.target.value) })}
                />
              </label>
            </div>
          </div>

          {/* Export Button */}
          <div className="space-y-3 min-w-0">
            <button
              type="button"
              onClick={handleExport}
              disabled={!isReady}
              className={`w-full rounded-lg px-5 py-3 text-sm font-semibold transition truncate ${
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

            {!hasImages && (
              <p className="text-xs text-slate-500 text-center break-words">
                Import an image to enable export.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
