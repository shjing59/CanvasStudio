import { useMemo } from 'react'
import { useCanvasStore } from '../../state/canvasStore'
import { PanelSection } from '../ui/PanelSection'
import { PresetButtons } from '../ui/PresetButtons'
import { QUALITY_PRESETS } from '../../constants/presets'

// Export settings panel - configuration only, actual export is in BottomToolbar
export const ExportSettingsPanel = () => {
  const exportOptions = useCanvasStore((state) => state.exportOptions)
  const setExportOptions = useCanvasStore((state) => state.setExportOptions)
  const image = useCanvasStore((state) => state.image)

  const qualityLabel = useMemo(
    () => Math.round(exportOptions.quality * 100),
    [exportOptions.quality]
  )

  return (
    <PanelSection 
      title="Export Settings" 
      description="Configure export format and quality"
    >
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
        <PresetButtons
          presets={QUALITY_PRESETS}
          currentValue={exportOptions.quality}
          onChange={(quality) => setExportOptions({ quality })}
        />
        <span className="block text-center text-slate-500">or fine tune</span>
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
      {!image && (
        <p className="text-xs text-slate-500">
          Import an image to enable export.
        </p>
      )}
    </PanelSection>
  )
}
