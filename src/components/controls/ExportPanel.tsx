import { useMemo } from 'react'
import { useExportImage } from '../../hooks/useExportImage'
import { useCanvasStore } from '../../state/canvasStore'

const QUALITY_PRESETS = [
  { label: '100%', value: 1 },
  { label: '90%', value: 0.9 },
  { label: '80%', value: 0.8 },
]

// Collects every export toggle (format, compression, resolution) in one place.
export const ExportPanel = () => {
  const exportOptions = useCanvasStore((state) => state.exportOptions)
  const setExportOptions = useCanvasStore((state) => state.setExportOptions)
  const image = useCanvasStore((state) => state.image)
  const { exportImage, isExporting, error } = useExportImage()

  const isReady = Boolean(image) && !isExporting

  const qualityLabel = useMemo(
    () => Math.round(exportOptions.quality * 100),
    [exportOptions.quality]
  )

  return (
    <section className="space-y-4 rounded-2xl bg-canvas-control/60 p-4 text-sm text-slate-200 shadow-inner shadow-black/20">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-white">5. Export</p>
          <p className="text-xs text-slate-400">Maintains original resolution & sRGB profile</p>
        </div>
        <button
          type="button"
          disabled={!isReady}
          onClick={exportImage}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
            isReady
              ? 'bg-white text-black transition hover:bg-slate-100'
              : 'bg-white/10 text-slate-500'
          }`}
        >
          {isExporting ? 'Rendering…' : 'Export (⌘/Ctrl + E)'}
        </button>
      </header>
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
      <div className="space-y-3 rounded-2xl border border-white/10 p-3 text-xs">
        <div className="flex flex-wrap gap-2">
          {QUALITY_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setExportOptions({ quality: preset.value })}
              className={`rounded-full border px-3 py-1 font-semibold ${
                exportOptions.quality === preset.value
                  ? 'border-white bg-white/10 text-white'
                  : 'border-white/10 text-slate-400'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <span className="self-center text-slate-500">or fine tune</span>
        </div>
        <label className="flex flex-col gap-1">
          <span>Custom quality: {qualityLabel}%</span>
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
      {error && <p className="text-xs text-rose-400">{error}</p>}
      {!image && (
        <p className="text-xs text-slate-500">
          Import an image to unlock full-resolution export.
        </p>
      )}
    </section>
  )
}

